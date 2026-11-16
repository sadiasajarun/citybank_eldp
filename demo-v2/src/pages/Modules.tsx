/**
 * City Bank ELDP Modules: a module explorer (six core modules + secondary modules) with a focused view per module.
 * Every figure comes from the demo state; module views link to the existing screens for the work itself.
 */
import { useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Brain, CalendarDays, ClipboardCheck, Gauge, Sparkles, Users, type LucideIcon } from 'lucide-react';
import { TRAINING } from '../data';
import { creditGap, CREDIT_TARGET, DIRECTORY, findById, TRAINERS, VENUES } from '../org';
import { attendedIds, ptResults, remainingLiability, roster, useDemo, type DemoState } from '../store';
import { Badge, cx, Drawer } from '../components/ui';
import { SourceTag } from '../components/Source';
import { COMPETENCIES, IDP_REQUESTS, idpPerson, REC_TITLE, SURVEY } from '../components/Tna';

type Key = 'lms' | 'tms' | 'ld' | 'ai' | 'comp' | 'pta';
type Tone = 'ok' | 'warn' | 'info' | 'neutral' | 'brand';
const card = 'rounded-2xl bg-white ring-1 ring-line';
const btn2 = 'min-h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-[14px] hover:border-ink/30';
const sel = 'min-h-10 rounded-lg border border-line bg-white px-3 text-[15px]';

const CORE: { key: Key; icon: LucideIcon; name: string; line: string; caps: string[]; fr: string; status: string; tone: Tone }[] = [
  { key: 'lms', icon: BookOpen, name: 'Learning Management System', line: 'Online courses, learning materials, exams, certifications and progress tracking.', caps: ['Course library and builder', 'Learning paths', 'Learner progress', 'Certificates'], fr: 'FR 190–209', status: 'Demonstrated', tone: 'ok' },
  { key: 'tms', icon: CalendarDays, name: 'Training Management System', line: 'Physical training, webinars, nominations, attendance, trainers, venues, scheduling and costs.', caps: ['Planned training', 'Calendar, trainers, venues', 'Costs and bonds', 'Training database and reports'], fr: 'FR 49–184', status: 'Demonstrated', tone: 'ok' },
  { key: 'ld', icon: Users, name: 'Learning & Development Management', line: 'Development needs, skills and competencies, and learning journeys.', caps: ['Training needs (3 sources)', 'Competency frameworks', 'Development plans', 'Learning journeys'], fr: 'FR 15, 186–189, 241–243', status: 'Partly demonstrated', tone: 'warn' },
  { key: 'ai', icon: Sparkles, name: 'AI-assisted Learning Platform', line: 'Training recommendations, compliance risk, feedback analysis and a learning assistant.', caps: ['Training recommendations', 'Compliance risk', 'Feedback intelligence', 'Learning assistant'], fr: 'FR 185, 209, 213, 226, 245', status: 'Simulated', tone: 'info' },
  { key: 'comp', icon: Gauge, name: 'Competency Management', line: 'Competency frameworks, capability assessment and progress toward target levels.', caps: ['Frameworks and levels', 'Competency gaps', 'Competency assessment', 'Competency journey'], fr: 'FR 22, 241–243', status: 'Partly demonstrated', tone: 'warn' },
  { key: 'pta', icon: ClipboardCheck, name: 'Planned Training & Assessment', line: 'Scheduled activities, attendance, assessments, results and follow-up.', caps: ['Planned programmes', 'Attendance and feedback', 'Exams and evaluation', 'Results and release'], fr: 'FR 132–143, 210–220', status: 'Demonstrated', tone: 'ok' },
];
const SECONDARY: { name: string; to: string }[] = [
  { name: 'Knowledge Corner', to: '/knowledge' }, { name: 'Physical Library', to: '/library' }, { name: 'Reports and Analytics', to: '/reports' },
  { name: 'Integrations and API', to: '/admin/integrations' }, { name: 'Security and Audit', to: '/admin/security' }, { name: 'Mobile Learning', to: '/mobile' },
];

