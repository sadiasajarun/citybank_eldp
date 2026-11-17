/**
 * Workforce Learning Intelligence (FR 8–15, 168, 175–188, 208).
 * One dashboard, two views (Division Head · Supervisor), every figure computed from the demo state.
 * After the training is held, the Division Head view shows the training outcome for decision making:
 * who completed, who failed or was absent, and who still needs training.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { TRAINING } from '../../data';
import { CREDIT_TARGET, DIRECTORY, directReports, inDivision, type Person } from '../../org';
import { JOURNEY, journeyIndex } from '../../lifecycle';
import { ptResults, useDemo, type DemoState } from '../../store';
import { useSwitchRole } from '../../components/perspective';
import { Badge, cx, Drawer } from '../../components/ui';
import { ReasonModal } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { COMPETENCIES, IDP_REQUESTS, idpPerson, REC_TITLE, SURVEY, WhyDrawer } from '../../components/Tna';
import { mandatoryOf, PeopleTable, personRows, SUPERVISOR_NAME, type PersonRow } from './dash';
import { requestLog } from './requests';

type View = 'Division Head' | 'Supervisor';
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

/** The training outcome after the training is held (who completed, results, who still needs training). */
interface Outcome {
  participants: PersonRow[]; attended: PersonRow[]; absent: PersonRow[]; passed: PersonRow[]; failed: PersonRow[]; awaiting: PersonRow[]; withdrawn: PersonRow[];
  notTrained: PersonRow[]; followUp: PersonRow[]; passRate: number | null; avgScore: number | null;
}
function outcomeOf(rows: PersonRow[]): Outcome {
  const participants = rows.filter((r) => r.inTraining);
  const attended = participants.filter((r) => r.story === 'Attended');
  const absent = participants.filter((r) => r.story === 'Absent');
  const passed = participants.filter((r) => r.completed);
  const failed = participants.filter((r) => r.failed);
  const awaiting = attended.filter((r) => !r.completed && !r.failed);
  const withdrawn = rows.filter((r) => r.story === 'Withdrawn');
  const notTrained = rows.filter((r) => !r.inTraining && r.story !== 'Withdrawn' && r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation));
  const scored = [...passed, ...failed].filter((r) => r.score !== null);
  return {
    participants, attended, absent, passed, failed, awaiting, withdrawn, notTrained,
    followUp: [...failed, ...absent, ...withdrawn, ...notTrained],
    passRate: passed.length + failed.length ? Math.round((passed.length / (passed.length + failed.length)) * 100) : null,
    avgScore: scored.length ? Math.round(scored.reduce((n, r) => n + (r.score ?? 0), 0) / scored.length) : null,
  };
}

