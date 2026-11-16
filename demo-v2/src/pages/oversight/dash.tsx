/**
 * Shared dashboard template for the oversight screens (O1): computed people rows, training records,
 * clickable headline figures with drill-down tables, bars, period filters and a print view.
 * Every figure here is computed from the store and the fictional org model; nothing is a hard-coded total.
 */
import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { TRAINING } from '../../data';
import { CREDIT_TARGET, DIRECTORY, directReports, inDivision, type Person } from '../../org';
import { courseOf, ptResults, roster, type DemoState, type PtStatus } from '../../store';
import type { Attendance, Role } from '../../types';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { Badge, Btn, cx } from '../../components/ui';

/* ------------------------------------------------------------------ */
/* Scope (rule 9): supervisor = direct reports, division head = division, others = bank */
/* ------------------------------------------------------------------ */
export const SUPERVISOR_NAME = 'Mahmud Karim';
export const DIVISION_NAME = 'Corporate Banking';
export interface Scope { kind: 'team' | 'division' | 'bank'; label: string; people: Person[] }
export function scopeFor(role: Role): Scope {
  if (role === 'supervisor') return { kind: 'team', label: `${SUPERVISOR_NAME}’s direct reports`, people: directReports(SUPERVISOR_NAME) };
  if (role === 'division_head') return { kind: 'division', label: `${DIVISION_NAME} Division`, people: inDivision(DIVISION_NAME) };
  return { kind: 'bank', label: 'All divisions (bank-wide)', people: DIRECTORY };
}

/* ------------------------------------------------------------------ */
/* Mandatory course (Information Security Awareness 2026)               */
/* ------------------------------------------------------------------ */
export const MANDATORY_COURSE = 'Information Security Awareness 2026';
const LIVE_COURSE = ['e1', 'e2', 'e4'];
export interface Mandatory { progress: number; status: 'Completed' | 'In progress' | 'Overdue' | 'Not started'; overdue: boolean; due: string; enrollmentId?: string }
export function mandatoryOf(s: DemoState, id: string): Mandatory | null {
  const en = s.enrollments.find((x) => x.personId === id);
  if (LIVE_COURSE.includes(id)) {
    const c = courseOf(s, id);
    const overdue = !c.completed && en?.status === 'Overdue';
    return { progress: c.progress, status: c.completed ? 'Completed' : overdue ? 'Overdue' : c.progress > 0 ? 'In progress' : 'Not started', overdue, due: en?.due ?? '20 Nov 2026', enrollmentId: en?.id };
  }
  if (!en) return null;
  return { progress: en.progress, status: en.status, overdue: en.status === 'Overdue', due: en.due, enrollmentId: en.id };
}

/* ------------------------------------------------------------------ */
/* People rows: the story training status per person                    */
/* ------------------------------------------------------------------ */
export interface PersonRow {
  p: Person;
  story: string;
  inTraining: boolean;
  d1?: Attendance;
  d2?: Attendance;
  result: PtStatus | '—';
  score: number | null;
  remediation?: string;
  course: Mandatory | null;
  completed: boolean;
  failed: boolean;
  inProgress: boolean;
  needs: boolean;
  needReason: string;
}

export function personRows(s: DemoState, people: Person[]): PersonRow[] {
  const ros = new Set(roster(s).map((e) => e.id));
  const pt = new Map(ptResults(s).map((r) => [r.id, r]));
  return people.map((p) => {
    const part = s.participation[p.id];
    let story: string;
    if (part === 'Withdrawn') story = 'Withdrawn';
    else if (s.resolutions[p.id] === 'remove') story = 'Removed at nomination';
    else if (!s.nominationSubmitted || !ros.has(p.id)) story = 'Not nominated';
    else if (!s.finalized) story = 'Nominated';
    else if (!s.invitesSent || !part) story = 'Selected';
    else story = part;
    const inTraining = !['Withdrawn', 'Removed at nomination', 'Not nominated'].includes(story);
    const r = inTraining ? pt.get(p.id) : undefined;
    const result: PtStatus | '—' = r ? r.status : '—';
    const completed = result === 'Passed';
    const failed = result === 'Failed';
    const inProgress = inTraining && !completed && !failed && story !== 'Absent';
    const needs = !completed && !inProgress;
    const rem = s.remediation[p.id];
    const needReason = failed ? `Failed the assessment${rem ? ` · ${rem.toLowerCase()}` : ' · no follow-up yet'}`
      : story === 'Absent' ? 'Absent from the training'
      : story === 'Withdrawn' ? 'Withdrew from the training'
      : story === 'Removed at nomination' ? 'Removed at nomination (conflict)'
      : p.creditLevel < CREDIT_TARGET ? `Below target (level ${p.creditLevel} of ${CREDIT_TARGET}) · not nominated` : 'Not nominated for this training';
    return {
      p, story, inTraining, result, score: r?.score ?? null, remediation: rem,
      d1: inTraining ? s.attendance[p.id] : undefined, d2: inTraining ? s.attendance2[p.id] : undefined,
      course: mandatoryOf(s, p.id), completed, failed, inProgress, needs, needReason: needs ? needReason : '',
    };
  });
}