/* ---------------- shared data ---------------- */
interface Course { title: string; category: string; difficulty: 'Beginner' | 'Intermediate' | 'Advanced'; duration: string; mandatory: boolean; target: string; division: string; progress: number; completion: number; status: string; objective: string; modules: string[]; assessment: string; to: string }
function courses(s: DemoState): Course[] {
  const en = s.enrollments;
  const infoDone = en.length ? Math.round((en.filter((e) => e.status === 'Completed').length / en.length) * 100) : 0;
  const mods = s.courseModules.length ? s.courseModules : ['Credit risk frameworks', 'Financial statement analysis', 'Cash flow and early-warning signals', 'Portfolio case studies'];
  return [
    { title: 'Information Security Awareness 2026', category: 'Compliance', difficulty: 'Beginner', duration: '2 h', mandatory: true, target: 'All employees', division: 'All divisions', progress: s.courseProgress, completion: infoDone, status: 'Published', objective: 'Recognise phishing, protect customer data and report incidents.', modules: ['Phishing red flags', 'Passwords and access', 'Data Protection Basics', 'Reporting an incident'], assessment: 'Checkpoint quiz · pass 80%', to: '/learning/course' },
    { title: TRAINING.title, category: 'Credit', difficulty: 'Advanced', duration: '4 modules · 16 h classroom', mandatory: false, target: 'Relationship Managers, Credit Analysts', division: 'Corporate Banking', progress: Math.round((s.tcourse.done / mods.length) * 100), completion: s.completed ? 94 : 0, status: s.courseSetup ? 'Published' : 'Draft', objective: 'Raise Credit Analysis from level 2 to level 4.', modules: mods, assessment: '20 objective + 1 descriptive · pass 70%', to: '/learning/training' },
    { title: 'Credit Fundamentals', category: 'Credit', difficulty: 'Beginner', duration: '4 h', mandatory: false, target: 'New credit officers', division: 'Corporate Banking', progress: 100, completion: 88, status: 'Published', objective: 'Core credit concepts before advanced training.', modules: ['Credit basics', 'Ratios', 'Cash-flow analysis'], assessment: 'Quiz · pass 70%', to: '/journey' },
    { title: 'AML & CFT Refresher', category: 'Compliance', difficulty: 'Intermediate', duration: '3 h', mandatory: true, target: 'All customer-facing staff', division: 'All divisions', progress: 0, completion: 71, status: 'Published', objective: 'Know the reporting thresholds and escalation steps.', modules: ['Typologies', 'Reporting thresholds', 'Escalation'], assessment: 'Proctored exam · pass 75%', to: '/assessment' },
    { title: 'Leadership Essentials', category: 'Leadership', difficulty: 'Intermediate', duration: '6 h', mandatory: false, target: 'Unit heads and team leads', division: 'All divisions', progress: 0, completion: 40, status: 'Published', objective: 'Coach, give feedback and lead change.', modules: ['Coaching', 'Feedback', 'Leading change'], assessment: 'Reflection + quiz', to: '/learning/course' },
    { title: 'Customer Experience Excellence', category: 'Customer', difficulty: 'Beginner', duration: '3 h', mandatory: false, target: 'Relationship Managers', division: 'Retail Banking', progress: 100, completion: 82, status: 'Published', objective: 'Handle complaints and build long-term relationships.', modules: ['Listening', 'Complaints', 'Follow-up'], assessment: 'Scenario quiz', to: '/learning/course' },
  ];
}
type Risk = 'Completed' | 'On track' | 'At risk' | 'Overdue';
const riskOf = (st: string, progress: number): Risk => (st === 'Completed' ? 'Completed' : st === 'Overdue' ? 'Overdue' : progress < 50 ? 'At risk' : 'On track');
const RISK: Record<Risk, Tone> = { Completed: 'ok', 'On track': 'info', 'At risk': 'warn', Overdue: 'brand' };
function learners(s: DemoState) {
  return s.enrollments.map((e) => {
    const p = findById(e.personId);
    const progress = e.personId === 'e1' ? s.courseProgress : e.progress;
    const status = e.personId === 'e1' && s.courseCompleted ? 'Completed' : e.status;
    return { id: e.id, name: p?.name ?? e.personId, division: p?.division ?? '', course: e.course, progress, last: progress === 0 ? 'Not started' : progress < 50 ? '9 days ago' : '2 days ago', due: e.due, risk: riskOf(status, progress), enrollmentId: e.id };
  }).sort((a, b) => a.progress - b.progress);
}

/* ---------------- small building blocks ---------------- */
function Tabs({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-canvas p-1" role="tablist">
      {options.map((o) => <button key={o} role="tab" aria-selected={value === o} onClick={() => onChange(o)} className={cx('rounded-md px-3 py-1.5 text-[15px]', value === o ? 'bg-white shadow-sm' : 'text-ink-2 hover:text-ink')}>{o}</button>)}
    </div>
  );
}
function Strip({ items }: { items: [string, string, (() => void)?][] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([n, l, go]) => (
        <li key={l}>{go
          ? <button onClick={go} className={cx(card, 'w-full px-5 py-4 text-left hover:shadow-md')}><div className="text-[32px] font-semibold leading-none tabular-nums">{n}</div><div className="mt-1.5 text-[15px] text-ink-2">{l}</div></button>
          : <div className={cx(card, 'px-5 py-4')}><div className="text-[32px] font-semibold leading-none tabular-nums">{n}</div><div className="mt-1.5 text-[15px] text-ink-2">{l}</div></div>}</li>
      ))}
    </ul>
  );
}
function Table({ head, rows, empty = 'Nothing to show.' }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[15px]">
        <thead className="text-[14px] text-ink-3"><tr>{head.map((h) => <th key={h} className="py-2 pr-3 font-normal">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className="py-2.5 pr-3 align-top">{c}</td>)}</tr>) : <tr><td colSpan={head.length} className="py-6 text-center text-ink-3">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
const Bar = ({ v, tone = 'bg-ok' }: { v: number; tone?: string }) => <span className="flex items-center gap-2"><span className="h-2 w-24 rounded-full bg-canvas"><span className={cx('block h-2 rounded-full', tone)} style={{ width: `${Math.min(100, v)}%` }} /></span><span className="tabular-nums text-ink-2">{v}%</span></span>;
const Flow = ({ steps, done = -1 }: { steps: string[]; done?: number }) => (
  <ol className="flex flex-wrap items-center gap-2">
    {steps.map((x, i) => <li key={x} className="flex items-center gap-2"><span className={cx('rounded-full px-3 py-1 text-[14px]', i <= done ? 'bg-ok-soft text-ok' : 'bg-canvas text-ink-2')}>{x}</span>{i < steps.length - 1 && <ArrowRight size={14} className="text-ink-3" />}</li>)}
  </ol>
);

/* ================================================================== */
export function Modules() {
  const [sp, setSp] = useSearchParams();
  const m = sp.get('m') as Key | null;
  const mod = CORE.find((x) => x.key === m);
  return mod ? <ModuleView k={mod.key} onBack={() => setSp({})} /> : <Explorer onOpen={(k) => setSp({ m: k })} />;
}

