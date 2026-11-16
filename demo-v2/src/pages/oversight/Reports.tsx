/**
 * Reports (O4, FR 12, 175–185): the named report types with working filters, data computed from the
 * training database, the roster, attendance, assessment results and the directory, a bar visual,
 * CSV export and a print view for PDF. Supervisors and division heads see their own scope.
 */
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MASTERS, PERSONAS, TRAINING } from '../../data';
import { CREDIT_TARGET, DIVISIONS, type Person } from '../../org';
import { useDemo, type DemoState } from '../../store';
import { PageHead, Section } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { AiLabel, Badge, Btn, cx, Field, inputCls, Modal } from '../../components/ui';
import { Bars, inPeriod, isDone, MANDATORY_COURSE, monthLabel, monthOf, pct, PERIODS, personRows, printTable, scopeFor, Select, trainingRecords, type TrainingRecord } from './dash';
import { programmeRows } from './Dashboards';

type Key = 'employee' | 'division' | 'tag' | 'period' | 'gender' | 'group' | 'feedback' | 'calendar' | 'multi' | 'scheduled' | 'ai';
type FilterKey = 'period' | 'division' | 'tag' | 'category';
const REPORTS: { key: Key; label: string; fr: string; uses: FilterKey[] }[] = [
  { key: 'employee', label: 'Employee-wise', fr: 'FR 175', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'division', label: 'Division / Department / Function-wise', fr: 'FR 176', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'tag', label: 'Tag / label-wise', fr: 'FR 12, 177', uses: ['period', 'division', 'category'] },
  { key: 'period', label: 'Period-wise', fr: 'FR 178', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'gender', label: 'Gender-wise', fr: 'FR 179', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'group', label: 'Group-wise', fr: 'FR 180', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'feedback', label: 'Training feedback', fr: 'FR 181, 225', uses: [] },
  { key: 'calendar', label: 'Training calendar', fr: 'FR 182', uses: ['period'] },
  { key: 'multi', label: 'Multiple criteria', fr: 'FR 183', uses: ['period', 'division', 'tag', 'category'] },
  { key: 'scheduled', label: 'Scheduled distribution', fr: 'FR 184', uses: [] },
  { key: 'ai', label: 'AI training suggestions', fr: 'FR 185', uses: ['division'] },
];
const isKey = (v: string | null): v is Key => !!v && REPORTS.some((r) => r.key === v);
const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];

type Cell = string | number;
interface ColDef { key: string; header: string; filter?: boolean; strong?: boolean }
interface Out { cols: ColDef[]; rows: Record<string, Cell>[]; bars: { label: string; value: number }[]; barTitle: string; barUnit?: string; note?: ReactNode }

const uniq = (xs: string[]) => new Set(xs).size;
const sumHours = (rs: TrainingRecord[]) => rs.reduce((n, r) => n + r.hours, 0);