/** Group rows and compute completion, attendance and pass rates (department progress). */
export interface GroupStat { key: string; people: number; inTraining: number; attended: number; passed: number; failed: number; completion: number; attendance: number | null; passRate: number | null; mandatory: number | null; belowTarget: number }
export function groupStats(rows: PersonRow[], by: (r: PersonRow) => string, s: DemoState): GroupStat[] {
  const keys = [...new Set(rows.map(by))].sort();
  return keys.map((key) => {
    const g = rows.filter((r) => by(r) === key);
    const inTraining = g.filter((r) => r.inTraining).length;
    const attended = g.filter((r) => r.story === 'Attended').length;
    const decided = g.filter((r) => r.story === 'Attended' || r.story === 'Absent').length;
    const passed = g.filter((r) => r.completed).length;
    const failed = g.filter((r) => r.failed).length;
    const enrolled = g.filter((r) => r.course);
    return {
      key, people: g.length, inTraining, attended, passed, failed,
      completion: pct(passed, g.length) ?? 0,
      attendance: s.attendanceSubmitted ? pct(attended, decided) : null,
      passRate: passed + failed ? pct(passed, passed + failed) : null,
      mandatory: enrolled.length ? pct(enrolled.filter((r) => r.course?.status === 'Completed').length, enrolled.length) : null,
      belowTarget: g.filter((r) => r.p.creditLevel < CREDIT_TARGET).length,
    };
  });
}

export const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 100) : null);
export const pctText = (v: number | null) => (v === null ? '—' : `${v}%`);

/* ------------------------------------------------------------------ */
/* Training records (training database + this training + mandatory course) */
/* ------------------------------------------------------------------ */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Month index (year × 12 + month) of the last date mentioned in a text, e.g. "18–19 Nov 2026 · 2 days". */
export function monthOf(text: string): number | null {
  const all = [...text.matchAll(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/g)];
  const m = all[all.length - 1];
  return m ? Number(m[2]) * 12 + MONTHS.indexOf(m[1]) : null;
}
export const monthLabel = (ym: number) => `${MONTHS[ym % 12]} ${Math.floor(ym / 12)}`;

const TITLE_TAGS: Record<string, string[]> = {
  [TRAINING.title]: [...TRAINING.tags],
  'AML & CFT Refresher': ['AML'],
  'Executive Programme in Risk': ['Risk'],
  'Treasury Certification': ['Risk'],
  'Trade Finance (CDCS)': ['Foreign Trade'],
  'CFA Level I': ['Credit'],
  [MANDATORY_COURSE]: ['ICT', 'ISS'],
  'Customer Experience Excellence': ['CRM'],
  'Leadership Essentials for Managers': ['City Future Fit'],
  'Sustainable Finance Fundamentals': ['Sustainable Finance'],
};
export const tagsOf = (title: string) => TITLE_TAGS[title] ?? [];

export interface TrainingRecord {
  key: string; eid: string; name: string; personId?: string; division: string; department: string; gender: string; grade: string; designation: string;
  training: string; category: string; tags: string[]; mode: string; medium: string; date: string; ym: number | null; hours: number; status: string; result: string; source: string;
}