function Explorer({ onOpen }: { onOpen: (k: Key) => void }) {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-[1320px]">
      <header className="mb-8">
        <h1 className="text-[40px] font-semibold leading-tight tracking-tight">City Bank ELDP Modules</h1>
        <p className="mt-2 text-[18px] text-ink-2">Explore the platform areas that manage learning, training, capability, assessment and workforce development.</p>
        <p className="mt-1 text-[15px] text-ink-3">One connected platform for learning operations, employee development and workforce insight.</p>
      </header>
      <div className="relative">
        {/* the connected platform core */}
        <div className="pointer-events-none absolute inset-x-[16%] top-1/2 hidden h-px bg-line lg:block" aria-hidden />
        <ul className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CORE.map((x, i) => (
            <li key={x.key} className="anim-up" style={{ animationDelay: `${i * 60}ms` }}>
              <button onClick={() => onOpen(x.key)} className={cx(card, 'group flex h-full w-full flex-col px-6 py-5 text-left transition-shadow hover:shadow-lg hover:ring-ink/20', x.key === 'ai' && 'bg-[#f6f9fd]')}>
                <div className="flex items-start justify-between gap-3">
                  <span className={cx('grid h-12 w-12 place-items-center rounded-xl', x.key === 'ai' ? 'bg-sky-100 text-sky-800' : 'bg-brand-soft text-brand')}><x.icon size={22} /></span>
                  <Badge t={x.tone}>{x.status}</Badge>
                </div>
                <h2 className="mt-4 text-[22px] font-semibold leading-tight">{x.name}</h2>
                <p className="mt-1 text-[15px] text-ink-2">{x.line}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">{x.caps.map((c) => <li key={c} className="rounded-full bg-canvas px-2.5 py-0.5 text-[14px] text-ink-2">{c}</li>)}</ul>
                <span className="mt-auto flex items-center justify-between pt-5 text-[15px]"><span className="text-ink-3">{x.fr}</span><span className="flex items-center gap-1.5 font-medium text-brand group-hover:underline">Explore module <ArrowRight size={16} /></span></span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink-2">Also in the platform</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{SECONDARY.map((x) => <li key={x.name}><button onClick={() => nav(x.to)} className="rounded-full bg-white px-4 py-2 text-[15px] ring-1 ring-line hover:ring-ink/30">{x.name}</button></li>)}</ul>
      </section>
      <p className="mt-8"><SourceTag kind="fictional" /></p>
    </div>
  );
}

/* ================================================================== */
function ModuleView({ k, onBack }: { k: Key; onBack: () => void }) {
  const mod = CORE.find((x) => x.key === k)!;
  return (
    <div className="mx-auto max-w-[1320px]">
      <button onClick={onBack} className="flex items-center gap-2 text-[15px] text-ink-2 hover:text-brand"><ArrowLeft size={16} />All modules</button>
      <header className="mt-3 flex flex-wrap items-center gap-4">
        <span className={cx('grid h-14 w-14 place-items-center rounded-2xl', k === 'ai' ? 'bg-sky-100 text-sky-800' : 'bg-brand-soft text-brand')}><mod.icon size={26} /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{mod.name}</h1>
          <p className="text-[16px] text-ink-2">{mod.line} <span className="text-ink-3">· {mod.fr}</span></p>
        </div>
        <Badge t={mod.tone}>{mod.status}</Badge>
      </header>
      <div className="anim-fade mt-6 space-y-6">
        {k === 'lms' && <Lms />}
        {k === 'tms' && <Tms />}
        {k === 'ld' && <Ld />}
        {k === 'ai' && <Ai />}
        {k === 'comp' && <Comp />}
        {k === 'pta' && <Pta />}
      </div>
    </div>
  );
}

function Next({ label, go, note }: { label: string; go: () => void; note?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-4 ring-1 ring-line">
      <span className="text-[15px] text-ink-2">{note ?? 'Next step'}</span>
      <button onClick={go} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">{label} <ArrowRight size={16} /></button>
    </div>
  );
}

/* ---------------- LMS ---------------- */
function Lms() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Course Library');
  const [f, setF] = useState({ cat: 'All categories', diff: 'All levels', role: 'All roles', div: 'All divisions', mand: 'All', done: 'All' });
  const [open, setOpen] = useState<Course | null>(null);
  const cs = courses(s);
  const ls = learners(s);
  const certs = [
    ...(s.courseCompleted ? [{ t: 'Information Security Awareness 2026', who: 'Ayesha Rahman', date: '12 Nov 2026', no: 'CERT-2026-088412' }] : []),
    { t: 'Credit Fundamentals', who: 'Ayesha Rahman', date: '20 Aug 2026', no: 'CERT-2026-077310' },
    { t: 'AML & CFT Refresher 2025', who: 'Tanvir Hasan', date: '24 Nov 2025', no: 'CERT-2025-061925' },
    { t: 'Market Risk Fundamentals', who: 'Sadia Islam', date: '05 Jul 2026', no: 'CERT-2026-071204' },
  ];
  const shown = cs.filter((c) => (f.cat === 'All categories' || c.category === f.cat) && (f.diff === 'All levels' || c.difficulty === f.diff) && (f.role === 'All roles' || c.target.includes(f.role)) && (f.div === 'All divisions' || c.division === f.div || c.division === 'All divisions')
    && (f.mand === 'All' || (f.mand === 'Mandatory') === c.mandatory) && (f.done === 'All' || (f.done === 'Completed' ? c.progress === 100 : c.progress < 100)));
  const atRisk = ls.filter((l) => l.risk === 'At risk' || l.risk === 'Overdue');
  const completion = Math.round(cs.reduce((n, c) => n + c.completion, 0) / cs.length);
  return (
    <>
      <Strip items={[[String(cs.length), 'Courses', () => setTab('Course Library')], [String(ls.filter((l) => l.risk !== 'Completed' && l.progress > 0).length), 'Courses in progress', () => setTab('Learner Progress')], [`${completion}%`, 'Average completion'], [String(atRisk.length), 'Learners at risk', () => setTab('Learner Progress')]]} />
      <section className={cx(card, 'px-6 py-5')}>
        <div className="mb-4"><Flow steps={['Course', 'Modules', 'Lessons', 'Activities', 'Assessment', 'Feedback', 'Certificate']} /></div>
        <Tabs value={tab} options={['Course Library', 'Course Builder', 'Learning Paths', 'Enrollments', 'Learner Progress', 'Certificates']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Course Library' && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <select aria-label="Category" className={sel} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{['All categories', 'Compliance', 'Credit', 'Leadership', 'Customer'].map((x) => <option key={x}>{x}</option>)}</select>
                <select aria-label="Difficulty" className={sel} value={f.diff} onChange={(e) => setF({ ...f, diff: e.target.value })}>{['All levels', 'Beginner', 'Intermediate', 'Advanced'].map((x) => <option key={x}>{x}</option>)}</select>
                <select aria-label="Role" className={sel} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{['All roles', 'Relationship Managers', 'Credit Analysts', 'All employees'].map((x) => <option key={x}>{x}</option>)}</select>
                <select aria-label="Division" className={sel} value={f.div} onChange={(e) => setF({ ...f, div: e.target.value })}>{['All divisions', 'Corporate Banking', 'Retail Banking'].map((x) => <option key={x}>{x}</option>)}</select>
                <select aria-label="Mandatory" className={sel} value={f.mand} onChange={(e) => setF({ ...f, mand: e.target.value })}>{['All', 'Mandatory', 'Optional'].map((x) => <option key={x}>{x}</option>)}</select>
                <select aria-label="Completion" className={sel} value={f.done} onChange={(e) => setF({ ...f, done: e.target.value })}>{['All', 'Completed', 'Not completed'].map((x) => <option key={x}>{x}</option>)}</select>
              </div>
              <Table head={['Course', 'Category', 'Level', 'Duration', 'Mandatory', 'Target', 'My progress', 'Completion', 'Status']}
                rows={shown.map((c) => [<button key="t" onClick={() => setOpen(c)} className="text-left hover:text-brand">{c.title}</button>, c.category, c.difficulty, c.duration, c.mandatory ? 'Yes' : 'No', <span key="g" className="text-ink-2">{c.target}</span>, <Bar key="p" v={c.progress} />, `${c.completion}%`, <Badge key="s" t={c.status === 'Published' ? 'ok' : 'warn'}>{c.status}</Badge>])} empty="No courses match these filters." />
            </>
          )}
          {tab === 'Course Builder' && (
            <div className="grid gap-5 lg:grid-cols-2">
              {cs.slice(0, 2).map((c) => (
                <div key={c.title} className="rounded-xl bg-canvas/60 px-5 py-4">
                  <div className="text-[17px] font-medium">{c.title}</div>
                  <ol className="mt-2 space-y-1 text-[15px]">{c.modules.map((x, i) => <li key={x}>{i + 1}. {x} <span className="text-ink-3">· lessons, activities</span></li>)}</ol>
                  <p className="mt-2 text-[14px] text-ink-3">Assessment: {c.assessment} · feedback · certificate</p>
                  {c.title === TRAINING.title && <button onClick={() => nav('/trainer/course-setup')} className={cx(btn2, 'mt-3')}>Open course setup</button>}
                </div>
              ))}
            </div>
          )}
          {tab === 'Learning Paths' && (
            <div className="space-y-4">
              <div><div className="mb-2 text-[16px] font-medium">Credit Analysis · level 2 → 4</div><Flow steps={['Credit Fundamentals', 'Financial Analysis', TRAINING.title, 'Assessment', 'Competency Review']} done={s.journeyDone - 1 + (s.pta.released ? 1 : 0)} /></div>
              <div><div className="mb-2 text-[16px] font-medium">Mandatory compliance · annual</div><Flow steps={['Information Security Awareness', 'AML & CFT Refresher', 'Code of Conduct']} done={s.courseCompleted ? 0 : -1} /></div>
              <button onClick={() => nav('/journey')} className={btn2}>Open learning journey</button>
            </div>
          )}
          {tab === 'Enrollments' && <Table head={['Course', 'Enrolled', 'Completed', 'In progress', 'Not started', 'Overdue']} rows={[['Information Security Awareness 2026', ...(['', 'Completed', 'In progress', 'Not started', 'Overdue'] as const).map((st) => String(st ? s.enrollments.filter((e) => e.status === st).length : s.enrollments.length))], [TRAINING.title, String(roster(s).length), s.completed ? String(attendedIds(s).length) : '0', String(s.tcourse.started ? 1 : 0), String(Math.max(0, roster(s).length - (s.tcourse.started ? 1 : 0))), '0']]} />}
          {tab === 'Learner Progress' && <Table head={['Employee', 'Course', 'Progress', 'Last activity', 'Due', 'Status', '']} rows={ls.map((l) => [<span key="n">{l.name}<span className="block text-[14px] text-ink-3">{l.division}</span></span>, l.course, <Bar key="b" v={l.progress} tone={l.risk === 'Overdue' ? 'bg-brand' : l.risk === 'At risk' ? 'bg-amber-400' : 'bg-ok'} />, l.last, l.due, <Badge key="r" t={RISK[l.risk]}>{l.risk}</Badge>, l.risk === 'At risk' || l.risk === 'Overdue' ? <button key="a" onClick={() => s.sendReminders([l.enrollmentId])} className={btn2}>Send reminder</button> : null])} />}
          {tab === 'Certificates' && <Table head={['Certificate', 'Employee', 'Completion date', 'Number', 'QR', '']} rows={certs.map((c) => [c.t, c.who, c.date, <span key="n" className="tabular-nums">{c.no}</span>, <Badge key="q" t="ok">Verified</Badge>, <button key="d" onClick={() => nav('/employee/certificates')} className={btn2}>Download</button>])} />}
        </div>
      </section>
      <Next label="Open the mandatory course" go={() => nav('/learning/course')} note="See a course as a learner: lessons, checkpoint and certificate." />
      <Drawer open={open !== null} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="space-y-4 text-[16px]">
            <dl className="divide-y divide-line border-y border-line">
              {([['Description', `${open.category} · ${open.difficulty}`], ['Objective', open.objective], ['Duration', open.duration], ['Target learners', open.target], ['Completion criteria', 'All modules and the assessment passed'], ['Assessment', open.assessment], ['Feedback', 'Course and trainer feedback after completion'], ['Certificate', 'Issued with QR verification'], ['Completion rate', `${open.completion}%`]] as [string, string][]).map(([a, b]) => <div key={a} className="grid grid-cols-[150px_1fr] gap-4 py-2.5"><dt className="text-ink-3">{a}</dt><dd>{b}</dd></div>)}
            </dl>
            <div><div className="mb-1 text-[15px] text-ink-3">Modules</div><ol className="space-y-1">{open.modules.map((x, i) => <li key={x}>{i + 1}. {x}</li>)}</ol></div>
            <button onClick={() => nav(open.to)} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Open course <ArrowRight size={16} /></button>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ---------------- TMS ---------------- */
function Tms() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Planned Training');
  const ros = roster(s);
  const planned = [
    ...(s.scheduled ? [{ t: TRAINING.title, d: '18–19 Nov 2026', v: s.sched.venue, o: 'City Bank L&D', tr: s.sched.trainers.map((x) => x.name).join(', '), p: ros.length, st: s.completed ? 'Completed' : 'Scheduled', b: s.budgetApproved ? 'Approved' : 'Pending', a: s.attendanceSubmitted ? `${attendedIds(s).length} of ${ros.length}` : 'Pending' }] : []),
    ...s.programmes.map((p) => ({ t: p.title, d: p.date, v: p.venue, o: 'City Bank L&D', tr: p.trainer, p: p.participants, st: p.status, b: 'Approved', a: p.attended === null ? 'Pending' : `${p.attended} of ${p.participants}` })),
  ];
  const marks = Object.values(s.attendance);
  const att = { present: marks.filter((x) => x === 'Present').length, absent: marks.filter((x) => x === 'Absent').length, excused: marks.filter((x) => x === 'Excused').length, self: Object.values(s.selfMarked).filter(Boolean).length };
  const actual = Number((s.planned.actualExpense || '0').replace(/[^0-9]/g, '')) || 0;
  return (
    <>
      <Strip items={[[String(planned.length), 'Planned training', () => setTab('Planned Training')], [String(planned.filter((x) => x.st !== 'Completed').length), 'Upcoming sessions', () => setTab('Training Calendar')], [String(TRAINERS.length), 'Trainers', () => setTab('Trainers and Venues')], [String(s.bonds.length), 'Training bonds', () => setTab('Costs and Bonds')]]} />
      <section className={cx(card, 'px-6 py-5')}>
        <Tabs value={tab} options={['Planned Training', 'Training Calendar', 'Trainers and Venues', 'Attendance', 'Costs and Bonds', 'Training Database', 'Reports']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Planned Training' && <Table head={['Training', 'Date', 'Venue', 'Organizer', 'Trainer', 'People', 'Status', 'Budget', 'Attendance']} rows={planned.map((x) => [x.t, x.d, x.v, x.o, x.tr, String(x.p), <Badge key="s">{x.st}</Badge>, x.b, x.a])} />}
          {tab === 'Training Calendar' && <Table head={['Date', 'Session', 'Type', 'Venue booking', 'Trainer', 'Conflicts']} rows={[...planned.map((x) => [x.d, x.t, /Webinar/.test(x.v) ? 'Webinar' : 'Classroom', x.v, x.tr, VENUES.find((v) => v.name === x.v)?.bookedOn.length ? <Badge key="c" t="warn">Venue booked on {VENUES.find((v) => v.name === x.v)!.bookedOn.join(', ')}</Badge> : <Badge key="c" t="ok">None</Badge>]), ...(s.nominationSubmitted ? [['18 Nov 2026', 'Participant conflicts', '—', '—', '—', <Badge key="p" t="warn">4 flagged at nomination</Badge>]] : [])]} />}
          {tab === 'Trainers and Venues' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Table head={['Trainer', 'Type', 'Sessions', 'Material']} rows={TRAINERS.map((t) => [<span key="n">{t.name}<span className="block text-[14px] text-ink-3">{t.designation} · {t.institute}</span></span>, t.type, String(planned.filter((p) => p.tr.includes(t.name)).length), t.name === 'Nafis Ahmed' ? (s.materialLinked ? 'Linked' : s.materialUploaded ? 'Uploaded' : '—') : '—'])} />
              <Table head={['Venue', 'Capacity', 'Booked on']} rows={VENUES.map((v, i) => [<span key="n">{v.name}<span className="block text-[14px] text-ink-3">{v.address}</span></span>, String([60, 30, 200, 40][i] ?? 40), v.bookedOn.join(', ') || 'Free'])} />
            </div>
          )}
          {tab === 'Attendance' && <Strip items={[[String(ros.length), 'Participants'], [String(att.present), 'Present (Day 1)'], [String(att.absent + att.excused), 'Absent or excused'], [String(att.self), 'Self-marked']]} />}
          {tab === 'Costs and Bonds' && (
            <div className="space-y-4">
              <Strip items={[['BDT 14,40,000', 'Approved budget'], [actual ? `BDT ${actual.toLocaleString('en-IN')}` : '—', 'Actual expense'], [actual && ros.length ? `BDT ${Math.round(actual / ros.length).toLocaleString('en-IN')}` : '—', 'Cost per employee'], [s.planned.paymentNo || '—', 'Payment number']]} />
              <Table head={['Bond', 'Employee', 'Amount', 'Remaining liability']} rows={s.bonds.slice(0, 6).map((b) => [b.title, b.name, `BDT ${b.amount.toLocaleString('en-IN')}`, `BDT ${remainingLiability(b).toLocaleString('en-IN')}`])} empty="No bonds yet." />
            </div>
          )}
          {tab === 'Training Database' && <div className="flex flex-wrap items-center gap-4"><span className="text-[16px]">{s.dbRows.length} rows in the training database</span><button onClick={() => nav('/hr/training-db')} className={btn2}>Open training database</button></div>}
          {tab === 'Reports' && <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{['Employee-wise', 'Division-wise', 'Tag-wise', 'Period-wise', 'Gender-wise', 'Group-wise', 'Feedback', 'Training calendar', 'Multiple criteria', 'Scheduled distribution'].map((r) => <li key={r}><button onClick={() => nav('/reports')} className="flex w-full items-center justify-between rounded-xl bg-canvas/60 px-4 py-3 text-left text-[15px] hover:bg-canvas">{r} report<ArrowRight size={15} className="text-ink-3" /></button></li>)}</ul>}
        </div>
      </section>
      <Next label="Open the training calendar" go={() => nav('/hr/calendar')} />
    </>
  );
}

