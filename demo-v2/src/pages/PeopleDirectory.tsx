/**
 * People (FR 11, 15, 168): City Bank → Division → Department → Team → Employee, and each employee's learning record.
 * The single place to explore the organisation and open an individual learning record.
 */
import { useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { TRAINING } from '../data';
import { CREDIT_TARGET, DIRECTORY, DIVISIONS, findById, type Person } from '../org';
import { ptResults, roster, useDemo, type DemoState } from '../store';
import { Badge, Btn, cx, Field, inputCls, Modal } from '../components/ui';
import { SourceTag } from '../components/Source';
import { IDP_REQUESTS } from '../tnaData';
import { mandatoryOf, personRows, type PersonRow } from './oversight/dash';
import { recordRowsFor } from './employee/Record';

const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];
const card = 'rounded-2xl bg-white ring-1 ring-line';
const btn2 = 'min-h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-[14px] hover:border-ink/30';
const sel = 'min-h-10 rounded-lg border border-line bg-white px-3 text-[15px]';
type Tone = 'ok' | 'warn' | 'info' | 'neutral' | 'brand';

/* ---------------- per-person status ---------------- */
type Status = 'Failed assessment' | 'Overdue' | 'Withdrawal requested' | 'At risk' | 'Below target' | 'Completed' | 'Not enrolled' | 'On track';
const STATUS_TONE: Record<Status, Tone> = { 'Failed assessment': 'brand', Overdue: 'brand', 'Withdrawal requested': 'warn', 'At risk': 'warn', 'Below target': 'warn', Completed: 'ok', 'Not enrolled': 'neutral', 'On track': 'info' };
const RISK_LEVEL: Record<Status, number> = { 'Failed assessment': 3, Overdue: 3, 'Withdrawal requested': 2, 'At risk': 2, 'Below target': 1, Completed: 0, 'Not enrolled': 0, 'On track': 0 };
const below = (p: Person) => TARGET_ROLES.includes(p.designation) && p.creditLevel < CREDIT_TARGET;
function statusOf(s: DemoState, r: PersonRow): Status {
  const part = s.participation[r.p.id] ?? '';
  if (r.failed) return 'Failed assessment';
  if (r.course?.overdue) return 'Overdue';
  if (/Withdrawal|Replacement Proposed/.test(part)) return 'Withdrawal requested';
  if (r.course && r.course.status !== 'Completed' && r.course.progress < 50) return 'At risk';
  if (below(r.p) && !r.inTraining) return 'Below target';
  if (r.completed) return 'Completed';
  if (!r.course && !r.inTraining) return 'Not enrolled';
  return 'On track';
}
const current = (r: PersonRow) => (r.inTraining ? TRAINING.title : r.course ? 'Information Security Awareness 2026' : '—');