export function trainingRecords(s: DemoState): TrainingRecord[] {
  const byEid = new Map(DIRECTORY.map((p) => [p.eid, p]));
  const pt = new Map(ptResults(s).map((r) => [r.id, r]));
  const out: TrainingRecord[] = [];
  s.dbRows.forEach((r, i) => {
    const p = byEid.get(r.eid);
    const [category = 'General', mode = '', medium = ''] = r.meta.split(' · ');
    const story = r.training === TRAINING.title;
    const res = story && p ? pt.get(p.id) : undefined;
    out.push({
      key: `db${i}`, eid: r.eid, name: r.name, personId: p?.id, division: r.division, department: p?.department ?? '—', gender: p ? (p.gender === 'F' ? 'Female' : 'Male') : '—', grade: r.grade || p?.grade || '—', designation: r.designation,
      training: r.training, category, tags: tagsOf(r.training), mode, medium, date: r.duration, ym: monthOf(r.duration), hours: Number(r.manHour) || 0,
      status: story ? 'Attended' : 'Completed', result: res && res.status !== 'Not taken' ? res.status : '—', source: r.source,
    });
  });
  // This training, before or without a database row (nominated, invited, absent …)
  if (s.nominationSubmitted) {
    personRows(s, DIRECTORY).filter((r) => r.inTraining && r.story !== 'Attended').forEach((r) => {
      out.push({
        key: `st-${r.p.id}`, eid: r.p.eid, name: r.p.name, personId: r.p.id, division: r.p.division, department: r.p.department, gender: r.p.gender === 'F' ? 'Female' : 'Male', grade: r.p.grade, designation: r.p.designation,
        training: TRAINING.title, category: TRAINING.category, tags: [...TRAINING.tags], mode: 'In-house', medium: 'Classroom', date: '18–19 Nov 2026 · 2 days', ym: monthOf('Nov 2026'), hours: 0,
        status: r.story, result: r.result === 'Not taken' ? '—' : r.result, source: 'Training record',
      });
    });
  }
  // Mandatory e-learning enrolments
  DIRECTORY.forEach((p) => {
    const m = mandatoryOf(s, p.id);
    if (!m) return;
    out.push({
      key: `en-${p.id}`, eid: p.eid, name: p.name, personId: p.id, division: p.division, department: p.department, gender: p.gender === 'F' ? 'Female' : 'Male', grade: p.grade, designation: p.designation,
      training: MANDATORY_COURSE, category: 'Mandatory', tags: tagsOf(MANDATORY_COURSE), mode: 'In-house', medium: 'e-Learning', date: `Due ${m.due}`, ym: monthOf(m.due), hours: m.status === 'Completed' ? 2 : 0,
      status: m.status, result: '—', source: 'e-Learning',
    });
  });
  return out;
}
export const isDone = (r: TrainingRecord) => r.status === 'Completed' || r.status === 'Attended';

/* ------------------------------------------------------------------ */
/* Periods (FR 5, 11, 12, 15, 178)                                      */
/* ------------------------------------------------------------------ */
const ym = (y: number, m: number) => y * 12 + m;
export const PERIODS: { key: string; label: string; from: number; to: number }[] = [
  { key: 'all', label: 'All periods', from: 0, to: Number.MAX_SAFE_INTEGER },
  { key: 'month', label: 'This month · Nov 2026', from: ym(2026, 10), to: ym(2026, 10) },
  { key: 'quarter', label: 'This quarter · Oct–Dec 2026', from: ym(2026, 9), to: ym(2026, 11) },
  { key: 'fy2026', label: 'FY2026 · Jan–Dec 2026', from: ym(2026, 0), to: ym(2026, 11) },
  { key: 'fy2025', label: 'FY2025 · Jan–Dec 2025', from: ym(2025, 0), to: ym(2025, 11) },
];
export const inPeriod = (key: string, month: number | null) => {
  const p = PERIODS.find((x) => x.key === key) ?? PERIODS[0];
  if (p.key === 'all') return true;
  return month !== null && month >= p.from && month <= p.to;
};

