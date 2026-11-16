import { useMemo, useState } from 'react';
import { Pencil, Plus, Printer } from 'lucide-react';
import { TRAINING } from '../../data';
import { bondEndDate, DEMO_DATE, remainingLiability, useDemo, type Bond } from '../../store';
import { findByEid, findById, VENDORS } from '../../org';
import { PageHead } from '../../components/Templates';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { Badge, Btn, cx, Field, inputCls, Modal } from '../../components/ui';
import { FrRef, SourceTag } from '../../components/Source';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 2026-11-20 → 20 Nov 2026 */
const toDisplay = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MON[m - 1]} ${y}`;
};
/** 20 Nov 2026 → 2026-11-20 */
const toIso = (disp: string) => {
  const [d, mon, y] = disp.split(' ');
  const m = MON.indexOf(mon);
  if (m < 0 || !d || !y) return '';
  return `${y}-${String(m + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const dayNum = (disp: string) => { const iso = toIso(disp); return iso ? Number(iso.replace(/-/g, '')) : 0; };
const daysBetween = (a: string, b: string) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1 : 0);
const bdt = (n: number) => `BDT ${n.toLocaleString('en-IN')}`;

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const two = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${ONES[n % 10]}` : ''}`);
const three = (n: number) => [Math.floor(n / 100) ? `${ONES[Math.floor(n / 100)]} hundred` : '', n % 100 ? two(n % 100) : ''].filter(Boolean).join(' ');
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Bangladeshi numbering: crore, lakh, thousand. */
export const amountInWords = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return '';
  const v = Math.floor(n);
  const parts = [
    Math.floor(v / 1e7) ? `${three(Math.floor(v / 1e7))} crore` : '',
    Math.floor((v % 1e7) / 1e5) ? `${two(Math.floor((v % 1e7) / 1e5))} lakh` : '',
    Math.floor((v % 1e5) / 1e3) ? `${two(Math.floor((v % 1e5) / 1e3))} thousand` : '',
    v % 1000 ? three(v % 1000) : '',
  ].filter(Boolean);
  return cap(`${parts.join(' ')} taka`);
};
export const periodInWords = (n: number) => (n > 0 && n < 100 ? cap(`${two(n)} year${n === 1 ? '' : 's'}`) : '');

/** Training Title setup (FR 150–151) with the module dates (FR 153). Fictional demonstration data. */
const TITLES: { title: string; category: string; mode: string; medium: string; tags: string; institute: string; from: string; to: string; manHour: string }[] = [
  { title: TRAINING.title, category: TRAINING.category, mode: 'In-house', medium: 'Classroom', tags: TRAINING.tags.join(', '), institute: TRAINING.organizedBy, from: '2026-11-18', to: '2026-11-19', manHour: '16' },
  { title: 'Executive Programme in Risk', category: 'Functional', mode: 'External-foreign', medium: 'Classroom', tags: 'Risk', institute: 'INSEAD', from: '2025-03-02', to: '2025-03-14', manHour: '78' },
  { title: 'Treasury Certification', category: 'Functional', mode: 'External-foreign', medium: 'Classroom', tags: 'Risk', institute: 'Singapore Institute of Banking', from: '2026-06-01', to: '2026-06-12', manHour: '72' },
  { title: 'Trade Finance (CDCS)', category: 'Functional', mode: 'External-local', medium: 'Classroom', tags: 'Foreign Trade', institute: 'Bangladesh Institute of Bank Management (BIBM)', from: '2026-07-20', to: '2026-07-31', manHour: '60' },
  { title: 'Leadership Essentials for Managers', category: 'Soft-skill', mode: 'External-local', medium: 'Classroom', tags: 'MT Development', institute: 'BRAC Business School', from: '2026-12-02', to: '2026-12-04', manHour: '24' },
  { title: 'Sustainable Finance Fundamentals', category: 'Functional', mode: 'In-house', medium: 'Webinar', tags: 'Sustainable Finance, ESRM', institute: 'City Bank L&D', from: '2026-10-29', to: '2026-10-29', manHour: '6' },
];