function OutcomeCard({ s, o, onSeeWho, onOpenRequest }: { s: DemoState; o: Outcome; onSeeWho: () => void; onOpenRequest: () => void }) {
  const total = Math.max(1, o.participants.length);
  const segs: { k: string; n: number; cls: string; text: string }[] = [
    { k: 'Completed', n: o.passed.length, cls: 'bg-ok', text: 'text-ok' },
    { k: 'Awaiting result', n: o.awaiting.length, cls: 'bg-ink/25', text: 'text-ink-2' },
    { k: 'Failed', n: o.failed.length, cls: 'bg-brand', text: 'text-brand' },
    { k: 'Absent', n: o.absent.length, cls: 'bg-amber-300', text: 'text-amber-800' },
  ];
  const pill = s.completed ? ['Training closed', 'bg-ok-soft text-ok'] : s.pta.released ? ['Results released', 'bg-sky-100 text-sky-900'] : ['Awaiting results', 'bg-amber-100 text-amber-900'];
  const next = !s.pta.released ? 'Release the post-training assessment results.'
    : o.failed.length || o.absent.length ? `Assign a re-attempt to ${o.failed.length} and a follow-up session to ${o.absent.length}.`
    : o.notTrained.length ? `Plan the next batch for ${o.notTrained.length} officers still below target.` : 'No follow-up needed.';
  const facts: [string, ReactNode][] = [
    ['Assessment', o.passRate === null ? 'Results not released yet' : <span>{o.passRate}% pass rate{o.avgScore !== null && <span className="text-ink-2"> · average {o.avgScore}%</span>}</span>],
    ['Attendance', `${o.attended.length} of ${o.participants.length} attended both days`],
    ['Still needs training', o.followUp.length ? <span className="text-warn">{o.followUp.length} people · {o.failed.length} failed, {o.absent.length} absent, {o.withdrawn.length} withdrew, {o.notTrained.length} not yet trained</span> : 'Nobody'],
  ];
  return (
    <section aria-labelledby="outcome-title" className="min-w-0 rounded-2xl bg-white px-7 py-6 shadow-sm ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[15px] text-ink-3">{TRAINING.requestId} · {CB} training outcome</div>
        <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-3 py-0.5 text-[14px] font-medium', pill[1])}>{pill[0]}</span>
      </div>
      <h2 id="outcome-title" className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{TRAINING.title}</h2>

      <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div>
          <div className="num text-[48px] leading-none">{o.passed.length}<span className="text-[26px] text-ink-3"> of {o.participants.length}</span></div>
          <div className="mt-1 text-[16px] text-ink-2">participants completed</div>
        </div>
        <div role="img" aria-label={segs.map((g) => `${g.n} ${g.k.toLowerCase()}`).join(', ')}>
          <div className="flex h-3 gap-1.5">
            {segs.filter((g) => g.n > 0).map((g) => <span key={g.k} className={cx('h-3 rounded-full', g.cls)} style={{ width: `${(g.n / total) * 100}%` }} />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
            {segs.map((g) => <span key={g.k}><b className={g.text}>{g.n}</b> <span className="text-ink-3">{g.k.toLowerCase()}</span></span>)}
          </div>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-line pt-4 md:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[14px] text-ink-3">{k}</dt>
            <dd className="text-[16px]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[16px]"><span className="text-ink-3">Recommended next step: </span>{next}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={onSeeWho} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          See who completed <ArrowRight size={18} />
        </button>
        <button onClick={onOpenRequest} className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[16px] hover:border-ink/30">Open training request</button>
      </div>
    </section>
  );
}

export function Intelligence() {
  const s = useDemo();
  const nav = useNavigate();
  const go = useSwitchRole();
  const initial: View = s.role === 'supervisor' ? 'Supervisor' : 'Division Head';
  const [view, setView] = useState<View>(initial);
  const [dept, setDept] = useState('All departments');
  const [desig, setDesig] = useState('All designations');
  const [status, setStatus] = useState('All statuses');
  const [mand, setMand] = useState('All mandatory');
  const [comp, setComp] = useState('All competencies');
  const [more, setMore] = useState(false);
  const [riskOnly, setRiskOnly] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [why, setWhy] = useState(false);
  const [decide, setDecide] = useState<'approve' | 'reject' | null>(null);

  const lastStep = journeyIndex(s) === JOURNEY.length - 1;
  const reset = () => { setDept('All departments'); setDesig('All designations'); setStatus('All statuses'); setMand('All mandatory'); setComp('All competencies'); };

  /* ---------- population for the view and filters ---------- */
  const base: Person[] = view === 'Supervisor' ? directReports(SUPERVISOR_NAME) : inDivision(CB);
  const depts = [...new Set(base.map((p) => p.department))].sort();
  const desigs = [...new Set(base.map((p) => p.designation))].sort();
  const allRows = personRows(s, base.filter((p) => (dept === 'All departments' || p.department === dept) && (desig === 'All designations' || p.designation === desig)));
  const rows = allRows.filter((r) =>
    (status === 'All statuses' || (status === 'Completed' ? r.completed : status === 'In progress' ? r.inProgress : status === 'Failed' ? r.failed : r.needs))
    && (mand === 'All mandatory' || (r.course?.overdue ? 'Overdue' : r.course?.status ?? 'Not enrolled') === mand)
    && (comp === 'All competencies' || (comp === 'Credit Analysis below target' ? r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation) : r.p.creditLevel >= CREDIT_TARGET)));
  const people = rows.map((r) => r.p);
  const track = useMemo(() => tracking(s, rows), [s, rows]);

  /* ---------- shared figures ---------- */
  const enrolled = rows.filter((r) => r.course);
  const mandDone = enrolled.filter((r) => r.course?.status === 'Completed');
  const compliance = enrolled.length ? Math.round((mandDone.length / enrolled.length) * 100) : null;
  const overdue = rows.filter((r) => r.course?.overdue);
  const below = rows.filter((r) => r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation));
  const atRisk = track.filter((t) => t.risk === 'High risk' || t.risk === 'At risk');
  const ids = new Set(people.map((p) => p.id));
  const withdrawals = [s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => ids.has(w.empId) && w.status !== 'none');
  const pendingWd = withdrawals.filter((w) => w.status === 'requested');
  const held = s.attendanceSubmitted;
  const outcome = outcomeOf(allRows);

  const open = (d: Detail) => setDetail(d);
  const peopleOf = (rs: { p: Person }[]) => rs.map((r) => r.p);
  const toSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  /* ---------- metrics per view ---------- */
  type Metric = { n: string; l: string; tone?: 'warn' | 'bad' | 'ok'; d: Detail };
  const M: Record<View, Metric[]> = {
    'Division Head': held ? [
      { n: String(outcome.passed.length), l: 'Completed the training', tone: 'ok', d: { title: 'Completed the training', what: `${outcome.passed.length} of ${outcome.participants.length} participants attended and passed ${TRAINING.title}.`, why: 'Attendance submitted and the post-training assessment passed.', data: 'Attendance and released assessment results', status: s.pta.released ? 'Results released' : 'Results not released yet', next: 'Confirm the new competency level with their supervisors.', people: peopleOf(outcome.passed), report: '/reports' } },
      { n: outcome.passRate === null ? '—' : `${outcome.passRate}%`, l: 'Assessment pass rate', tone: outcome.passRate !== null && outcome.passRate < 80 ? 'warn' : 'ok', d: { title: 'Assessment pass rate', what: outcome.passRate === null ? 'Results not released yet.' : `${outcome.passRate}% passed${outcome.avgScore !== null ? `, average score ${outcome.avgScore}%` : ''}.`, why: `${outcome.failed.length} failed.`, data: 'Released assessment results', status: s.pta.released ? 'Released' : 'Not released', next: 'Assign re-attempts to those who failed.', people: peopleOf(outcome.failed), report: '/assessment/results' } },
      { n: String(outcome.failed.length), l: 'Failed · re-attempt', tone: outcome.failed.length ? 'bad' : 'ok', d: { title: 'Failed the assessment', what: `${outcome.failed.length} participants failed the post-training assessment.`, why: 'Score below the pass mark.', data: 'Released assessment results', status: '—', next: 'Assign a re-attempt or remedial session.', people: peopleOf(outcome.failed), report: '/assessment/results' } },
      { n: String(outcome.absent.length), l: 'Absent · follow-up', tone: outcome.absent.length ? 'warn' : 'ok', d: { title: 'Absent from the training', what: `${outcome.absent.length} participants were absent.`, why: 'Marked absent in the submitted attendance.', data: 'Attendance', status: '—', next: 'Create a follow-up task or add them to the next batch.', people: peopleOf(outcome.absent) } },
      { n: String(outcome.followUp.length), l: 'Still needs training', tone: outcome.followUp.length ? 'warn' : 'ok', d: { title: 'Still needs training', what: `${outcome.followUp.length} people still need this training.`, why: `${outcome.failed.length} failed, ${outcome.absent.length} absent, ${outcome.withdrawn.length} withdrew and ${outcome.notTrained.length} officers below target were not trained.`, data: 'Attendance, results and competency matrix', status: '—', next: 'Plan the next batch.', people: peopleOf(outcome.followUp), report: '/division' } },
      { n: compliance === null ? '—' : `${compliance}%`, l: 'Mandatory compliance', tone: compliance !== null && compliance < 90 ? 'warn' : 'ok', d: { title: 'Mandatory compliance', what: `${mandDone.length} of ${enrolled.length} completed.`, why: `${overdue.length} overdue.`, data: 'Course enrolments', status: '—', next: 'Ask supervisors to follow up.', people: peopleOf(enrolled.filter((r) => r.course?.status !== 'Completed')) } },
    ] : [
      { n: String(below.length), l: 'Below target', tone: 'warn', d: { title: 'Employees below target', what: `${below.length} of ${rows.filter((r) => TARGET_ROLES.includes(r.p.designation)).length} officers are below the Credit Analysis target.`, why: 'Current level 2–3 against target 4.', data: 'Competency matrix', status: s.requestSubmitted ? `Request ${TRAINING.requestId} raised` : 'No request yet', next: 'Raise a training request.', people: peopleOf(below), report: '/division' } },
      { n: String(COMPETENCIES.filter((c) => c.training && c.below / c.total >= 0.2).length), l: 'Active training needs', d: { title: 'Active training needs', what: 'Competencies with a gap that needs training.', why: COMPETENCIES.filter((c) => c.training && c.below / c.total >= 0.2).map((c) => c.name).join(', '), data: 'Competency setup and matrix', status: '—', next: 'Open training needs.', people: [], report: '/division' } },
      { n: String(outcome.participants.length), l: 'In this training', d: { title: `Participants in ${TRAINING.title}`, what: `${outcome.participants.length} people nominated or selected.`, why: 'From the nomination and scheduling steps.', data: 'Participant list', status: s.scheduled ? `Scheduled ${TRAINING.dates}` : 'Not scheduled yet', next: 'The outcome appears here after the training.', people: peopleOf(outcome.participants) } },
      { n: String(SURVEY.responses), l: 'Survey signals', d: { title: 'Survey and nomination signals', what: `${SURVEY.responses} responses; ${SURVEY.high} high priority.`, why: `${SURVEY.top} is the top request.`, data: 'Programme-wise TNA survey', status: s.tna.survey ? 'Used as evidence' : 'Not used yet', next: 'Use it as evidence for the request.', people: [], report: '/division' } },
      { n: compliance === null ? '—' : `${compliance}%`, l: 'Mandatory compliance', tone: compliance !== null && compliance < 90 ? 'warn' : 'ok', d: { title: 'Mandatory compliance', what: `${mandDone.length} of ${enrolled.length} completed.`, why: `${overdue.length} overdue.`, data: 'Course enrolments', status: '—', next: 'Ask supervisors to follow up.', people: peopleOf(enrolled.filter((r) => r.course?.status !== 'Completed')) } },
      { n: String(requestLog(s).filter((r) => r.status === 'Ongoing').length), l: 'Upcoming training', d: { title: 'Upcoming division training', what: requestLog(s).filter((r) => r.status === 'Ongoing').map((r) => r.title).join(', ') || 'None', why: 'From your training requests.', data: 'Training requests', status: '—', next: 'Open a request for details.', people: [], report: '/overview' } },
    ],
    Supervisor: [
      { n: String(rows.length), l: 'Direct reports', d: { title: 'Direct reports', what: `${rows.length} people report to ${SUPERVISOR_NAME}.`, why: 'From HRIS.', data: 'HRIS reporting lines', status: '—', next: 'Open the team table below.', people } },
      { n: String(atRisk.length), l: 'Need attention', tone: atRisk.length ? 'warn' : 'ok', d: { title: 'Employees needing attention', what: `${atRisk.length} team members are at risk.`, why: 'Low progress, overdue courses, failed assessment or absence.', data: 'Course progress, attendance and results', status: `${track.filter((t) => t.risk === 'High risk').length} high risk`, next: 'Send reminders or contact them.', people: atRisk.map((t) => t.p) } },
      { n: String(overdue.length), l: 'Overdue mandatory', tone: overdue.length ? 'bad' : 'ok', d: { title: 'Overdue mandatory learning', what: `${overdue.length} overdue.`, why: 'Past the due date without completion.', data: 'Course enrolments', status: '—', next: 'Send reminders.', people: peopleOf(overdue) } },
      { n: String(rows.filter((r) => r.inProgress).length), l: 'In progress', d: { title: 'In progress', what: `${rows.filter((r) => r.inProgress).length} are on ${TRAINING.title}.`, why: 'Selected and invited.', data: 'Participant list', status: '—', next: 'Track attendance and results.', people: peopleOf(rows.filter((r) => r.inProgress)) } },
      { n: String(pendingWd.length), l: 'Pending decisions', tone: pendingWd.length ? 'bad' : 'ok', d: { title: 'Pending withdrawal decisions', what: `${pendingWd.length} withdrawal request${pendingWd.length === 1 ? '' : 's'} waiting for you.`, why: 'Employees asked to withdraw from the training.', data: 'Withdrawal requests', status: '—', next: 'Decide below or on Withdrawal Requests.', people: pendingWd.map((w) => DIRECTORY.find((p) => p.id === w.empId)!).filter(Boolean) } },
      { n: String(s.attendanceSubmitted && !s.pta.released ? rows.filter((r) => r.story === 'Attended').length : 0), l: 'Upcoming assessments', d: { title: 'Upcoming assessments', what: 'Post-training assessment after the training days.', why: 'Opens once attendance is submitted.', data: 'Assessment schedule', status: s.pta.released ? 'Released' : s.attendanceSubmitted ? 'Open' : 'Not open yet', next: 'Remind attendees to submit.', people: peopleOf(rows.filter((r) => r.story === 'Attended')) } },
    ],
  };

  /* ---------- live tracking actions ---------- */
  const actor = view === 'Supervisor' ? 'supervisor' : 'division_head';
  const act = (t: Track) => {
    if (t.action === 'Send reminder' || t.action === 'Manager intervention') {
      if (t.enrollmentId) s.sendReminders([t.enrollmentId]);
      else { s.logEvent(actor, 'Reminder sent', `${t.p.name} · ${t.item} (simulated)`); useDemo.setState({ toast: `Reminder sent to ${t.p.name} (simulated)` }); }
    } else if (t.action === 'Review assessment') nav('/assessment/results');
    else if (t.action === 'Create follow-up task') { s.logEvent(actor, 'Follow-up task created', `${t.p.name} · ${t.why}`); useDemo.setState({ toast: `Follow-up task created for ${t.p.name}` }); }
    else if (['e1', 'e2', 'e4'].includes(t.p.id)) go('employee', '/employee/record', t.p.id);
    else nav('/learning/course');
  };
  const shownTrack = (riskOnly ? atRisk : track).slice(0, 8);

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
          <p className="mt-1 text-[16px] text-ink-2">See who completed the training, who still needs it, and plan the next action.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SourceTag kind="fictional" />
            <FrRef>{view === 'Supervisor' ? 'FR 8–12' : 'FR 13–15, 185–188'}</FrRef>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastStep && <button data-testid="exec-reviewed" onClick={() => s.viewExec()} className="min-h-11 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Mark insight as reviewed</button>}
          <span className="text-[15px] text-ink-3">View as</span>
          <div className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-line" role="tablist" aria-label="View as">
            {(['Division Head', 'Supervisor'] as const).map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); setDept('All departments'); setDesig('All designations'); }} className={cx('rounded-md px-4 py-2 text-[15px]', view === v ? 'bg-ink text-white' : 'text-ink-2 hover:text-ink')}>{v}</button>)}
          </div>
        </div>
      </header>

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
        <span className="px-2 text-[15px] text-ink-2">{view === 'Supervisor' ? `Team · ${SUPERVISOR_NAME}` : CB}</span>
        <select aria-label="Department" className={sel} value={dept} onChange={(e) => setDept(e.target.value)}>{['All departments', ...depts].map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Designation" className={sel} value={desig} onChange={(e) => setDesig(e.target.value)}>{['All designations', ...desigs].map((x) => <option key={x}>{x}</option>)}</select>
        <select aria-label="Status" className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>{['All statuses', 'Completed', 'In progress', 'Failed', 'Needs training'].map((x) => <option key={x}>{x}</option>)}</select>
        <button onClick={() => setMore((v) => !v)} className="px-2 text-[15px] text-brand hover:underline">{more ? 'Fewer filters' : 'More filters'}</button>
        <button onClick={reset} className="ml-auto px-2 text-[15px] text-ink-2 hover:text-ink">Reset filters</button>
        {more && (
          <div className="flex w-full flex-wrap gap-2 border-t border-line pt-2">
            <select aria-label="Mandatory learning status" className={sel} value={mand} onChange={(e) => setMand(e.target.value)}>{['All mandatory', 'Completed', 'In progress', 'Overdue', 'Not started'].map((x) => <option key={x}>{x}</option>)}</select>
            <select aria-label="Competency" className={sel} value={comp} onChange={(e) => setComp(e.target.value)}>{['All competencies', 'Credit Analysis below target', 'Credit Analysis at target'].map((x) => <option key={x}>{x}</option>)}</select>
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

      {/* division head: training outcome first, then the planning signals */}
      {view === 'Division Head' && (
        <div className="mt-6 space-y-6">
          {held
            ? <OutcomeCard s={s} o={outcome} onSeeWho={() => toSection('sec-results')} onOpenRequest={() => go('division_head', `/division/requests/${TRAINING.requestId}`)} />
            : (
              <section className="rounded-2xl border border-dashed border-line bg-white px-7 py-5">
                <div className="text-[15px] text-ink-3">{TRAINING.requestId} · {CB} training outcome</div>
                <h2 className="mt-1 text-[22px] font-semibold">{TRAINING.title}</h2>
                <p className="mt-1 text-[16px] text-ink-2">The outcome appears here after the training on {TRAINING.dates}: who completed, who failed or was absent, and who still needs training.</p>
              </section>
            )}
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

      {/* division head: who completed and who still needs training */}
      {view === 'Division Head' && held && (
        <>
          <Section id="sec-results" title="Who completed the training" className="mt-6" right={<span className="text-[15px] text-ink-3">{outcome.participants.length} participants · {TRAINING.dates}</span>}>
            <PeopleTable rows={outcome.participants} label="participants" maxHeight={420} />
          </Section>
          <Section title="Who still needs training" className="mt-6" right={<span className="text-[15px] text-ink-3">For the next batch or a re-attempt</span>}>
            <PeopleTable rows={outcome.followUp} needs label="people" maxHeight={420} emptyText="Everyone in scope has completed the training." />
          </Section>
        </>
      )}

      {/* live tracking */}
      <Section id="sec-live" title="Live learning tracking" className="mt-6" right={<label className="flex items-center gap-2 text-[15px] text-ink-2"><input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} className="h-4 w-4 accent-brand" />At risk only ({atRisk.length})</label>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[15px]">
            <thead className="text-[14px] text-ink-3"><tr>{['Employee', 'Course or training', 'Progress', 'Last activity', 'Due', 'Assessment', 'Risk', ''].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {shownTrack.map((t) => (
                <tr key={t.p.id}>
                  <td className="py-2.5 pr-3"><span className="block">{t.p.name}</span><span className="text-[14px] text-ink-3">{t.p.designation} · {t.p.department}</span></td>
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
              <button onClick={() => { setDetail(null); toSection(held && view === 'Division Head' ? 'sec-results' : 'sec-live'); }} className={btn2}>Open employees</button>
              <button onClick={() => { setDetail(null); nav(view === 'Division Head' ? '/division' : '/supervisor/team'); }} className={btn2}>View evidence</button>
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