export function Select({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; className?: string }) {
  return (
    <label className={cx('flex items-center gap-2 text-[15px]', className)}>
      <span className="text-ink-3">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-line bg-white px-2.5 py-2 text-[15px] outline-none focus:border-brand">
        {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Headline figures, each opening the people or records behind it      */
/* ------------------------------------------------------------------ */
export interface Fig { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ok' | 'warn' | 'brand' | 'neutral'; onOpen?: () => void; cta?: string }
export function Figures({ items }: { items: Fig[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3 xl:grid-cols-5">
      {items.map((f) => {
        const body = (
          <>
            <div className={cx('num text-[32px] leading-none', f.tone === 'ok' && 'text-ok', f.tone === 'warn' && 'text-warn', f.tone === 'brand' && 'text-brand')}>{f.value}</div>
            <div className="mt-2 text-[15px] font-semibold text-ink">{f.label}</div>
            {f.sub && <div className="mt-0.5 text-[14px] text-ink-3">{f.sub}</div>}
            {f.onOpen && <div className="mt-2 text-[14px] font-semibold text-brand">{f.cta ?? 'See who'} →</div>}
          </>
        );
        return f.onOpen
          ? <button key={f.label} onClick={f.onOpen} className="bg-white p-5 text-left transition-colors hover:bg-[#faf8f5] focus-visible:outline-2 focus-visible:outline-brand">{body}</button>
          : <div key={f.label} className="bg-white p-5">{body}</div>;
      })}
    </div>
  );
}

/** Wide overlay for drill-down tables. */
export function DrillPanel({ open, title, sub, onClose, children }: { open: boolean; title: string; sub?: ReactNode; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="anim-slide flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-canvas shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <div><h2 className="text-[22px] font-bold tracking-tight">{title}</h2>{sub && <div className="mt-0.5 text-[15px] text-ink-3">{sub}</div>}</div>
          <button onClick={onClose} aria-label="Close" className="mt-1 text-ink-3 hover:text-ink"><X size={22} /></button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* People table: the standard columns for a list of people              */
/* ------------------------------------------------------------------ */
const attText = (a?: Attendance) => a ?? '—';
export const STORY_TONE: Record<string, string> = { 'Not nominated': 'neutral', Nominated: 'info', Selected: 'info', 'Removed at nomination': 'neutral' };

export function peopleColumns(opts: { needs?: boolean } = {}): Column<PersonRow>[] {
  const cols: Column<PersonRow>[] = [
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums text-ink-2">{r.p.eid}</span>, sort: (r) => r.p.eid },
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold">{r.p.name}</span>, sort: (r) => r.p.name },
    { key: 'designation', header: 'Designation', render: (r) => r.p.designation, filter: (r) => r.p.designation },
    { key: 'department', header: 'Department', render: (r) => r.p.department, filter: (r) => r.p.department, sort: (r) => r.p.department },
    { key: 'story', header: 'Training status', render: (r) => <Badge t={STORY_TONE[r.story]}>{r.story}</Badge>, filter: (r) => r.story, sort: (r) => r.story },
    { key: 'att', header: 'Day 1 / Day 2', render: (r) => <span className="whitespace-nowrap">{attText(r.d1)} / {attText(r.d2)}</span> },
    { key: 'result', header: 'Assessment', render: (r) => (r.result === '—' ? <span className="text-ink-3">—</span> : <span className="whitespace-nowrap"><Badge>{r.result}</Badge>{r.score !== null && r.result !== 'Awaiting release' && <span className="ml-1.5 tabular-nums text-ink-2">{r.score}%</span>}</span>), filter: (r) => (r.result === '—' ? 'Not in training' : r.result) },
    { key: 'course', header: 'Mandatory course', render: (r) => (r.course ? <span className="whitespace-nowrap">{r.course.progress}% · <span className={cx(r.course.status === 'Overdue' ? 'font-semibold text-brand' : r.course.status === 'Completed' ? 'text-ok' : 'text-ink-2')}>{r.course.status}</span></span> : <span className="text-ink-3">Not enrolled</span>), filter: (r) => r.course?.status ?? 'Not enrolled', sort: (r) => r.course?.progress ?? -1 },
  ];
  if (opts.needs) cols.push({ key: 'why', header: 'Why', render: (r) => <span className="text-ink-2">{r.needReason}</span> });
  return cols;
}

export function PeopleTable({ rows, needs, emptyText, maxHeight, label = 'people', selectable, bulk }: { rows: PersonRow[]; needs?: boolean; emptyText?: string; maxHeight?: number; label?: string; selectable?: boolean; bulk?: (sel: PersonRow[], clear: () => void) => ReactNode }) {
  return (
    <DataTable rows={rows} columns={peopleColumns({ needs })} rowKey={(r) => r.p.id} searchText={(r) => `${r.p.name} ${r.p.eid}`} emptyText={emptyText ?? 'Nobody in this group.'} maxHeight={maxHeight} label={label} selectable={selectable} bulk={bulk} />
  );
}

export const peopleCsv = (name: string, rows: PersonRow[]) =>
  downloadCsv(name, ['EID', 'Name', 'Designation', 'Division', 'Department', 'Supervisor', 'Training status', 'Day 1', 'Day 2', 'Assessment', 'Score', 'Mandatory course', 'Progress %', 'Needs training'],
    rows.map((r) => [r.p.eid, r.p.name, r.p.designation, r.p.division, r.p.department, r.p.supervisor, r.story, attText(r.d1), attText(r.d2), r.result, r.score ?? '', r.course?.status ?? 'Not enrolled', r.course?.progress ?? '', r.needs ? r.needReason : '']));

/** A drill-down state: which group of people is open. */
export function useDrill() {
  const [drill, setDrill] = useState<{ title: string; sub?: string; rows: PersonRow[]; needs?: boolean } | null>(null);
  const panel = (
    <DrillPanel open={!!drill} title={drill?.title ?? ''} sub={drill?.sub} onClose={() => setDrill(null)}>
      {drill && (
        <>
          <PeopleTable rows={drill.rows} needs={drill.needs} maxHeight={480} />
          <div className="mt-4 flex justify-end gap-2">
            <Btn v="secondary" onClick={() => peopleCsv(`${drill.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`, drill.rows)}>Download CSV</Btn>
            <Btn onClick={() => setDrill(null)}>Done</Btn>
          </div>
        </>
      )}
    </DrillPanel>
  );
  return { open: setDrill, panel };
}

/* ------------------------------------------------------------------ */
/* Bars (simple, accessible)                                           */
/* ------------------------------------------------------------------ */
export function Bars({ data, unit = '', max, onPick }: { data: { label: string; value: number; note?: string }[]; unit?: string; max?: number; onPick?: (label: string) => void }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-[15px] text-ink-3">No data for these filters.</p>;
  return (
    <ul className="space-y-2.5" aria-label="Bar chart">
      {data.map((d) => {
        const row = (
          <>
            <span className="w-44 shrink-0 truncate text-left text-[15px] text-ink-2" title={d.label}>{d.label}</span>
            <span className="h-3 flex-1 rounded-full bg-slate-100"><span className="anim-grow block h-full rounded-full bg-ink/80" style={{ width: `${Math.max(2, (d.value / m) * 100)}%` }} /></span>
            <span className="w-24 shrink-0 text-right text-[15px] font-semibold tabular-nums">{d.value.toLocaleString('en-IN')}{unit}{d.note && <span className="font-normal text-ink-3"> {d.note}</span>}</span>
          </>
        );
        return <li key={d.label}>{onPick ? <button onClick={() => onPick(d.label)} className="flex w-full items-center gap-3 rounded-md hover:bg-[#faf8f5]">{row}</button> : <div className="flex items-center gap-3">{row}</div>}</li>;
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Print view for PDF: a clean window with the table                    */
/* ------------------------------------------------------------------ */
const escHtml = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function printTable(title: string, sub: string, header: string[], rows: (string | number)[][]) {
  const w = window.open('', '_blank', 'width=1100,height=800');
  if (!w) return false;
  const html = `<!doctype html><html><head><title>${escHtml(title)}</title><style>
    body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#16181d;margin:32px;font-size:14px}
    h1{font-size:24px;margin:0 0 4px} p{color:#4a515d;margin:0 0 18px}
    table{border-collapse:collapse;width:100%} th,td{border:1px solid #d4d7dd;padding:6px 8px;text-align:left;vertical-align:top}
    th{background:#f6f7f9} footer{margin-top:18px;color:#7c8492;font-size:12px}
  </style></head><body><h1>${escHtml(title)}</h1><p>${escHtml(sub)}</p><table><thead><tr>${header.map((h) => `<th>${escHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <footer>City Bank ELDP · fictional demonstration data · printed from the demo</footer></body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return true;
}