/* ---------------- L&D ---------------- */
function Ld() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Training Needs');
  return (
    <>
      <Strip items={[[String(creditGap().length), 'Employees below target', () => setTab('Division Development')], [String(IDP_REQUESTS.length), 'Development requests', () => setTab('Development Plans')], [String(SURVEY.responses), 'Survey responses', () => setTab('Training Needs')], ['1', 'Active learning journey', () => setTab('Learning Journeys')]]} />
      <section className={cx(card, 'px-6 py-5')}>
        <div className="mb-4"><Flow steps={['Learning need', 'Competency gap', 'Development plan', 'Training or course', 'Assessment', 'Competency progress']} /></div>
        <Tabs value={tab} options={['Training Needs', 'Competency Frameworks', 'Development Plans', 'Learning Journeys', 'Division Development']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Training Needs' && <ul className="grid gap-3 md:grid-cols-3">{[['Competency and role gap', `${creditGap('Corporate Banking').length} officers below target`, s.tna.recommendation === 'accepted'], ['Survey or nomination output', `${SURVEY.responses} responses · ${SURVEY.top} on top`, s.tna.survey], ['Individual development requests', `${IDP_REQUESTS.length} requests`, s.tna.idpIds.length > 0]].map(([t, d, on], i) => <li key={String(t)} className="rounded-xl bg-canvas/60 px-5 py-4"><span className="text-[14px] text-ink-3">Source {i + 1}</span><span className="block text-[17px] font-medium">{t}</span><span className="block text-[15px] text-ink-2">{d}</span>{on && <Badge t="ok">Used in a request</Badge>}</li>)}</ul>}
          {tab === 'Competency Frameworks' && <Table head={['Framework', 'Description', 'Status', 'Level', 'Categories', 'Levels', 'Roles']} rows={[['Functional', 'Job skills such as Credit Analysis', 'Active', 'All levels', 'Credit, Risk, Operations', '1–5', 'Officers, analysts'], ['Leadership', 'Leading people and change', 'Active', 'Managers', 'Coaching, Decision making', '1–4', 'Unit heads'], ['Customer Experience', 'Serving customers well', 'Active', 'All levels', 'Service, Relationship', '1–5', 'Customer-facing'], ['Innovation', 'Improving how work is done', 'Inactive', 'All levels', 'Ideas, Experimentation', '1–4', 'All']].map((r) => r.map((c, i) => (i === 2 ? <Badge key="s" t={c === 'Active' ? 'ok' : 'neutral'}>{c}</Badge> : c)))} />}
          {tab === 'Development Plans' && <Table head={['Employee', 'Development need', 'Current', 'Target', 'Recommended learning', 'Status', 'Action']} rows={IDP_REQUESTS.map((r) => { const p = idpPerson(r); return [p?.name ?? '', r.area, `L${p?.creditLevel ?? 2}`, 'L4', r.learning, <Badge key="s" t={s.tna.idpIds.includes(r.id) ? 'ok' : 'warn'}>{s.tna.idpIds.includes(r.id) ? 'Used as evidence' : r.status}</Badge>, <button key="a" onClick={() => nav('/division')} className={btn2}>Review</button>]; })} />}
          {tab === 'Learning Journeys' && <div className="space-y-3"><Flow steps={['Current level 2', 'Recommended course', 'Training', 'Assessment', 'Manager review', 'Target level 4']} done={s.pta.released ? 3 : s.attendanceSubmitted ? 2 : s.tcourse.started ? 1 : 0} /><button onClick={() => nav('/journey')} className={btn2}>Open learning journey</button></div>}
          {tab === 'Division Development' && <Table head={['Competency', 'Level', 'Below target', 'Priority', 'Recommended']} rows={COMPETENCIES.map((c) => [c.name, `${c.current} → ${c.target}`, `${c.below} of ${c.total}`, c.priority, c.training ?? '—'])} />}
        </div>
      </section>
      <Next label="Open training needs" go={() => nav('/division')} note="Raise a training requirement from the three sources." />
    </>
  );
}

