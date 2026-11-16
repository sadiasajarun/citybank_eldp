import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileUp, Plus } from 'lucide-react';
import { MASTERS, TRAINING } from '../../data';
import { useDemo, type DbRow } from '../../store';
import { findByEid, VENDORS } from '../../org';
import { PageHead } from '../../components/Templates';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { Alert, Badge, Btn, cx, Field, inputCls, Modal, Tabs } from '../../components/ui';
import { FrRef, SourceTag } from '../../components/Source';

/* ------------------------------------------------------------------ */
/* CSV helpers                                                          */
/* ------------------------------------------------------------------ */
const parseCsv = (text: string): string[][] => {
  const out: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim())) out.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) out.push(row);
  return out;
};
const toCsv = (header: string[], rows: string[][]) => [header, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');

const DB_HEADER = ['EID', 'Name', 'Grade', 'Designation', 'Division', 'Location', 'Training / Course', 'Category · Mode · Medium', 'Institute', 'Duration', 'Man-hour'];
const SAMPLE_MIGRATION = toCsv(DB_HEADER, [
  ['CBL-10231', '', '', '', '', '', 'Credit Appraisal Basics', 'Functional · In-house · Classroom', 'City Bank L&D', '14 Feb 2024 · 2 days', '12'],
  ['CBL-10755', '', '', '', '', '', 'SME Cluster Financing', 'Functional · External-local · Classroom', 'Bangladesh Institute of Bank Management (BIBM)', '09–11 Jul 2024 · 3 days', '18'],
  ['CBL-11390', '', '', '', '', '', 'Basel III Capital Adequacy', 'Functional · External-local · Webinar', 'Bangladesh Institute of Bank Management (BIBM)', '22 Sep 2024 · 1 day', '6'],
  ['CBL-99999', '', '', '', '', '', 'Branch Operations Refresher', 'General · In-house · Classroom', 'City Bank L&D', '03 Oct 2024 · 1 day', '6'],
]);
const SAMPLE_BULK = toCsv(DB_HEADER, [
  ['CBL-09520', '', '', '', '', '', 'Anti-Bribery & Corruption 2026', 'Mandatory · In-house · e-Learning', 'City Bank L&D', '04 Nov 2026 · 1 day', '2'],
  ['CBL-11012', '', '', '', '', '', 'Anti-Bribery & Corruption 2026', 'Mandatory · In-house · e-Learning', 'City Bank L&D', '05 Nov 2026 · 1 day', '2'],
]);

interface Parsed<T> { rows: T[]; skipped: string[] }

/** Employee rows: Employee ID is required; HRIS fields fill in from the Employee Database when blank. */
const parseDbRows = (text: string): Parsed<DbRow> => {
  const lines = parseCsv(text);
  const body = lines.length && lines[0][0]?.trim().toUpperCase() === 'EID' ? lines.slice(1) : lines;
  const rows: DbRow[] = [], skipped: string[] = [];
  body.forEach((c, i) => {
    const [eid = '', name = '', grade = '', designation = '', division = '', location = '', training = '', meta = '', institute = '', duration = '', manHour = ''] = c.map((x) => x.trim());
    const p = findByEid(eid);
    if (!eid || !training) { skipped.push(`Row ${i + 2}: Employee ID and Training / Course are required`); return; }
    if (!p && !name) { skipped.push(`Row ${i + 2}: ${eid} is not in the Employee Database`); return; }
    rows.push({
      eid: p?.eid ?? eid, name: name || p?.name || '', grade: grade || p?.grade || '', designation: designation || p?.designation || '', division: division || p?.division || '', location: location || p?.location || '',
      training, meta, institute, duration, manHour, source: 'Seed',
    });
  });
  return { rows, skipped };
};

/* ------------------------------------------------------------------ */
/* External trainees (FR 173–174)                                       */
/* ------------------------------------------------------------------ */
interface External { id: string; name: string; organisation: string; contact: string; training: string; institute: string; duration: string; manHour: string; source: string }
const EXT_HEADER = ['Name', 'Organisation', 'Contact', 'Training / Course', 'Institute', 'Duration', 'Man-hour'];
const SEED_EXTERNAL: External[] = [
  { id: 'EXT-2026-001', name: 'Mahbub Alam', organisation: 'City Brokerage Ltd.', contact: 'mahbub.alam@example.com', training: 'AML & CFT Refresher', institute: 'City Bank L&D', duration: '03 Nov 2026 · 1 day', manHour: '8', source: 'Migration' },
  { id: 'EXT-2026-002', name: 'Shirin Akhter', organisation: 'City Hajj Finance (agent)', contact: 'shirin.akhter@example.com', training: 'Customer Experience Excellence', institute: 'City Bank L&D', duration: '12 Nov 2026 · 1 day', manHour: '6', source: 'Single entry' },
];
const SAMPLE_EXTERNAL = toCsv(EXT_HEADER, [
  ['Kazi Nazmul', 'City Bank Capital Resources', 'kazi.nazmul@example.com', 'Sustainable Finance Fundamentals', 'City Bank L&D', '29 Oct 2026 · 1 day', '6'],
  ['Rumana Haque', 'Partner MFI (BRAC)', 'rumana.haque@example.com', 'Sustainable Finance Fundamentals', 'City Bank L&D', '29 Oct 2026 · 1 day', '6'],
  ['', 'Unknown', '', 'Sustainable Finance Fundamentals', '', '', ''],
]);
const parseExternal = (text: string, startId: number): Parsed<External> => {
  const lines = parseCsv(text);
  const body = lines.length && lines[0][0]?.trim().toLowerCase() === 'name' ? lines.slice(1) : lines;
  const rows: External[] = [], skipped: string[] = [];
  body.forEach((c, i) => {
    const [name = '', organisation = '', contact = '', training = '', institute = '', duration = '', manHour = ''] = c.map((x) => x.trim());
    if (!name || !training) { skipped.push(`Row ${i + 2}: Name and Training / Course are required`); return; }
    rows.push({ id: `EXT-2026-${String(startId + rows.length).padStart(3, '0')}`, name, organisation, contact, training, institute, duration, manHour, source: 'Bulk upload' });
  });
  return { rows, skipped };
};

/* ------------------------------------------------------------------ */
/* Upload modal (shared by migration, bulk entry and external trainees) */
/* ------------------------------------------------------------------ */
function UploadModal<T>({ open, onClose, title, intro, header, sample, templateName, parse, onImport, describe }: {
  open: boolean; onClose: () => void; title: string; intro: string; header: string[]; sample: string; templateName: string;
  parse: (text: string) => Parsed<T>; onImport: (rows: T[], file: string) => void; describe: (row: T) => string;
}) {
  const [file, setFile] = useState<{ name: string; parsed: Parsed<T> } | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const close = () => { setFile(null); onClose(); };
  const read = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    setFile({ name: f.name, parsed: parse(text) });
  };
  const n = file?.parsed.rows.length ?? 0;
  return (
    <Modal open={open} onClose={close} title={title} footer={<><Btn v="secondary" onClick={close}>Cancel</Btn><Btn disabled={!n} onClick={() => { if (file) onImport(file.parsed.rows, file.name); close(); }}>{n ? `Upload ${n} record${n > 1 ? 's' : ''}` : 'Upload records'}</Btn></>}>
      <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1">
        <p className="text-[16px] text-ink-2">{intro}</p>
        <div className="rounded-lg bg-canvas p-3 text-[14px] text-ink-2"><b>Template columns:</b> {header.join(' · ')}</div>
        <div className="flex flex-wrap gap-2">
          <Btn v="secondary" size="sm" icon={<Download size={15} />} onClick={() => downloadCsv(templateName, header, [])}>Download template</Btn>
          <input ref={ref} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void read(e.target.files?.[0]); e.target.value = ''; }} />
          <Btn v="secondary" size="sm" icon={<FileUp size={15} />} onClick={() => ref.current?.click()}>Choose CSV file</Btn>
          <Btn v="link" onClick={() => setFile({ name: templateName.replace('template', 'sample'), parsed: parse(sample) })}>Use sample file</Btn>
        </div>
        {file && (
          <div className="space-y-2">
            <div className="text-[16px] font-semibold">{file.name} · {n} ready{file.parsed.skipped.length ? ` · ${file.parsed.skipped.length} skipped` : ''}</div>
            {n > 0 && <ul className="max-h-40 overflow-y-auto rounded-lg border border-line p-3 text-[15px]">{file.parsed.rows.map((r, i) => <li key={i}>{describe(r)}</li>)}</ul>}
            {file.parsed.skipped.length > 0 && <Alert kind="warn" title="Rows that will not be uploaded">{file.parsed.skipped.join(' · ')}</Alert>}
          </div>
        )}
        <p className="text-[14px] text-ink-3">Admin access only. Files are checked here and stored in the simulated document store.</p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Single entry (employee)                                              */
