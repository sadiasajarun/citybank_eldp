import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { TRAINING } from '../../data';
import { findById } from '../../org';
import { courseOf, DEMO_DATE, ptResults, useDemo, type DemoState } from '../../store';
import { PageHead } from '../../components/Templates';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { SourceTag } from '../../components/Source';
import { Alert, Badge, Btn, cx, inputCls } from '../../components/ui';

export type LearningType = 'Classroom' | 'Webinar' | 'e-Learning';
export interface RecordRow {
  key: string; iso: string; dateLabel: string; learning: string; detail: string;
  type: LearningType; hours: number; result: string; certificate: boolean; fresh: boolean; kind: 'Programme' | 'Course' | 'Assessment';
}

/** Earlier learning history per employee (fictional, migrated into the training database). */
const HISTORY: Record<string, Omit<RecordRow, 'key' | 'fresh'>[]> = {
  e1: [
    { iso: '2026-10-08', dateLabel: '08 Oct 2026', learning: 'Customer Experience Excellence', detail: 'City Bank L&D · In-house', type: 'Classroom', hours: 8, result: 'Completed', certificate: false, kind: 'Programme' },
    { iso: '2026-08-20', dateLabel: '20 Aug 2026', learning: 'Credit Fundamentals', detail: 'Learning journey step 1 · City Bank L&D', type: 'e-Learning', hours: 4, result: 'Completed · 88%', certificate: true, kind: 'Course' },
    { iso: '2025-11-24', dateLabel: '24 Nov 2025', learning: 'AML & CFT Refresher 2025', detail: 'Mandatory · City Bank L&D', type: 'Classroom', hours: 8, result: 'Completed', certificate: true, kind: 'Programme' },
    { iso: '2025-06-15', dateLabel: '15 Jun 2025', learning: 'Relationship Management Essentials', detail: 'BRAC Business School · External-local', type: 'Webinar', hours: 6, result: 'Completed', certificate: false, kind: 'Programme' },
  ],
  e2: [
    { iso: '2026-09-14', dateLabel: '14 Sep 2026', learning: 'Financial Statement Analysis', detail: 'BIBM · External-local', type: 'Classroom', hours: 12, result: 'Completed', certificate: true, kind: 'Programme' },
    { iso: '2025-11-24', dateLabel: '24 Nov 2025', learning: 'AML & CFT Refresher 2025', detail: 'Mandatory · City Bank L&D', type: 'Classroom', hours: 8, result: 'Completed', certificate: true, kind: 'Programme' },
    { iso: '2025-03-10', dateLabel: '10 Mar 2025', learning: 'Credit Appraisal Basics', detail: 'City Bank L&D · In-house', type: 'Webinar', hours: 6, result: 'Completed', certificate: false, kind: 'Programme' },
  ],
  e4: [
    { iso: '2026-07-05', dateLabel: '05 Jul 2026', learning: 'Market Risk Fundamentals', detail: 'City Bank L&D', type: 'e-Learning', hours: 5, result: 'Completed · 91%', certificate: true, kind: 'Course' },
    { iso: '2026-02-18', dateLabel: '18 Feb 2026', learning: 'Basel III Capital Workshop', detail: 'BIBM · External-local', type: 'Classroom', hours: 12, result: 'Completed', certificate: false, kind: 'Programme' },
    { iso: '2025-11-24', dateLabel: '24 Nov 2025', learning: 'AML & CFT Refresher 2025', detail: 'Mandatory · City Bank L&D', type: 'Classroom', hours: 8, result: 'Completed', certificate: true, kind: 'Programme' },
  ],
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** First date found in a free-text duration ("18–19 Nov 2026 · 2 days", "Aug 2026"). */
function parseDate(text: string): { iso: string; label: string } {
  const m = text.match(/(?:(\d{1,2})(?:\s*[–-]\s*\d{1,2})?\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/);
  if (!m) return { iso: '2026-11-12', label: text };
  const day = m[1] ? m[1].padStart(2, '0') : '01';
  const mon = String(MONTHS.indexOf(m[2]) + 1).padStart(2, '0');
  return { iso: `${m[3]}-${mon}-${day}`, label: m[1] ? `${day} ${m[2]} ${m[3]}` : `${m[2]} ${m[3]}` };
}
const typeOf = (meta: string): LearningType => (/e-Learning/i.test(meta) ? 'e-Learning' : /Classroom/i.test(meta) ? 'Classroom' : /Webinar/i.test(meta) ? 'Webinar' : 'Classroom');

/** Every learning record of one employee: training database rows + course + assessment + migrated history. */
export function recordRowsFor(s: DemoState, empId: string): RecordRow[] {
  const p = findById(empId);
  const rows: RecordRow[] = [];
  const pt = ptResults(s).find((r) => r.id === empId);
  if (p) {
    s.dbRows.filter((r) => r.eid === p.eid).forEach((r, i) => {
      const d = parseDate(r.duration);
      const story = r.training === TRAINING.title && r.source === 'Attendance';
      let result = r.source === 'Employee request' ? 'Validated by HR' : r.source === 'Attendance' ? 'Attended' : 'Completed';
      if (story && pt && pt.score !== null) result = pt.status === 'Awaiting release' ? 'Attended · assessment awaiting release' : `Attended · assessment ${pt.score}% · ${pt.status}`;
      rows.push({
        key: `db-${i}-${r.training}`, iso: d.iso, dateLabel: d.label, learning: r.training, detail: `${r.institute} · ${r.source === 'Employee request' ? 'added on your request' : r.source === 'Attendance' ? 'from attendance' : r.source}`,
        type: typeOf(r.meta), hours: Number.parseFloat(r.manHour) || 0, result, certificate: r.source === 'Employee request' || r.source === 'Bond', fresh: story && s.attendanceSubmitted, kind: 'Programme',
      });
    });
  }
  const c = courseOf(s, empId);
  if (c.progress > 0 || c.completed) {
    rows.push({ key: 'course-isa', iso: '2026-11-12', dateLabel: c.completed ? '12 Nov 2026' : 'Due 20 Nov 2026', learning: 'Information Security Awareness 2026', detail: 'Mandatory e-learning · City Bank L&D', type: 'e-Learning', hours: c.completed ? 3 : 0, result: c.completed ? 'Completed · certificate issued' : `In progress · ${c.progress}%`, certificate: c.completed, fresh: false, kind: 'Course' });
  }
  if (empId === 'e1' && (s.examStatus === 'reviewed' || s.aiScore.state !== 'suggested')) {
    rows.push({ key: 'aml-exam', iso: '2026-11-12', dateLabel: '12 Nov 2026', learning: 'AML Annual Certification', detail: 'Proctored assessment · standalone exam', type: 'e-Learning', hours: 1, result: s.aiScore.state === 'suggested' ? 'Submitted' : 'Passed · 82%', certificate: s.aiScore.state !== 'suggested', fresh: false, kind: 'Assessment' });
  }
  (HISTORY[empId] ?? []).forEach((h, i) => rows.push({ ...h, key: `h-${i}`, fresh: false, detail: `${h.detail} · migrated record` }));
  return rows.sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));
}