/* ================================================================== */
export function PeopleDirectory() {
  const s = useDemo();
  const nav = useNavigate();
  const [scope, setScope] = useState<{ div?: string; dept?: string; team?: string }>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Corporate Banking': true });
  const [q, setQ] = useState('');
  const [f, setF] = useState({ desig: 'All designations', role: 'All roles', learn: 'All learning', mand: 'All mandatory', comp: 'All competency', train: 'All training', risk: 'All risk' });
  const [sort, setSort] = useState('Highest risk');
  const rowsAll = personRows(s, DIRECTORY);
  const depts = (d: string) => [...new Set(DIRECTORY.filter((p) => p.division === d).map((p) => p.department))].sort();
  const teams = (d: string, dp: string) => [...new Set(DIRECTORY.filter((p) => p.division === d && p.department === dp).map((p) => p.supervisor))].sort();
  const count = (fn: (p: Person) => boolean) => DIRECTORY.filter(fn).length;

  const filtered = rowsAll.filter((r) => {
    const p = r.p; const st = statusOf(s, r);
    return (!scope.div || p.division === scope.div) && (!scope.dept || p.department === scope.dept) && (!scope.team || p.supervisor === scope.team)
      && (!q.trim() || `${p.name} ${p.eid}`.toLowerCase().includes(q.trim().toLowerCase()))
      && (f.desig === 'All designations' || p.designation === f.desig)
      && (f.role === 'All roles' || (f.role === 'Credit roles') === TARGET_ROLES.includes(p.designation))
      && (f.learn === 'All learning' || (f.learn === 'Learning now' ? r.inTraining || (!!r.course && r.course.status !== 'Completed') : !r.inTraining))
      && (f.mand === 'All mandatory' || (r.course?.overdue ? 'Overdue' : r.course?.status ?? 'Not enrolled') === f.mand)
      && (f.comp === 'All competency' || (f.comp === 'Below target') === below(p))
      && (f.train === 'All training' || r.story === f.train)
      && (f.risk === 'All risk' || st === f.risk);
  });
  const sorted = [...filtered].sort((a, b) => sort === 'Name' ? a.p.name.localeCompare(b.p.name) : sort === 'Division' ? a.p.division.localeCompare(b.p.division)
    : sort === 'Progress' ? (a.course?.progress ?? 0) - (b.course?.progress ?? 0) : sort === 'Largest competency gap' ? a.p.creditLevel - b.p.creditLevel
      : sort === 'Upcoming deadline' ? (a.course?.due ?? 'z').localeCompare(b.course?.due ?? 'z') : RISK_LEVEL[statusOf(s, b)] - RISK_LEVEL[statusOf(s, a)]);
  const listing = !!(scope.div || q.trim() || Object.values(f).some((v) => !v.startsWith('All')));
  const learning = rowsAll.filter((r) => r.inTraining || (r.course && r.course.status !== 'Completed')).length;
  const attention = rowsAll.filter((r) => RISK_LEVEL[statusOf(s, r)] >= 2).length;
  const crumbs = [['City Bank', {}], ...(scope.div ? [[scope.div, { div: scope.div }]] : []), ...(scope.dept ? [[scope.dept, { div: scope.div, dept: scope.dept }]] : []), ...(scope.team ? [[`Team · ${scope.team}`, scope]] : [])] as [string, typeof scope][];
  const go = (id: string, tab?: string) => nav(`/people/${id}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`);
  const Node = ({ label, n, on, depth, onClick, toggle, expanded }: { label: string; n: number; on: boolean; depth: number; onClick: () => void; toggle?: () => void; expanded?: boolean }) => (
    <div className={cx('flex items-center gap-1 rounded-lg pr-2', on ? 'bg-canvas' : 'hover:bg-canvas/60')} style={{ paddingLeft: depth * 16 }}>
      {toggle ? <button onClick={toggle} aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`} className="grid h-8 w-6 place-items-center text-ink-3">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button> : <span className="w-6" />}
      <button onClick={onClick} className={cx('flex min-w-0 flex-1 items-center justify-between gap-2 py-1.5 text-left text-[15px]', on && 'font-medium')}><span className="truncate">{label}</span><span className="text-[14px] tabular-nums text-ink-3">{n}</span></button>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-[36px] font-semibold tracking-tight">People</h1><p className="text-[16px] text-ink-2">Explore the organisation and open anyone’s learning record.</p></div>
        <SourceTag kind="fictional" />
      </header>
      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        {([[DIRECTORY.length, 'Employees', () => setScope({})], [DIVISIONS.length, 'Divisions'], [new Set(DIRECTORY.map((p) => `${p.division}/${p.department}`)).size, 'Departments'], [learning, 'Learning now', () => setF({ ...f, learn: 'Learning now' })], [attention, 'Need attention', () => setSort('Highest risk')], [rowsAll.filter((r) => below(r.p)).length, 'Below target', () => setF({ ...f, comp: 'Below target' })]] as [number, string, (() => void)?][]).map(([n, l, fn]) => (
          <li key={l}><button onClick={fn} disabled={!fn} className={cx(card, 'w-full px-5 py-3.5 text-left enabled:hover:shadow-md')}><div className={cx('text-[32px] font-semibold leading-none tabular-nums', (l === 'Need attention' || l === 'Below target') && 'text-amber-700')}>{n}</div><div className="mt-1.5 text-[15px] text-ink-2">{l}</div></button></li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        {/* hierarchy */}
        <nav aria-label="Organisation" className={cx(card, 'self-start p-3')}>
          <Node label="City Bank" n={DIRECTORY.length} on={!scope.div} depth={0} onClick={() => setScope({})} />
          {DIVISIONS.map((d) => (
            <div key={d.name}>
              <Node label={d.name} n={count((p) => p.division === d.name)} on={scope.div === d.name && !scope.dept} depth={1} expanded={!!open[d.name]} toggle={() => setOpen({ ...open, [d.name]: !open[d.name] })} onClick={() => { setScope({ div: d.name }); setOpen({ ...open, [d.name]: true }); }} />
              {open[d.name] && depts(d.name).map((dp) => (
                <div key={dp}>
                  <Node label={dp} n={count((p) => p.division === d.name && p.department === dp)} on={scope.dept === dp && scope.div === d.name && !scope.team} depth={2} expanded={!!open[`${d.name}/${dp}`]} toggle={() => setOpen({ ...open, [`${d.name}/${dp}`]: !open[`${d.name}/${dp}`] })} onClick={() => setScope({ div: d.name, dept: dp })} />
                  {open[`${d.name}/${dp}`] && teams(d.name, dp).map((t) => <Node key={t} label={`Team · ${t}`} n={count((p) => p.division === d.name && p.department === dp && p.supervisor === t)} on={scope.team === t && scope.dept === dp} depth={3} onClick={() => setScope({ div: d.name, dept: dp, team: t })} />)}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <section className="min-w-0">
          <ol className="mb-3 flex flex-wrap items-center gap-1.5 text-[15px]">
            {crumbs.map(([l, sc], i) => <li key={l} className="flex items-center gap-1.5">{i > 0 && <ChevronRight size={14} className="text-ink-3" />}<button onClick={() => setScope(sc)} className={i === crumbs.length - 1 ? 'font-medium' : 'text-ink-2 hover:text-brand'}>{l}</button></li>)}
          </ol>
          <div className={cx(card, 'flex flex-wrap gap-2 px-4 py-3')}>
            <input aria-label="Search by name or Employee ID" className={cx(inputCls, 'max-w-[240px]')} placeholder="Name or Employee ID" value={q} onChange={(e) => setQ(e.target.value)} />
            <select aria-label="Designation" className={sel} value={f.desig} onChange={(e) => setF({ ...f, desig: e.target.value })}>{['All designations', ...new Set(DIRECTORY.map((p) => p.designation))].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Role" className={sel} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{['All roles', 'Credit roles', 'Other roles'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Learning status" className={sel} value={f.learn} onChange={(e) => setF({ ...f, learn: e.target.value })}>{['All learning', 'Learning now', 'Not learning'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Mandatory course" className={sel} value={f.mand} onChange={(e) => setF({ ...f, mand: e.target.value })}>{['All mandatory', 'Completed', 'In progress', 'Overdue', 'Not started', 'Not enrolled'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Competency status" className={sel} value={f.comp} onChange={(e) => setF({ ...f, comp: e.target.value })}>{['All competency', 'Below target', 'At target'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Training status" className={sel} value={f.train} onChange={(e) => setF({ ...f, train: e.target.value })}>{['All training', ...new Set(rowsAll.map((r) => r.story))].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Risk status" className={sel} value={f.risk} onChange={(e) => setF({ ...f, risk: e.target.value })}>{['All risk', ...Object.keys(STATUS_TONE)].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Sort by" className={sel} value={sort} onChange={(e) => setSort(e.target.value)}>{['Highest risk', 'Name', 'Division', 'Progress', 'Largest competency gap', 'Upcoming deadline'].map((x) => <option key={x}>{x}</option>)}</select>
            <button onClick={() => { setQ(''); setF({ desig: 'All designations', role: 'All roles', learn: 'All learning', mand: 'All mandatory', comp: 'All competency', train: 'All training', risk: 'All risk' }); }} className="px-2 text-[15px] text-ink-2 hover:text-ink">Reset</button>
          </div>

          {listing ? (
            <div className={cx(card, 'mt-4 overflow-x-auto px-5 py-3')}>
              <table className="w-full min-w-[1040px] text-left text-[15px]">
                <thead className="text-[14px] text-ink-3"><tr>{['Employee', 'Designation · department', 'Current learning', 'Progress', 'Competency', 'Mandatory', 'Status', 'Actions'].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {sorted.map((r) => {
                    const st = statusOf(s, r);
                    return (
                      <tr key={r.p.id}>
                        <td className="py-2.5 pr-3"><button onClick={() => go(r.p.id)} className="text-left hover:text-brand"><span className="block">{r.p.name}</span><span className="text-[14px] tabular-nums text-ink-3">{r.p.eid}</span></button></td>
                        <td className="py-2.5 pr-3 text-ink-2">{r.p.designation}<span className="block text-[14px] text-ink-3">{r.p.department}</span></td>
                        <td className="py-2.5 pr-3 text-ink-2">{current(r)}</td>
                        <td className="py-2.5 pr-3">{r.course ? <span className="flex items-center gap-2"><span className="h-2 w-20 rounded-full bg-canvas"><span className="block h-2 rounded-full bg-ok" style={{ width: `${r.course.progress}%` }} /></span><span className="tabular-nums text-ink-2">{r.course.progress}%</span></span> : '—'}</td>
                        <td className={cx('py-2.5 pr-3', below(r.p) ? 'text-amber-700' : 'text-ink-2')}>{TARGET_ROLES.includes(r.p.designation) ? `L${r.p.creditLevel} of ${CREDIT_TARGET}` : '—'}</td>
                        <td className="py-2.5 pr-3 text-ink-2">{r.course ? (r.course.overdue ? 'Overdue' : r.course.status) : 'Not enrolled'}</td>
                        <td className="py-2.5 pr-3"><Badge t={STATUS_TONE[st]}>{st}</Badge></td>
                        <td className="py-2.5"><div className="flex flex-wrap gap-x-3 gap-y-1 text-[14px]">
                          <button onClick={() => go(r.p.id)} className="text-brand hover:underline">Open record</button>
                          {below(r.p) && <button onClick={() => go(r.p.id, 'Competencies')} className="text-brand hover:underline">Competency gap</button>}
                          <button onClick={() => go(r.p.id, 'Training Record')} className="text-brand hover:underline">Training record</button>
                          {r.result !== '—' && <button onClick={() => go(r.p.id, 'Assessments')} className="text-brand hover:underline">Assessment</button>}
                          <button onClick={() => go(r.p.id, 'Calendar')} className="text-brand hover:underline">Calendar</button>
                        </div></td>
                      </tr>
                    );
                  })}
                  {!sorted.length && <tr><td colSpan={8} className="py-6 text-center text-ink-3">Nobody matches these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {DIVISIONS.map((d) => {
                const rs = rowsAll.filter((r) => r.p.division === d.name);
                return (
                  <li key={d.name}><button onClick={() => { setScope({ div: d.name }); setOpen({ ...open, [d.name]: true }); }} className={cx(card, 'w-full px-6 py-5 text-left hover:shadow-md')}>
                    <div className="flex items-baseline justify-between gap-3"><span className="text-[20px] font-semibold">{d.name}</span><span className="text-[15px] text-ink-3">{rs.length} people</span></div>
                    <div className="mt-1 text-[14px] text-ink-3">Head: {d.head} · {depts(d.name).join(', ')}</div>
                    <div className="mt-3 flex flex-wrap gap-x-5 text-[15px]"><span><b className="font-medium">{rs.filter((r) => r.inTraining || (r.course && r.course.status !== 'Completed')).length}</b> learning</span><span className="text-amber-700"><b className="font-medium">{rs.filter((r) => RISK_LEVEL[statusOf(s, r)] >= 2).length}</b> need attention</span><span><b className="font-medium">{rs.filter((r) => below(r.p)).length}</b> below target</span></div>
                  </button></li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Individual learning record                                          */
/* ================================================================== */
const TABS = ['Overview', 'Current Learning', 'Training Record', 'Calendar', 'Competencies', 'Assessments', 'Feedback', 'Certificates', 'Development Requests'] as const;
type Tab = (typeof TABS)[number];

function Tbl({ head, rows, empty = 'Nothing yet.' }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-[15px]">
      <thead className="text-[14px] text-ink-3"><tr>{head.map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className="py-2.5 pr-3">{c}</td>)}</tr>) : <tr><td colSpan={head.length} className="py-6 text-center text-ink-3">{empty}</td></tr>}</tbody>
    </table></div>
  );
}

export function EmployeeRecord() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const s = useDemo();
  const nav = useNavigate();
  const p = findById(id);
  const [period, setPeriod] = useState('All periods');
  const [rec, setRec] = useState(false);
  const [form, setForm] = useState({ title: 'CFA Level I', provider: 'CFA Institute', date: '2026-08', duration: '300 hours', description: 'Self-study with exam passed in August 2026.', file: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  if (!p) return <div className="mx-auto max-w-[1320px]"><button onClick={() => nav('/people')} className="flex items-center gap-2 text-[15px] text-ink-2"><ArrowLeft size={16} />People</button><p className="mt-6">Employee not found.</p></div>;
  const tab = (TABS as readonly string[]).includes(sp.get('tab') ?? '') ? (sp.get('tab') as Tab) : 'Overview';
  const row = personRows(s, [p])[0];
  const st = statusOf(s, row);
  const m = mandatoryOf(s, p.id);
  const recs = recordRowsFor(s, p.id);
  const year = new Date().getFullYear();
  const shownRecs = recs.filter((r) => period === 'All periods' || (period === 'This year' ? r.iso.startsWith('2026') : r.iso.startsWith('2025')));
  const hours = recs.filter((r) => r.iso.startsWith('2026')).reduce((n, r) => n + r.hours, 0);
  const pt = ptResults(s).find((r) => r.id === p.id);
  const onTraining = roster(s).some((e) => e.id === p.id);
  const isE1 = p.id === 'e1';
  const reqState = isE1 ? s.recordRequest : (s.audit.find((a) => a.action === 'Training record submitted' && a.detail.startsWith(`${p.name} · `)) ? 'pending' : 'none');
  const next = row.failed ? 'Book a re-attempt' : m?.overdue ? 'Remind about the overdue course' : m && m.status !== 'Completed' ? 'Continue the mandatory course' : below(p) && !onTraining ? 'Nominate for Credit Analysis training' : 'No action needed';
  const certs = [...recs.filter((r) => r.certificate).map((r) => ({ t: r.learning, date: r.dateLabel, no: `CERT-${r.iso.slice(0, 4)}-${(r.key.length * 7919 + r.iso.length * 31) % 90000 + 10000}` })), ...(isE1 && s.courseCompleted ? [{ t: 'Information Security Awareness 2026', date: '12 Nov 2026', no: 'CERT-2026-088412' }] : [])];
  const events: [string, string, string, Tone][] = [
    ...(onTraining ? [['18–19 Nov', `${TRAINING.title} · training`, s.participation[p.id] ?? 'Selected', 'info'] as [string, string, string, Tone]] : []),
    ...(m && m.status !== 'Completed' ? [[m.due.replace(' 2026', ''), 'Information Security Awareness 2026 due', `${m.progress}%`, m.overdue ? 'brand' : 'warn'] as [string, string, string, Tone]] : []),
    ...(onTraining && s.attendanceSubmitted ? [['20 Nov', 'Post-training assessment', pt?.status ?? '—', 'info'] as [string, string, string, Tone]] : []),
    ...(row.story === 'Attended' ? [['22 Nov', 'Feedback deadline', isE1 && s.feedbackSubmitted ? 'Sent' : 'Due', 'warn'] as [string, string, string, Tone]] : []),
    ['30 Nov', 'AML Annual Certification', 'Assigned', 'neutral'],
  ];
  const submit = () => {
    const [y, mo] = form.date.split('-');
    const when = y && mo ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mo) - 1]} ${y}` : form.date;
    if (isE1) s.requestRecord({ title: form.title.trim(), institute: form.provider.trim(), date: when, file: form.file || 'certificate.pdf' });
    else { s.logEvent('employee', 'Training record submitted', `${p.name} · ${form.title} (${form.provider}) · ${when} · ${form.duration} · awaiting HR validation`); useDemo.setState({ toast: 'Sent to HR for validation' }); }
    setRec(false);
  };
  const steps = ['Current level', 'Recommended course', 'Training', 'Assessment', 'Review', 'Updated competency'];
  const done = pt?.status === 'Passed' ? 4 : onTraining && s.attendanceSubmitted ? 2 : onTraining ? 1 : 0;

  return (
    <div className="mx-auto max-w-[1320px]">
      <button onClick={() => nav('/people')} className="flex items-center gap-2 text-[15px] text-ink-2 hover:text-brand"><ArrowLeft size={16} />People · {p.division} · {p.department}</button>
      <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{p.name}</h1>
          <p className="text-[16px] text-ink-2">{p.eid} · {p.designation} · {p.division} · {p.department} · supervisor {p.supervisor}</p>
        </div>
        <div className="flex items-center gap-3"><Badge t={STATUS_TONE[st]}>{st}</Badge>{TARGET_ROLES.includes(p.designation) && <Badge t={below(p) ? 'warn' : 'ok'}>Credit Analysis L{p.creditLevel} of {CREDIT_TARGET}</Badge>}</div>
      </header>
      <div className="mt-5 flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-line" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setSp({ tab: t })} className={cx('rounded-md px-3 py-1.5 text-[15px]', tab === t ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}>{t}</button>)}
      </div>

      <section className={cx(card, 'mt-5 px-6 py-5')}>
        {tab === 'Overview' && (
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-4">
            {([['Current learning', current(row)], ['Course progress', m ? `${m.progress}%` : '—'], ['Upcoming training', onTraining && !s.attendanceSubmitted ? `${TRAINING.title} · 18–19 Nov` : '—'], ['Upcoming assessment', onTraining && s.attendanceSubmitted && !s.pta.released ? 'Post-training assessment' : 'AML Annual Certification · 30 Nov'], ['Mandatory learning', m ? (m.overdue ? 'Overdue' : m.status) : 'Not enrolled'], ['Learning hours this year', `${hours} h`], ['Priority competency gap', TARGET_ROLES.includes(p.designation) && below(p) ? `Credit Analysis · ${CREDIT_TARGET - p.creditLevel} levels` : 'None']] as [string, string][]).map(([k, v]) => <div key={k}><div className="text-[14px] text-ink-3">{k}</div><div className="text-[17px]">{v}</div></div>)}
            <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><span className="text-[16px]"><span className="text-ink-3">Next action: </span>{next}</span>
              {next !== 'No action needed' && <button onClick={() => (next.startsWith('Remind') && m?.enrollmentId ? s.sendReminders([m.enrollmentId]) : setSp({ tab: next.startsWith('Book') ? 'Assessments' : next.startsWith('Nominate') ? 'Competencies' : 'Current Learning' }))} className="min-h-10 rounded-lg bg-brand px-4 text-[15px] font-medium text-white hover:bg-brand-dark">{next.startsWith('Remind') ? 'Send reminder' : 'Open'}</button>}</div>
          </div>
        )}
        {tab === 'Current Learning' && <Tbl head={['Course or training', 'Progress', 'Last activity', 'Due', 'Completion', 'Assessment', 'Risk', '']} rows={[
          ...(m ? [['Information Security Awareness 2026', `${m.progress}%`, m.progress === 0 ? 'Not started' : m.progress < 50 ? '9 days ago' : '2 days ago', m.due, m.status, 'Checkpoint quiz', <Badge key="r" t={m.overdue ? 'brand' : m.status === 'Completed' ? 'ok' : m.progress < 50 ? 'warn' : 'info'}>{m.overdue ? 'Overdue' : m.status === 'Completed' ? 'Completed' : m.progress < 50 ? 'At risk' : 'On track'}</Badge>, m.status !== 'Completed' && m.enrollmentId ? <button key="a" onClick={() => s.sendReminders([m.enrollmentId!])} className={btn2}>Send reminder</button> : null]] : []),
          ...(onTraining ? [[TRAINING.title, isE1 ? `${Math.round((s.tcourse.done / (s.courseModules.length || 4)) * 100)}%` : '—', '—', '18–19 Nov', row.story, pt?.status ?? '—', <Badge key="r" t={row.failed ? 'brand' : 'info'}>{row.failed ? 'Failed' : 'On track'}</Badge>, isE1 ? <button key="a" onClick={() => nav('/learning/training')} className={btn2}>View course</button> : null]] : []),
        ]} empty="Not enrolled in any learning right now." />}
        {tab === 'Training Record' && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <select aria-label="Time period" className={sel} value={period} onChange={(e) => setPeriod(e.target.value)}>{['All periods', 'This year', 'Last year'].map((x) => <option key={x}>{x}</option>)}</select>
              {reqState === 'pending' ? <Badge t="warn">Record request waiting for HR</Badge> : <button onClick={() => setRec(true)} className={btn2}>Request to add a training record</button>}
            </div>
            <Tbl head={['Training', 'Date', 'Medium', 'Attendance', 'Hours', 'Feedback', 'Certificate', 'Assessment']} rows={shownRecs.map((r) => [r.learning, r.dateLabel, r.type, r.kind === 'Programme' ? 'Attended' : '—', String(r.hours || '—'), r.kind === 'Programme' ? 'Given' : '—', r.certificate ? 'Issued' : '—', r.result])} />
          </>
        )}
        {tab === 'Calendar' && <ul className="divide-y divide-line">{events.map(([d, t, stt, tone]) => <li key={d + t} className="grid grid-cols-[90px_minmax(0,1fr)_auto] items-center gap-3 py-2.5"><span className="text-[15px] tabular-nums">{d}</span><span className="text-[16px]">{t}</span><Badge t={tone}>{stt}</Badge></li>)}</ul>}
        {tab === 'Competencies' && (
          <div className="space-y-5">
            <Tbl head={['Competency', 'Current', 'Target', 'Gap', 'Evaluation', 'Recommended learning', 'Progress']} rows={[['Credit Analysis', `L${p.creditLevel}`, `L${CREDIT_TARGET}`, String(Math.max(0, CREDIT_TARGET - p.creditLevel)), s.pta.released && pt ? `Assessed · ${pt.status}` : 'Not yet assessed', below(p) ? TRAINING.title : '—', onTraining ? row.story : below(p) ? 'Not nominated' : 'At target']]} />
            <ol className="flex flex-wrap items-center gap-2">{steps.map((x, i) => <li key={x} className="flex items-center gap-2"><span className={cx('rounded-full px-3 py-1 text-[14px]', i <= done ? 'bg-ok-soft text-ok' : 'bg-canvas text-ink-2')}>{x}</span>{i < steps.length - 1 && <ChevronRight size={14} className="text-ink-3" />}</li>)}</ol>
          </div>
        )}
        {tab === 'Assessments' && <Tbl head={['Exam', 'Date', 'Linked to', 'Score', 'Result', 'Evaluation', 'Trainer feedback']} rows={[
          ...(onTraining && s.attendanceSubmitted ? [['Post-training assessment', '20 Nov 2026', TRAINING.title, pt?.score != null && s.pta.released ? `${pt.score}%` : '—', pt?.status ?? '—', s.pta.released ? 'Released' : 'Trainer evaluating', isE1 && s.pta.released ? 'Clear cash-flow reasoning; quantify expected loss next time.' : '—']] : []),
          ...recs.filter((r) => r.kind === 'Assessment' || /%/.test(r.result)).map((r) => [r.learning, r.dateLabel, r.detail, r.result.split('· ')[1] ?? '—', 'Passed', 'Released', '—']),
        ]} empty="No assessments yet." />}
        {tab === 'Feedback' && <Tbl head={['Training', 'Requested', 'Submitted', 'Score', 'Comments', 'Status']} rows={[
          ...(row.story === 'Attended' ? [[TRAINING.title, '20 Nov 2026', isE1 && s.feedbackSubmitted ? '21 Nov 2026' : '—', isE1 && s.feedbackSubmitted ? '4.6 / 5' : '—', isE1 && s.feedbackSubmitted ? 'Practical case studies' : '—', isE1 && s.feedbackSubmitted ? 'Submitted' : 'Due']] : []),
          ...recs.filter((r) => r.kind === 'Programme').slice(0, 2).map((r) => [r.learning, r.dateLabel, r.dateLabel, '4.4 / 5', '—', 'Submitted']),
        ]} />}
        {tab === 'Certificates' && <Tbl head={['Certificate', 'Completion date', 'Number', 'QR', '']} rows={certs.map((c) => [c.t, c.date, <span key="n" className="tabular-nums">{c.no}</span>, <Badge key="q" t="ok">Verified</Badge>, <button key="d" onClick={() => nav('/employee/certificates')} className={btn2}>Download</button>])} empty="No certificates yet." />}
        {tab === 'Development Requests' && <Tbl head={['Request', 'Area', 'Requested learning', 'Submitted', 'Status']} rows={IDP_REQUESTS.filter((r) => r.personId === p.id).map((r) => [r.id, r.area, r.learning, r.submitted, s.tna.idpIds.includes(r.id) ? 'Used in a training request' : r.status])} empty="No development requests." />}
      </section>
      <p className="mt-3 text-[14px] text-ink-3">Year {year} · fictional demonstration data</p>

      <Modal open={rec} onClose={() => setRec(false)} title="Request to add a training record" footer={<><Btn v="secondary" onClick={() => setRec(false)}>Cancel</Btn><Btn disabled={!form.title.trim() || !form.provider.trim()} onClick={submit}>Send to HR</Btn></>}>
        <p className="mb-4 text-[16px] text-ink-2">HR validates it before it is added (FR 6, 172).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Training title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Provider"><input className={inputCls} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></Field>
          <Field label="Date"><input type="month" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Duration"><input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><span className="mb-1.5 block text-[15px] font-semibold text-ink-2">Supporting document</span>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="sr-only" aria-label="Choose supporting document" onChange={(e) => setForm({ ...form, file: e.target.files?.[0]?.name ?? '' })} />
            <div className="flex items-center gap-3"><Btn v="secondary" onClick={() => fileRef.current?.click()}>Choose file</Btn><span className="text-[15px] text-ink-2">{form.file || 'No file chosen'}</span></div></div>
        </div>
      </Modal>
    </div>
  );
}