/* ------------------------------------------------------------------ */
const TITLE_OPTIONS = [TRAINING.title, 'AML & CFT Refresher', 'Customer Experience Excellence', 'Leadership Essentials for Managers', 'Sustainable Finance Fundamentals', 'Trade Finance (CDCS)'];

function SingleEntryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useDemo();
  const blank = { eid: '', training: '', category: 'Functional', mode: 'In-house', medium: 'Classroom', institute: 'City Bank L&D', duration: '', manHour: '' };
  const [f, setF] = useState(blank);
  const [tried, setTried] = useState(false);
  const p = findByEid(f.eid);
  const errors = { eid: !p ? (f.eid ? 'No employee found with this Employee ID.' : 'Enter the Employee ID.') : '', training: !f.training.trim() ? 'Enter the training / course.' : '', duration: !f.duration.trim() ? 'Enter the duration, e.g. 05 Nov 2026 · 1 day.' : '', manHour: !/^\d+(\.\d+)?$/.test(f.manHour) ? 'Enter the man-hours as a number.' : '' };
  const valid = Object.values(errors).every((x) => !x);
  const hint = (k: keyof typeof errors) => (tried && errors[k] ? <span className="text-brand">{errors[k]}</span> : undefined);
  const close = () => { setF(blank); setTried(false); onClose(); };
  const save = () => {
    setTried(true);
    if (!valid || !p) return;
    s.addDbRows([{ eid: p.eid, name: p.name, grade: p.grade, designation: p.designation, division: p.division, location: p.location, training: f.training.trim(), meta: `${f.category} · ${f.mode} · ${f.medium}`, institute: f.institute, duration: f.duration.trim(), manHour: f.manHour, source: 'Single entry' }], 'Single entry');
    useDemo.setState({ toast: `Record added: ${p.name} · ${f.training.trim()}` });
    close();
  };
  return (
    <Modal open={open} onClose={close} title="Single entry · Training Database" footer={<><Btn v="secondary" onClick={close}>Cancel</Btn><Btn onClick={save}>Save record</Btn></>}>
      <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
        <Field label="Employee ID" hint={hint('eid') ?? (!f.eid ? <span className="text-ink-3">Try CBL-10977</span> : undefined)}><input className={inputCls} value={f.eid} onChange={(e) => setF({ ...f, eid: e.target.value })} placeholder="CBL-00000" /></Field>
        {p && <div className="rounded-lg bg-canvas p-3 text-[15px]"><b>{p.name}</b> · {p.grade} · {p.designation} · {p.division} · {p.location}<div className="text-[14px] text-ink-3">From Employee Database (HRIS) · simulated</div></div>}
        <Field label="Training / Course" hint={hint('training')}>
          <input className={inputCls} list="tdb-titles" value={f.training} onChange={(e) => setF({ ...f, training: e.target.value })} />
          <datalist id="tdb-titles">{TITLE_OPTIONS.map((t) => <option key={t} value={t} />)}</datalist>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Category"><select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{MASTERS.categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Mode"><select className={inputCls} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>{MASTERS.modes.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Medium"><select className={inputCls} value={f.medium} onChange={(e) => setF({ ...f, medium: e.target.value })}>{MASTERS.mediums.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Institute"><select className={inputCls} value={f.institute} onChange={(e) => setF({ ...f, institute: e.target.value })}>{VENDORS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration" hint={hint('duration')}><input className={inputCls} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="05 Nov 2026 · 1 day" /></Field>
          <Field label="Man-hour" hint={hint('manHour')}><input className={inputCls} inputMode="decimal" value={f.manHour} onChange={(e) => setF({ ...f, manHour: e.target.value })} placeholder="8" /></Field>
        </div>
      </div>
    </Modal>
  );
}

function ExternalEntryModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (x: Omit<External, 'id' | 'source'>) => void }) {
  const blank = { name: '', organisation: '', contact: '', training: '', institute: 'City Bank L&D', duration: '', manHour: '' };
  const [f, setF] = useState(blank);
  const [tried, setTried] = useState(false);
  const errors = { name: !f.name.trim() ? 'Enter the trainee name.' : '', organisation: !f.organisation.trim() ? 'Enter the organisation.' : '', training: !f.training.trim() ? 'Enter the training / course.' : '' };
  const valid = Object.values(errors).every((x) => !x);
  const hint = (k: keyof typeof errors) => (tried && errors[k] ? <span className="text-brand">{errors[k]}</span> : undefined);
  const close = () => { setF(blank); setTried(false); onClose(); };
  return (
    <Modal open={open} onClose={close} title="Single entry · External trainee" footer={<><Btn v="secondary" onClick={close}>Cancel</Btn><Btn onClick={() => { setTried(true); if (valid) { onSave(f); close(); } }}>Save record</Btn></>}>
      <div className="max-h-[62vh] space-y-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" hint={hint('name')}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Organisation" hint={hint('organisation')}><input className={inputCls} value={f.organisation} onChange={(e) => setF({ ...f, organisation: e.target.value })} /></Field>
        </div>
        <Field label="Contact (email or phone)"><input className={inputCls} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
        <Field label="Training / Course" hint={hint('training')}>
          <input className={inputCls} list="tdb-ext-titles" value={f.training} onChange={(e) => setF({ ...f, training: e.target.value })} />
          <datalist id="tdb-ext-titles">{TITLE_OPTIONS.map((t) => <option key={t} value={t} />)}</datalist>
        </Field>
        <Field label="Institute"><select className={inputCls} value={f.institute} onChange={(e) => setF({ ...f, institute: e.target.value })}>{VENDORS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration"><input className={inputCls} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} placeholder="12 Nov 2026 · 1 day" /></Field>
          <Field label="Man-hour"><input className={inputCls} inputMode="decimal" value={f.manHour} onChange={(e) => setF({ ...f, manHour: e.target.value })} placeholder="6" /></Field>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
type Keyed = DbRow & { key: string };
const SOURCE_TONE: Record<string, string> = { Attendance: 'ok', Bond: 'info', 'Employee request': 'warn', Seed: 'neutral', Migration: 'neutral', 'Bulk upload': 'neutral', 'Single entry': 'neutral' };
const SOURCE_LABEL = (src: DbRow['source']) => (src === 'Seed' ? 'Existing record' : src);
const TABS = ['Employee training records', 'External trainees'];

export function TrainingDb() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [modal, setModal] = useState<'migration' | 'bulk' | 'single' | 'ext-single' | 'ext-bulk' | null>(null);
  const [external, setExternal] = useState<External[]>(SEED_EXTERNAL);

  const rows: Keyed[] = useMemo(() => s.dbRows.map((r, i) => ({ ...r, key: `${s.dbRows.length - i}` })), [s.dbRows]);
  const fresh = new Set(['Attendance', 'Bond', 'Single entry', 'Bulk upload', 'Migration', 'Employee request']);

  const columns: Column<Keyed>[] = [
    { key: 'eid', header: 'EID', sort: (r) => r.eid, render: (r) => <span className="whitespace-nowrap tabular-nums">{r.eid}</span> },
    { key: 'name', header: 'Name', sort: (r) => r.name, render: (r) => <span className="whitespace-nowrap font-semibold">{r.name}</span> },
    { key: 'grade', header: 'Grade', render: (r) => r.grade },
    { key: 'designation', header: 'Designation', render: (r) => <span className="whitespace-nowrap">{r.designation}</span> },
    { key: 'division', header: 'Division', filter: (r) => r.division, sort: (r) => r.division, render: (r) => <span className="whitespace-nowrap">{r.division}</span> },
    { key: 'location', header: 'Location', render: (r) => r.location },
    { key: 'training', header: 'Training / Course', sort: (r) => r.training, render: (r) => <span className="font-semibold">{r.training}</span> },
    { key: 'meta', header: 'Category · Mode · Medium', render: (r) => <span className="whitespace-nowrap">{r.meta}</span> },
    { key: 'institute', header: 'Institute', render: (r) => r.institute },
    { key: 'duration', header: 'Duration', render: (r) => <span className="whitespace-nowrap">{r.duration}</span> },
    { key: 'manHour', header: 'Man-hour', sort: (r) => Number(r.manHour) || 0, render: (r) => r.manHour },
    { key: 'source', header: 'Source', filter: (r) => SOURCE_LABEL(r.source), render: (r) => <Badge t={SOURCE_TONE[r.source] ?? 'neutral'}>{SOURCE_LABEL(r.source)}</Badge> },
  ];
  const extColumns: Column<External>[] = [
    { key: 'id', header: 'Record ID', sort: (r) => r.id, render: (r) => <span className="tabular-nums">{r.id}</span> },
    { key: 'name', header: 'Name', sort: (r) => r.name, render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'org', header: 'Organisation', filter: (r) => r.organisation, render: (r) => r.organisation },
    { key: 'contact', header: 'Contact', render: (r) => r.contact || '—' },
    { key: 'training', header: 'Training / Course', sort: (r) => r.training, render: (r) => r.training },
    { key: 'institute', header: 'Institute', render: (r) => r.institute || '—' },
    { key: 'duration', header: 'Duration', render: (r) => r.duration || '—' },
    { key: 'manHour', header: 'Man-hour', render: (r) => r.manHour || '—' },
    { key: 'source', header: 'Source', filter: (r) => r.source, render: (r) => <Badge t="neutral">{r.source}</Badge> },
  ];

  const exportDb = () => downloadCsv('training-database.csv', [...DB_HEADER, 'Source'], s.dbRows.map((r) => [r.eid, r.name, r.grade, r.designation, r.division, r.location, r.training, r.meta, r.institute, r.duration, r.manHour, SOURCE_LABEL(r.source)]));
  const exportExt = () => downloadCsv('external-trainees.csv', ['Record ID', ...EXT_HEADER, 'Source'], external.map((r) => [r.id, r.name, r.organisation, r.contact, r.training, r.institute, r.duration, r.manHour, r.source]));

  const addExternal = (list: Omit<External, 'id' | 'source'>[], source: string, file?: string) => {
    const start = external.length + 1;
    const withIds = list.map((x, i) => ({ ...x, id: `EXT-2026-${String(start + i).padStart(3, '0')}`, source }));
    setExternal([...withIds, ...external]);
    s.logEvent('hr', 'External trainee database updated', `${withIds.length} record${withIds.length > 1 ? 's' : ''} · ${source}${file ? ` · ${file}` : ''} (FR 173–174)`);
    useDemo.setState({ toast: `${withIds.length} external trainee record${withIds.length > 1 ? 's' : ''} added` });
  };

  const employeeTab = tab === TABS[0];
  return (
    <div>
      <PageHead
        title="Training Database"
        meta="One learning record per training, fed by attendance, bonds, migration, bulk and single entry"
        fr="FR 169–174"
        tags={<SourceTag kind="fictional" />}
        actions={employeeTab ? (
          <>
            <Btn v="secondary" icon={<FileUp size={16} />} onClick={() => setModal('migration')}>Migration uploader</Btn>
            <Btn v="secondary" icon={<Download size={16} />} onClick={() => setModal('bulk')}>Bulk entry template</Btn>
            <Btn icon={<Plus size={16} />} onClick={() => setModal('single')}>Single entry</Btn>
          </>
        ) : (
          <>
            <Btn v="secondary" icon={<FileUp size={16} />} onClick={() => setModal('ext-bulk')}>Bulk entry template</Btn>
            <Btn icon={<Plus size={16} />} onClick={() => setModal('ext-single')}>Single entry</Btn>
          </>
        )}
      />

      <div className="mb-5"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>

      {employeeTab ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-[#faf8f5] px-5 py-4 text-[16px]">
            <span>Employee requests to add a training record (FR 6, 172) are validated in <b>HR Approvals</b>{s.recordRequest === 'pending' ? ' · 1 waiting now' : s.recordRequest === 'approved' ? ' · last request approved and added here' : ''}.</span>
            <span className="flex-1" />
            <Btn v="link" onClick={() => nav('/hr/approvals')}>Open HR Approvals</Btn>
          </div>
          <DataTable<Keyed>
            rows={rows}
            columns={columns}
            rowKey={(r) => r.key}
            searchText={(r) => `${r.eid} ${r.name} ${r.training} ${r.institute}`}
            searchPlaceholder="Search by Employee ID, name or training"
            label="records"
            rowClassName={(r) => cx(fresh.has(r.source) && 'bg-ok-soft/40')}
            toolbar={<Btn v="secondary" size="sm" icon={<Download size={15} />} onClick={exportDb}>Export CSV</Btn>}
          />
          <p className="mt-3 text-[15px] text-ink-3">Highlighted rows were added in this session. “Submit &amp; Update Training Database” writes attendance rows automatically (FR 170) and “Input in Training Database &amp; Exit” on a bond writes a bond row (FR 171). Name, grade, designation, division and location come from the Employee Database by Employee ID.</p>
        </>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">A separate database for trainees from outside the bank (subsidiaries, agents, partners). <FrRef>FR 173–174</FrRef></div>
          <DataTable<External>
            rows={external}
            columns={extColumns}
            rowKey={(r) => r.id}
            searchText={(r) => `${r.name} ${r.organisation} ${r.training}`}
            searchPlaceholder="Search by name, organisation or training"
            label="external trainees"
            toolbar={<Btn v="secondary" size="sm" icon={<Download size={15} />} onClick={exportExt}>Export CSV</Btn>}
          />
        </>
      )}

      <UploadModal<DbRow>
        open={modal === 'migration'} onClose={() => setModal(null)} title="Migration uploader"
        intro="Upload the existing training history from the old system (FR 169). Each row needs an Employee ID and a training; the HRIS fields fill in automatically."
        header={DB_HEADER} sample={SAMPLE_MIGRATION} templateName="training-db-migration-template.csv" parse={parseDbRows}
        describe={(r) => `${r.eid} · ${r.name} · ${r.training}`}
        onImport={(list) => { s.addDbRows(list, 'Migration'); useDemo.setState({ toast: `${list.length} records migrated into the Training Database` }); }}
      />
      <UploadModal<DbRow>
        open={modal === 'bulk'} onClose={() => setModal(null)} title="Bulk entry template"
        intro="Download the template, fill one row per employee and training, then upload it (FR 172)."
        header={DB_HEADER} sample={SAMPLE_BULK} templateName="training-db-bulk-template.csv" parse={parseDbRows}
        describe={(r) => `${r.eid} · ${r.name} · ${r.training}`}
        onImport={(list) => { s.addDbRows(list, 'Bulk upload'); useDemo.setState({ toast: `${list.length} records added by bulk upload` }); }}
      />
      <UploadModal<External>
        open={modal === 'ext-bulk'} onClose={() => setModal(null)} title="Bulk entry template · External trainees"
        intro="Migrate or bulk-add external trainee records (FR 173–174). Name and training are required."
        header={EXT_HEADER} sample={SAMPLE_EXTERNAL} templateName="external-trainees-template.csv" parse={(t) => parseExternal(t, external.length + 1)}
        describe={(r) => `${r.name} · ${r.organisation} · ${r.training}`}
        onImport={(list, file) => addExternal(list, 'Bulk upload', file)}
      />
      <SingleEntryModal open={modal === 'single'} onClose={() => setModal(null)} />
      <ExternalEntryModal open={modal === 'ext-single'} onClose={() => setModal(null)} onSave={(x) => addExternal([x], 'Single entry')} />
    </div>
  );
}