const nextBondId = (bonds: Bond[]) => {
  const nums = bonds.map((b) => /^BND-2026-01(\d{2})$/.exec(b.id)?.[1]).filter((x): x is string => !!x).map(Number);
  const n = (nums.length ? Math.max(...nums) : 29) + 1;
  return `BND-2026-01${String(n).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Print preview (FR 162): single-sided Legal page                     */
/* ------------------------------------------------------------------ */
export function BondPrintModal({ bond, onClose }: { bond: Bond | null; onClose: () => void }) {
  const s = useDemo();
  if (!bond) return null;
  const end = bondEndDate(bond);
  const print = () => {
    s.logEvent('hr', 'Training bond printed', `${bond.id} · ${bond.name} · Legal page, single-sided`);
    window.print();
  };
  return (
    <Modal open onClose={onClose} title={`Print Training Bond · ${bond.id}`} footer={<><Btn v="secondary" onClick={onClose}>Close</Btn><Btn icon={<Printer size={16} />} onClick={print}>Print</Btn></>}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[15px] text-ink-3">Legal page (8.5 × 14 in) · single-sided <SourceTag kind="fictional" /></div>
      <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-canvas p-4">
        <article className="mx-auto aspect-[8.5/14] w-full max-w-[460px] bg-white px-8 py-8 font-serif text-[14px] leading-relaxed text-ink shadow-sm">
          <h2 className="text-center text-[18px] font-bold tracking-wide">TRAINING BOND</h2>
          <p className="mt-1 text-center text-[14px] text-ink-3">The City Bank PLC · Human Resources Division · {bond.id}</p>
          <p className="mt-5">This bond is signed on <b>{bond.signDate}</b> between The City Bank PLC (the “Bank”) and <b>{bond.name}</b>, {bond.designation} ({bond.grade}), Employee ID <b>{bond.eid}</b>, {bond.division}, {bond.location} (the “Employee”).</p>
          <p className="mt-3">The Bank sponsors the Employee for <b>{bond.title}</b> ({bond.category} · {bond.mode} · {bond.medium}) at <b>{bond.institute}</b>, from {bond.from} to {bond.to} ({bond.days} days, {bond.manHour} man-hours).</p>
          <p className="mt-3">In return, the Employee agrees to serve the Bank for <b>{bond.periodWords || `${bond.periodYears} years`}</b> ({bond.periodYears} years), from <b>{bond.startDate}</b> to <b>{end}</b>.</p>
          <p className="mt-3">If the Employee leaves the Bank's service before {end}, the Employee will repay <b>{bdt(bond.amount)}</b> ({bond.amountWords}), reduced in proportion to the period already served.</p>
          <div className="mt-12 grid grid-cols-2 gap-8 text-[14px]">
            <div className="border-t border-ink/40 pt-1">Employee<br />{bond.name}</div>
            <div className="border-t border-ink/40 pt-1">For The City Bank PLC<br />Head of HR</div>
          </div>
        </article>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* New Training Bond Setup (FR 144–163)                                */
/* ------------------------------------------------------------------ */
interface Form {
  eid: string; title: string; institute: string; from: string; to: string; manHour: string;
  signDate: string; periodYears: string; periodWords: string; startDate: string; amount: string; amountWords: string;
}

export function BondSetupModal({ open, onClose, empId, bond }: { open: boolean; onClose: () => void; empId?: string; bond?: Bond }) {
  if (!open) return null;
  return <BondForm onClose={onClose} empId={empId} bond={bond} />;
}

function BondForm({ onClose, empId, bond }: { onClose: () => void; empId?: string; bond?: Bond }) {
  const s = useDemo();
  const [print, setPrint] = useState<Bond | null>(null);
  const [tried, setTried] = useState(false);
  const [f, setF] = useState<Form>(() => {
    if (bond) {
      return {
        eid: bond.eid, title: bond.title, institute: bond.institute, from: toIso(bond.from), to: toIso(bond.to), manHour: bond.manHour,
        signDate: toIso(bond.signDate), periodYears: String(bond.periodYears), periodWords: bond.periodWords, startDate: toIso(bond.startDate), amount: String(bond.amount), amountWords: bond.amountWords,
      };
    }
    const story = empId ? findById(empId) : undefined;
    const t = TITLES[0];
    return {
      eid: story?.eid ?? '', title: story ? t.title : '', institute: story ? t.institute : '', from: story ? t.from : '', to: story ? t.to : '', manHour: story ? t.manHour : '',
      signDate: story ? '2026-11-17' : '', periodYears: '', periodWords: '', startDate: story ? '2026-11-20' : '', amount: '', amountWords: '',
    };
  });
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));

  const person = findByEid(f.eid);
  const fromBond = bond && bond.eid === f.eid ? bond : undefined;
  const emp = person
    ? { name: person.name, grade: person.grade, designation: person.designation, division: person.division, location: person.location }
    : fromBond ? { name: fromBond.name, grade: fromBond.grade, designation: fromBond.designation, division: fromBond.division, location: fromBond.location } : null;
  const meta = TITLES.find((t) => t.title === f.title) ?? (bond && bond.title === f.title ? { category: bond.category, mode: bond.mode, medium: bond.medium, tags: bond.tags } : null);
  const days = daysBetween(f.from, f.to);
  const years = Number(f.periodYears);
  const amount = Number(f.amount.replace(/[,\s]/g, ''));
  const institutes = useMemo(() => [...new Set([...VENDORS, ...TITLES.map((t) => t.institute), ...s.bonds.map((b) => b.institute)])], [s.bonds]);

  const errors: Record<string, string> = {};
  if (!emp) errors.eid = f.eid ? 'No employee found with this Employee ID.' : 'Enter the Employee ID.';
  if (!f.title) errors.title = 'Choose the training / course title.';
  if (!f.institute) errors.institute = 'Choose the institute.';
  if (!f.from || !f.to || days < 1) errors.duration = 'Enter a valid from and to date.';
  if (!/^\d+(\.\d+)?$/.test(f.manHour)) errors.manHour = 'Enter the man-hours as a number.';
  if (!f.signDate) errors.signDate = 'Enter the bond signing date.';
  if (!Number.isInteger(years) || years < 1) errors.periodYears = 'Enter the bond period in whole years.';
  if (!f.periodWords.trim()) errors.periodWords = 'Enter the bond period in words.';
  if (!f.startDate) errors.startDate = 'Pick the bond start date.';
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Enter the bond amount.';
  if (!f.amountWords.trim()) errors.amountWords = 'Enter the bond amount in words.';
  const valid = Object.keys(errors).length === 0;
  const err = (k: string) => (tried && errors[k] ? <span className="text-brand">{errors[k]}</span> : undefined);

  const build = (): Bond | null => {
    if (!valid || !emp || !meta) return null;
    return {
      id: bond?.id ?? nextBondId(s.bonds), eid: f.eid.trim().toUpperCase(), ...emp,
      title: f.title, category: meta.category, mode: meta.mode, medium: meta.medium, tags: meta.tags, institute: f.institute,
      from: toDisplay(f.from), to: toDisplay(f.to), days, manHour: f.manHour,
      signDate: toDisplay(f.signDate), periodYears: years, periodWords: f.periodWords.trim(), startDate: toDisplay(f.startDate), amount, amountWords: f.amountWords.trim(),
    };
  };
  const endDate = f.startDate && years > 0 ? bondEndDate({ startDate: toDisplay(f.startDate), periodYears: years }) : '';

  const act = (kind: 'print' | 'db' | 'save') => {
    setTried(true);
    const b = build();
    if (!b) return;
    if (kind === 'print') { setPrint(b); return; }
    if (kind === 'db') s.saveBondRecord(b, true);
    else if (bond) s.updateBond(bond.id, b);
    else s.saveBondRecord(b, false);
    useDemo.setState({ toast: kind === 'db' ? `${b.id} saved and added to the Training Database` : `${b.id} saved in the Training Bond Database` });
    onClose();
  };

  const pickTitle = (title: string) => {
    const t = TITLES.find((x) => x.title === title);
    set(t ? { title, institute: t.institute, from: t.from, to: t.to, manHour: f.manHour || t.manHour } : { title });
  };

  const missing = Object.keys(errors).length;
  return (
    <>
      <Modal open={!print} onClose={onClose} title={bond ? `Edit Training Bond · ${bond.id}` : 'New Training Bond Setup'} footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          {tried && !valid && <span className="mr-auto text-[14px] text-brand">{missing} field{missing > 1 ? 's' : ''} to complete</span>}
          {!tried && <span className="mr-auto" />}
          <Btn v="secondary" icon={<Printer size={16} />} onClick={() => act('print')}>Print Training Bond</Btn>
          <Btn v="secondary" onClick={() => act('save')}>Save &amp; Exit</Btn>
          <Btn onClick={() => act('db')}>Input in Training Database &amp; Exit</Btn>
        </div>
      }>
        <div className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">
          <div className="flex items-center gap-2"><SourceTag kind="fictional" /><FrRef>FR 144–163</FrRef></div>
          <fieldset>
            <legend className="mb-2 text-[17px] font-bold">Employee</legend>
            <Field label="Employee ID" hint={err('eid') ?? (!bond && !f.eid ? <span className="text-ink-3">Try CBL-10482 or CBL-11804</span> : undefined)}>
              <input className={inputCls} value={f.eid} onChange={(e) => set({ eid: e.target.value })} placeholder="CBL-00000" aria-invalid={tried && !!errors.eid} />
            </Field>
            {emp && (
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-canvas p-3 text-[15px]">
                {([['Name', emp.name], ['Grade', emp.grade], ['Designation', emp.designation], ['Division', emp.division], ['Location', emp.location]] as const).map(([k, v]) => <div key={k}><dt className="text-[14px] text-ink-3">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
                <div className="col-span-2 text-[14px] text-ink-3">From Employee Database (HRIS) · simulated · read-only</div>
              </dl>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-[17px] font-bold">Training</legend>
            <Field label="Training / Course Title" hint={err('title')}>
              <select className={inputCls} value={f.title} onChange={(e) => pickTitle(e.target.value)}>
                <option value="">Choose from Training Title setup</option>
                {[...new Set([...TITLES.map((t) => t.title), ...(bond ? [bond.title] : [])])].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            {meta && <div className="flex flex-wrap gap-2 text-[14px]"><Badge t="neutral">{meta.category}</Badge><Badge t="neutral">{meta.mode}</Badge><Badge t="neutral">{meta.medium}</Badge><Badge t="neutral">Tags: {meta.tags}</Badge></div>}
            <Field label="Institute" hint={err('institute')}>
              <select className={inputCls} value={f.institute} onChange={(e) => set({ institute: e.target.value })}>
                <option value="">Choose from Vendor setup</option>
                {institutes.map((v) => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration from"><input type="date" className={inputCls} value={f.from} onChange={(e) => set({ from: e.target.value })} /></Field>
              <Field label="Duration to"><input type="date" className={inputCls} value={f.to} onChange={(e) => set({ to: e.target.value })} /></Field>
            </div>
            <div className="text-[15px] text-ink-2">{err('duration') ?? (days > 0 ? `${days} day${days > 1 ? 's' : ''} (calculated)` : 'Number of days is calculated from the dates')}</div>
            <Field label="Man-hour" hint={err('manHour')}><input className={inputCls} inputMode="decimal" value={f.manHour} onChange={(e) => set({ manHour: e.target.value })} placeholder="16" /></Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-[17px] font-bold">Bond</legend>
            <Field label="Bond Signing Date" hint={err('signDate')}><input type="date" className={inputCls} value={f.signDate} onChange={(e) => set({ signDate: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bond Period (years)" hint={err('periodYears')}><input className={inputCls} inputMode="numeric" value={f.periodYears} onChange={(e) => set({ periodYears: e.target.value, periodWords: periodInWords(Number(e.target.value)) })} placeholder="2" /></Field>
              <Field label="Bond Period in Word" hint={err('periodWords')}><input className={inputCls} value={f.periodWords} onChange={(e) => set({ periodWords: e.target.value })} placeholder="Two years" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bond Start Date" hint={err('startDate')}><input type="date" className={inputCls} value={f.startDate} onChange={(e) => set({ startDate: e.target.value })} /></Field>
              <Field label="Bond End Date (calculated)"><input className={cx(inputCls, 'bg-canvas')} value={endDate} readOnly placeholder="Start date + period" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bond Amount (BDT)" hint={err('amount')}><input className={inputCls} inputMode="numeric" value={f.amount} onChange={(e) => set({ amount: e.target.value, amountWords: amountInWords(Number(e.target.value.replace(/[,\s]/g, ''))) })} placeholder="200000" /></Field>
              <Field label="Bond Amount in Word" hint={err('amountWords')}><input className={inputCls} value={f.amountWords} onChange={(e) => set({ amountWords: e.target.value })} placeholder="Two lakh taka" /></Field>
            </div>
            <p className="text-[14px] text-ink-3">The words fill in from the numbers; edit them if the bond wording differs.</p>
          </fieldset>
        </div>
      </Modal>
      <BondPrintModal bond={print} onClose={() => setPrint(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Training Bond Database (FR 164–167)                                 */
/* ------------------------------------------------------------------ */
export function Bonds() {
  const s = useDemo();
  const [setup, setSetup] = useState<{ open: boolean; bond?: Bond }>({ open: false });
  const [print, setPrint] = useState<Bond | null>(null);

  const totalAmount = s.bonds.reduce((a, b) => a + b.amount, 0);
  const totalLiability = s.bonds.reduce((a, b) => a + remainingLiability(b), 0);
  const active = s.bonds.filter((b) => {
    const end = Date.parse(bondEndDate(b));
    return Number.isFinite(end) && end >= DEMO_DATE.getTime();
  }).length;

  const columns: Column<Bond>[] = [
    { key: 'id', header: 'Bond ID', sort: (b) => b.id, render: (b) => <span className="font-semibold tabular-nums">{b.id}</span> },
    { key: 'emp', header: 'Employee', sort: (b) => b.name, render: (b) => <div><div className="font-semibold">{b.name}</div><div className="text-[14px] text-ink-3">{b.eid} · {b.grade}</div></div> },
    { key: 'division', header: 'Division', filter: (b) => b.division, sort: (b) => b.division, render: (b) => b.division },
    { key: 'training', header: 'Training', sort: (b) => b.title, render: (b) => <div><div>{b.title}</div><div className="text-[14px] text-ink-3">{b.from} – {b.to} · {b.manHour} man-hours</div></div> },
    { key: 'institute', header: 'Institute', filter: (b) => b.institute, render: (b) => b.institute },
    { key: 'start', header: 'Bond Start', sort: (b) => dayNum(b.startDate), render: (b) => <span className="whitespace-nowrap">{b.startDate}</span> },
    { key: 'period', header: 'Period', sort: (b) => b.periodYears, render: (b) => `${b.periodYears} yr` },
    { key: 'end', header: 'Bond End Date', sort: (b) => Date.parse(bondEndDate(b)) || 0, render: (b) => <span className="whitespace-nowrap">{bondEndDate(b)}</span> },
    { key: 'amount', header: 'Amount', sort: (b) => b.amount, render: (b) => <span className="whitespace-nowrap tabular-nums">{bdt(b.amount)}</span> },
    { key: 'liab', header: 'Remaining Liability', sort: (b) => remainingLiability(b), render: (b) => <span className="whitespace-nowrap font-semibold tabular-nums">{bdt(remainingLiability(b))}</span> },
    { key: 'act', header: '', render: (b) => (
      <div className="flex gap-1">
        <Btn v="ghost" size="sm" icon={<Pencil size={15} />} onClick={() => setSetup({ open: true, bond: b })}>Edit</Btn>
        <Btn v="ghost" size="sm" icon={<Printer size={15} />} onClick={() => setPrint(b)} label={`Print training bond ${b.id}`}>Print</Btn>
      </div>
    ) },
  ];

  const exportCsv = () => downloadCsv('training-bonds.csv', ['Bond ID', 'Employee ID', 'Name', 'Grade', 'Designation', 'Division', 'Location', 'Training', 'Institute', 'From', 'To', 'Days', 'Man-hour', 'Signing date', 'Period (years)', 'Start date', 'End date', 'Amount', 'Remaining liability'],
    s.bonds.map((b) => [b.id, b.eid, b.name, b.grade, b.designation, b.division, b.location, b.title, b.institute, b.from, b.to, b.days, b.manHour, b.signDate, b.periodYears, b.startDate, bondEndDate(b), b.amount, remainingLiability(b)]));

  return (
    <div>
      <PageHead
        title="Training Bond Database"
        meta="Summary of all training bonds, with the liability still owed if an employee leaves early"
        fr="FR 144–167"
        tags={<SourceTag kind="fictional" />}
        actions={<><Btn v="secondary" onClick={exportCsv}>Export CSV</Btn><Btn icon={<Plus size={16} />} onClick={() => setSetup({ open: true })}>New Training Bond Setup</Btn></>}
      />

      <div className="mb-6 flex flex-wrap divide-x divide-line border-y border-line">
        {([[String(s.bonds.length), 'Bonds on record'], [String(active), 'Active on 12 Nov 2026'], [bdt(totalAmount), 'Total bond amount'], [bdt(totalLiability), 'Remaining liability']] as const).map(([n, l]) => (
          <div key={l} className="flex-1 px-6 py-4 first:pl-0"><div className="text-[28px] font-extrabold leading-none tabular-nums">{n}</div><div className="mt-1 text-[15px] text-ink-2">{l}</div></div>
        ))}
      </div>

      <DataTable<Bond>
        rows={s.bonds}
        columns={columns}
        rowKey={(b) => b.id}
        searchText={(b) => `${b.id} ${b.name} ${b.eid} ${b.title}`}
        searchPlaceholder="Search by bond, name, Employee ID or training"
        label="bonds"
        emptyText="No bonds match these filters."
      />
      <p className="mt-3 text-[15px] text-ink-3">Remaining liability is calculated straight-line from the bond start date, period and amount, as of 12 Nov 2026. Bonds come from New Training Bond Setup or from the Undertaking step in Training Scheduling (FR 167); “Input in Training Database &amp; Exit” also writes a Training Database row (FR 171).</p>

      <BondSetupModal key={setup.bond?.id ?? 'new'} open={setup.open} bond={setup.bond} onClose={() => setSetup({ open: false })} />
      <BondPrintModal bond={print} onClose={() => setPrint(null)} />
    </div>
  );
}