/* ---------------- AI ---------------- */
const QA: [string, (s: DemoState) => string][] = [
  ['Which course should I take next?', () => `${REC_TITLE}. Your role needs Credit Analysis at level 4 and you are at level 2.`],
  ['What is my competency gap?', () => 'Credit Analysis: level 2 of target 4, a gap of 2 levels.'],
  ['What training is mandatory for my role?', (s) => `Information Security Awareness 2026 (${s.courseCompleted ? 'complete' : `${s.courseProgress}% done, due 20 Nov`}) and AML & CFT Refresher.`],
  ['When is my next assessment?', (s) => (s.attendanceSubmitted && !s.ptaSubmitted ? 'Your post-training assessment is open now.' : 'AML Annual Certification opens on 30 Nov.')],
];
function Ai() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Training Recommendations');
  const [asked, setAsked] = useState<number | null>(null);
  const ls = learners(s).filter((l) => l.risk === 'At risk' || l.risk === 'Overdue');
  return (
    <>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[15px] text-sky-900"><Brain size={16} />AI-assisted · Human decision required</p>
      <section className={cx(card, 'px-6 py-5')}>
        <Tabs value={tab} options={['Training Recommendations', 'Compliance Risk', 'Feedback Intelligence', 'Learning Assistant']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Training Recommendations' && <Table head={['For', 'Skill gap', 'Role requirement', 'Mandatory', 'Recommended', 'Reason', 'Human review']} rows={[
            ['Corporate Banking', `Credit Analysis · ${creditGap('Corporate Banking').length} below`, 'Level 4', 'Credit risk training', REC_TITLE, 'Skill gap + role + mandatory rule', <Badge key="h" t={s.tna.recommendation === 'accepted' ? 'ok' : 'warn'}>{s.tna.recommendation === 'accepted' ? 'Accepted' : 'Waiting'}</Badge>],
            ['Ayesha Rahman', 'Credit Analysis 2 → 4', 'Level 4', 'Information Security', 'Advanced Financial Analysis', 'Next in her learning path', <Badge key="h" t="ok">Approved by L&D</Badge>],
            ['Nusrat Karim', 'Financial modelling', 'Level 3', '—', 'Financial Modelling for Bankers', 'Development request', <Badge key="h" t="warn">Waiting</Badge>],
          ]} />}
          {tab === 'Compliance Risk' && <Table head={['Employee', 'Course', 'Due', 'Progress', 'Risk', 'Reason', 'Action']} rows={ls.map((l) => [l.name, l.course, l.due, <Bar key="b" v={l.progress} tone={l.risk === 'Overdue' ? 'bg-brand' : 'bg-amber-400'} />, <Badge key="r" t={RISK[l.risk]}>{l.risk}</Badge>, l.progress === 0 ? 'Not started' : 'Low progress, no recent activity', <button key="a" onClick={() => s.sendReminders([l.enrollmentId])} className={btn2}>Send reminder</button>])} empty="Nobody at risk." />}
          {tab === 'Feedback Intelligence' && (s.feedbackSubmitted
            ? <div className="grid gap-4 md:grid-cols-3">{[['Sentiment', '89% positive · 4.6 / 5'], ['Main themes', 'Practical case studies · trainer clarity'], ['Recurring issues', 'Day 2 too short · room temperature'], ['Trainer feedback', 'Nafis Ahmed 4.7 / 5'], ['Course feedback', 'Relevance 4.5 · content 4.6'], ['Human review', 'Pending HR review']].map(([a, b]) => <div key={a} className="rounded-xl bg-canvas/60 px-4 py-3"><div className="text-[14px] text-ink-3">{a}</div><div className="text-[16px]">{b}</div></div>)}</div>
            : <p className="text-[16px] text-ink-2">Feedback analysis appears after participants submit feedback for {TRAINING.title}.</p>)}
          {tab === 'Learning Assistant' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <ul className="space-y-2">{QA.map(([q], i) => <li key={q}><button onClick={() => setAsked(i)} className={cx('w-full rounded-xl px-4 py-3 text-left text-[15px] ring-1', asked === i ? 'bg-sky-50 ring-sky-300' : 'ring-line hover:ring-ink/30')}>{q}</button></li>)}</ul>
              <div className="rounded-xl bg-[#f1f6fb] px-5 py-4 text-[16px]">{asked === null ? <span className="text-ink-2">Choose a question. Answers come from Ayesha Rahman's records.</span> : QA[asked][1](s)}</div>
            </div>
          )}
        </div>
      </section>
      <Next label="Review the training recommendation" go={() => nav('/division')} />
    </>
  );
}

