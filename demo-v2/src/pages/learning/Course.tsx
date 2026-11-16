import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Check, ChevronLeft, ChevronRight, Download, FileText, Lock, Pause, Play, Printer, RotateCcw, ShieldCheck, Star, Subtitles, Video, WifiOff,
} from 'lucide-react';
import { courseOf, useDemo } from '../../store';
import { findById } from '../../org';
import { JOURNEY, journeyAction, journeyIndex } from '../../lifecycle';
import { PageHead, PersonBanner } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { Badge, Btn, cx, inputCls, Progress } from '../../components/ui';
import { personaFor, useSwitchRole } from '../../components/perspective';

/* ================================================================== */
/* Course data (fictional) · FR 190–198                                */
/* ================================================================== */
type Kind = 'video' | 'pdf' | 'h5p' | 'quiz' | 'feedback' | 'certificate';
interface Mod { title: string; kind: Kind; type: string; length: string; preview: string[] }
const MODS: Mod[] = [
  { title: 'Phishing & Social Engineering', kind: 'video', type: 'Video', length: '12 min', preview: ['How phishing emails imitate IT and senior managers', 'Red flags: urgency, links and mismatched senders', 'Reporting with the Phish button in Outlook'] },
  { title: 'Data Handling & Classification', kind: 'pdf', type: 'PDF reading', length: '6 pages', preview: ['Public, Internal, Confidential and Restricted data', 'Clear desk and clear screen', 'Sharing customer data safely'] },
  { title: 'Scenario: the urgent caller', kind: 'h5p', type: 'H5P scenario', length: '5 min', preview: ['A branching phone-call scenario', 'Feedback on every choice'] },
  { title: 'Assessment checkpoint', kind: 'quiz', type: 'Checkpoint', length: '10 questions · pass 80%', preview: ['10 questions drawn from the course bank', 'Pass mark 80% · 2 attempts'] },
  { title: 'Course feedback', kind: 'feedback', type: 'Feedback', length: '2 min', preview: ['Rate the scenario activity', 'Rate the course'] },
  { title: 'Certificate', kind: 'certificate', type: 'Certificate', length: 'QR-verified', preview: ['Digital certificate with QR verification', 'Valid 12 months, then a refresher is assigned'] },
];
/** Progress (%) at which each of the first four modules is complete; feedback completes the course. */
const DONE_AT = [20, 40, 65, 85];
const ICON: Record<Kind, typeof Video> = { video: Video, pdf: FileText, h5p: BookOpen, quiz: Check, feedback: Star, certificate: Award };
const doneCount = (progress: number, completed: boolean) => (completed ? MODS.length : DONE_AT.filter((t) => progress >= t).length);

