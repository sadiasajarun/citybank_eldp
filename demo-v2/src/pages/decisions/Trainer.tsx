/**
 * Trainer Workspace (FR 16–19, 210–220): your actions, calendar, sessions, materials and assessment review.
 * Decisions on scores and integrity stay on the existing review screens (one source of business logic).
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendedIds, ptResults, roster, useDemo, type DemoState } from '../../store';
import { ReasonModal } from '../../components/Templates';
import { Badge, cx, Drawer } from '../../components/ui';
import { useSection } from '../../components/useSection';

const ME = 'Nafis Ahmed';
type Tone = 'ok' | 'warn' | 'info' | 'neutral';

interface Session { key: string; date: string; time: string; day: number; title: string; topic: string; venue: string; people: number; duration: string; status: string; tone: Tone; live: boolean }
interface Agenda { key: string; date: string; day: number; time: string; title: string; detail: string; status: string; tone: Tone; kind: 'Sessions' | 'Assessments' | 'Material deadlines'; go: () => void }

function sessionsOf(s: DemoState): Session[] {
  const resp = s.trainerResponse;
  const st = resp === 'accepted' ? (s.attendanceSubmitted ? 'Delivered' : 'Confirmed') : resp === 'rejected' ? 'Declined' : s.invitesSent ? 'Response needed' : 'Tentative';
  const tone: Tone = resp === 'accepted' ? 'ok' : resp === 'rejected' ? 'neutral' : 'warn';
  const people = roster(s).length;
  const venue = s.sched.venue || TRAINING.venue;
  const mine = s.sched.trainers.filter((t) => t.name === ME);
  const topic = mine.map((t) => t.topic).join(' · ') || 'Credit risk frameworks';
  const dur = mine[0]?.duration ?? '6 h';
  return [
    { key: 's06', date: '06 Nov', time: '10:00–13:00', day: 6, title: 'Credit Appraisal Basics', topic: 'Appraisal walkthrough', venue: 'Online · Teams', people: 26, duration: '3 h', status: 'Delivered', tone: 'ok', live: false },
    ...(s.scheduled ? [
      { key: 'd1', date: '18 Nov', time: '09:30–12:30', day: 18, title: TRAINING.title, topic, venue, people, duration: dur, status: st, tone, live: true },
      { key: 'd2', date: '19 Nov', time: '09:30–11:30', day: 19, title: TRAINING.title, topic: 'Portfolio case studies', venue, people, duration: '2 h', status: st, tone, live: true },
    ] : []),
    { key: 's27', date: '27 Nov', time: '15:00–17:00', day: 27, title: 'Risk Champions Forum', topic: 'Early-warning signals', venue: 'Head Office Auditorium', people: 40, duration: '2 h', status: 'Confirmed', tone: 'ok', live: false },
  ];
}

export function TrainerSessions() {
  useSection();
  const s = useDemo();
  const nav = useNavigate();
  const [reject, setReject] = useState(false);
  const [file, setFile] = useState('');
  const [open, setOpen] = useState<Session | null>(null);
  const [filter, setFilter] = useState<'All' | Agenda['kind']>('All');
  const input = useRef<HTMLInputElement>(null);
  const resp = s.trainerResponse;
  const sessions = sessionsOf(s);
  const people = roster(s);
  const results = ptResults(s);
  const fileName = file || 'Credit_Risk_Case_Pack_v3.pdf';
  const upload = () => input.current?.click();
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const upcoming = sessions.filter((x) => x.day >= 12 && x.status !== 'Declined' && x.status !== 'Delivered');
  const ptaWaiting = s.attendanceSubmitted && !s.pta.released;
  const amlWaiting = s.aiScore.state === 'suggested';
  const matWaiting = s.materialUploaded && !s.materialLinked;

  /* ---------- your actions: only what needs attention ---------- */
  const actions: { training: string; what: string; when: string; status: string; tone: Tone; why: string; cta: string; go: () => void }[] = [];
  if (s.invitesSent && resp === 'pending') actions.push({ training: TRAINING.title, what: 'Facilitation invitation', when: 'Respond by 15 Nov', status: 'Response needed', tone: 'warn', why: 'Accept, or reject with a reason. HR is told at once.', cta: 'Respond', go: () => scroll('sec-invite') });
  if (resp === 'accepted' && !s.courseSetup) actions.push({ training: TRAINING.title, what: 'Course setup', when: 'Before 17 Nov', status: 'To do', tone: 'warn', why: 'Set the modules, the assessment and the AI assistant.', cta: 'Set up course', go: () => nav('/trainer/course-setup') });
  if (resp === 'accepted' && !s.materialUploaded) actions.push({ training: TRAINING.title, what: 'Material upload', when: 'Due 16 Nov', status: 'To do', tone: 'warn', why: `Upload ${fileName} for HR to link.`, cta: 'Upload material', go: upload });
  if (s.materialUploaded && !s.materialLinkRequested) actions.push({ training: TRAINING.title, what: 'Material link', when: 'Due 16 Nov', status: 'Not linked', tone: 'warn', why: 'Ask HR Admin to link the uploaded file to the training.', cta: 'Request HR link', go: () => s.requestMaterialLink() });
  if (ptaWaiting) actions.push({ training: TRAINING.title, what: 'Post-training assessment', when: 'Due 20 Nov', status: 'Awaiting review', tone: 'warn', why: 'Check integrity, decide the AI-suggested score, add a note, release.', cta: 'Review assessment', go: () => nav('/assessment/review') });
  if (amlWaiting) actions.push({ training: 'AML Annual Certification', what: 'Assessment review', when: 'Due 30 Nov', status: 'AI suggested', tone: 'info', why: 'AI has suggested a score. Review the evidence and decide.', cta: 'Review assessment', go: () => nav('/assessment') });

  const primary = actions[0];

  /* ---------- calendar (agenda) ---------- */
  const agenda: Agenda[] = ([
    ...sessions.filter((x) => x.status !== 'Declined').map((x): Agenda => ({ key: x.key, date: x.date, day: x.day, time: x.time, title: x.title, detail: `${x.venue} · ${x.people} participants`, status: x.status, tone: x.tone, kind: 'Sessions', go: () => setOpen(x) })),
    ...(resp === 'accepted' ? [{ key: 'm', date: '16 Nov', day: 16, time: 'Deadline', title: 'Material for HR to link', detail: TRAINING.title, status: s.materialLinked ? 'Linked' : s.materialLinkRequested ? 'With HR' : s.materialUploaded ? 'Request link' : 'To upload', tone: (s.materialLinked ? 'ok' : 'warn') as Tone, kind: 'Material deadlines' as const, go: () => scroll('sec-materials') }] : []),
    ...(s.attendanceSubmitted ? [{ key: 'p', date: '20 Nov', day: 20, time: 'Due', title: 'Post-training assessment', detail: TRAINING.title, status: s.pta.released ? 'Released' : 'Assessment review', tone: (s.pta.released ? 'ok' : 'warn') as Tone, kind: 'Assessments' as const, go: () => nav('/assessment/review') }] : []),
    { key: 'a', date: '30 Nov', day: 30, time: '10:00', title: 'AML Annual Certification Assessment', detail: 'Online', status: amlWaiting ? 'Assessment review' : 'Decided', tone: (amlWaiting ? 'info' : 'ok') as Tone, kind: 'Assessments' as const, go: () => { nav('/assessment'); } },
  ] as Agenda[]).sort((a, b) => a.day - b.day);
  const shown = agenda.filter((x) => filter === 'All' || x.kind === filter);

  /* ---------- materials ---------- */
  const mats = [
    ...(s.materialUploaded ? [{ key: 'm1', name: fileName, type: fileName.split('.').pop()?.toUpperCase() ?? 'PDF', date: '16 Nov 2026', training: TRAINING.title, linked: s.materialLinked, hr: s.materialLinked ? `Linked · ${s.materialProtection}` : s.materialLinkRequested ? 'Link requested' : 'Not requested', live: true }] : []),
    { key: 'm0', name: 'Credit_Appraisal_Basics.pptx', type: 'PPTX', date: '04 Nov 2026', training: 'Credit Appraisal Basics', linked: true, hr: 'Linked · download allowed', live: false },
  ];

  /* ---------- assessment review ---------- */
  const e1 = results.find((r) => r.id === 'e1');
  const reviews = [
    {
      exam: `${TRAINING.title} · post-training`, who: 'Ayesha Rahman', objective: s.attendanceSubmitted ? '36 / 40' : '—', descriptive: s.attendanceSubmitted ? '1 answer' : '—',
      ai: s.attendanceSubmitted ? '7 / 10' : '—', evidence: 'Names 3 of 4 risk signals; cash-flow reasoning partly complete',
      decision: s.pta.decision === 'pending' ? '—' : `${s.pta.descriptive} / 10 · ${s.pta.decision === 'accepted' ? 'AI score accepted' : 'adjusted'}`,
      status: !s.attendanceSubmitted ? 'After training day' : s.pta.released ? `Released · ${e1?.status ?? ''}` : s.pta.integrity === 'pending' ? 'Integrity check' : s.pta.decision === 'pending' ? 'Score to decide' : 'Ready to release',
      tone: (!s.attendanceSubmitted ? 'neutral' : s.pta.released ? 'ok' : 'warn') as Tone, to: '/assessment/review', disabled: !s.attendanceSubmitted,
    },
    {
      exam: 'AML Annual Certification', who: 'Ayesha Rahman', objective: '28 / 30', descriptive: '1 answer', ai: '7 / 10', evidence: 'Correct reporting threshold; escalation steps incomplete',
      decision: amlWaiting ? '—' : `${s.aiScore.score} / 10 · ${s.aiScore.state === 'accepted' ? 'AI score accepted' : 'adjusted'}`,
      status: amlWaiting ? 'Score to decide' : 'Decided', tone: (amlWaiting ? 'info' : 'ok') as Tone, to: '/assessment', disabled: false,
    },
  ];

  const strip: [string, string, boolean][] = [
    [String(upcoming.filter((x) => x.day <= 19).length), 'Sessions this week', false],
    [upcoming[0]?.date ?? '—', upcoming[0] ? 'Next session' : 'No upcoming session', false],
    [String(resp === 'rejected' || !s.scheduled ? 0 : people.length), 'Participants assigned', false],
    [String((ptaWaiting ? 1 : 0) + (amlWaiting ? 1 : 0)), 'Assessments to review', ptaWaiting || amlWaiting],
    [String(matWaiting ? 1 : 0), 'Material awaiting HR link', matWaiting],
  ];

  const card = 'rounded-2xl bg-white ring-1 ring-line';
  const btn2 = 'min-h-10 rounded-lg border border-line bg-white px-4 text-[15px] hover:border-ink/30 disabled:opacity-50';
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-[18px] font-semibold text-white">NA</span>
          <div>
            <h1 className="text-[36px] font-semibold leading-tight tracking-tight">{ME}</h1>
            <p className="text-[16px] text-ink-2">Trainer · Risk Management Division · also has employee and supervisor access</p>
          </div>
        </div>
        {primary
          ? <button onClick={primary.go} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark">{primary.cta} <ArrowRight size={17} /></button>
          : upcoming[0] && <button onClick={() => setOpen(upcoming[0])} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark">Open next session <ArrowRight size={17} /></button>}
      </header>

      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {strip.map(([n, l, warn]) => (
          <li key={l} className={cx(card, 'px-5 py-3.5')}>
            <div className={cx('text-[30px] font-semibold leading-none tabular-nums', warn && 'text-amber-700')}>{n}</div>
            <div className="mt-1.5 text-[15px] leading-snug text-ink-2">{l}</div>
          </li>
        ))}
      </ul>

      <input ref={input} type="file" accept=".pdf,.pptx,.docx,.xlsx" className="sr-only" aria-label="Choose a material file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f.name); s.uploadMaterial(); } }} />

      {/* actions + calendar side by side */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section id="sec-actions" className={cx(card, 'scroll-mt-4 px-6 py-5')}>
          <h2 className="text-[22px] font-semibold">Your actions <span className="text-[15px] font-normal text-ink-3">· {actions.length}</span></h2>
          {actions.length ? (
            <ul className="mt-2 divide-y divide-line">
              {actions.map((a) => (
                <li key={a.what} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-ink-3">{a.training} · {a.when}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[16px] font-medium">{a.what}<Badge t={a.tone}>{a.status}</Badge></span>
                    <span className="block text-[15px] text-ink-2">{a.why}</span>
                  </span>
                  <button onClick={a.go} className={btn2}>{a.cta}</button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-[16px] text-ink-2">Nothing needs your attention right now.</p>}

          {s.invitesSent && (
            <div id="sec-invite" className={cx('mt-4 scroll-mt-4 rounded-xl px-5 py-4', resp === 'pending' ? 'bg-brand-soft/40 ring-1 ring-brand/30' : 'bg-canvas/60')}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] text-ink-3">Invitation to facilitate · Nusrat Jahan, HR</div>
                  <div className="text-[17px] font-medium">{TRAINING.title}</div>
                  <div className="text-[15px] text-ink-2">{TRAINING.dates} · {s.sched.venue} · {people.length} participants</div>
                </div>
                {resp === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => setReject(true)} className={btn2}>Reject</button>
                    <button onClick={() => s.trainerRespond('accepted')} className="min-h-10 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Accept</button>
                  </div>
                ) : <Badge t={resp === 'accepted' ? 'ok' : 'neutral'}>{resp === 'accepted' ? 'Accepted' : `Rejected · ${s.trainerReason}`}</Badge>}
              </div>
            </div>
          )}
        </section>

        <section id="sec-calendar" className={cx(card, 'scroll-mt-4 px-6 py-5')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">My calendar</h2>
            <div className="flex gap-1 rounded-lg bg-canvas p-1" role="tablist" aria-label="Calendar filter">
              {(['All', 'Sessions', 'Assessments', 'Material deadlines'] as const).map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className={cx('rounded-md px-2.5 py-1 text-[14px]', filter === f ? 'bg-white shadow-sm' : 'text-ink-2')}>{f === 'Material deadlines' ? 'Materials' : f}</button>
              ))}
            </div>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {shown.map((x) => (
              <li key={x.key}>
                <button onClick={x.go} className="grid w-full grid-cols-[68px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1 py-2.5 text-left hover:bg-canvas/60">
                  <span className="leading-tight"><span className="block text-[15px] font-medium tabular-nums">{x.date}</span><span className="text-[14px] text-ink-3">{x.time}</span></span>
                  <span className="min-w-0"><span className="block truncate text-[16px]">{x.title}</span><span className="block truncate text-[14px] text-ink-3">{x.detail}</span></span>
                  <Badge t={x.tone}>{x.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* sessions + materials side by side */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section id="sec-sessions" className={cx(card, 'scroll-mt-4 px-6 py-5')}>
          <h2 className="text-[22px] font-semibold">My sessions</h2>
          <table className="mt-2 w-full text-left text-[15px]">
            <thead className="text-[14px] text-ink-3"><tr>{['Date', 'Training · topic', 'Venue', 'People', 'Status', ''].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {sessions.map((x) => (
                <tr key={x.key}>
                  <td className="py-2.5 pr-3 tabular-nums">{x.date}<span className="block text-[14px] text-ink-3">{x.time}</span></td>
                  <td className="py-2.5 pr-3"><span className="block">{x.title}</span><span className="text-[14px] text-ink-3">{x.topic}</span></td>
                  <td className="py-2.5 pr-3 text-ink-2">{x.venue}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{x.people}</td>
                  <td className="py-2.5 pr-3"><Badge t={x.tone}>{x.status}</Badge></td>
                  <td className="py-2.5 text-right"><button onClick={() => setOpen(x)} className="text-brand hover:underline">Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="sec-materials" className={cx(card, 'scroll-mt-4 px-6 py-5')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">Training materials</h2>
            {resp === 'accepted' && <button onClick={upload} className={btn2}>{s.materialUploaded ? 'Replace file' : 'Upload material'}</button>}
          </div>
          <p className="mt-1 text-[14px] text-ink-3">You upload; HR Admin links the file to the training before participants see it.</p>
          <ul className="mt-2 divide-y divide-line">
            {mats.map((m) => (
              <li key={m.key} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0"><span className="block truncate text-[16px]">{m.name}</span><span className="text-[14px] text-ink-3">{m.type} · uploaded {m.date} · {m.training}</span></span>
                  <Badge t={m.linked ? 'ok' : 'warn'}>{m.linked ? 'Linked' : 'Not linked'}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
                  <span className="text-ink-2">HR review: {m.hr}</span>
                  {m.live && !s.materialLinkRequested && <button onClick={() => s.requestMaterialLink()} className="text-brand hover:underline">Request HR link</button>}
                  {m.linked && <button onClick={() => (m.live ? setOpen(sessions.find((x) => x.live) ?? null) : setOpen(sessions[0]))} className="text-brand hover:underline">View linked training</button>}
                </div>
              </li>
            ))}
            {!s.materialUploaded && resp === 'accepted' && (
              <li className="flex flex-wrap items-center gap-3 py-3 text-[15px]"><span className="text-ink-2">No file for {TRAINING.title} yet.</span><button onClick={() => { setFile(''); s.uploadMaterial(); }} className="text-brand hover:underline">Use the sample case pack</button></li>
            )}
          </ul>
        </section>
      </div>

      {/* assessment review */}
      <section id="sec-assessments" className={cx(card, 'mt-5 scroll-mt-4 px-6 py-5')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold">Assessment review</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[14px] font-medium text-sky-900"><Sparkles size={15} />AI-assisted · Trainer decides</span>
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[15px]">
            <thead className="text-[14px] text-ink-3"><tr>{['Exam · participant', 'Objective', 'Descriptive', 'AI suggests', 'Evidence', 'Your decision', 'Status', ''].map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {reviews.map((r) => (
                <tr key={r.exam}>
                  <td className="py-3 pr-3"><span className="block">{r.exam}</span><span className="text-[14px] text-ink-3">{r.who}</span></td>
                  <td className="py-3 pr-3 tabular-nums">{r.objective}</td>
                  <td className="py-3 pr-3">{r.descriptive}</td>
                  <td className="py-3 pr-3 tabular-nums text-sky-800">{r.ai}</td>
                  <td className="max-w-[260px] py-3 pr-3 text-[14px] text-ink-2">{r.evidence}</td>
                  <td className="py-3 pr-3">{r.decision}</td>
                  <td className="py-3 pr-3"><Badge t={r.tone}>{r.status}</Badge></td>
                  <td className="py-3 text-right"><button onClick={() => nav(r.to)} disabled={r.disabled} className={btn2}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[14px] text-ink-3">On the review screen you accept or adjust the score, add a note, clear or flag integrity, and submit the final evaluation. Objective answers are scored automatically for the other {Math.max(0, people.length - 1)} participants.</p>
      </section>

      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="space-y-5 text-[16px]">
            <dl className="divide-y divide-line border-y border-line">
              {([
                ['Date and time', `${open.date} · ${open.time}`], ['Venue', open.venue], ['Topics', open.topic], ['Session duration', open.duration], ['Participants', String(open.people)],
                ['Materials', open.live ? (s.materialLinked ? 'Linked for participants' : s.materialLinkRequested ? 'With HR to link' : s.materialUploaded ? 'Uploaded · not linked' : 'Not uploaded') : 'Linked'],
                ['Attendance', open.live ? (s.attendanceSubmitted ? `${attendedIds(s).length} of ${people.length} attended` : 'Taken on the day') : open.status === 'Delivered' ? '24 of 26 attended' : 'Taken on the day'],
                ['Feedback', open.live ? (s.feedbackSubmitted ? '4.6 / 5 · 89% positive' : s.attendanceSubmitted ? 'Open' : 'After the session') : open.status === 'Delivered' ? '4.3 / 5' : 'After the session'],
                ['Assessment', open.live ? (s.pta.released ? 'Released' : s.attendanceSubmitted ? 'Awaiting your review' : 'After the session') : open.status === 'Delivered' ? 'Released' : '—'],
              ] as [string, string][]).map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] gap-4 py-2.5"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>)}
            </dl>
            {open.live && (
              <>
                <h3 className="text-[15px] text-ink-3">Assigned participants</h3>
                <ul className="max-h-[320px] divide-y divide-line overflow-y-auto">
                  {people.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-[15px]">
                      <span>{e.name}<span className="text-ink-3"> · {e.role}</span></span>
                      {s.attendanceSubmitted && (attendedIds(s).includes(e.id) ? <Check size={16} className="text-ok" /> : <span className="text-[14px] text-ink-3">Absent</span>)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Drawer>

      <ReasonModal
        open={reject}
        title="Reject the invitation"
        intro="A reason is required (FR 17). HR sees it and reassigns your session."
        confirm="Reject"
        suggested="Board Risk Committee meeting on 18 Nov."
        onClose={() => setReject(false)}
        onConfirm={(reason) => { s.trainerRespond('rejected', reason); setReject(false); }}
      />
    </div>
  );
}