/* ---------------- Competency ---------------- */
function Comp() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Competency Gaps');
  const gap = creditGap();
  return (
    <>
      <Strip items={[[String(COMPETENCIES.length), 'Competencies in use'], [String(gap.length), 'Employees below target', () => setTab('Competency Gaps')], [`L${CREDIT_TARGET}`, 'Credit Analysis target'], [String(DIRECTORY.filter((p) => p.creditLevel >= CREDIT_TARGET).length), 'At or above target']]} />
      <section className={cx(card, 'px-6 py-5')}>
        <Tabs value={tab} options={['Competency Gaps', 'Competency Assessment', 'Competency Journey', 'Frameworks']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Competency Gaps' && <Table head={['Competency', 'Employee', 'Role', 'Current', 'Target', 'Gap', 'Recommended', 'Status']} rows={gap.slice(0, 12).map((p) => ['Credit Analysis', p.name, p.designation, `L${p.creditLevel}`, `L${CREDIT_TARGET}`, String(CREDIT_TARGET - p.creditLevel), REC_TITLE, <Badge key="s" t={roster(s).some((e) => e.id === p.id) ? 'info' : 'neutral'}>{roster(s).some((e) => e.id === p.id) ? 'In training' : 'Not nominated'}</Badge>])} />}
          {tab === 'Competency Assessment' && <Table head={['Employee', 'Competency', 'Manager feedback', 'Survey input', 'Assessment', 'Criteria', 'Calculated level', 'Review']} rows={['e1', 'e2', 'e4'].map((id) => { const p = findById(id); const r = ptResults(s).find((x) => x.id === id); return [p?.name ?? id, 'Credit Analysis', id === 'e1' ? 'Strong analysis, needs speed' : 'Solid basics', '4.2 / 5', r && r.score !== null && s.pta.released ? `${r.score}%` : '—', 'Assessment 60% · manager 25% · survey 15%', r && s.pta.released && r.status === 'Passed' ? `L${Math.min(5, (p?.creditLevel ?? 2) + 1)}` : `L${p?.creditLevel ?? 2}`, <Badge key="v" t={s.pta.released ? 'ok' : 'neutral'}>{s.pta.released ? 'Ready for review' : 'Waiting for results'}</Badge>]; })} />}
          {tab === 'Competency Journey' && <Flow steps={['Current competency', 'Development activity', 'Training or course', 'Assessment', 'Review', 'Updated competency']} done={s.pta.released ? 3 : s.attendanceSubmitted ? 2 : s.tcourse.started ? 1 : 0} />}
          {tab === 'Frameworks' && <ul className="flex flex-wrap gap-2">{['Functional', 'Innovation', 'Collaboration', 'Customer Experience', 'Leadership', 'Execution Excellence'].map((x) => <li key={x} className="rounded-full bg-canvas px-4 py-2 text-[15px]">{x}</li>)}</ul>}
        </div>
      </section>
      <Next label="Open competency profile" go={() => nav('/competency')} />
    </>
  );
}

