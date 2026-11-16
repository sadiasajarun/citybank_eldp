/**
 * Workforce Learning Intelligence (FR 11–12, 15, 168, 175–186, 208, 241–243).
 * One dashboard, three views (Management · Supervisor · Division Head), every figure computed from the demo state.
 * Management is a proposed role based on FR 168, 175–185, 208 and 241–243.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MASTERS, TRAINING } from '../../data';
import { CREDIT_TARGET, creditGap, DIRECTORY, DIVISIONS, directReports, inDivision, type Person } from '../../org';
import { ptResults, useDemo, type DemoState } from '../../store';
import { useSwitchRole } from '../../components/perspective';
import { Badge, cx, Drawer } from '../../components/ui';
import { ReasonModal } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { COMPETENCIES, IDP_REQUESTS, idpPerson, REC_TITLE, SURVEY, WhyDrawer } from '../../components/Tna';
import { NeedCard } from '../Command';
import { inPeriod, isDone, mandatoryOf, PERIODS, personRows, SUPERVISOR_NAME, trainingRecords, type PersonRow } from './dash';
import { requestLog } from './requests';

type View = 'Management' | 'Supervisor' | 'Division Head';
type Risk = 'High risk' | 'At risk' | 'On track' | 'Complete';
const RISK_TONE: Record<Risk, string> = { 'High risk': 'bg-brand-soft text-brand-dark', 'At risk': 'bg-amber-100 text-amber-900', 'On track': 'bg-sky-100 text-sky-900', Complete: 'bg-ok-soft text-ok' };
const RISK_ORDER: Record<Risk, number> = { 'High risk': 0, 'At risk': 1, 'On track': 2, Complete: 3 };
const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];
const CB = 'Corporate Banking';
const card = 'rounded-2xl bg-white ring-1 ring-line';
const btn2 = 'min-h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-[14px] hover:border-ink/30';
const sel = 'min-h-10 rounded-lg border border-line bg-white px-3 text-[15px]';

interface Track { p: Person; row: PersonRow; item: string; progress: number; last: string; due: string; assessment: string; risk: Risk; why: string; action: string; enrollmentId?: string }
interface Detail { title: string; what: string; why: string; data: string; status: string; next: string; people: Person[]; report?: string }

/** Live tracking: the mandatory course plus this training, one row per person (the riskiest item wins). */
function tracking(s: DemoState, rows: PersonRow[]): Track[] {
  const pt = new Map(ptResults(s).map((r) => [r.id, r]));
  return rows.map((row) => {
    const m = row.course ?? mandatoryOf(s, row.p.id);
    const res = pt.get(row.p.id);
    const assessment = res ? (res.status === 'Not taken' ? '—' : res.status) : '—';
    let risk: Risk = 'Complete', why = 'All learning complete', action = 'View record', item = 'Information Security Awareness 2026', progress = 100, last = '—', due = '—';
    if (m) {
      progress = m.progress; due = m.overdue ? 'Overdue' : `Due ${m.due.replace(' 2026', '')}`;
      last = m.progress === 0 ? 'Not started' : m.progress < 50 ? '9 days ago' : '2 days ago';
      if (m.status === 'Completed') { risk = 'Complete'; why = 'Course complete'; action = 'View course'; }
      else if (m.overdue || m.progress === 0) { risk = 'High risk'; why = m.overdue ? 'Mandatory course overdue' : 'Not started · due soon'; action = 'Manager intervention'; }
      else if (m.progress < 50) { risk = 'At risk'; why = 'Low progress · no recent activity'; action = 'Send reminder'; }
      else { risk = 'On track'; why = 'Progressing'; action = 'View course'; }
    }
    if (row.failed) { risk = 'High risk'; why = 'Failed the post-training assessment'; action = 'Review assessment'; item = TRAINING.title; progress = 100; due = row.remediation ?? 'No follow-up yet'; }
    else if (row.story === 'Absent') { risk = 'At risk'; why = 'Absent from the training'; action = 'Create follow-up task'; item = TRAINING.title; }
    return { p: row.p, row, item, progress, last, due, assessment, risk, why, action, enrollmentId: m?.enrollmentId };
  }).sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
}