export function ReportsPage() {
  const s = useDemo();
  const [params] = useSearchParams();
  const scope = scopeFor(s.role);
  const defaultKey: Key = isKey(params.get('type')) ? (params.get('type') as Key) : s.role === 'supervisor' ? 'tag' : s.role === 'division_head' ? 'division' : 'employee';
  const [key, setKey] = useState<Key>(defaultKey);
  const [period, setPeriod] = useState('fy2026');
  const [division, setDivision] = useState('All divisions');
  const [tag, setTag] = useState('All labels');
  const [category, setCategory] = useState('All categories');
  const [tagSet, setTagSet] = useState<string[]>([]);
  const [tagMode, setTagMode] = useState<'any' | 'all'>('any');
  const [level, setLevel] = useState<'Division' | 'Department'>(scope.kind === 'bank' ? 'Division' : 'Department');
  const rep = REPORTS.find((r) => r.key === key) ?? REPORTS[0];
  const uses = (f: FilterKey) => rep.uses.includes(f) && !(f === 'division' && scope.kind !== 'bank');

  const eids = new Set(scope.people.map((p) => p.eid));
  const base = trainingRecords(s).filter((r) => scope.kind === 'bank' || eids.has(r.eid));
  const tagsPresent = MASTERS.tags.filter((t) => base.some((r) => r.tags.includes(t)));
  const recs = base.filter((r) =>
    (!uses('period') || inPeriod(period, r.ym)) &&
    (!uses('division') || division === 'All divisions' || r.division === division) &&
    (!uses('tag') || tag === 'All labels' || r.tags.includes(tag)) &&
    (!uses('category') || category === 'All categories' || r.category === category));
  const people = scope.people.filter((p) => !uses('division') || division === 'All divisions' || p.division === division);

  const out = key === 'scheduled' || key === 'ai' ? null : compute(key, { recs, people, level, tagSet, tagMode, tagsPresent, period, s });
  const filterText = [uses('period') && PERIODS.find((p) => p.key === period)?.label, uses('division') && division, uses('tag') && tag, uses('category') && category].filter(Boolean).join(' · ');
  const title = `${rep.label} training report`;
  const header = out?.cols.map((c) => c.header) ?? [];
  const flat = out?.rows.map((r) => out.cols.map((c) => r[c.key] ?? '')) ?? [];
  const [printBlocked, setPrintBlocked] = useState(false);

  return (
    <div>
      <PageHead title="Reports" meta={<>Scope: <b className="text-ink">{scope.label}</b> · {scope.people.length} people</>} fr="FR 12, 175–185" tags={<SourceTag kind="fictional" />}
        actions={out ? <>
          <Btn v="secondary" onClick={() => downloadCsv(`${key}-report.csv`, header, flat)}>Download CSV (Excel)</Btn>
          <Btn v="secondary" onClick={() => setPrintBlocked(!printTable(title, `${scope.label}${filterText ? ` · ${filterText}` : ''}`, header, flat))}>Print / Save as PDF</Btn>
        </> : undefined} />
      {printBlocked && <p className="-mt-4 mb-6 text-[15px] text-warn">The browser blocked the print window. Allow pop-ups for this page and try again.</p>}

      <div role="tablist" aria-label="Report type" className="flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button key={r.key} role="tab" aria-selected={key === r.key} onClick={() => setKey(r.key)} className={cx('rounded-full border px-4 py-2 text-[15px] font-semibold transition-colors', key === r.key ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-2 hover:border-ink/30 hover:text-ink')}>{r.label}</button>
        ))}
      </div>

      <Section title={<>{title}</>} fr={rep.fr} className="mt-8">
        {rep.uses.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-4">
            {uses('period') && <Select label="Period" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} />}
            {uses('division') && <Select label="Division" value={division} onChange={setDivision} options={['All divisions', ...DIVISIONS.map((d) => d.name)]} />}
            {uses('tag') && <Select label="Label" value={tag} onChange={setTag} options={['All labels', ...tagsPresent]} />}
            {uses('category') && <Select label="Category" value={category} onChange={setCategory} options={['All categories', ...MASTERS.categories]} />}
            {key === 'division' && <Select label="Level" value={level} onChange={(v) => setLevel(v as 'Division' | 'Department')} options={['Division', 'Department']} />}
          </div>
        )}
        {key === 'tag' && (
          <div className="mb-5">
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[15px]">
              <span className="text-ink-3">Labels (one or more)</span>
              <Select label="Match" value={tagMode} onChange={(v) => setTagMode(v as 'any' | 'all')} options={[{ value: 'any', label: 'Any selected label' }, { value: 'all', label: 'All selected labels' }]} />
              {tagSet.length > 0 && <Btn v="link" onClick={() => setTagSet([])}>Clear labels</Btn>}
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsPresent.map((t) => {
                const on = tagSet.includes(t);
                return <button key={t} aria-pressed={on} onClick={() => setTagSet(on ? tagSet.filter((x) => x !== t) : [...tagSet, t])} className={cx('rounded-full border px-3 py-1 text-[14px] font-semibold', on ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white text-ink-2 hover:border-ink/30')}>{t}</button>;
              })}
            </div>
          </div>
        )}

        {out && <ReportView key={key} out={out} />}
        {key === 'scheduled' && <Scheduled />}
        {key === 'ai' && <AiSuggestions division={uses('division') ? division : 'All divisions'} />}
      </Section>
    </div>
  );
}