/* ---------------- Planned Training & Assessment ---------------- */
function Pta() {
  const s = useDemo();
  const nav = useNavigate();
  const [tab, setTab] = useState('Planned Training');
  const res = ptResults(s).filter((r) => r.status === 'Passed' || r.status === 'Failed');
  const pass = res.length ? Math.round((res.filter((r) => r.status === 'Passed').length / res.length) * 100) : null;
  const actual = Number((s.planned.actualExpense || '0').replace(/[^0-9]/g, '')) || 0;
  return (
    <>
      <Strip items={[[String(s.programmes.length + (s.scheduled ? 1 : 0)), 'Planned programmes', () => setTab('Planned Training')], [s.attendanceSubmitted ? 'Done' : 'Pending', 'Attendance'], [pass === null ? '—' : `${pass}%`, 'Pass rate', () => setTab('Assessment')], [String(res.filter((r) => r.status === 'Failed').length), 'Failed assessments', () => setTab('Assessment')]]} />
      <section className={cx(card, 'px-6 py-5')}>
        <Tabs value={tab} options={['Planned Training', 'Assessment']} onChange={setTab} />
        <div className="mt-4">
          {tab === 'Planned Training' && <Table head={['Training', 'Date', 'Venue', 'Trainer', 'People', 'Attendance', 'Feedback', 'Expense', 'Completion']} rows={[
            ...(s.scheduled ? [[TRAINING.title, '18–19 Nov 2026', s.sched.venue, 'Nafis Ahmed', String(roster(s).length), s.attendanceSubmitted ? `${attendedIds(s).length} attended` : 'Pending', s.feedbackSubmitted ? '4.6 / 5' : 'Pending', actual ? `BDT ${actual.toLocaleString('en-IN')}` : 'Not closed', <Badge key="c" t={s.completed ? 'ok' : 'info'}>{s.completed ? 'Closed' : 'Open'}</Badge>]] : []),
            ...s.programmes.map((p) => [p.title, p.date, p.venue, p.trainer, String(p.participants), p.attended === null ? 'Pending' : `${p.attended} attended`, p.status === 'Completed' ? '4.3 / 5' : 'Pending', p.status === 'Completed' ? 'Recorded' : '—', <Badge key="c">{p.status}</Badge>]),
          ]} />}
          {tab === 'Assessment' && <Table head={['Exam', 'Linked to', 'Question types', 'Participation', 'Evaluation', 'Result', 'Trainer decision', 'Integrity']} rows={[
            ['Post-training assessment', TRAINING.title, 'Objective + descriptive', s.attendanceSubmitted ? `${attendedIds(s).length} attendees` : 'After training', s.ptaSubmitted ? (s.pta.decision === 'pending' ? 'AI suggested · trainer to decide' : 'Decided') : 'Waiting for answers', s.pta.released ? `Released · ${pass}% pass` : 'Not released', s.pta.decision === 'pending' ? '—' : `${s.pta.descriptive} / 10`, 'Proctoring signals only'],
            ['AML Annual Certification', 'AML & CFT Refresher', 'Objective + descriptive', '118 candidates', s.aiScore.state === 'suggested' ? 'AI suggested · trainer to decide' : 'Decided', 'Scheduled release', s.aiScore.state === 'suggested' ? '—' : `${s.aiScore.score} / 10`, 'Proctored'],
          ]} />}
        </div>
      </section>
      <Next label={s.ptaSubmitted && !s.pta.released ? 'Evaluate the assessment' : 'Open assessment results'} go={() => nav(s.ptaSubmitted && !s.pta.released ? '/assessment/review' : '/assessment/results')} />
    </>
  );
}