const DUR = 725;
const SCENES = [
  { at: 0, title: 'Why attackers target bank staff', en: 'Phishing emails often pretend to come from IT or a senior manager.', bn: 'ফিশিং ইমেইল প্রায়ই আইটি বা ঊর্ধ্বতন কর্মকর্তার নামে আসে।' },
  { at: 180, title: 'Spotting the red flags', en: 'Look for urgency, unexpected links and mismatched sender addresses.', bn: 'জরুরি ভাষা, অপ্রত্যাশিত লিংক ও ভুল প্রেরকের ঠিকানা লক্ষ্য করুন।' },
  { at: 360, title: 'Passwords and OTPs', en: 'Never share your password or OTP, not even with IT.', bn: 'কখনও আপনার পাসওয়ার্ড বা ওটিপি কাউকে দেবেন না, আইটিকেও না।' },
  { at: 540, title: 'Report it', en: 'Report suspicious emails with the Phish button in Outlook.', bn: 'সন্দেহজনক ইমেইল আউটলুকের ফিশ বাটনে রিপোর্ট করুন।' },
];
const PAGES = [
  { h: '1 · Why classification matters', p: 'Every document and record at City Bank carries a classification. It decides who may see it, how it is stored and how it is shared.' },
  { h: '2 · The four levels', p: 'Public · Internal · Confidential · Restricted. Customer account details, credit memos and HR records are Confidential or higher.' },
  { h: '3 · Clear desk, clear screen', p: 'Lock your screen when you step away (Windows + L). Keep printed Confidential papers in a locked drawer.' },
  { h: '4 · Sharing customer data', p: 'Share only through approved channels. Never send customer data to personal email or messaging apps.' },
  { h: '5 · Removable media', p: 'USB storage is blocked by default. Exceptions need an approved request and encryption.' },
  { h: '6 · If something goes wrong', p: 'Report a suspected data leak to the Information Security desk within one hour. Speed limits the damage.' },
];
const H5P = {
  q: 'A caller says he is from IT. Your account is “about to be locked” and he needs the OTP that was just sent to your phone. What do you do?',
  choices: [
    { t: 'Read out the OTP so the account is not locked', ok: false, fb: 'An OTP proves it is you. Anyone who has it can act as you. IT never asks for it.' },
    { t: 'Hang up and call the IT Service Desk on the number in the intranet', ok: true, fb: 'Correct. Verify through a channel you trust, then report the call to Information Security.' },
    { t: 'Ask the caller for his employee ID first, then share the OTP', ok: false, fb: 'Attackers often have real names and IDs. Checking an ID does not make sharing an OTP safe.' },
  ],
};
const QUIZ = [
  { q: 'An email from “IT Helpdesk” asks you to confirm your password via a link. What do you do?', o: ['Click and comply', 'Report it with the Phish button', 'Forward it to colleagues'], a: 1 },
  { q: 'A customer’s account statement is classified as…', o: ['Public', 'Internal', 'Confidential'], a: 2 },
  { q: 'You leave your desk for five minutes. You should…', o: ['Leave the screen on', 'Lock the screen', 'Log out of email only'], a: 1 },
];
const RESOURCES = ['Information Security Policy v4.2.pdf', 'Phishing examples (preview only)', 'Data classification matrix.xlsx'];

interface Xapi { at: string; verb: string; obj: string }
const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const hm = (sec: number) => `${Math.floor(sec / 3600)}h ${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}m`;

function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */
export function CoursePage() {
  const s = useDemo();
  const id = s.employeeId;
  const c = courseOf(s, id);
  const [view, setView] = useState<'overview' | 'player'>('overview');
  const [startAt, setStartAt] = useState<number | null>(null);
  const n = doneCount(c.progress, c.completed);
  const open = (mod?: number) => { setStartAt(mod ?? null); setView('player'); };

  const tags = <><SourceTag kind="fictional">Course and learner data are fictional</SourceTag><SourceTag kind="simulated">Content and tracking simulated</SourceTag></>;
  const actions = view === 'overview'
    ? <Btn onClick={() => open(c.completed ? MODS.length - 1 : undefined)}>{c.completed ? 'View certificate' : c.progress > 0 ? `Resume (${c.progress}%)` : 'Start course'} <ArrowRight size={16} /></Btn>
    : <Btn v="secondary" onClick={() => setView('overview')}><ArrowLeft size={16} />Course overview</Btn>;

  return (
    <div>
      {s.role === 'employee' && <PersonBanner empId={id} reason="Your own course progress" />}
      <PageHead title="Information Security Awareness 2026" meta={<>ISA-2026 · version 3.1 · Mandatory · due 20 Nov 2026 · {c.completed ? 'Completed' : `${c.progress}% complete`}</>} fr="FR 190–198" tags={tags} actions={actions} />
      {view === 'overview' ? <Overview progress={c.progress} completed={c.completed} done={n} onOpen={open} /> : <Player key={id} empId={id} startAt={startAt} />}
    </div>
  );
}