export type Period = 'This year' | 'Last 12 months' | 'All time' | 'Custom';
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function inPeriod(rowIso: string, period: Period, from = '', to = '') {
  if (period === 'All time') return true;
  if (period === 'This year') return rowIso.startsWith(String(DEMO_DATE.getFullYear()));
  if (period === 'Last 12 months') {
    const d = new Date(DEMO_DATE);
    d.setFullYear(d.getFullYear() - 1);
    return rowIso > iso(d);
  }
  return (!from || rowIso >= from) && (!to || rowIso <= to);
}

export const recordKpis = (rows: RecordRow[]) => ({
  hours: rows.reduce((a, r) => a + r.hours, 0),
  programmes: rows.filter((r) => r.kind === 'Programme').length,
  courses: rows.filter((r) => r.kind === 'Course' && r.result.startsWith('Completed')).length,
  certificates: rows.filter((r) => r.certificate).length,
});

export function MyRecord() {
  const s = useDemo();
  const nav = useNavigate();
  const [period, setPeriod] = useState<Period>('This year');
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');
  const empId = s.employeeId;
  const p = findById(empId);
  const all = useMemo(() => recordRowsFor(s, empId), [s, empId]);
  const rows = all.filter((r) => inPeriod(r.iso, period, from, to));
  const k = recordKpis(rows);
  const fresh = all.find((r) => r.fresh);

  const cols: Column<RecordRow>[] = [
    { key: 'date', header: 'Date', render: (r) => <span className="whitespace-nowrap tabular-nums">{r.dateLabel}</span>, sort: (r) => r.iso },
    { key: 'learning', header: 'Learning', render: (r) => <div><div className="font-semibold">{r.learning}{r.fresh && <span className="ml-2"><Badge t="ok">Just updated</Badge></span>}</div><div className="text-[14px] text-ink-3">{r.detail}</div></div>, sort: (r) => r.learning },
    { key: 'type', header: 'Type', render: (r) => r.type, filter: (r) => r.type },
    { key: 'hours', header: 'Hours', render: (r) => <span className="tabular-nums">{r.hours || '—'}</span>, sort: (r) => r.hours },
    { key: 'result', header: 'Result', render: (r) => <Badge t={/Failed/.test(r.result) ? 'brand' : /In progress|awaiting|Submitted/i.test(r.result) ? 'info' : 'ok'}>{r.result}</Badge> },
  ];

  const exportCsv = () => {
    downloadCsv(`learning-record-${p?.eid ?? empId}.csv`, ['Date', 'Learning', 'Detail', 'Type', 'Hours', 'Result'], rows.map((r) => [r.dateLabel, r.learning, r.detail, r.type, r.hours, r.result]));
    s.logEvent('employee', 'Learning record exported', `${p?.name ?? empId} · ${period} · ${rows.length} rows (CSV)`);
  };

  return (
    <div>
      <PageHead
        title="My learning record"
        meta={p ? `${p.name} · ${p.eid} · ${p.designation} · ${p.division}` : empId}
        fr="FR 5, 170"
        tags={<SourceTag kind="fictional" />}
        actions={<><Btn v="link" onClick={() => nav('/journey')}>Open my learning journey <ArrowRight size={16} /></Btn><Btn v="secondary" onClick={exportCsv}><Download size={16} />Export CSV</Btn></>}
      />

      {s.completed && !s.recordSynced && empId === 'e1' && (
        <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#efd9d6] bg-white px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-semibold">HR closed the training · the record is ready to update</div>
            <p className="text-[16px] text-ink-2">Attendance, 16 learning hours and feedback for Advanced Credit Risk Management are written to this record and the training database.</p>
          </div>
          <Btn onClick={() => s.syncRecords()}>Update learning record</Btn>
        </section>
      )}
      {s.recordSynced && empId === 'e1' && (
        <div className="mb-6"><Alert kind="ok" title="Learning record updated">Advanced Credit Risk Management is recorded as completed with 16 learning hours. Supervisors and management dashboards now show it.</Alert></div>
      )}
      {fresh && (
        <div className="mb-6">
          <Alert kind="ok" title="Just updated from attendance">{fresh.learning} · {fresh.hours} learning hours added to your record and the training database when HR submitted attendance.</Alert>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div role="radiogroup" aria-label="Time frame" className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
          {(['This year', 'Last 12 months', 'All time', 'Custom'] as Period[]).map((x) => (
            <button key={x} role="radio" aria-checked={period === x} onClick={() => setPeriod(x)} className={cx('rounded-lg px-4 py-2 text-[15px] font-semibold', period === x ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas')}>{x}</button>
          ))}
        </div>
        {period === 'Custom' && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[15px] text-ink-2">From<input type="date" className={cx(inputCls, 'mt-1')} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="text-[15px] text-ink-2">To<input type="date" className={cx(inputCls, 'mt-1')} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        )}
      </div>

      <dl className="mb-8 grid grid-cols-2 divide-line border-y border-line md:grid-cols-4 md:divide-x">
        {([['Learning hours', k.hours], ['Programmes', k.programmes], ['Courses completed', k.courses], ['Certificates', k.certificates]] as [string, number][]).map(([l, v]) => (
          <div key={l} className="px-5 py-5 first:pl-0">
            <dd className="num text-[32px] leading-none">{v}</dd>
            <dt className="mt-1.5 text-[15px] text-ink-3">{l} · {period === 'Custom' ? 'selected period' : period.toLowerCase()}</dt>
          </div>
        ))}
      </dl>

      {s.recordRequest === 'pending' && empId === 'e1' && (
        <div className="mb-6"><Alert kind="info" title="Waiting for HR validation">{s.recordDetails.title} ({s.recordDetails.institute}) is added once HR approves it (FR 6, 172).</Alert></div>
      )}

      <DataTable
        rows={rows}
        columns={cols}
        rowKey={(r) => r.key}
        searchText={(r) => `${r.learning} ${r.detail}`}
        searchPlaceholder="Search learning"
        rowClassName={(r) => (r.fresh ? 'bg-ok-soft/60' : '')}
        emptyText="No learning recorded in this period."
        label="records"
      />
    </div>
  );
}
