import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Hourglass } from 'lucide-react';
import { TRAINING } from '../../data';
import { DIVISIONS, findById } from '../../org';
import { courseOf, useDemo, type DemoState, type Withdrawal } from '../../store';
import { NotYet, PersonBanner, ReasonModal } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { personaFor } from '../../components/perspective';
import { Alert, Badge, Btn, cx, Field, inputCls, Modal, Progress } from '../../components/ui';
import { inPeriod, recordKpis, recordRowsFor } from './Record';
import { IDP_REQUESTS } from '../../tnaData';
import { useSection } from '../../components/useSection';

/* ================================================================== */
/* Small month grid (FR 2, FR 18), shared with the trainer page        */
/* ================================================================== */
export interface CalEvent { day: number; label: string; tone: 'brand' | 'ok' | 'info' | 'warn' }
const DOT: Record<CalEvent['tone'], string> = { brand: 'bg-brand', ok: 'bg-ok', info: 'bg-info', warn: 'bg-amber-500' };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** `month` is 0-based (10 = November). */
export function MonthGrid({ year, month, events }: { year: number; month: number; events: CalEvent[] }) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: first }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const byDay = (d: number) => events.filter((e) => e.day === d);
  return (
    <div>
      <div className="mb-3 text-[16px] font-semibold">{MONTH_NAMES[month]} {year}</div>
      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`${MONTH_NAMES[month]} ${year}`}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d} className="pb-1 text-[14px] font-semibold text-ink-3">{d}</div>)}
        {cells.map((d, i) => {
          const ev = d ? byDay(d) : [];
          return (
            <div key={i} role="gridcell" title={ev.map((e) => e.label).join(' · ') || undefined} className={cx('flex h-10 flex-col items-center justify-center rounded-lg text-[14px] tabular-nums', !d && 'invisible', ev.length > 0 ? 'bg-[#faf8f5] font-bold text-ink' : 'text-ink-2')}>
              {d}
              {ev.length > 0 && <span className="mt-0.5 flex gap-0.5">{ev.slice(0, 3).map((e, j) => <span key={j} className={cx('h-1.5 w-1.5 rounded-full', DOT[e.tone])} />)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Helpers                                                              */
/* ================================================================== */
const withdrawalOf = (s: DemoState, id: string): Withdrawal | null => {
  if (id === 'e2') return s.withdrawal.status !== 'none' ? s.withdrawal : null;
  return s.otherWithdrawals[id] ?? null;
};
const replacedBy = (s: DemoState, id: string): Withdrawal | null =>
  [s.withdrawal, ...Object.values(s.otherWithdrawals)].find((w) => w.replacementId === id && w.status === 'approved') ?? null;

function Tracker({ at }: { at: 1 | 2 | 3 }) {
  const steps = ['You', 'Supervisor', 'HR Admin'];
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Withdrawal progress">
      {steps.map((x, i) => (
        <li key={x} className="flex items-center gap-2">
          <span className={cx('grid h-7 w-7 place-items-center rounded-full text-[14px] font-bold', i < at ? 'bg-ok text-white' : i === at ? 'anim-pulse bg-amber-500 text-white' : 'bg-canvas text-ink-3')}>{i < at ? <Check size={14} /> : i + 1}</span>
          <span className={cx('text-[16px] font-semibold', i === at ? 'text-ink' : 'text-ink-2')}>{x}{i === at ? ' · deciding now' : ''}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

/* ================================================================== */
/* The invitation as the hero card (FR 119)                            */
/* ================================================================== */
function Invitation({ empId, onWithdraw }: { empId: string; onWithdraw: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const p = findById(empId);
  const name = p?.name ?? personaFor('employee', empId).name;
  const part = s.participation[empId];
  const wd = withdrawalOf(s, empId);
  const rep = replacedBy(s, empId);
  const lc = DIVISIONS.find((d) => d.name === p?.division)?.learningChampion ?? 'Farzana Haque';
  const calLog = s.audit.find((a) => (a.action === 'Added to calendar' || a.action === 'Removed from calendar') && a.detail.startsWith(name));
  const inCal = calLog?.action === 'Added to calendar';
  const decided = s.withdrawal.status === 'approved' || s.withdrawal.status === 'rejected';
  const canSelf = part === 'Accepted' && s.invitesSent && s.trainerResponse !== 'pending' && decided && !s.attendanceSubmitted && !s.selfMarked[empId];
  const canWithdraw = (part === 'Invited' || part === 'Accepted') && !s.attendanceSubmitted && !s.selfMarked[empId] && !wd;
  const why = rep
    ? `Added as a replacement for ${findById(rep.empId)?.name ?? 'a colleague'}: proposed by ${findById(rep.empId)?.supervisor ?? 'the supervisor'}, approved by HR.`
    : s.addedParticipants.includes(empId) ? 'Added to the participant list by HR Admin.'
    : `Nominated by ${lc}, Learning Champion, to close the Credit Analysis gap for your role.`;

  const toggleCal = () => {
    s.logEvent('employee', inCal ? 'Removed from calendar' : 'Added to calendar', `${name} · ${TRAINING.title} · 18–19 Nov · Outlook (simulated)`);
    useDemo.setState({ toast: inCal ? 'Removed from your Outlook calendar (simulated)' : 'Added to your Outlook calendar (simulated)' });
  };

  const facts: [string, string][] = [
    ['Dates', TRAINING.dates],
    ['Time', TRAINING.time],
    ['Venue', s.sched.venue],
    ['Trainers', s.sched.trainers.map((t) => t.name).join(' · ')],
  ];

  let footer: React.ReactNode = null;
  let state: React.ReactNode = null;
  if (part === 'Invited') {
    footer = <>{canWithdraw && <Btn v="secondary" onClick={onWithdraw}>Withdrawn Request</Btn>}<span className="flex-1" /><Btn size="lg" onClick={() => s.accept(empId)}>Accept</Btn></>;
  } else if (part === 'Accepted') {
    state = (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[16px]">
        <span className="flex items-center gap-2 font-semibold text-ok"><CheckCircle2 size={18} />You’re attending</span>
        {inCal && <span className="text-ink-2">In your Outlook calendar <SourceTag kind="simulated" /></span>}
        {s.selfMarked[empId] && <span className="font-semibold text-ok">Attendance marked · Day 1, 09:24</span>}
        {!s.materialLinked && <span className="text-ink-3">Material appears here when HR links it.</span>}
        {wd?.status === 'rejected' && <span className="text-ink-2">Your withdrawal was not approved{wd.supReason ? `: ${wd.supReason}` : ''}.</span>}
      </div>
    );
    footer = (
      <>
        {canWithdraw && <Btn v="secondary" onClick={onWithdraw}>Withdrawn Request</Btn>}
        <span className="flex-1" />
        <Btn v="secondary" onClick={toggleCal}>{inCal ? 'Remove from calendar' : 'Add to calendar'}</Btn>
        {s.materialLinked && <Btn v="secondary" onClick={() => nav('/knowledge')}>View material</Btn>}
        {canSelf && <Btn onClick={() => s.selfMark(empId)}>Mark my attendance</Btn>}
      </>
    );
  } else if (part === 'Withdrawal Requested' || part === 'Replacement Proposed' || part === 'Approved') {
    state = (
      <div className="space-y-3">
        <Tracker at={part === 'Withdrawal Requested' ? 1 : 2} />
        <p className="flex items-start gap-2 text-[16px] text-ink-2"><Hourglass size={17} className="mt-1 shrink-0" />Your reason: “{wd?.reason}”. {part === 'Withdrawal Requested' ? `${p?.supervisor ?? 'Your supervisor'} decides next.` : 'Your supervisor approved; HR Admin gives the final decision.'}</p>
      </div>
    );
  } else if (part === 'Withdrawn') {
    state = <Alert kind="ok" title="Withdrawal approved">You are no longer a participant.{wd?.replacementId ? ` ${findById(wd.replacementId)?.name} replaces you.` : ''} Your supervisor was copied on the exclusion email.</Alert>;
    footer = <><span className="flex-1" /><Btn v="secondary" onClick={() => nav('/employee/record')}>Open my record</Btn></>;
  } else if (part === 'Attended') {
    state = <p className="flex items-center gap-2 text-[16px] font-semibold text-ok"><CheckCircle2 size={18} />You attended · 16 learning hours added to your record</p>;
    footer = <><Btn v="secondary" onClick={() => nav('/employee/record')}>Open my record</Btn><span className="flex-1" />{s.feedbackSubmitted ? <span className="text-[16px] font-semibold text-ok">Feedback sent · thank you</span> : <Btn size="lg" onClick={() => nav('/employee/feedback')}>Give feedback <ArrowRight size={16} /></Btn>}</>;
  } else if (part === 'Absent') {
    state = <Alert kind="warn" title="Marked absent">HR recorded you as absent on both days. Speak to your supervisor about the next run.</Alert>;
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold text-ink-3">Training invitation · {TRAINING.trainingId}</div>
            <h2 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight">{TRAINING.title}</h2>
          </div>
          <Badge>{part}</Badge>
        </div>
        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 2xl:grid-cols-4">
          {facts.map(([k, v]) => <div key={k}><dt className="text-[15px] text-ink-3">{k}</dt><dd className="text-[17px] font-semibold">{v}</dd></div>)}
        </dl>
        <dl className="mt-5 grid gap-x-8 gap-y-3 border-t border-line pt-5 md:grid-cols-3">
          <div><dt className="text-[15px] text-ink-3">Why you were invited</dt><dd className="text-[16px]">{why}</dd></div>
          <div><dt className="text-[15px] text-ink-3">Assigned by</dt><dd className="text-[16px]">Nusrat Jahan, HR Admin · Learning &amp; Development</dd></div>
          <div><dt className="text-[15px] text-ink-3">Attendance</dt><dd className="text-[16px]">Required on both days. Mark yourself present on the day.</dd></div>
        </dl>
        {state && <div className="mt-5">{state}</div>}
      </div>
      {footer && <div className="flex flex-wrap items-center gap-3 border-t border-line bg-[#faf8f5] px-7 py-4">{footer}</div>}
    </article>
  );
}

/* ================================================================== */
/* Page: My Learning and Development (FR 1–6, 190–209, 210–226, 241–243) */
/* ================================================================== */
type Tone = 'ok' | 'warn' | 'info' | 'neutral' | 'brand';
const card = 'rounded-2xl bg-white ring-1 ring-line';
const btn2 = 'min-h-10 shrink-0 rounded-lg border border-line bg-white px-4 text-[15px] hover:border-ink/30 disabled:opacity-50';

const tagOf = (r: { learning: string; detail: string }) => (/mandatory|aml|security|conduct/i.test(`${r.learning} ${r.detail}`) ? 'Mandatory' : /credit|risk|financ/i.test(r.learning) ? 'Credit' : 'Customer & leadership');

export function MyLearning() {
  useSection();
  const s = useDemo();
  const nav = useNavigate();
  const empId = s.employeeId;
  const p = findById(empId);
  const persona = personaFor('employee', empId);
  const name = p?.name ?? persona.name;
  const part = s.participation[empId];
  const [wd, setWd] = useState(false);
  const [rec, setRec] = useState(false);
  const [form, setForm] = useState({ title: 'CFA Level I', institute: 'CFA Institute', date: '2026-08', duration: '300 hours', description: 'Self-study with exam passed in August 2026.', file: '' });
  const [calF, setCalF] = useState<'All' | 'Training' | 'Courses' | 'Exams' | 'Feedback'>('All');
  const [fYear, setFYear] = useState('All years');
  const [fCat, setFCat] = useState('All categories');
  const [fTag, setFTag] = useState('All tags');
  const [fStatus, setFStatus] = useState('All statuses');
  const [fMed, setFMed] = useState('All media');
  const fileRef = useRef<HTMLInputElement>(null);

  const course = courseOf(s, empId);
  const allRows = recordRowsFor(s, empId);
  const k = recordKpis(allRows.filter((r) => inPeriod(r.iso, 'This year')));
  const onTraining = !!part && part !== 'Withdrawn';
  const level = p?.creditLevel ?? 2;
  const isE1 = empId === 'e1';
  const myIdp = IDP_REQUESTS.filter((r) => r.personId === empId);
  const myRecordReq = isE1 ? (s.recordRequest === 'none' ? null : { state: s.recordRequest, title: s.recordDetails.title }) : null;
  const bannerReason = empId === 'e2' ? 'Known clash: client meeting on 18 Nov, flagged at nomination' : replacedBy(s, empId) ? `Added as a replacement for ${findById(replacedBy(s, empId)!.empId)?.name}` : undefined;
  const mods = s.courseModules.length || 4;
  const tpct = Math.round((s.tcourse.done / mods) * 100);

  const agenda: { key: string; day: number; date: string; title: string; detail: string; status: string; tone: Tone; kind: 'Training' | 'Courses' | 'Exams' | 'Feedback'; go: () => void }[] = ([
    ...(onTraining ? [18, 19].map((d) => ({ key: `t${d}`, day: d, date: `${d} Nov`, title: `${TRAINING.title} · Day ${d - 17}`, detail: `09:30 · ${s.sched.venue}`, status: part === 'Invited' ? 'Invitation' : part === 'Attended' ? 'Attended' : part === 'Accepted' ? 'Accepted' : part, tone: (part === 'Invited' ? 'brand' : 'ok') as Tone, kind: 'Training' as const, go: () => { document.getElementById('sec-training')?.scrollIntoView({ behavior: 'smooth' }); } })) : []),
    ...(!course.completed ? [{ key: 'c', day: 20, date: '20 Nov', title: 'Information Security Awareness 2026', detail: `Mandatory · ${course.progress}% complete`, status: 'Course due', tone: 'warn' as Tone, kind: 'Courses' as const, go: () => { nav('/learning/course'); } }] : []),
    ...(isE1 && s.attendanceSubmitted ? [{ key: 'a', day: 20, date: '20 Nov', title: 'Post-training assessment', detail: TRAINING.title, status: s.ptaSubmitted ? 'Submitted' : 'Due', tone: (s.ptaSubmitted ? 'ok' : 'warn') as Tone, kind: 'Exams' as const, go: () => { nav('/learning/training/assessment'); } }] : []),
    ...(part === 'Attended' ? [{ key: 'f', day: 22, date: '22 Nov', title: `Feedback · ${TRAINING.title}`, detail: 'Content, trainer, relevance, logistics', status: s.feedbackSubmitted ? 'Sent' : 'Due', tone: (s.feedbackSubmitted ? 'ok' : 'warn') as Tone, kind: 'Feedback' as const, go: () => { nav('/employee/feedback'); } }] : []),
    { key: 'e', day: 30, date: '30 Nov', title: 'AML Annual Certification Assessment', detail: 'Online', status: 'Upcoming exam', tone: 'info' as Tone, kind: 'Exams' as const, go: () => { nav('/assessment'); } },
  ] as { key: string; day: number; date: string; title: string; detail: string; status: string; tone: Tone; kind: 'Training' | 'Courses' | 'Exams' | 'Feedback'; go: () => void }[]).sort((a, b) => a.day - b.day);

  const years = ['All years', ...[...new Set(allRows.map((r) => r.iso.slice(0, 4)))].sort().reverse()];
  const rows = allRows.filter((r) => (fYear === 'All years' || r.iso.startsWith(fYear)) && (fCat === 'All categories' || r.kind === fCat) && (fTag === 'All tags' || tagOf(r) === fTag)
    && (fStatus === 'All statuses' || (fStatus === 'Completed' ? r.result.startsWith('Completed') : !r.result.startsWith('Completed'))) && (fMed === 'All media' || r.type === fMed));
  const sel = 'min-h-10 rounded-lg border border-line bg-white px-3 text-[15px]';

  const submitRecord = () => {
    const [y, m] = form.date.split('-');
    const when = y && m ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}` : form.date;
    const det = { title: form.title.trim(), institute: form.institute.trim(), date: when, file: form.file || 'certificate.pdf' };
    if (isE1) s.requestRecord(det);
    else { s.logEvent('employee', 'Training record submitted', `${name} · ${det.title} (${det.institute}) · ${det.date} · ${form.duration} · awaiting HR validation`); useDemo.setState({ toast: 'Sent to HR for validation' }); }
    setRec(false);
  };

  const steps = ['Credit Fundamentals', 'Financial Analysis', TRAINING.title, 'Assessment', 'Competency Review'];
  const doneSteps = Math.min(steps.length, s.journeyDone + (s.pta.released ? 1 : 0));

  return (
    <div className="mx-auto max-w-[1320px]">
      <PersonBanner empId={empId} reason={bannerReason} />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[14px] text-ink-3">My Learning and Development</div>
          <h1 className="text-[36px] font-semibold leading-tight tracking-tight">{name}</h1>
          <p className="text-[16px] text-ink-2">{p?.designation ?? persona.title} · {p?.division ?? 'Corporate Banking'} · {p?.eid}</p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-2 text-[15px]">
          <div><dt className="text-ink-3">Learning this year</dt><dd className="text-[18px] font-medium">{k.hours} hours</dd></div>
          <div><dt className="text-ink-3">Mandatory compliance</dt><dd className={cx('text-[18px] font-medium', !course.completed && 'text-amber-700')}>{course.completed ? 100 : course.progress}%</dd></div>
          <div><dt className="text-ink-3">Current focus</dt><dd className="text-[18px] font-medium">Credit Analysis · level {level} → 4</dd></div>
        </dl>
      </header>

      {/* 1 · the training invitation first */}
      <section id="sec-training" className="scroll-mt-4">
        {part ? <Invitation empId={empId} onWithdraw={() => setWd(true)} /> : !s.invitesSent ? (
          <NotYet title="No training invitation yet" after="HR sends the training invitations" />
        ) : <div className={cx(card, 'px-7 py-6 text-[16px] text-ink-2')}>You are not on a scheduled training right now.</div>}
      </section>

      {/* 2 · the training's course and assessment, once accepted */}
      {isE1 && (part === 'Accepted' || part === 'Attended') && (
        <section className={cx(card, 'mt-8 flex flex-wrap items-center gap-6 px-7 py-6')}>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-ink-3">Course · {mods} modules · AI assistant</div>
            <div className="text-[20px] font-semibold">{TRAINING.title}</div>
            <div className="mt-2 flex max-w-md items-center gap-3"><span className="flex-1"><Progress value={tpct} tone={tpct === 100 ? 'ok' : 'brand'} /></span><span className="text-[14px] text-ink-2">{s.tcourse.started ? `${tpct}%` : 'Not started'}</span></div>
          </div>
          {s.attendanceSubmitted && !s.ptaSubmitted
            ? <button onClick={() => nav('/learning/training/assessment')} className="min-h-11 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Take the assessment</button>
            : <button onClick={() => nav('/learning/training')} className={btn2}>{s.tcourse.started ? 'Continue course' : 'Course overview'}</button>}
        </section>
      )}

      {/* 3 · calendar and learning */}
      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section id="sec-calendar" className={cx(card, 'scroll-mt-4 px-7 py-6')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">My calendar</h2>
            <div className="flex gap-1 rounded-lg bg-canvas p-1" role="tablist" aria-label="Calendar filter">
              {(['All', 'Training', 'Courses', 'Exams', 'Feedback'] as const).map((o) => <button key={o} role="tab" aria-selected={calF === o} onClick={() => setCalF(o)} className={cx('rounded-md px-2.5 py-1 text-[14px]', calF === o ? 'bg-white shadow-sm' : 'text-ink-2')}>{o}</button>)}
            </div>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {agenda.filter((a) => calF === 'All' || a.kind === calF).map((a) => (
              <li key={a.key}>
                <button onClick={a.go} className="grid w-full grid-cols-[60px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1 py-3 text-left hover:bg-canvas/60">
                  <span className="text-[15px] font-medium tabular-nums">{a.date}</span>
                  <span className="min-w-0"><span className="block truncate text-[16px]">{a.title}</span><span className="block truncate text-[14px] text-ink-3">{a.detail}</span></span>
                  <Badge t={a.tone}>{a.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className={cx(card, 'px-7 py-6')}>
          <h2 className="text-[22px] font-semibold">My learning</h2>
          <ul className="mt-3 divide-y divide-line">
            <li className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[16px]">Information Security Awareness 2026</span><span className="block text-[14px] text-ink-3">Mandatory · last viewed: Data Protection Basics · {course.completed ? 'completed' : 'due in 8 days'}</span>
                <span className="mt-1.5 block max-w-[240px]"><Progress value={course.progress} tone={course.completed ? 'ok' : 'brand'} /></span></span>
              <button onClick={() => nav('/learning/course')} className={btn2}>{course.completed ? 'Certificate' : 'Continue'}</button>
            </li>
            <li className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[16px]">AML Annual Certification</span><span className="block text-[14px] text-ink-3">Proctored exam · opens 30 Nov</span></span>
              <button onClick={() => nav('/assessment')} className={btn2}>Open</button>
            </li>
            <li className="flex items-center gap-4 py-3">
              <span className="min-w-0 flex-1"><span className="block text-[16px]">Certificates</span><span className="block text-[14px] text-ink-3">{k.certificates + (course.completed ? 1 : 0)} issued · QR verified</span></span>
              <button onClick={() => nav('/employee/certificates')} className={btn2}>View</button>
            </li>
          </ul>
        </section>
      </div>

      {/* 4 · record */}
      <section className={cx(card, 'mt-8 px-7 py-6')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold">My training record</h2>
          <div className="flex flex-wrap items-center gap-3">
            {myRecordReq && <Badge t={myRecordReq.state === 'approved' ? 'ok' : 'warn'}>{myRecordReq.state === 'approved' ? `Added by HR: ${myRecordReq.title}` : `Waiting for HR: ${myRecordReq.title}`}</Badge>}
            {myRecordReq?.state !== 'pending' && <button onClick={() => setRec(true)} className={btn2}>Request to add a previous training record</button>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <select aria-label="Year" className={sel} value={fYear} onChange={(e) => setFYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select>
          <select aria-label="Training category" className={sel} value={fCat} onChange={(e) => setFCat(e.target.value)}>{['All categories', 'Programme', 'Course', 'Assessment'].map((y) => <option key={y}>{y}</option>)}</select>
          <select aria-label="Training tag" className={sel} value={fTag} onChange={(e) => setFTag(e.target.value)}>{['All tags', 'Mandatory', 'Credit', 'Customer & leadership'].map((y) => <option key={y}>{y}</option>)}</select>
          <select aria-label="Status" className={sel} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>{['All statuses', 'Completed', 'Other'].map((y) => <option key={y}>{y}</option>)}</select>
          <select aria-label="Learning medium" className={sel} value={fMed} onChange={(e) => setFMed(e.target.value)}>{['All media', 'Classroom', 'Webinar', 'e-Learning'].map((y) => <option key={y}>{y}</option>)}</select>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead className="text-[14px] text-ink-3"><tr>{['Training', 'Date', 'Medium', 'Attendance', 'Hours', 'Certificate'].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="py-3 pr-3"><span className="block">{r.learning}</span><span className="text-[14px] text-ink-3">{r.detail}</span></td>
                  <td className="py-3 pr-3 tabular-nums text-ink-2">{r.dateLabel}</td>
                  <td className="py-3 pr-3 text-ink-2">{r.type}</td>
                  <td className="py-3 pr-3">{r.kind === 'Programme' ? (r.result.startsWith('Completed') ? 'Attended' : r.result) : '—'}</td>
                  <td className="py-3 pr-3 tabular-nums">{r.hours || '—'}</td>
                  <td className="py-3">{r.certificate ? <Badge t="ok">Issued</Badge> : <span className="text-ink-3">—</span>}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="py-6 text-center text-ink-3">No records match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5 · development journey */}
      <section id="sec-development" className={cx(card, 'mt-8 scroll-mt-4 px-7 py-6')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold">My development journey</h2>
          <div className="flex gap-5 text-[15px]"><button onClick={() => nav('/competency')} className="text-brand hover:underline">Competencies</button><button onClick={() => nav('/journey')} className="text-brand hover:underline">Learning journey →</button></div>
        </div>
        <p className="mt-2 text-[16px]"><span className="font-medium">Credit Analysis</span> <span className="text-ink-2">· level {level} of target 4</span> <span className={level < 4 ? 'text-amber-700' : 'text-ok'}>· {level < 4 ? `gap of ${4 - level}` : 'at target'}</span></p>
        <ol className="mt-5 grid gap-3 md:grid-cols-5">
          {steps.map((x, i) => (
            <li key={x}>
              <div className={cx('h-1.5 rounded-full', i < doneSteps ? 'bg-ok' : i === doneSteps ? 'bg-brand' : 'bg-line')} />
              <div className={cx('mt-2 text-[15px] leading-snug', i > doneSteps && 'text-ink-3')}>{x}</div>
            </li>
          ))}
        </ol>
        {myIdp.length > 0 && <p className="mt-5 border-t border-line pt-4 text-[15px] text-ink-2">Development request: {myIdp[0].learning} · {s.tna.idpIds.includes(myIdp[0].id) ? 'used in a training request' : myIdp[0].status.toLowerCase()}</p>}
      </section>

      <ReasonModal
        open={wd}
        title="Withdrawn Request"
        intro={<>Tell your supervisor, <b>{p?.supervisor ?? 'your supervisor'}</b>, why you cannot attend. They approve, approve with a replacement, or reject; HR Admin gives the final decision (FR 119).</>}
        confirm="Send to supervisor"
        suggested={empId === 'e2' ? 'Client meeting scheduled during training.' : 'Branch audit visit on 18 Nov.'}
        onClose={() => setWd(false)}
        onConfirm={(reason) => { s.requestWithdrawalFor(empId, reason); setWd(false); }}
      />

      <Modal
        open={rec}
        onClose={() => setRec(false)}
        title="Request to add a previous training record"
        footer={<><Btn v="secondary" onClick={() => setRec(false)}>Cancel</Btn><Btn disabled={!form.title.trim() || !form.institute.trim()} onClick={submitRecord}>Send to HR</Btn></>}
      >
        <p className="mb-4 text-[16px] text-ink-2">HR validates it before it is added to your record (FR 6, 172).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Training title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Provider"><input className={inputCls} value={form.institute} onChange={(e) => setForm({ ...form, institute: e.target.value })} /></Field>
          <Field label="Date"><input type="month" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Duration"><input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea rows={2} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[15px] font-semibold text-ink-2">Supporting document</span>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" className="sr-only" aria-label="Choose supporting document" onChange={(e) => setForm({ ...form, file: e.target.files?.[0]?.name ?? '' })} />
            <div className="flex flex-wrap items-center gap-3"><Btn v="secondary" onClick={() => fileRef.current?.click()}>Choose file</Btn><span className="text-[15px] text-ink-2">{form.file || 'No file chosen'}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