export function Intelligence() {
  const s = useDemo();
  const nav = useNavigate();
  const go = useSwitchRole();
  const initial: View = s.role === 'supervisor' ? 'Supervisor' : s.role === 'division_head' ? 'Division Head' : 'Management';
  const [view, setView] = useState<View>(initial);
  const [period, setPeriod] = useState('fy2026');
  const [division, setDivision] = useState('All divisions');
  const [dept, setDept] = useState('All departments');
  const [desig, setDesig] = useState('All designations');
  const [status, setStatus] = useState('All statuses');
  const [mand, setMand] = useState('All mandatory');
  const [comp, setComp] = useState('All competencies');
  const [training, setTraining] = useState('All trainings');
  const [category, setCategory] = useState('All categories');
  const [label, setLabel] = useState('All labels');
  const [more, setMore] = useState(false);
  const [riskOnly, setRiskOnly] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [why, setWhy] = useState(false);
  const [decide, setDecide] = useState<'approve' | 'reject' | null>(null);
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: 'below', dir: -1 });

  useEffect(() => { if (view === 'Management') s.viewExec(); }, [view]);
  const reset = () => { setPeriod('fy2026'); setDivision('All divisions'); setDept('All departments'); setDesig('All designations'); setStatus('All statuses'); setMand('All mandatory'); setComp('All competencies'); setTraining('All trainings'); setCategory('All categories'); setLabel('All labels'); };

  /* ---------- population for the view and filters ---------- */
  const base: Person[] = view === 'Supervisor' ? directReports(SUPERVISOR_NAME) : view === 'Division Head' ? inDivision(CB) : division === 'All divisions' ? DIRECTORY : inDivision(division);
  const depts = [...new Set(base.map((p) => p.department))].sort();
  const desigs = [...new Set(base.map((p) => p.designation))].sort();
  const allRows = personRows(s, base.filter((p) => (dept === 'All departments' || p.department === dept) && (desig === 'All designations' || p.designation === desig)));
  const rows = allRows.filter((r) =>
    (status === 'All statuses' || (status === 'Completed' ? r.completed : status === 'In progress' ? r.inProgress : status === 'Failed' ? r.failed : r.needs))
    && (mand === 'All mandatory' || (r.course?.overdue ? 'Overdue' : r.course?.status ?? 'Not enrolled') === mand)
    && (comp === 'All competencies' || (comp === 'Credit Analysis below target' ? r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation) : r.p.creditLevel >= CREDIT_TARGET)));
  const people = rows.map((r) => r.p);
  const eids = new Set(people.map((p) => p.eid));
  const allRecs = trainingRecords(s);
  const recs = allRecs.filter((r) => eids.has(r.eid) && inPeriod(period, r.ym) && (training === 'All trainings' || r.training === training) && (category === 'All categories' || r.category === category) && (label === 'All labels' || r.tags.includes(label)));
  const track = useMemo(() => tracking(s, rows), [s, rows]);
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  /* ---------- shared figures ---------- */
  const enrolled = rows.filter((r) => r.course);
  const mandDone = enrolled.filter((r) => r.course?.status === 'Completed');
  const compliance = enrolled.length ? Math.round((mandDone.length / enrolled.length) * 100) : null;
  const overdue = rows.filter((r) => r.course?.overdue);
  const below = rows.filter((r) => r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation));
  const hours = recs.reduce((n, r) => n + r.hours, 0);
  const results = ptResults(s).filter((r) => people.some((p) => p.id === r.id) && (r.status === 'Passed' || r.status === 'Failed'));
  const passRate = results.length ? Math.round((results.filter((r) => r.status === 'Passed').length / results.length) * 100) : null;
  const active = s.programmes.filter((p) => p.status !== 'Completed').length + (s.scheduled && !s.completed ? 1 : 0);
  const spend = s.completed ? 1440000 : s.scheduled ? 1440000 : 0;
  const investment = 1280000 + spend;
  const atRisk = track.filter((t) => t.risk === 'High risk' || t.risk === 'At risk');
  const ids = new Set(people.map((p) => p.id));
  const withdrawals = [s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => ids.has(w.empId) && w.status !== 'none');
  const pendingWd = withdrawals.filter((w) => w.status === 'requested');

  const open = (d: Detail) => setDetail(d);
  const peopleOf = (rs: { p: Person }[]) => rs.map((r) => r.p);

  /* ---------- metrics per view ---------- */
  type Metric = { n: string; l: string; tone?: 'warn' | 'bad' | 'ok'; d: Detail };
  const M: Record<View, Metric[]> = {
    Management: [
      { n: compliance === null ? '—' : `${compliance}%`, l: 'Mandatory compliance', tone: compliance !== null && compliance < 90 ? 'warn' : 'ok', d: { title: 'Mandatory learning compliance', what: `${mandDone.length} of ${enrolled.length} enrolled employees completed ${'Information Security Awareness 2026'}.`, why: `${overdue.length} overdue and ${enrolled.length - mandDone.length - overdue.length} still in progress or not started.`, data: 'Course enrolments and progress', status: `${compliance ?? 0}% complete`, next: 'Send reminders and review overdue employees.', people: peopleOf(enrolled.filter((r) => r.course?.status !== 'Completed')), report: '/reports' } },
      { n: hours.toLocaleString('en-IN'), l: 'Learning hours', d: { title: 'Learning hours', what: `${hours} learning hours recorded in ${periodLabel}.`, why: `${recs.length} training records match the filters.`, data: 'Training database records', status: `${new Set(recs.filter(isDone).map((r) => r.eid)).size} people trained`, next: 'Compare hours by division below.', people: people.filter((p) => recs.some((r) => r.eid === p.eid)), report: '/reports' } },
      { n: passRate === null ? '—' : `${passRate}%`, l: 'Assessment pass rate', tone: passRate !== null && passRate < 80 ? 'warn' : 'ok', d: { title: 'Assessment pass rate', what: passRate === null ? 'No results released yet.' : `${passRate}% passed the post-training assessment.`, why: `${results.filter((r) => r.status === 'Failed').length} failed.`, data: 'Released assessment results', status: s.pta.released ? 'Released' : 'Not released', next: 'Review failed assessments and assign re-attempts.', people: people.filter((p) => results.some((r) => r.id === p.id && r.status === 'Failed')), report: '/assessment/results' } },
      { n: String(below.length), l: 'Employees below target', tone: 'warn', d: { title: 'Employees below target', what: `${below.length} employees are below the Credit Analysis target (level ${CREDIT_TARGET}).`, why: 'Their current competency level is under the level their role requires.', data: 'Competency matrix', status: `${below.filter((r) => r.inTraining).length} in training`, next: 'Review the recommended training.', people: peopleOf(below), report: '/competency' } },
      { n: String(active), l: 'Active programmes', d: { title: 'Active programmes', what: `${active} programmes are scheduled or running.`, why: 'From the training calendar.', data: 'Training calendar', status: s.scheduled ? `${TRAINING.title} scheduled` : 'Story training not scheduled yet', next: 'Open the calendar for dates and venues.', people: [], report: '/hr/calendar' } },
      { n: `৳${(investment / 100000).toFixed(1)}L`, l: 'Training investment', d: { title: 'Training investment', what: `BDT ${investment.toLocaleString('en-IN')} committed this year.`, why: s.scheduled ? `Includes ${TRAINING.title} (BDT 14,40,000).` : 'Earlier programmes only.', data: 'Planned training budgets and actual expenses', status: s.completed ? 'Closed with actual expense' : 'Budgeted', next: 'Open the training investment report.', people: [], report: '/reports' } },
    ],
    Supervisor: [
      { n: String(rows.length), l: 'Direct reports', d: { title: 'Direct reports', what: `${rows.length} people report to ${SUPERVISOR_NAME}.`, why: 'From HRIS.', data: 'HRIS reporting lines', status: '—', next: 'Open the team table below.', people } },
      { n: String(atRisk.length), l: 'Need attention', tone: atRisk.length ? 'warn' : 'ok', d: { title: 'Employees needing attention', what: `${atRisk.length} team members are at risk.`, why: 'Low progress, overdue courses, failed assessment or absence.', data: 'Course progress, attendance and results', status: `${track.filter((t) => t.risk === 'High risk').length} high risk`, next: 'Send reminders or contact them.', people: atRisk.map((t) => t.p) } },
      { n: String(overdue.length), l: 'Overdue mandatory', tone: overdue.length ? 'bad' : 'ok', d: { title: 'Overdue mandatory learning', what: `${overdue.length} overdue.`, why: 'Past the due date without completion.', data: 'Course enrolments', status: '—', next: 'Send reminders.', people: peopleOf(overdue) } },
      { n: String(rows.filter((r) => r.inProgress).length), l: 'In progress', d: { title: 'In progress', what: `${rows.filter((r) => r.inProgress).length} are on ${TRAINING.title}.`, why: 'Selected and invited.', data: 'Participant list', status: '—', next: 'Track attendance and results.', people: peopleOf(rows.filter((r) => r.inProgress)) } },
      { n: String(pendingWd.length), l: 'Pending decisions', tone: pendingWd.length ? 'bad' : 'ok', d: { title: 'Pending withdrawal decisions', what: `${pendingWd.length} withdrawal request${pendingWd.length === 1 ? '' : 's'} waiting for you.`, why: 'Employees asked to withdraw from the training.', data: 'Withdrawal requests', status: '—', next: 'Decide below or on Withdrawal Requests.', people: pendingWd.map((w) => DIRECTORY.find((p) => p.id === w.empId)!).filter(Boolean) } },
      { n: String(s.attendanceSubmitted && !s.pta.released ? rows.filter((r) => r.story === 'Attended').length : 0), l: 'Upcoming assessments', d: { title: 'Upcoming assessments', what: 'Post-training assessment after the training days.', why: 'Opens once attendance is submitted.', data: 'Assessment schedule', status: s.pta.released ? 'Released' : s.attendanceSubmitted ? 'Open' : 'Not open yet', next: 'Remind attendees to submit.', people: peopleOf(rows.filter((r) => r.story === 'Attended')) } },
    ],
    'Division Head': [
      { n: String(below.length), l: 'Below target', tone: 'warn', d: { title: 'Employees below target', what: `${below.length} of ${rows.filter((r) => TARGET_ROLES.includes(r.p.designation)).length} officers are below the Credit Analysis target.`, why: 'Current level 2–3 against target 4.', data: 'Competency matrix', status: s.requestSubmitted ? `Request ${TRAINING.requestId} raised` : 'No request yet', next: 'Raise a training request.', people: peopleOf(below), report: '/division' } },
      { n: String(COMPETENCIES.filter((c) => c.training && c.below / c.total >= 0.2).length), l: 'Active training needs', d: { title: 'Active training needs', what: 'Competencies with a gap that needs training.', why: COMPETENCIES.filter((c) => c.training && c.below / c.total >= 0.2).map((c) => c.name).join(', '), data: 'Competency setup and matrix', status: '—', next: 'Open training needs.', people: [], report: '/division' } },
      { n: '1', l: 'AI recommendations', d: { title: 'AI training recommendation', what: `${REC_TITLE} recommended.`, why: 'Skill gap, role requirement and mandatory learning.', data: 'Competency matrix, role requirements, training history', status: s.tna.recommendation === 'accepted' ? 'Accepted' : 'Waiting for your decision', next: 'Review the recommendation.', people: peopleOf(below), report: '/division' } },
      { n: String(SURVEY.responses), l: 'Survey signals', d: { title: 'Survey and nomination signals', what: `${SURVEY.responses} responses; ${SURVEY.high} high priority.`, why: `${SURVEY.top} is the top request.`, data: 'Programme-wise TNA survey', status: s.tna.survey ? 'Used as evidence' : 'Not used yet', next: 'Use it as evidence for the request.', people: [], report: '/division' } },
      { n: compliance === null ? '—' : `${compliance}%`, l: 'Mandatory compliance', tone: compliance !== null && compliance < 90 ? 'warn' : 'ok', d: { title: 'Mandatory compliance', what: `${mandDone.length} of ${enrolled.length} completed.`, why: `${overdue.length} overdue.`, data: 'Course enrolments', status: '—', next: 'Ask supervisors to follow up.', people: peopleOf(enrolled.filter((r) => r.course?.status !== 'Completed')) } },
      { n: String(requestLog(s).filter((r) => r.status === 'Ongoing').length), l: 'Upcoming training', d: { title: 'Upcoming division training', what: requestLog(s).filter((r) => r.status === 'Ongoing').map((r) => r.title).join(', ') || 'None', why: 'From your training requests.', data: 'Training requests', status: '—', next: 'Open a request for details.', people: [], report: '/overview' } },
    ],
  };

  /* ---------- live tracking actions ---------- */
  const act = (t: Track) => {
    if (t.action === 'Send reminder' || t.action === 'Manager intervention') {
      if (t.enrollmentId) s.sendReminders([t.enrollmentId]);
      else { s.logEvent(view === 'Supervisor' ? 'supervisor' : 'management', 'Reminder sent', `${t.p.name} · ${t.item} (simulated)`); useDemo.setState({ toast: `Reminder sent to ${t.p.name} (simulated)` }); }
    } else if (t.action === 'Review assessment') nav('/assessment/results');
    else if (t.action === 'Create follow-up task') { s.logEvent(view === 'Supervisor' ? 'supervisor' : 'management', 'Follow-up task created', `${t.p.name} · ${t.why}`); useDemo.setState({ toast: `Follow-up task created for ${t.p.name}` }); }
    else if (['e1', 'e2', 'e4'].includes(t.p.id)) go('employee', '/employee/record', t.p.id);
    else nav('/learning/course');
  };
  const shownTrack = (riskOnly ? atRisk : track).slice(0, 8);

  /* ---------- division comparison (management) ---------- */
  const divRows = DIVISIONS.map((d) => {
    const ppl = inDivision(d.name);
    const rs = personRows(s, ppl);
    const en = rs.filter((r) => r.course);
    const e = new Set(ppl.map((p) => p.eid));
    const rc = allRecs.filter((r) => e.has(r.eid) && inPeriod(period, r.ym));
    const res = ptResults(s).filter((r) => ppl.some((p) => p.id === r.id) && (r.status === 'Passed' || r.status === 'Failed'));
    const gap = creditGap(d.name).length;
    const comp2 = en.length ? Math.round((en.filter((r) => r.course?.status === 'Completed').length / en.length) * 100) : null;
    const risk = gap >= 10 ? 'Credit Analysis gap' : comp2 !== null && comp2 < 50 ? 'Mandatory learning' : '—';
    return { name: d.name, people: ppl.length, below: gap, compliance: comp2, completion: rc.length ? Math.round((rc.filter(isDone).length / rc.length) * 100) : null, pass: res.length ? Math.round((res.filter((r) => r.status === 'Passed').length / res.length) * 100) : null, hours: rc.reduce((n, r) => n + r.hours, 0), risk, action: risk === 'Credit Analysis gap' ? 'Review the gap' : risk === 'Mandatory learning' ? 'Send reminders' : 'Monitor' };
  }).filter((d) => division === 'All divisions' || d.name === division);
  const sorted = [...divRows].sort((a, b) => { const x = a[sort.k as keyof typeof a] ?? -1; const y = b[sort.k as keyof typeof b] ?? -1; return (x > y ? 1 : x < y ? -1 : 0) * sort.dir; });
  const th = (k: string, l: string) => <th className="py-2 pr-3 font-normal"><button onClick={() => setSort({ k, dir: sort.k === k ? (sort.dir === 1 ? -1 : 1) : -1 })} className="flex items-center gap-1 hover:text-ink" aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>{l}{sort.k === k && (sort.dir === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</button></th>;

  /* ---------- trends ---------- */
  const months = [...new Set(allRecs.map((r) => r.ym).filter((m): m is number => m !== null))].sort((a, b) => a - b).slice(-6);
  const mName = (m: number) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m % 12];
  const hrsBy = months.map((m) => ({ l: mName(m), v: allRecs.filter((r) => r.ym === m && eids.has(r.eid)).reduce((n, r) => n + r.hours, 0) }));
  const doneBy = months.map((m) => ({ l: mName(m), v: allRecs.filter((r) => r.ym === m && eids.has(r.eid) && isDone(r)).length }));

  /* ---------- priority risks (management) ---------- */
  const risks: { title: string; why: string; who: string; next: string; go: () => void; cta: string }[] = [
    ...(creditGap(CB).length ? [{ title: `Credit Analysis gap in ${CB}`, why: `${creditGap(CB).length} of ${inDivision(CB).filter((p) => TARGET_ROLES.includes(p.designation)).length} officers below target.`, who: `${CB} · Relationship Managers and Credit Analysts`, next: s.requestSubmitted ? `Track ${TRAINING.title}.` : 'Review the AI-recommended training.', go: () => setView('Division Head'), cta: 'Open division view' }] : []),
    ...(atRisk.length ? [{ title: 'Employees at risk of missing mandatory learning', why: `${atRisk.length} with low progress, overdue or not started.`, who: `${new Set(atRisk.map((t) => t.p.division)).size} divisions`, next: 'Send reminders through supervisors.', go: () => { setRiskOnly(true); document.getElementById('sec-live')?.scrollIntoView({ behavior: 'smooth' }); }, cta: 'See live tracking' }] : []),
    ...(results.some((r) => r.status === 'Failed') ? [{ title: 'Failed post-training assessments', why: `${results.filter((r) => r.status === 'Failed').length} participants failed ${TRAINING.title}.`, who: 'Their supervisors and HR', next: 'Review results and assign re-attempts.', go: () => nav('/assessment/results'), cta: 'Review results' }] : []),
  ];

  /* ---------- supervisor calendar ---------- */
  const team = view === 'Supervisor' ? rows : [];
  const cal: { date: string; what: string; n: number; act: string }[] = [
    ...(pendingWd.length ? [{ date: 'Now', what: 'Withdrawal decision', n: pendingWd.length, act: 'Decide' }] : []),
    ...(s.scheduled && !s.attendanceSubmitted ? [{ date: '18–19 Nov', what: TRAINING.title, n: team.filter((r) => r.inTraining).length, act: 'Release them for both days' }] : []),
    ...(s.attendanceSubmitted && !s.pta.released ? [{ date: '20 Nov', what: 'Post-training assessment', n: team.filter((r) => r.story === 'Attended').length, act: 'Remind to submit' }] : []),
    { date: '20 Nov', what: 'Information Security Awareness due', n: team.filter((r) => r.course && r.course.status !== 'Completed').length, act: 'Send reminders' },
    ...(s.pta.released && !s.feedbackSubmitted ? [{ date: '22 Nov', what: 'Training feedback due', n: team.filter((r) => r.story === 'Attended').length, act: 'Encourage feedback' }] : []),
  ].filter((x) => x.n > 0);

  const toneCls = (t?: 'warn' | 'bad' | 'ok') => (t === 'warn' ? 'text-amber-700' : t === 'bad' ? 'text-brand' : '');
  const Bars = ({ title, data }: { title: string; data: { l: string; v: number }[] }) => {
    const mx = Math.max(1, ...data.map((d) => d.v));
    return (
      <div>
        <div className="mb-2 text-[15px] text-ink-3">{title}</div>
        <div className="flex h-28 items-end gap-2">{data.map((d) => <div key={d.l} className="flex flex-1 flex-col items-center gap-1"><span className="text-[13px] tabular-nums text-ink-2">{d.v}</span><span className="w-full rounded-t bg-ink/70" style={{ height: `${Math.max(3, (d.v / mx) * 80)}px` }} /><span className="text-[13px] text-ink-3">{d.l}</span></div>)}</div>
      </div>
    );
  };
  const Section = ({ id, title, right, children, className }: { id?: string; title: string; right?: ReactNode; children: ReactNode; className?: string }) => (
    <section id={id} className={cx(card, 'scroll-mt-4 px-6 py-5', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-[22px] font-semibold">{title}</h2>{right}</div>
      {children}
    </section>
  );

  return (
    <div className="mx-auto max-w-[1480px] px-8 py-8">
      {/* header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-semibold leading-tight tracking-tight">Workforce Learning Intelligence</h1>
          <p className="mt-1 text-[16px] text-ink-2">Understand learning performance, identify risks early and plan the next action.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SourceTag kind="fictional" />
            {view === 'Management' && <SourceTag kind="proposed">Proposed management view · based on FR 168, 175–185, 208, 241–243</SourceTag>}
            <FrRef>{view === 'Supervisor' ? 'FR 8–12' : view === 'Division Head' ? 'FR 13–15, 185–188' : 'FR 168, 175–185, 208'}</FrRef>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-ink-3">View as</span>
          <div className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-line" role="tablist" aria-label="View as">
            {(['Management', 'Supervisor', 'Division Head'] as const).map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); setDivision('All divisions'); setDept('All departments'); setDesig('All designations'); }} className={cx('rounded-md px-4 py-2 text-[15px]', view === v ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}>{v}</button>)}
          </div>
        </div>
      </header>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
        <select aria-label="Period" className={sel} value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
        {view === 'Management'
          ? <select aria-label="Division" className={sel} value={division} onChange={(e) => { setDivision(e.target.value); setDept('All departments'); }}>{['All divisions', ...DIVISIONS.map((d) => d.name)].map((x) => <option key={x}>{x}</option>)}</select>
          : <span className="px-2 text-[15px] text-ink-2">{view === 'Supervisor' ? `Team · ${SUPERVISOR_NAME}` : CB}</span>}
        <select aria-label="Department" className={sel} value={dept} onChange={(e) => setDept(e.target.value)}>{['All departments', ...depts].map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Designation" className={sel} value={desig} onChange={(e) => setDesig(e.target.value)}>{['All designations', ...desigs].map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>{['All statuses', 'Completed', 'In progress', 'Failed', 'Needs training'].map((x) => <option key={x}>{x}</option>)}</select>
        <button onClick={() => setMore((v) => !v)} className="px-2 text-[15px] text-brand hover:underline">{more ? 'Fewer filters' : 'More filters'}</button>
        <button onClick={reset} className="ml-auto px-2 text-[15px] text-ink-2 hover:text-ink">Reset filters</button>
        {more && (
          <div className="flex w-full flex-wrap gap-2 border-t border-line pt-2">
            <select aria-label="Mandatory learning status" className={sel} value={mand} onChange={(e) => setMand(e.target.value)}>{['All mandatory', 'Completed', 'In progress', 'Overdue', 'Not started'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Competency" className={sel} value={comp} onChange={(e) => setComp(e.target.value)}>{['All competencies', 'Credit Analysis below target', 'Credit Analysis at target'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Training" className={sel} value={training} onChange={(e) => setTraining(e.target.value)}>{['All trainings', ...new Set(allRecs.map((r) => r.training))].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Training category" className={sel} value={category} onChange={(e) => setCategory(e.target.value)}>{['All categories', ...MASTERS.categories].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Training label" className={sel} value={label} onChange={(e) => setLabel(e.target.value)}>{['All labels', ...MASTERS.tags].map((x) => <option key={x}>{x}</option>)}</select>
          </div>
        )}
      </div>

      {/* summary strip */}
      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {M[view].map((m) => (
          <li key={m.l}><button onClick={() => open(m.d)} className={cx(card, 'w-full px-5 py-4 text-left hover:shadow-md hover:ring-ink/20')}>
            <div className={cx('text-[34px] font-semibold leading-none tabular-nums', toneCls(m.tone))}>{m.n}</div>
            <div className="mt-1.5 text-[15px] text-ink-2">{m.l}</div>
          </button></li>
        ))}
      </ul>

      {/* view-specific decision area */}
      {view === 'Management' && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Section title="Priority risks">
            {risks.length ? <ul className="divide-y divide-line">{risks.map((r) => (
              <li key={r.title} className="flex flex-wrap items-start gap-4 py-3">
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                <span className="min-w-0 flex-1"><span className="block text-[17px] font-medium">{r.title}</span>
                  <span className="block text-[15px] text-ink-2"><span className="text-ink-3">Why: </span>{r.why}</span>
                  <span className="block text-[15px] text-ink-2"><span className="text-ink-3">Who: </span>{r.who}</span>
                  <span className="block text-[15px]"><span className="text-ink-3">Next: </span>{r.next}</span></span>
                <button onClick={r.go} className={btn2}>{r.cta}</button>
              </li>))}</ul> : <p className="text-[16px] text-ink-2">No priority risks for these filters.</p>}
          </Section>
          <Section title="Management actions">
            <ul className="divide-y divide-line">
              {[
                { l: `Review the ${CB} Credit Analysis gap`, go: () => setView('Division Head') },
                { l: 'Follow up on employees at risk of missing mandatory learning', go: () => { setRiskOnly(true); document.getElementById('sec-live')?.scrollIntoView({ behavior: 'smooth' }); } },
                { l: 'Review failed assessments', go: () => nav('/assessment/results') },
                { l: 'Open the training investment report', go: () => nav('/reports') },
                { l: 'Review recommended learning priorities', go: () => document.getElementById('sec-gaps')?.scrollIntoView({ behavior: 'smooth' }) },
              ].map((a) => <li key={a.l}><button onClick={a.go} className="flex w-full items-center justify-between gap-3 py-3 text-left text-[16px] hover:text-brand">{a.l}<ArrowRight size={16} className="shrink-0 text-ink-3" /></button></li>)}
            </ul>
          </Section>
        </div>
      )}

      {view === 'Supervisor' && (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Section title="Pending supervisor decisions">
            {withdrawals.length ? <ul className="divide-y divide-line">{withdrawals.map((w) => {
              const p = DIRECTORY.find((x) => x.id === w.empId);
              const story = w.empId === s.withdrawal.empId;
              return (
                <li key={w.empId} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="min-w-0"><span className="block text-[16px] font-medium">{p?.name} · withdrawal request</span>
                      <span className="block text-[14px] text-ink-3">Reason: {w.reason || '—'} · training {TRAINING.dates} · replacement eligible: Sadia Islam (no conflicts)</span></span>
                    <Badge t={w.status === 'requested' ? 'warn' : 'ok'}>{w.status === 'requested' ? 'Waiting for you' : w.status === 'proposed' ? 'With HR' : w.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
                  </div>
                  {w.status === 'requested' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.role !== 'supervisor' ? <button onClick={() => go('supervisor', '/supervisor')} className={btn2}>Open as supervisor</button> : story ? <>
                        <button onClick={() => setDecide('approve')} className={btn2}>Approve withdrawal</button>
                        <button onClick={() => nav('/supervisor')} className="min-h-9 rounded-lg bg-brand px-3 text-[14px] font-medium text-white hover:bg-brand-dark">Approve with replacement</button>
                        <button onClick={() => setDecide('reject')} className={btn2}>Reject</button>
                      </> : <button onClick={() => nav('/supervisor')} className={btn2}>Decide</button>}
                      {['e1', 'e2', 'e4'].includes(w.empId) && <button onClick={() => go('employee', '/employee', w.empId)} className="px-2 text-[14px] text-brand hover:underline">View employee</button>}
                    </div>
                  )}
                </li>
              );
            })}</ul> : <p className="text-[16px] text-ink-2">No withdrawal or replacement requests.</p>}
          </Section>
          <Section title="Team calendar">
            {cal.length ? <ul className="divide-y divide-line">{cal.map((c) => <li key={c.date + c.what} className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 py-2.5"><span className="text-[14px] tabular-nums text-ink-3">{c.date}</span><span><span className="block text-[16px]">{c.what}</span><span className="text-[14px] text-ink-3">{c.n} of your team · {c.act}</span></span></li>)}</ul> : <p className="text-[16px] text-ink-2">Nothing scheduled.</p>}
          </Section>
        </div>
      )}

      {view === 'Division Head' && (
        <div className="mt-6 space-y-6">
          <NeedCard />
          <div className="grid gap-6 xl:grid-cols-3">
            <Section title="AI recommendation" className="bg-[#f1f6fb] ring-0">
              <div className="text-[20px] font-semibold">{REC_TITLE}</div>
              <p className="mt-1 text-[15px] text-ink-2">Skill gap, role requirement, mandatory courses, progress and division learning data.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[14px] text-sky-900"><Sparkles size={14} />AI-assisted recommendation · Human decision required</span>
              <div className="mt-4 flex flex-wrap gap-3"><button onClick={() => nav('/division')} className={btn2}>Review recommendation</button><button onClick={() => setWhy(true)} className="text-[14px] text-sky-800 hover:underline">View supporting evidence</button></div>
            </Section>
            <Section title="Survey and nomination signals">
              <p className="text-[16px]"><span className="text-[28px] font-semibold tabular-nums">{SURVEY.responses}</span> <span className="text-ink-2">responses · {SURVEY.high} high priority</span></p>
              <ul className="mt-2 space-y-1 text-[15px]">{SURVEY.byDivision.map(([d, n]) => <li key={d} className="flex justify-between"><span>{d}</span><span className="tabular-nums text-ink-2">{n}</span></li>)}</ul>
              <p className="mt-2 text-[15px] text-ink-2">Suggested need: {SURVEY.top}{s.tna.survey ? ' · used as evidence' : ''}</p>
            </Section>
            <Section title="Development requests">
              <ul className="divide-y divide-line">{IDP_REQUESTS.map((r) => { const p = idpPerson(r); return <li key={r.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0"><span className="block text-[15px]">{p?.name} · {p?.designation}</span><span className="text-[14px] text-ink-3">{r.learning}</span></span><Badge t={s.tna.idpIds.includes(r.id) ? 'ok' : 'neutral'}>{s.tna.idpIds.includes(r.id) ? 'Used' : r.status}</Badge></li>; })}</ul>
              <button onClick={() => nav('/division')} className="mt-2 text-[14px] text-brand hover:underline">Review on training needs →</button>
            </Section>
          </div>
        </div>
      )}

      {/* live tracking */}
      <Section id="sec-live" title="Live learning tracking" className="mt-6" right={<label className="flex items-center gap-2 text-[15px] text-ink-2"><input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} className="h-4 w-4 accent-brand" />At risk only ({atRisk.length})</label>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[15px]">
            <thead className="text-[14px] text-ink-3"><tr>{['Employee', 'Course or training', 'Progress', 'Last activity', 'Due', 'Assessment', 'Risk', ''].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {shownTrack.map((t) => (
                <tr key={t.p.id}>
                  <td className="py-2.5 pr-3"><span className="block">{t.p.name}</span><span className="text-[14px] text-ink-3">{t.p.designation} · {view === 'Management' ? t.p.division : t.p.department}</span></td>
                  <td className="py-2.5 pr-3 text-ink-2">{t.item}</td>
                  <td className="py-2.5 pr-3"><span className="flex items-center gap-2"><span className="h-2 w-24 rounded-full bg-canvas"><span className={cx('block h-2 rounded-full', t.risk === 'High risk' ? 'bg-brand' : t.risk === 'At risk' ? 'bg-amber-400' : 'bg-ok')} style={{ width: `${t.progress}%` }} /></span><span className="tabular-nums text-ink-2">{t.progress}%</span></span></td>
                  <td className="py-2.5 pr-3 text-ink-2">{t.last}</td>
                  <td className="py-2.5 pr-3 text-ink-2">{t.due}</td>
                  <td className="py-2.5 pr-3 text-ink-2">{t.assessment}</td>
                  <td className="py-2.5 pr-3"><span title={t.why} className={cx('rounded-full px-2.5 py-0.5 text-[14px] font-medium', RISK_TONE[t.risk])}>{t.risk}</span></td>
                  <td className="py-2.5 text-right"><button onClick={() => act(t)} className={btn2}>{t.action}{['Send reminder', 'Manager intervention', 'Create follow-up task'].includes(t.action) && !t.enrollmentId ? ' (simulated)' : ''}</button></td>
                </tr>
              ))}
              {!shownTrack.length && <tr><td colSpan={8} className="py-6 text-center text-ink-3">Nobody is at risk for these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      {/* detail below the decision summary */}
      {view === 'Management' && (
        <>
          <Section title="Division comparison" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-[15px]">
                <thead className="text-[14px] text-ink-3"><tr>{th('name', 'Division')}{th('people', 'Employees')}{th('below', 'Below target')}{th('compliance', 'Mandatory')}{th('completion', 'Completion')}{th('pass', 'Pass rate')}{th('hours', 'Hours')}<th className="py-2 pr-3 font-normal">Priority risk</th><th className="py-2 font-normal">Action</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {sorted.map((d) => (
                    <tr key={d.name}>
                      <td className="py-2.5 pr-3">{d.name}</td><td className="py-2.5 pr-3 tabular-nums">{d.people}</td>
                      <td className={cx('py-2.5 pr-3 tabular-nums', d.below >= 10 && 'text-amber-700')}>{d.below}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{d.compliance === null ? '—' : `${d.compliance}%`}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{d.completion === null ? '—' : `${d.completion}%`}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{d.pass === null ? '—' : `${d.pass}%`}</td>
                      <td className="py-2.5 pr-3 tabular-nums">{d.hours}</td>
                      <td className="py-2.5 pr-3 text-ink-2">{d.risk}</td>
                      <td className="py-2.5"><button onClick={() => { setDivision(d.name); document.getElementById('sec-live')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-[14px] text-brand hover:underline">{d.action}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Section id="sec-gaps" title="Priority competency gaps">
              <table className="w-full text-left text-[15px]">
                <thead className="text-[14px] text-ink-3"><tr>{['Competency', 'Division', 'Level', 'Affected', 'Recommended learning'].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {COMPETENCIES.filter((c) => c.training).map((c) => (
                    <tr key={c.name}><td className="py-2.5 pr-3">{c.name}</td><td className="py-2.5 pr-3 text-ink-2">{CB}</td><td className="py-2.5 pr-3 tabular-nums">{c.current} → {c.target}</td><td className="py-2.5 pr-3 tabular-nums">{c.below} of {c.total}</td><td className="py-2.5 text-ink-2">{c.training}{c.story && s.requestSubmitted ? ` · ${s.completed ? 'delivered' : 'in progress'}` : ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </Section>
            <Section title="Trends">
              <div className="grid gap-6 sm:grid-cols-2"><Bars title="Learning hours by month" data={hrsBy} /><Bars title="Completed training by month" data={doneBy} /></div>
              <p className="mt-4 text-[15px] text-ink-2">Pass rate {passRate === null ? 'not released yet' : `${passRate}%`} · investment BDT {investment.toLocaleString('en-IN')}</p>
            </Section>
          </div>
        </>
      )}

      {view === 'Supervisor' && (
        <Section title="Team learning" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-[15px]">
              <thead className="text-[14px] text-ink-3"><tr>{['Employee', 'Department', 'This training', 'Mandatory', 'Assessment', 'Attendance', 'Competency', 'Next action'].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => {
                  const t = track.find((x) => x.p.id === r.p.id);
                  return (
                    <tr key={r.p.id}>
                      <td className="py-2.5 pr-3"><span className="block">{r.p.name}</span><span className="text-[14px] text-ink-3">{r.p.designation}</span></td>
                      <td className="py-2.5 pr-3 text-ink-2">{r.p.department}</td>
                      <td className="py-2.5 pr-3"><Badge>{r.story}</Badge></td>
                      <td className="py-2.5 pr-3 text-ink-2">{r.course ? (r.course.overdue ? 'Overdue' : `${r.course.status} · ${r.course.progress}%`) : '—'}</td>
                      <td className="py-2.5 pr-3 text-ink-2">{r.result}</td>
                      <td className="py-2.5 pr-3 text-ink-2">{r.d1 ? `${r.d1}${r.d2 ? ` / ${r.d2}` : ''}` : '—'}</td>
                      <td className={cx('py-2.5 pr-3', r.p.creditLevel < CREDIT_TARGET ? 'text-amber-700' : 'text-ok')}>L{r.p.creditLevel} of {CREDIT_TARGET}</td>
                      <td className="py-2.5">{t && t.risk !== 'Complete' && t.risk !== 'On track' ? <button onClick={() => act(t)} className="text-[14px] text-brand hover:underline">{t.action}</button> : <span className="text-ink-3">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {view === 'Division Head' && (
        <Section title="Division training progress" className="mt-6">
          <ul className="divide-y divide-line">
            {requestLog(s).map((r) => (
              <li key={r.id}><button onClick={() => go('division_head', `/division/requests/${r.id}`)} className="grid w-full grid-cols-[minmax(0,2fr)_110px_minmax(0,1.4fr)_20px] items-center gap-4 py-3 text-left hover:text-brand">
                <span className="min-w-0"><span className="block truncate text-[16px]">{r.title}</span><span className="text-[14px] text-ink-3">{r.id} · {r.people} people</span></span>
                <Badge t={r.status === 'Completed' ? 'ok' : r.status === 'Ongoing' ? 'info' : 'neutral'}>{r.status}</Badge>
                <span className="truncate text-[15px] text-ink-2">{r.outcome}</span><ArrowRight size={16} className="text-ink-3" />
              </button></li>
            ))}
          </ul>
        </Section>
      )}

      {/* detail drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? ''}>
        {detail && (
          <div className="space-y-5 text-[16px]">
            <dl className="divide-y divide-line border-y border-line">
              {([['What happened', detail.what], ['Why', detail.why], ['Data used', detail.data], ['People affected', `${detail.people.length}`], ['Current status', detail.status], ['Next action', detail.next]] as [string, string][]).map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-2.5"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {detail.people.length > 0 && <ul className="max-h-[280px] divide-y divide-line overflow-y-auto">{detail.people.map((p) => <li key={p.id} className="flex justify-between py-2 text-[15px]"><span>{p.name}</span><span className="text-ink-3">{p.designation} · {p.department}</span></li>)}</ul>}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setDetail(null); document.getElementById('sec-live')?.scrollIntoView({ behavior: 'smooth' }); }} className={btn2}>Open employees</button>
              <button onClick={() => { setDetail(null); nav(view === 'Division Head' ? '/division' : view === 'Supervisor' ? '/supervisor/team' : '/competency'); }} className={btn2}>View evidence</button>
              <button onClick={() => { const r = detail.report ?? '/reports'; setDetail(null); nav(r); }} className={btn2}>Open report</button>
            </div>
          </div>
        )}
      </Drawer>
      <WhyDrawer open={why} onClose={() => setWhy(false)} accepted={s.tna.recommendation === 'accepted'} />
      <ReasonModal open={decide !== null} title={decide === 'approve' ? 'Approve withdrawal' : 'Reject withdrawal'} intro="A reason is required. It goes to the employee and HR (FR 9–10)." confirm={decide === 'approve' ? 'Approve' : 'Reject'}
        suggested={decide === 'approve' ? 'Client commitment confirmed for 18 Nov.' : 'Training is critical for the role this quarter.'}
        onClose={() => setDecide(null)} onConfirm={(reason) => { if (decide) s.decideWithdrawal(decide, reason); setDecide(null); }} />
    </div>
  );
}