function ReportView({ out }: { out: Out }) {
  const cols: Column<Record<string, Cell>>[] = out.cols.map((c) => ({
    key: c.key, header: c.header,
    render: (r) => (c.strong ? <span className="font-semibold">{r[c.key]}</span> : typeof r[c.key] === 'number' ? <span className="tabular-nums">{(r[c.key] as number).toLocaleString('en-IN')}</span> : r[c.key]),
    sort: (r) => r[c.key] ?? '',
    filter: c.filter ? (r) => String(r[c.key] ?? '') : undefined,
  }));
  return (
    <>
      {out.note && <div className="mb-4 text-[15px] text-ink-2">{out.note}</div>}
      {out.bars.length > 0 && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-5">
          <div className="mb-3 text-[16px] font-semibold">{out.barTitle}</div>
          <Bars data={out.bars.slice(0, 10)} unit={out.barUnit} />
        </div>
      )}
      <DataTable rows={out.rows} columns={cols} rowKey={(r) => String(r._key)} searchText={(r) => out.cols.map((c) => r[c.key]).join(' ')} searchPlaceholder="Search this report" label="rows" maxHeight={520} emptyText="No records match these filters." />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Report computations                                                  */
/* ------------------------------------------------------------------ */
interface Ctx { recs: TrainingRecord[]; people: Person[]; level: 'Division' | 'Department'; tagSet: string[]; tagMode: 'any' | 'all'; tagsPresent: string[]; period: string; s: DemoState }

function compute(key: Key, c: Ctx): Out {
  const { recs, people } = c;
  if (key === 'employee') {
    const byEid = [...new Set(recs.map((r) => r.eid))].map((eid) => {
      const rs = recs.filter((r) => r.eid === eid);
      const last = [...rs].sort((a, b) => (b.ym ?? 0) - (a.ym ?? 0))[0];
      return { _key: eid, eid, name: last.name, division: last.division, department: last.department, records: rs.length, completed: rs.filter(isDone).length, hours: sumHours(rs), latest: last.training };
    }).sort((a, b) => b.hours - a.hours);
    return {
      cols: [{ key: 'eid', header: 'EID' }, { key: 'name', header: 'Name', strong: true }, { key: 'division', header: 'Division', filter: true }, { key: 'department', header: 'Department', filter: true }, { key: 'records', header: 'Records' }, { key: 'completed', header: 'Completed' }, { key: 'hours', header: 'Hours' }, { key: 'latest', header: 'Latest training' }],
      rows: byEid, bars: byEid.slice(0, 8).map((r) => ({ label: r.name, value: r.hours })), barTitle: 'Learning hours · top employees', barUnit: ' h',
    };
  }
  if (key === 'division') {
    const unitOf = (x: { division: string; department: string }) => (c.level === 'Division' ? x.division : `${x.division} · ${x.department}`);
    const units = [...new Set([...people.map(unitOf), ...recs.map(unitOf)])].sort();
    const rows = units.map((u) => {
      const rs = recs.filter((r) => unitOf(r) === u);
      const headcount = people.filter((p) => unitOf(p) === u).length;
      const trained = uniq(rs.filter(isDone).map((r) => r.eid));
      return { _key: u, unit: u, people: headcount, trained, coverage: `${pct(trained, headcount) ?? 0}%`, records: rs.length, hours: sumHours(rs) };
    });
    return {
      cols: [{ key: 'unit', header: c.level === 'Division' ? 'Division / Function' : 'Division · Department', strong: true }, { key: 'people', header: 'People' }, { key: 'trained', header: 'Trained' }, { key: 'coverage', header: 'Coverage' }, { key: 'records', header: 'Records' }, { key: 'hours', header: 'Hours' }],
      rows, bars: rows.map((r) => ({ label: r.unit, value: r.hours })), barTitle: 'Learning hours by unit', barUnit: ' h',
    };
  }
  if (key === 'tag') {
    const shown = c.tagSet.length ? c.tagSet : c.tagsPresent;
    const rows: Record<string, Cell>[] = shown.map((t) => {
      const rs = recs.filter((r) => r.tags.includes(t));
      return { _key: t, label: t, records: rs.length, employees: uniq(rs.map((r) => r.eid)), completed: rs.filter(isDone).length, hours: sumHours(rs) };
    });
    let note: ReactNode = 'Each record counts once for every label it carries.';
    if (c.tagSet.length > 1) {
      const rs = recs.filter((r) => (c.tagMode === 'any' ? c.tagSet.some((t) => r.tags.includes(t)) : c.tagSet.every((t) => r.tags.includes(t))));
      const label = `${c.tagMode === 'any' ? 'Any of' : 'All of'}: ${c.tagSet.join(' + ')}`;
      rows.unshift({ _key: '__combined', label, records: rs.length, employees: uniq(rs.map((r) => r.eid)), completed: rs.filter(isDone).length, hours: sumHours(rs) });
      note = <>The first row combines the selected labels ({c.tagMode === 'any' ? 'records with any of them' : 'records with all of them'}).</>;
    }
    return {
      cols: [{ key: 'label', header: 'Label', strong: true }, { key: 'records', header: 'Records' }, { key: 'employees', header: 'Employees' }, { key: 'completed', header: 'Completed' }, { key: 'hours', header: 'Hours' }],
      rows, bars: rows.map((r) => ({ label: String(r.label), value: Number(r.records) })), barTitle: 'Training records by label', note,
    };
  }
  if (key === 'period') {
    const months = [...new Set(recs.map((r) => r.ym).filter((m): m is number => m !== null))].sort((a, b) => a - b);
    const rows = months.map((m) => {
      const rs = recs.filter((r) => r.ym === m);
      return { _key: String(m), month: monthLabel(m), records: rs.length, employees: uniq(rs.map((r) => r.eid)), completed: rs.filter(isDone).length, hours: sumHours(rs) };
    });
    return {
      cols: [{ key: 'month', header: 'Month', strong: true }, { key: 'records', header: 'Records' }, { key: 'employees', header: 'Employees' }, { key: 'completed', header: 'Completed' }, { key: 'hours', header: 'Hours' }],
      rows, bars: rows.map((r) => ({ label: r.month, value: r.hours })), barTitle: 'Learning hours by month', barUnit: ' h',
    };
  }
  if (key === 'gender' || key === 'group') {
    const g = (x: { gender: string; grade: string }) => (key === 'gender' ? (x.gender === 'F' || x.gender === 'Female' ? 'Female' : x.gender === 'M' || x.gender === 'Male' ? 'Male' : 'Not recorded') : x.grade || 'Not recorded');
    const keys = [...new Set([...people.map(g), ...recs.map(g)])].sort();
    const rows = keys.map((k) => {
      const rs = recs.filter((r) => g(r) === k);
      const workforce = people.filter((p) => g(p) === k).length;
      const trained = uniq(rs.filter(isDone).map((r) => r.eid));
      return { _key: k, group: k, workforce, trained, coverage: `${pct(trained, workforce) ?? 0}%`, records: rs.length, hours: sumHours(rs), cov: pct(trained, workforce) ?? 0 };
    });
    return {
      cols: [{ key: 'group', header: key === 'gender' ? 'Gender' : 'Grade band', strong: true }, { key: 'workforce', header: 'Workforce' }, { key: 'trained', header: 'Trained' }, { key: 'coverage', header: 'Coverage' }, { key: 'records', header: 'Records' }, { key: 'hours', header: 'Hours' }],
      rows, bars: rows.map((r) => ({ label: r.group, value: r.cov })), barTitle: 'Coverage: share of the workforce with a completed training', barUnit: '%',
      note: key === 'group' ? <span className="inline-flex flex-wrap items-center gap-2">"Group" is read as grade band. <SourceTag kind="proposed">Proposed interpretation of FR 180</SourceTag></span> : undefined,
    };
  }
  if (key === 'feedback') {
    const events = c.s.audit.filter((a) => a.action === 'Feedback submitted');
    const qs = ['Content', 'Trainer', 'Relevance', 'Logistics'];
    const scores = qs.map((q) => {
      const vals = events.map((e) => Number(e.detail.match(new RegExp(`${q} (\\d)`))?.[1] ?? NaN)).filter((n) => !Number.isNaN(n));
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    });
    const avgVals = scores.filter((x): x is number => x !== null);
    const avg = avgVals.length ? Math.round((avgVals.reduce((a, b) => a + b, 0) / avgVals.length) * 10) / 10 : null;
    const row: Record<string, Cell> = { _key: TRAINING.trainingId, training: TRAINING.title, responses: events.length, ...Object.fromEntries(qs.map((q, i) => [q.toLowerCase(), scores[i] ?? '—'])), average: avg ?? '—' };
    const others = c.s.programmes.filter((p) => p.status === 'Completed').map((p) => ({ _key: p.id, training: p.title, responses: 0, content: '—', trainer: '—', relevance: '—', logistics: '—', average: '—' }));
    return {
      cols: [{ key: 'training', header: 'Training', strong: true }, { key: 'responses', header: 'Responses' }, ...qs.map((q) => ({ key: q.toLowerCase(), header: `${q} (of 5)` })), { key: 'average', header: 'Average' }],
      rows: [row, ...others], bars: scores.every((x) => x === null) ? [] : qs.map((q, i) => ({ label: q, value: scores[i] ?? 0 })), barTitle: `${TRAINING.title} · average rating (of 5)`,
      note: events.length ? 'In this demo only the employee you play submits feedback; other participants’ responses are not simulated.' : 'No feedback has been submitted yet. Feedback opens after attendance is submitted.',
    };
  }
  if (key === 'calendar') {
    const rows = programmeRows(c.s).filter((p) => p.date === 'To be confirmed' || inPeriod(c.period, monthOf(p.date))).map((p) => ({ _key: p.id, id: p.id, title: p.title, date: p.date, venue: p.venue, medium: p.medium, status: p.status, participants: p.participants, attended: p.attended ?? '—' }));
    return {
      cols: [{ key: 'id', header: 'Training ID' }, { key: 'title', header: 'Programme', strong: true }, { key: 'date', header: 'Date' }, { key: 'venue', header: 'Venue', filter: true }, { key: 'medium', header: 'Medium', filter: true }, { key: 'status', header: 'Status', filter: true }, { key: 'participants', header: 'Participants' }, { key: 'attended', header: 'Attended' }],
      rows, bars: rows.map((r) => ({ label: r.title, value: r.participants })), barTitle: 'Participants per programme',
    };
  }
  // multiple criteria: record level, every criterion is a filter
  const rows = recs.map((r) => ({ _key: r.key, eid: r.eid, name: r.name, gender: r.gender, division: r.division, department: r.department, grade: r.grade, training: r.training, category: r.category, labels: r.tags.join(', '), date: r.date, hours: r.hours, status: r.status, result: r.result }));
  const byStatus = [...new Set(rows.map((r) => r.status))].map((st) => ({ label: st, value: rows.filter((r) => r.status === st).length }));
  return {
    cols: [{ key: 'eid', header: 'EID' }, { key: 'name', header: 'Name', strong: true }, { key: 'gender', header: 'Gender', filter: true }, { key: 'division', header: 'Division', filter: true }, { key: 'department', header: 'Department', filter: true }, { key: 'grade', header: 'Grade', filter: true }, { key: 'training', header: 'Training', filter: true }, { key: 'category', header: 'Category', filter: true }, { key: 'labels', header: 'Labels' }, { key: 'date', header: 'Date' }, { key: 'hours', header: 'Hours' }, { key: 'status', header: 'Status', filter: true }, { key: 'result', header: 'Assessment', filter: true }],
    rows, bars: byStatus, barTitle: 'Records by status', note: 'Combine any criteria with the filters above and in the table.',
  };
}
/* ------------------------------------------------------------------ */
/* Scheduled distribution (FR 184): local schedules, simulated sending  */
/* ------------------------------------------------------------------ */
interface Schedule { id: string; report: string; recipients: string; frequency: string; format: string; next: string; lastSent: string }
const SEED_SCHEDULES: Schedule[] = [
  { id: 'SCH-001', report: 'Division / Department / Function-wise', recipients: 'Division Heads', frequency: 'Monthly · 1st working day', format: 'PDF', next: '01 Dec 2026', lastSent: '01 Nov 2026' },
  { id: 'SCH-002', report: 'Employee-wise', recipients: 'Supervisors', frequency: 'Weekly · Monday', format: 'CSV (Excel)', next: '16 Nov 2026', lastSent: '09 Nov 2026' },
];
const NEXT: Record<string, string> = { 'Weekly · Monday': '16 Nov 2026', 'Monthly · 1st working day': '01 Dec 2026', 'Quarterly · first week': '05 Jan 2027' };

function Scheduled() {
  const s = useDemo();
  const [list, setList] = useState<Schedule[]>(SEED_SCHEDULES);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ report: 'Tag / label-wise', recipients: 'Supervisors', frequency: 'Monthly · 1st working day', format: 'PDF' });
  const add = () => {
    const id = `SCH-${String(list.length + 1).padStart(3, '0')}`;
    setList([...list, { id, ...form, next: NEXT[form.frequency] ?? '—', lastSent: '—' }]);
    s.logEvent(s.role, 'Scheduled report created', `${id} · ${form.report} → ${form.recipients} · ${form.frequency} · ${form.format}`);
    useDemo.setState({ toast: `Schedule ${id} saved. Delivery is simulated.` });
    setOpen(false);
  };
  const sendNow = (x: Schedule) => {
    setList(list.map((y) => (y.id === x.id ? { ...y, lastSent: '12 Nov 2026' } : y)));
    s.logEvent(s.role, 'Scheduled report sent', `${x.id} · ${x.report} → ${x.recipients} (simulated)`);
    useDemo.setState({ toast: `${x.report} report sent to ${x.recipients} (simulated)` });
  };
  const cols: Column<Schedule>[] = [
    { key: 'id', header: 'Schedule', render: (x) => <span className="tabular-nums text-ink-2">{x.id}</span> },
    { key: 'report', header: 'Report', render: (x) => <span className="font-semibold">{x.report}</span>, filter: (x) => x.report },
    { key: 'recipients', header: 'Recipients', render: (x) => x.recipients, filter: (x) => x.recipients },
    { key: 'frequency', header: 'Frequency', render: (x) => x.frequency },
    { key: 'format', header: 'Format', render: (x) => x.format },
    { key: 'next', header: 'Next send', render: (x) => x.next },
    { key: 'last', header: 'Last sent', render: (x) => x.lastSent },
    { key: 'act', header: '', render: (x) => <Btn v="secondary" size="sm" onClick={() => sendNow(x)}>Send now</Btn> },
  ];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3"><SourceTag kind="simulated" /><span className="text-[15px] text-ink-3">Schedules are written to the audit trail; no email is sent from the demo.</span></div>
      <DataTable rows={list} columns={cols} rowKey={(x) => x.id} label="schedules" footer={<Btn onClick={() => setOpen(true)}>Add schedule</Btn>} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add schedule" footer={<><Btn v="secondary" onClick={() => setOpen(false)}>Cancel</Btn><Btn onClick={add}>Save schedule</Btn></>}>
        <div className="grid gap-4">
          <Field label="Report"><select className={inputCls} value={form.report} onChange={(e) => setForm({ ...form, report: e.target.value })}>{REPORTS.filter((r) => r.key !== 'scheduled').map((r) => <option key={r.key}>{r.label}</option>)}</select></Field>
          <Field label="Recipients"><select className={inputCls} value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })}>{['Supervisors', 'Division Heads', 'Learning Champions', 'HR Admin (L&D)', 'Management'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Frequency"><select className={inputCls} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>{Object.keys(NEXT).map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Format"><select className={inputCls} value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>{['PDF', 'CSV (Excel)'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* AI training suggestions (FR 185): transparent rules, a person decides */
/* ------------------------------------------------------------------ */
interface Suggestion { id: string; eid: string; name: string; division: string; supervisor: string; suggestion: string; reason: string; priority: 'High' | 'Medium' | 'Low' }

function AiSuggestions({ division }: { division: string }) {
  const s = useDemo();
  const scope = scopeFor(s.role);
  const [decided, setDecided] = useState<Record<string, 'Accepted' | 'Dismissed'>>({});
  const rows = personRows(s, scope.people.filter((p) => division === 'All divisions' || p.division === division));
  const list: Suggestion[] = [];
  rows.forEach((r) => {
    const base = { eid: r.p.eid, name: r.p.name, division: r.p.division, supervisor: r.p.supervisor };
    if (r.failed) list.push({ ...base, id: `${r.p.id}-re`, suggestion: r.remediation ? `Follow up: ${r.remediation.toLowerCase()}` : 'Assessment re-attempt or credit risk refresher', reason: `Failed the post-training assessment (${r.score}%)`, priority: 'High' });
    else if (r.needs && r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation)) list.push({ ...base, id: `${r.p.id}-cr`, suggestion: `${TRAINING.title} (next batch)`, reason: `Credit Analysis level ${r.p.creditLevel}, role target ${CREDIT_TARGET} · ${r.needReason.toLowerCase()}`, priority: r.p.creditLevel <= 2 ? 'High' : 'Medium' });
    if (r.course && r.course.status !== 'Completed') list.push({ ...base, id: `${r.p.id}-md`, suggestion: MANDATORY_COURSE, reason: `Mandatory for the role · ${r.course.status.toLowerCase()} · due ${r.course.due}`, priority: r.course.overdue ? 'High' : 'Low' });
  });
  const decide = (sel: Suggestion[], d: 'Accepted' | 'Dismissed', clear: () => void) => {
    setDecided({ ...decided, ...Object.fromEntries(sel.map((x) => [x.id, d])) });
    s.logEvent(s.role, d === 'Accepted' ? 'AI suggestions accepted' : 'AI suggestions dismissed', `${sel.length} suggestion${sel.length > 1 ? 's' : ''} · ${[...new Set(sel.map((x) => x.name))].slice(0, 4).join(', ')}${sel.length > 4 ? '…' : ''} · decided by ${PERSONAS[s.role].name}`);
    useDemo.setState({ toast: `${sel.length} suggestion${sel.length > 1 ? 's' : ''} ${d.toLowerCase()} · logged in the audit trail` });
    clear();
  };
  const cols: Column<Suggestion>[] = [
    { key: 'name', header: 'Employee', render: (x) => <span><span className="font-semibold">{x.name}</span><span className="block text-[14px] text-ink-3">{x.eid}</span></span>, sort: (x) => x.name },
    { key: 'division', header: 'Division', render: (x) => x.division, filter: (x) => x.division },
    { key: 'suggestion', header: 'Suggested training', render: (x) => x.suggestion, filter: (x) => (x.suggestion.startsWith('Follow up') ? 'Follow-up' : x.suggestion) },
    { key: 'reason', header: 'Why (explainable)', render: (x) => <span className="text-ink-2">{x.reason}</span> },
    { key: 'priority', header: 'Priority', render: (x) => <Badge>{x.priority}</Badge>, filter: (x) => x.priority, sort: (x) => ['High', 'Medium', 'Low'].indexOf(x.priority) },
    { key: 'decision', header: 'Decision', render: (x) => (decided[x.id] ? <Badge t={decided[x.id] === 'Accepted' ? 'ok' : 'neutral'}>{decided[x.id]}</Badge> : <span className="text-ink-3">Waiting</span>), filter: (x) => decided[x.id] ?? 'Waiting' },
  ];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AiLabel>AI-suggested · a person decides</AiLabel>
        <SourceTag kind="simulated">Rules stand in for the AI engine</SourceTag>
        <FrRef>FR 185, 209</FrRef>
      </div>
      <p className="mb-4 max-w-3xl text-[16px] text-ink-2">Suggestions combine the skill gap, the role requirement and mandatory courses. Select rows to accept or dismiss them; every decision is written to the audit trail with your name.</p>
      <DataTable rows={list} columns={cols} rowKey={(x) => x.id} searchText={(x) => `${x.name} ${x.eid}`} label="suggestions" selectable canSelect={(x) => !decided[x.id]}
        bulk={(sel, clear) => <><Btn v="secondary" size="sm" onClick={() => decide(sel, 'Dismissed', clear)}>Dismiss</Btn><Btn size="sm" onClick={() => decide(sel, 'Accepted', clear)}>Accept suggestions</Btn></>}
        emptyText="No suggestions: everyone in scope is covered." />
    </>
  );
}