/* ---------------- course overview (FR 190–192, 198) ---------------- */
function Overview({ progress, completed, done, onOpen }: { progress: number; completed: boolean; done: number; onOpen: (m: number) => void }) {
  const facts: [string, string][] = [
    ['Course code', 'ISA-2026'], ['Version', '3.1 · updated Oct 2026'], ['Due date', '20 Nov 2026'], ['Mandatory for', 'All employees · Corporate Banking'],
    ['Difficulty', 'Foundation'], ['Duration', '3 h'], ['Languages', 'EN / বাংলা subtitles'], ['Offline', 'Available · low-bandwidth playback'],
  ];
  const rules: [string, string][] = [
    ['Sequential', 'Modules open in order'], ['Seek locked', 'You can rewind, not skip ahead'], ['Pass mark', '80% on the checkpoint'], ['Expiry / refresher', '12 months, then a refresher is assigned'], ['Certificate', 'QR-verified, digital signature'],
  ];
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-gradient-to-br from-[#fdf0ef] via-white to-[#eef2fb] p-6">
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-sm"><ShieldCheck size={48} strokeWidth={1.6} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-brand">Mandatory e-learning · Information Security</div>
            <div className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight">Information Security Awareness 2026</div>
            <div className="mt-3 flex items-center gap-3"><div className="w-56"><Progress value={progress} tone={completed ? 'ok' : 'brand'} /></div><span className="text-[15px] font-semibold">{completed ? 'Completed' : `${progress}% · ${done} of ${MODS.length} modules`}</span></div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-[22px] font-bold tracking-tight">What you will learn</h2>
          <ul className="mt-3 grid gap-2 text-[16px] md:grid-cols-2">
            {['Recognise phishing and social-engineering attempts', 'Classify and handle bank data correctly', 'Protect passwords, OTPs and devices', 'Report incidents quickly through the right channel'].map((o) => (
              <li key={o} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-ok" />{o}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-[22px] font-bold tracking-tight">Modules</h2>
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {MODS.map((m, i) => {
              const Icon = ICON[m.kind];
              const st = i < done ? 'Complete' : i === done ? 'Next' : 'Locked';
              return (
                <li key={m.title}>
                  <button onClick={() => onOpen(i)} className="flex w-full flex-wrap items-center gap-4 py-3 text-left hover:bg-white">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-2"><Icon size={17} /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{i + 1}. {m.title}</span><span className="block text-[15px] text-ink-3">{m.type} · {m.length}</span></span>
                    <Badge t={st === 'Complete' ? 'ok' : st === 'Next' ? 'brand' : 'neutral'}>{st === 'Locked' ? <><Lock size={13} />Locked</> : st}</Badge>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <aside className="space-y-8">
        <section>
          <h2 className="text-[22px] font-bold tracking-tight">Course details</h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {facts.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-2.5"><dt className="text-[15px] text-ink-3">{k}</dt><dd className="text-[16px] font-medium">{v}</dd></div>)}
          </dl>
        </section>
        <section>
          <h2 className="text-[22px] font-bold tracking-tight">Learning rules</h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {rules.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-2.5"><dt className="text-[15px] text-ink-3">{k}</dt><dd className="text-[16px] font-medium">{v}</dd></div>)}
          </dl>
          <p className="mt-2 text-[14px] text-ink-3">FR 190 (subtitles) · 191 (structure) · 192 (rules) · 193 (offline) · 198 (certificate)</p>
        </section>
      </aside>
    </div>
  );
}

/* ---------------- player (FR 193–198) ---------------- */
function Player({ empId, startAt }: { empId: string; startAt: number | null }) {
  const s = useDemo();
  const nav = useNavigate();
  const switchRole = useSwitchRole();
  const c = courseOf(s, empId);
  const person = findById(empId);
  const name = person?.name ?? personaFor('employee', empId).name;
  const eid = person?.eid ?? personaFor('employee', empId).eid;
  const done = doneCount(c.progress, c.completed);
  const [mod, setMod] = useState(startAt ?? Math.min(done, MODS.length - 1));
  const [panel, setPanel] = useState<'Resources' | 'Notes' | 'Tracking'>('Tracking');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState<string | null>(null);
  const [spent, setSpent] = useState(c.progress * 100);
  const [xapi, setXapi] = useState<Xapi[]>(() => [
    ...MODS.slice(0, done).map((m) => ({ at: 'Earlier', verb: 'completed', obj: m.title })).reverse(),
    { at: 'Earlier', verb: 'launched', obj: 'ISA-2026 v3.1' },
  ]);
  const log = (verb: string, obj: string) => setXapi((x) => [{ at: clock(), verb, obj }, ...x]);

  // video
  const initPos = c.progress >= DONE_AT[0] ? DUR : Math.round((c.progress / DONE_AT[0]) * DUR);
  const [pos, setPos] = useState(initPos);
  const [maxSeen, setMaxSeen] = useState(initPos);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cc, setCc] = useState<'Off' | 'EN' | 'বাংলা'>('EN');
  const [seekMsg, setSeekMsg] = useState(false);
  // pdf, h5p, quiz, feedback, certificate
  const [page, setPage] = useState(c.progress >= DONE_AT[1] ? PAGES.length : 1);
  const [pick, setPick] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(QUIZ.map(() => null));
  const [score, setScore] = useState<number | null>(null);
  const [stars, setStars] = useState({ activity: 0, course: 0 });
  const [comment, setComment] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => { const t = setInterval(() => setSpent((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => Math.min(DUR, p + 10 * speed)), 400);
    return () => clearInterval(t);
  }, [playing, speed]);
  useEffect(() => {
    setMaxSeen((m) => Math.max(m, pos));
    if (playing && pos >= DUR) { setPlaying(false); log('completed', `${MODS[0].title} (video)`); }
  }, [pos]);
  useEffect(() => { if (mod !== 0 && playing) { setPlaying(false); log('paused', `${MODS[0].title} @ ${mmss(pos)}`); } }, [mod]);

  const unlocked = (i: number) => i <= done;
  const finish = (i: number) => {
    if (i < DONE_AT.length && c.progress < DONE_AT[i]) {
      s.setCourseProgressFor(empId, DONE_AT[i]);
      s.logEvent('employee', 'Course module completed', `${name} · ISA-2026 · ${MODS[i].title} (simulated tracking)`);
    }
    log('completed', MODS[i].title);
    setMod(i + 1);
  };
  const togglePlay = () => {
    if (pos >= DUR) { setPos(0); setPlaying(true); log('played', `${MODS[0].title} from 00:00`); return; }
    log(playing ? 'paused' : 'played', `${MODS[0].title} @ ${mmss(pos)}`);
    setPlaying(!playing);
  };
  const seek = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const target = Math.round(((e.clientX - r.left) / r.width) * DUR);
    if (target > maxSeen + 2) { setSeekMsg(true); log('seek blocked', `${MODS[0].title} → ${mmss(target)}`); return; }
    setSeekMsg(false);
    setPos(target);
    log('seeked', `${MODS[0].title} → ${mmss(target)}`);
  };
  const submitFeedback = () => {
    log('rated', `Activity ${stars.activity}★ · course ${stars.course}★`);
    s.completeCourseFor(empId);
    log('completed', 'ISA-2026 · course');
    setMod(MODS.length - 1);
  };

  const certId = empId === 'e1' ? 'CERT-2026-088412' : `CERT-2026-${eid.replace(/\D/g, '').padStart(6, '0')}`;
  const downloadCert = () => {
    downloadText(`${certId}.txt`, [
      'City Bank PLC · Learning & Development',
      'CERTIFICATE OF COMPLETION',
      '',
      `This certifies that ${name} (${eid})`,
      'has successfully completed Information Security Awareness 2026 (ISA-2026, version 3.1).',
      'Issued 12 November 2026 · valid until 12 November 2027',
      `Certificate ID: ${certId} · verify by scanning the QR code (simulated)`,
      '',
      'Fictional demonstration data.',
    ].join('\n'));
    log('downloaded', certId);
  };

  const ji = journeyIndex(s);
  const nextAct = ji < JOURNEY.length ? journeyAction(JOURNEY[ji], s) : null;
  const mine = !!nextAct && nextAct.role === 'employee' && (nextAct.emp ?? 'e1') === empId && nextAct.to !== '/learning/course';
  const scene = [...SCENES].reverse().find((x) => pos >= x.at) ?? SCENES[0];
  const m = MODS[mod];
  /** After completion the footer holds the one primary action. */
  const stepV = c.completed ? 'secondary' : 'primary';

  return (
    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)_320px]">
      {/* module list */}
      <aside className="min-w-0">
        <div className="text-[15px] text-ink-3">{c.completed ? 'Completed' : `${c.progress}% complete`}</div>
        <div className="mt-1.5"><Progress value={c.progress} tone={c.completed ? 'ok' : 'brand'} /></div>
        <ol className="mt-4 space-y-1">
          {MODS.map((x, i) => {
            const isDone = i < done, isOpen = unlocked(i);
            return (
              <li key={x.title}>
                <button onClick={() => setMod(i)} aria-current={i === mod ? 'step' : undefined} className={cx('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left', i === mod ? 'bg-white shadow-sm ring-1 ring-line' : 'hover:bg-white')}>
                  <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[14px] font-bold', isDone ? 'bg-ok text-white' : isOpen ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{isDone ? <Check size={13} /> : isOpen ? i + 1 : <Lock size={12} />}</span>
                  <span className="min-w-0"><span className={cx('block text-[15px] leading-snug', i === mod ? 'font-bold' : 'font-semibold text-ink-2')}>{x.title}</span><span className="block text-[14px] text-ink-3">{x.type} · {x.length}</span></span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 flex items-center gap-1.5 text-[14px] text-ink-3"><Lock size={13} />Sequential order enforced</p>
      </aside>

      {/* main content */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-[22px] font-bold tracking-tight">{mod + 1}. {m.title}</h2>
          <Badge t="neutral">{m.type}</Badge>
          <SourceTag kind="simulated">Simulated content</SourceTag>
        </div>

        {!unlocked(mod) ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-8">
            <div className="flex items-center gap-2 text-[16px] font-semibold text-ink-2"><Lock size={18} />Locked · opens after “{MODS[mod - 1].title}” is complete</div>
            <div className="mt-4 text-[15px] font-semibold text-ink-3">In this module</div>
            <ul className="mt-2 space-y-1.5 text-[16px]">{m.preview.map((p) => <li key={p} className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />{p}</li>)}</ul>
            <div className="mt-6"><Btn v="secondary" onClick={() => setMod(done)}>Go to current module <ArrowRight size={16} /></Btn></div>
          </div>
        ) : m.kind === 'video' ? (
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#fdf0ef] via-white to-[#eef2fb]" style={{ aspectRatio: '16 / 8' }}>
              <div className="grid h-full place-items-center p-6 text-center">
                <div>
                  <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark">{playing ? <Pause size={34} /> : pos >= DUR ? <RotateCcw size={30} /> : <Play size={34} className="ml-1" />}</button>
                  <div className="mt-4 text-[20px] font-extrabold">{scene.title}</div>
                  <div className="text-[15px] text-ink-3">{pos > 0 && pos < DUR && !playing ? `Resume from ${mmss(pos)}` : pos >= DUR ? 'Watched to the end' : 'Press play to start'} · 720p adaptive · watermark {eid}</div>
                </div>
              </div>
              {cc !== 'Off' && (playing || (pos > 0 && pos < DUR)) && (
                <div className="absolute inset-x-6 bottom-4 rounded-lg bg-white/95 px-4 py-2 text-center text-[16px] font-medium shadow-sm">{cc === 'EN' ? scene.en : scene.bn}</div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
              <Btn v="secondary" size="sm" onClick={togglePlay}>{playing ? <><Pause size={15} />Pause</> : <><Play size={15} />{pos >= DUR ? 'Replay' : 'Play'}</>}</Btn>
              <span className="text-[15px] tabular-nums">{mmss(pos)} / {mmss(DUR)}</span>
              <button onClick={seek} aria-label="Seek (rewind only; skipping ahead is locked)" className="relative h-3 min-w-[120px] flex-1 cursor-pointer rounded-full bg-canvas">
                <span className="absolute inset-y-0 left-0 rounded-full bg-brand/25" style={{ width: `${(maxSeen / DUR) * 100}%` }} />
                <span className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(pos / DUR) * 100}%` }} />
              </button>
              <label className="flex items-center gap-1.5 text-[15px]"><span className="text-ink-3">Speed</span>
                <select value={speed} onChange={(e) => { setSpeed(Number(e.target.value)); log('changed speed', `${e.target.value}×`); }} className="rounded-lg border border-line bg-white px-2 py-1 text-[15px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((v) => <option key={v} value={v}>{v}×</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-[15px]"><Subtitles size={16} className="text-ink-3" />
                <select value={cc} onChange={(e) => { setCc(e.target.value as typeof cc); log('changed captions', e.target.value); }} aria-label="Captions" className="rounded-lg border border-line bg-white px-2 py-1 text-[15px]">
                  {(['Off', 'EN', 'বাংলা'] as const).map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <span className="flex items-center gap-1 text-[14px] text-ink-3"><Lock size={13} />Seek locked</span>
            </div>
            {seekMsg && <p className="mt-2 text-[15px] text-warn">Skipping ahead is locked (FR 192). You can rewind to any point you have already watched.</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-ok"><WifiOff size={15} />Available offline</span>
              <span className="flex-1" />
              <Btn v={stepV} disabled={maxSeen < DUR} onClick={() => finish(0)}>{maxSeen < DUR ? 'Watch to the end to continue' : 'Continue to next module'} <ArrowRight size={16} /></Btn>
            </div>
          </div>
        ) : m.kind === 'pdf' ? (
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white px-10 py-10" style={{ minHeight: 320 }}>
              <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="-rotate-[24deg] whitespace-nowrap text-[30px] font-extrabold text-brand/10">Preview only · {eid}</span></div>
              <div className="relative text-[14px] font-semibold text-ink-3">Data Handling &amp; Classification Standard · v2.3 · Internal</div>
              <h3 className="relative mt-4 text-[22px] font-bold">{PAGES[page - 1].h}</h3>
              <p className="relative mt-3 max-w-2xl text-[17px] leading-relaxed">{PAGES[page - 1].p}</p>
              <div className="relative mt-5 space-y-2">{[90, 75, 82].map((w) => <div key={w} className="h-2.5 rounded-full bg-canvas" style={{ width: `${w}%` }} />)}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Btn v="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} />Previous</Btn>
              <span className="text-[15px] tabular-nums">Page {page} of {PAGES.length}</span>
              <Btn v="secondary" size="sm" disabled={page === PAGES.length} onClick={() => { setPage(page + 1); log('viewed', `PDF page ${page + 1}`); }}>Next<ChevronRight size={16} /></Btn>
              <span className="text-[14px] text-ink-3">Preview only · watermark {eid} · download disabled</span>
              <span className="flex-1" />
              <Btn v={stepV} disabled={page < PAGES.length} onClick={() => finish(1)}>{page < PAGES.length ? 'Read to the last page' : 'Mark as read & continue'} <ArrowRight size={16} /></Btn>
            </div>
          </div>
        ) : m.kind === 'h5p' ? (
          <div className="rounded-2xl border border-line bg-white p-7">
            <div className="text-[15px] font-semibold text-ink-3">Interactive scenario (H5P)</div>
            <p className="mt-2 text-[18px] font-semibold leading-snug">{H5P.q}</p>
            <div className="mt-5 space-y-2.5">
              {H5P.choices.map((ch, i) => (
                <div key={ch.t}>
                  <button onClick={() => { setPick(i); log('answered', `Scenario · choice ${i + 1} (${ch.ok ? 'correct' : 'incorrect'})`); }} className={cx('w-full rounded-xl border p-4 text-left text-[16px]', pick === i ? (ch.ok ? 'border-ok bg-ok-soft' : 'border-amber-400 bg-warn-soft') : 'border-line hover:border-ink/30')}>{ch.t}</button>
                  {pick === i && <p className={cx('mt-1.5 px-1 text-[15px]', ch.ok ? 'text-ok' : 'text-warn')}>{ch.fb}</p>}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end"><Btn v={stepV} disabled={pick === null || !H5P.choices[pick].ok} onClick={() => finish(2)}>Continue to checkpoint <ArrowRight size={16} /></Btn></div>
          </div>
        ) : m.kind === 'quiz' ? (
          <div className="rounded-2xl border border-line bg-white p-7">
            <div className="text-[15px] text-ink-3">Sample of 3 from the 10-question checkpoint · pass mark 80%</div>
            <ol className="mt-4 space-y-5">
              {QUIZ.map((q, qi) => (
                <li key={q.q}>
                  <p className="text-[16px] font-semibold">{qi + 1}. {q.q}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.o.map((o, oi) => (
                      <label key={o} className={cx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[15px]', answers[qi] === oi ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-ink/30')}>
                        <input type="radio" name={`q${qi}`} checked={answers[qi] === oi} onChange={() => { setAnswers(answers.map((a, k) => (k === qi ? oi : a))); setScore(null); }} />{o}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            {score !== null && (
              <div className={cx('mt-5 rounded-xl px-4 py-3 text-[16px] font-semibold', score >= 80 ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn')}>
                Score {score}% · {score >= 80 ? 'Passed' : 'Below the 80% pass mark. Review your answers and try again.'}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              {score !== null && score >= 80
                ? <Btn v={stepV} onClick={() => finish(3)}>Continue to feedback <ArrowRight size={16} /></Btn>
                : <Btn v={stepV} disabled={answers.some((a) => a === null)} onClick={() => { const sc = Math.round((QUIZ.filter((q, i) => answers[i] === q.a).length / QUIZ.length) * 100); setScore(sc); log(sc >= 80 ? 'passed' : 'failed', `Checkpoint · ${sc}%`); }}>Submit answers</Btn>}
            </div>
          </div>
        ) : m.kind === 'feedback' ? (
          <div className="rounded-2xl border border-line bg-white p-7">
            {c.completed ? <p className="text-[16px] text-ink-2">Thank you. Your feedback was recorded when you completed the course.</p> : (
              <>
                {([['activity', 'How useful was the scenario activity?'], ['course', 'How relevant was this course to your role?']] as const).map(([k, l]) => (
                  <div key={k} className="mb-5">
                    <p className="text-[16px] font-semibold">{l}</p>
                    <div className="mt-2 flex gap-1" role="radiogroup" aria-label={l}>
                      {[1, 2, 3, 4, 5].map((v) => <button key={v} role="radio" aria-checked={stars[k] === v} aria-label={`${v} star${v > 1 ? 's' : ''}`} onClick={() => setStars({ ...stars, [k]: v })} className="p-0.5"><Star size={30} className={v <= stars[k] ? 'fill-amber-400 text-amber-400' : 'text-line'} /></button>)}
                    </div>
                  </div>
                ))}
                <label className="block"><span className="text-[15px] font-semibold text-ink-2">Comment (optional)</span><textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={cx(inputCls, 'mt-1.5')} /></label>
                <div className="mt-6 flex justify-end"><Btn disabled={!stars.activity || !stars.course} onClick={submitFeedback}>Submit feedback &amp; issue certificate <ArrowRight size={16} /></Btn></div>
              </>
            )}
          </div>
        ) : (
          <Certificate name={name} certId={certId} completed={c.completed} verified={verified} onVerify={() => { setVerified(true); log('verified', certId); }} onBack={() => setMod(done)} />
        )}

        {c.completed && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#cfe7d7] bg-[#f3faf5] px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-white"><Check size={18} /></span>
            <div className="min-w-0 flex-1 text-[16px]"><b>Course complete.</b> <span className="text-ink-2">Certificate {certId} issued to {name}. Supervisor and compliance reports are updated.</span></div>
            <Btn v="secondary" onClick={downloadCert}><Download size={16} />Download</Btn>
            <Btn v="secondary" onClick={() => nav('/employee/certificates')}>View certificate</Btn>
            {mine && nextAct
              ? <Btn onClick={() => switchRole(nextAct.role, nextAct.to, nextAct.emp)}>Continue: {nextAct.cta} <ArrowRight size={16} /></Btn>
              : <Btn onClick={() => nav('/employee')}>Back to My learning <ArrowRight size={16} /></Btn>}
          </div>
        )}
      </div>

      {/* resources / notes / tracking */}
      <aside className="min-w-0 lg:col-span-2 2xl:col-span-1">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex border-b border-line" role="tablist">
            {(['Resources', 'Notes', 'Tracking'] as const).map((p) => (
              <button key={p} role="tab" aria-selected={panel === p} onClick={() => setPanel(p)} className={cx('flex-1 border-b-2 px-2 py-3 text-[15px] font-semibold', panel === p ? 'border-brand text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>{p}</button>
            ))}
          </div>
          <div className="p-5 text-[15px]">
            {panel === 'Resources' && (
              <ul className="space-y-2">
                {RESOURCES.map((r) => (
                  <li key={r}><button onClick={() => log('accessed', r)} className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-canvas"><FileText size={16} className="mt-0.5 shrink-0 text-ink-3" /><span className="min-w-0 break-words">{r}</span></button></li>
                ))}
                <li className="pt-1 text-[14px] text-ink-3">Opened in preview only, with watermark {eid}. Each opening is tracked.</li>
              </ul>
            )}
            {panel === 'Notes' && (
              <div>
                <label className="block"><span className="text-[15px] font-semibold text-ink-2">My notes</span>
                  <textarea rows={6} value={notes} onChange={(e) => { setNotes(e.target.value); setNotesSaved(null); }} placeholder="e.g. Report suspicious emails with the Phish button in Outlook." className={cx(inputCls, 'mt-1.5')} />
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <Btn v="secondary" size="sm" disabled={!notes.trim()} onClick={() => { setNotesSaved(clock()); log('noted', m.title); }}>Save note</Btn>
                  {notesSaved && <span className="text-[14px] text-ok">Saved {notesSaved} · on this device</span>}
                </div>
              </div>
            )}
            {panel === 'Tracking' && (
              <div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {([['Video watched', `${Math.round((maxSeen / DUR) * 100)}%`], ['Time spent', hm(spent)], ['Last position', `${mmss(pos)} · module ${mod + 1}`], ['Modules done', `${done} of ${MODS.length}`]] as const).map(([k, v]) => (
                    <div key={k}><dt className="text-[14px] text-ink-3">{k}</dt><dd className="text-[16px] font-semibold">{v}</dd></div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center justify-between"><span className="text-[15px] font-semibold">xAPI statements</span><SourceTag kind="simulated">Simulated</SourceTag></div>
                <ol className="mt-2 max-h-56 space-y-1.5 overflow-y-auto scroll-thin pr-1">
                  {xapi.map((x, i) => (
                    <li key={`${x.at}-${i}`} className="rounded-lg bg-canvas px-2.5 py-1.5 text-[14px] leading-snug"><span className="text-ink-3">{x.at}</span> · <b>{name.split(' ')[0]}</b> <span className="font-semibold text-brand">{x.verb}</span> <span className="break-words">{x.obj}</span></li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- certificate with QR (FR 198) ---------------- */
function QrBlock({ seed }: { seed: string }) {
  const N = 21;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const finder = (x: number, y: number) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const finderOn = (x: number, y: number) => {
    const [fx, fy] = [[0, 0], [N - 7, 0], [0, N - 7]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7)!;
    const dx = x - fx, dy = y - fy;
    return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    h = (h * 1103515245 + 12345) >>> 0;
    if (finder(x, y) ? finderOn(x, y) : (h >>> 16) % 2 === 0) cells.push([x, y]);
  }
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="h-24 w-24" role="img" aria-label={`QR code for ${seed} (simulated)`}>
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#16181d" />)}
    </svg>
  );
}

function Certificate({ name, certId, completed, verified, onVerify, onBack }: { name: string; certId: string; completed: boolean; verified: boolean; onVerify: () => void; onBack: () => void }) {
  if (!completed) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
        <Award size={32} className="mx-auto text-ink-3" />
        <p className="mt-3 text-[16px] text-ink-2">The certificate is issued when you pass the checkpoint and submit the course feedback.</p>
        <div className="mt-5"><Btn v="secondary" onClick={onBack}>Go to current module <ArrowRight size={16} /></Btn></div>
      </div>
    );
  }
  return (
    <div>
      <div className="relative mx-auto max-w-2xl rounded-xl border-4 border-double border-brand/40 bg-white p-8 text-center shadow-sm">
        <img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-14 w-auto" />
        <div className="text-[14px] font-semibold text-ink-3">City Bank PLC · Learning &amp; Development</div>
        <h3 className="mt-3 text-[24px] font-extrabold">Certificate of Completion</h3>
        <p className="mt-3 text-[16px] text-ink-2">This is to certify that</p>
        <div className="mt-1 text-[30px] font-extrabold text-brand">{name}</div>
        <p className="mt-2 text-[16px] text-ink-2">has successfully completed</p>
        <div className="text-[18px] font-bold">Information Security Awareness 2026</div>
        <div className="mt-1 text-[14px] text-ink-3">Issued 12 November 2026 · valid until 12 November 2027</div>
        <div className="mt-6 flex items-end justify-between gap-6">
          <div className="text-left"><div className="mb-1 h-px w-40 bg-ink-3" /><div className="text-[14px] text-ink-3">Digital signature (placeholder)<br />Head of Learning &amp; Development</div></div>
          <div className="text-center"><QrBlock seed={certId} /><div className="text-[14px] text-ink-3">{certId}</div></div>
        </div>
      </div>
      <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-3">
        <Btn v="link" onClick={onVerify}><ShieldCheck size={15} />Verify</Btn>
        <Btn v="link" onClick={() => window.print()}><Printer size={15} />Print</Btn>
      </div>
      {verified && <p className="mx-auto mt-2 max-w-2xl rounded-xl bg-ok-soft px-4 py-3 text-center text-[15px] text-ok"><b>Valid.</b> {certId} was issued to {name} and has not been revoked. Checked against the ELDP certificate registry (simulated).</p>}
    </div>
  );
}
