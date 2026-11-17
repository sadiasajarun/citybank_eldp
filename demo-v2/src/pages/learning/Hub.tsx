/**
 * e-Learning hub (FR 190–205): My Learning, Course Catalog, Learning Paths, Goals, Discussion forum, Saved & offline,
 * Exams & results, Calendar, Points / badges / leaderboard, and Course Management (HR, trainer, admin).
 * Course content and the player for the mandatory course are the real story pages; others are simulated.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Award, Bookmark, BookOpen, CheckCircle2, Clock, Download, History, MessageSquare, Play, Plus, Search, ShieldCheck, Star, Target, Trophy, Upload, Users, WifiOff } from 'lucide-react';
import { TRAINING } from '../../data';
import { ptResults, useDemo } from '../../store';
import { BADGES, COURSES, EXAMS, LEADERBOARD, LEARNING_PATHS, POINT_RULES, TOP_SCORERS, type Course } from '../../seed/bank';
import { courseRoute, myCourses, myPoints } from '../employee/LearnerDash';
import { MonthGrid, type CalEvent } from '../employee/MyLearning';
import { StatCard, Panel } from '../../components/Dash';
import { ProgressRing } from '../../components/charts';
import { Badge, cx, Drawer, Modal } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { useT } from '../../i18n';

type Tab = 'my' | 'catalog' | 'paths' | 'goals' | 'forum' | 'saved' | 'exams' | 'calendar' | 'leaderboard' | 'manage';
const inputCls = 'min-h-11 rounded-lg border border-line bg-white px-3 text-[15px] outline-none focus:border-brand';

function CourseCard({ c, pct, onOpen }: { c: Course; pct: number; onOpen: () => void }) {
  const s = useDemo();
  const t = useT();
  const marked = s.learn.bookmarks.includes(c.id);
  const saved = s.learn.downloads.some((d) => d.id === c.id);
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className="relative h-[110px] px-4 py-3 text-white" style={{ background: c.color }}>
        <div className="flex items-start justify-between gap-2"><span className="rounded-md bg-black/25 px-2 py-0.5 text-[13px] font-medium">{c.category}</span><ProgressRing value={pct} size={44} stroke={4} color="#fff" /></div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between"><span className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px] font-semibold text-ink">{c.format}</span>{c.mandatory && <span className="rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-semibold ring-1 ring-white/40">{t('Mandatory')}</span>}</div>
      </div>
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <div className="text-[17px] font-semibold leading-snug">{c.title}</div>
        <div className="mt-0.5 text-[14px] text-ink-3">{c.modules} modules · {c.hours} hrs · {c.level}</div>
        <div className="mt-3 flex items-center gap-3"><span className="h-1.5 flex-1 rounded-full bg-canvas"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${pct}%` }} /></span><span className="text-[14px] tabular-nums text-ink-2">{pct}%</span></div>
        <div className="mt-3 flex items-center gap-2 pt-1">
          <button onClick={onOpen} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-[15px] font-medium text-white hover:bg-brand-dark"><Play size={15} />{pct >= 100 ? t('Review course') : pct > 0 ? t('Resume lesson') : 'Start course'}</button>
          <button onClick={() => s.toggleBookmark(c.id)} aria-pressed={marked} title={marked ? 'Remove bookmark' : 'Bookmark'} className={cx('grid h-10 w-10 place-items-center rounded-lg border', marked ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-3 hover:text-ink')}><Bookmark size={17} /></button>
          <button onClick={() => s.toggleDownload(c.id, c.title)} aria-pressed={saved} title={saved ? 'Remove offline copy' : 'Save for offline'} className={cx('grid h-10 w-10 place-items-center rounded-lg border', saved ? 'border-ok bg-ok-soft text-ok' : 'border-line text-ink-3 hover:text-ink')}><Download size={17} /></button>
          {pct >= 100 && <a href="#/employee/certificates" title="Certificate" className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink-3 hover:text-ink"><Award size={17} /></a>}
        </div>
      </div>
    </li>
  );
}

export function LearningHub() {
  const s = useDemo();
  const nav = useNavigate();
  const t = useT();
  const [params, setParams] = useSearchParams();
  const staff = s.role !== 'employee';
  const tab = (params.get('tab') as Tab) || (staff ? 'manage' : 'my');
  const setTab = (x: Tab) => { params.set('tab', x); params.delete('course'); setParams(params, { replace: true }); };
  const empId = s.employeeId;
  const list = myCourses(s, empId);
  const pctOf = (id: string) => list.find((c) => c.id === id)?.pct ?? 0;
  const openId = params.get('course');
  const open = COURSES.find((c) => c.id === openId) ?? null;
  const openCourse = (c: Course) => {
    s.viewCourse(c.id);
    if (c.id === 'EL004') nav('/learning/course');
    else { params.set('course', c.id); setParams(params, { replace: true }); }
  };
  const avg = Math.round(list.reduce((n, c) => n + c.pct, 0) / Math.max(1, list.length));
  const mand = list.filter((c) => c.mandatory);

  const TABS: [Tab, string, number?][] = [
    ['my', 'My Learning', list.length], ['catalog', 'Course catalog', COURSES.filter((c) => c.status === 'Published').length], ['paths', 'Learning paths', LEARNING_PATHS.length],
    ['goals', 'My learning goals'], ['forum', 'Discussion forum', s.learn.forum.length], ['saved', 'Saved & offline', s.learn.bookmarks.length + s.learn.downloads.length],
    ['exams', 'Exams & results'], ['calendar', 'Calendar'], ['leaderboard', 'Leaderboard'],
    ...(staff ? [['manage', 'Course management', COURSES.length] as [Tab, string, number]] : []),
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[14px] text-ink-3">e-Learning · FR 190–205</div>
          <h1 className="text-[34px] font-semibold tracking-tight">{t('Learning hub')}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">Courses, paths, goals, the forum and your results in one place. <SourceTag kind="fictional" /></p>
        </div>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label={t('Enrolled courses')} value={list.length} icon={BookOpen} sub={`${list.filter((c) => c.pct > 0 && c.pct < 100).length} actively in progress`} /></li>
        <li><StatCard label={t('Average progress')} value={`${avg}%`} icon={Clock} tone="ink" bar={avg} sub="Across assigned courses" /></li>
        <li><StatCard label={t('Completed & certified')} value={list.filter((c) => c.pct >= 100).length} icon={CheckCircle2} tone="ok" sub="QR-verifiable certificates" onClick={() => nav('/employee/certificates')} /></li>
        <li><StatCard label={t('Mandatory compliance')} value={`${mand.filter((c) => c.pct >= 100).length} / ${mand.length}`} icon={ShieldCheck} tone="amber" sub="Annual BFIU & HR mandates" /></li>
      </ul>

      <div role="tablist" aria-label="Learning hub" className="mt-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
        {TABS.map(([k, l, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-3.5 py-2 text-[15px]', tab === k ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-2 hover:text-ink')}>{t(l)}{n !== undefined && <span className="ml-1 text-ink-3">({n})</span>}</button>)}
      </div>

      <div className="mt-6">
        {tab === 'my' && <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map((c) => <CourseCard key={c.id} c={c} pct={c.pct} onOpen={() => openCourse(c)} />)}</ul>}
        {tab === 'catalog' && <Catalog pctOf={pctOf} onOpen={openCourse} />}
        {tab === 'paths' && <Paths pctOf={pctOf} />}
        {tab === 'goals' && <Goals />}
        {tab === 'forum' && <Forum />}
        {tab === 'saved' && <Saved onOpen={openCourse} />}
        {tab === 'exams' && <Exams empId={empId} />}
        {tab === 'calendar' && <CalendarTab />}
        {tab === 'leaderboard' && <Board empId={empId} />}
        {tab === 'manage' && staff && <Manage />}
      </div>

      <Drawer open={!!open} onClose={() => { params.delete('course'); setParams(params, { replace: true }); }} title={open?.title ?? ''}>
        {open && <CourseDetail c={open} pct={pctOf(open.id)} />}
      </Drawer>
    </div>
  );
}

function CourseDetail({ c, pct }: { c: Course; pct: number }) {
  const s = useDemo();
  const posts = s.learn.forum.filter((f) => f.course === c.title);
  const [q, setQ] = useState('');
  return (
    <div className="space-y-5 text-[16px]">
      <div className="flex items-center gap-4"><ProgressRing value={pct} size={60} stroke={6} /><div><div className="text-[14px] text-ink-3">{c.category} · {c.format} · {c.version}</div><div className="text-[15px]">{c.modules} modules · {c.hours} hrs · {c.level} · Instructor {c.instructor}</div></div></div>
      <ol className="divide-y divide-line rounded-xl ring-1 ring-line">
        {Array.from({ length: Math.min(c.modules, 6) }, (_, i) => {
          const done = ((i + 1) / c.modules) * 100 <= pct;
          return <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-[15px]"><span className={cx('grid h-7 w-7 place-items-center rounded-full text-[13px]', done ? 'bg-ok text-white' : 'bg-canvas text-ink-3')}>{done ? <CheckCircle2 size={15} /> : i + 1}</span>Module {i + 1}{i === 0 ? ' · Introduction' : i === c.modules - 1 ? ' · Final quiz' : ''}</li>;
        })}
      </ol>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => useDemo.setState({ toast: `Opening ${c.title} in the player (simulated). Progress is tracked as xAPI statements.` })} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 font-medium text-white"><Play size={16} />{pct > 0 ? 'Resume where you left off' : 'Start course'}</button>
        <button onClick={() => s.toggleBookmark(c.id)} className="min-h-11 rounded-lg border border-line px-4">{s.learn.bookmarks.includes(c.id) ? 'Bookmarked' : 'Bookmark'}</button>
        <button onClick={() => s.toggleDownload(c.id, c.title)} className="min-h-11 rounded-lg border border-line px-4">{s.learn.downloads.some((d) => d.id === c.id) ? 'Saved offline' : 'Save offline'}</button>
      </div>
      <div>
        <h3 className="flex items-center gap-2 text-[17px] font-semibold"><MessageSquare size={17} />Course discussion ({posts.length})</h3>
        <ul className="mt-2 space-y-2">{posts.map((p) => <li key={p.id} className="rounded-lg bg-canvas px-3 py-2 text-[15px]"><b>{p.author}</b>: {p.text}<div className="text-[13px] text-ink-3">{p.replies.length} replies</div></li>)}</ul>
        <div className="mt-2 flex gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question about this course" className={cx(inputCls, 'flex-1')} /><button disabled={q.trim().length < 5} onClick={() => { s.postForum(c.title, q.trim()); setQ(''); }} className="min-h-11 rounded-lg bg-ink px-4 text-white disabled:opacity-40">Post</button></div>
      </div>
    </div>
  );
}

function Catalog({ pctOf, onOpen }: { pctOf: (id: string) => number; onOpen: (c: Course) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All categories');
  const cats = ['All categories', ...new Set(COURSES.map((c) => c.category))];
  const rows = COURSES.filter((c) => c.status === 'Published' && (cat === 'All categories' || c.category === cat) && `${c.title} ${c.category} ${c.instructor}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
        <label className="relative min-w-[260px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search course title, category or instructor" className={cx(inputCls, 'w-full pl-9')} /></label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls} aria-label="Category">{cats.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rows.map((c) => <CourseCard key={c.id} c={c} pct={pctOf(c.id)} onOpen={() => onOpen(c)} />)}</ul>
      {!rows.length && <p className="text-ink-2">No courses match.</p>}
    </div>
  );
}

function Paths({ pctOf }: { pctOf: (id: string) => number }) {
  return (
    <ul className="grid gap-5 lg:grid-cols-2">
      {LEARNING_PATHS.map((p) => {
        const pcts = p.steps.map(pctOf);
        const done = Math.round((pcts.filter((x) => x >= 100).length / p.steps.length) * 100);
        return (
          <li key={p.title} className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3"><h3 className="text-[19px] font-semibold">{p.title}</h3>{p.mandatory && <span className="rounded-full bg-brand px-2.5 py-0.5 text-[13px] font-semibold text-white">Mandatory</span>}</div>
            <p className="mt-1 text-[15px] text-ink-2">{p.desc}</p>
            <div className="mt-3 flex justify-between text-[14px]"><span className="text-ink-3">{p.steps.length} sequential courses · {p.steps.reduce((n, id) => n + (COURSES.find((c) => c.id === id)?.hours ?? 0), 0)} hrs</span><b>{done}% complete</b></div>
            <div className="mt-1.5 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${done}%` }} /></div>
            <ol className="mt-4 space-y-2">{p.steps.map((id, i) => { const c = COURSES.find((x) => x.id === id)!; const v = pcts[i]; const locked = i > 0 && pcts[i - 1] < 100 && v === 0; return <li key={id} className="flex items-center justify-between gap-3 rounded-lg bg-canvas px-3 py-2 text-[15px]"><span className={cx(locked && 'text-ink-3')}>{i + 1}. {c.title}{locked && ' · locked until the previous course is done'}</span><span className="tabular-nums text-ink-3">{v}%</span></li>; })}</ol>
          </li>
        );
      })}
    </ul>
  );
}

function Goals() {
  const s = useDemo();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: 'Complete Credit Appraisal — Fundamentals', kind: 'Course' as 'Course' | 'Competency' | 'Hours', target: '31 Dec 2026' });
  return (
    <Panel title="My learning goals" sub="Learning goals and KPI progress; your supervisor sees them on the team dashboard (FR 205–206)" action={<button onClick={() => setOpen(true)} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><Plus size={16} />Set a goal</button>}>
      <ul className="grid gap-4 md:grid-cols-2">
        {s.learn.goals.map((g) => (
          <li key={g.id} className="rounded-xl border border-line p-4">
            <div className="flex items-center gap-2 text-[16px] font-semibold"><Target size={17} className="text-brand" />{g.title}</div>
            <div className="mt-1 text-[14px] text-ink-3">{g.kind} · target {g.target}</div>
            <div className="mt-3 flex items-center gap-3"><span className="h-2 flex-1 rounded-full bg-canvas"><span className={cx('block h-2 rounded-full', g.progress >= 100 ? 'bg-ok' : 'bg-brand')} style={{ width: `${g.progress}%` }} /></span><span className="text-[14px] tabular-nums">{g.progress}%</span></div>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} title="Set a learning goal" footer={<><button onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-line px-4">Cancel</button><button onClick={() => { s.addGoal({ title: f.title, kind: f.kind, target: f.target, progress: 0 }); setOpen(false); }} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white">Save goal</button></>}>
        <div className="space-y-3 text-[15px]">
          <label className="block">Goal<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={cx(inputCls, 'mt-1 w-full')} /></label>
          <label className="block">Type<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as typeof f.kind })} className={cx(inputCls, 'mt-1 w-full')}>{['Course', 'Competency', 'Hours'].map((k) => <option key={k}>{k}</option>)}</select></label>
          <label className="block">Target date<input value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} className={cx(inputCls, 'mt-1 w-full')} /></label>
        </div>
      </Modal>
    </Panel>
  );
}

function Forum() {
  const s = useDemo();
  const [course, setCourse] = useState(COURSES[0].title);
  const [q, setQ] = useState('');
  const [reply, setReply] = useState<Record<string, string>>({});
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Panel title="Discussion forum" sub="Ask questions per course; trainers answer and good answers earn points">
        <ul className="space-y-4">
          {s.learn.forum.map((p) => (
            <li key={p.id} className="rounded-xl border border-line p-4">
              <div className="text-[13px] text-ink-3">{p.course}</div>
              <div className="mt-1 text-[16px]"><b>{p.author}</b> <span className="text-[14px] text-ink-3">· {p.role} · {p.at}</span></div>
              <p className="mt-1 text-[16px]">{p.text}</p>
              <ul className="mt-3 space-y-2 border-l-2 border-line pl-4">{p.replies.map((r, i) => <li key={i} className="text-[15px]"><b>{r.author}</b>{r.trainer && <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-ok">Trainer answer</span>} <span className="text-[13px] text-ink-3">· {r.at}</span><div>{r.text}</div></li>)}</ul>
              <div className="mt-3 flex gap-2"><input value={reply[p.id] ?? ''} onChange={(e) => setReply({ ...reply, [p.id]: e.target.value })} placeholder="Write a reply" className={cx(inputCls, 'flex-1')} /><button disabled={(reply[p.id] ?? '').trim().length < 3} onClick={() => { s.replyForum(p.id, reply[p.id].trim()); setReply({ ...reply, [p.id]: '' }); }} className="min-h-11 rounded-lg border border-line px-4 disabled:opacity-40">Reply</button></div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Ask a question" sub="Visible to learners and the trainer of the course">
        <label className="block text-[15px]">Course<select value={course} onChange={(e) => setCourse(e.target.value)} className={cx(inputCls, 'mt-1 w-full')}>{COURSES.filter((c) => c.status === 'Published').map((c) => <option key={c.id}>{c.title}</option>)}</select></label>
        <label className="mt-3 block text-[15px]">Question<textarea value={q} onChange={(e) => setQ(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line p-3 text-[15px] outline-none focus:border-brand" placeholder="What would you like to ask?" /></label>
        <button disabled={q.trim().length < 5} onClick={() => { s.postForum(course, q.trim()); setQ(''); }} className="mt-3 min-h-11 w-full rounded-lg bg-brand font-medium text-white disabled:opacity-40">Post question</button>
      </Panel>
    </div>
  );
}

function Saved({ onOpen }: { onOpen: (c: Course) => void }) {
  const s = useDemo();
  const marked = COURSES.filter((c) => s.learn.bookmarks.includes(c.id));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Bookmarks" sub="Courses and resources you saved">
        {marked.length ? <ul className="divide-y divide-line">{marked.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 py-2.5"><button onClick={() => onOpen(c)} className="min-w-0 truncate text-left text-[16px] hover:text-brand"><Bookmark size={15} className="mr-2 inline text-brand" />{c.title}</button><button onClick={() => s.toggleBookmark(c.id)} className="text-[14px] text-ink-3 hover:text-ink">Remove</button></li>)}</ul> : <p className="text-ink-2">No bookmarks yet. Use the bookmark button on any course.</p>}
      </Panel>
      <Panel title="Downloads for offline learning" sub="Encrypted on the device; progress syncs when you are back online (FR 193) · simulated">
        {s.learn.downloads.length ? <ul className="divide-y divide-line">{s.learn.downloads.map((d) => <li key={d.id} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0"><span className="block truncate text-[16px]"><WifiOff size={15} className="mr-2 inline text-ok" />{d.title}</span><span className="text-[13px] text-ink-3">{d.size} · available offline until {d.until}</span></span><button onClick={() => s.toggleDownload(d.id, d.title)} className="text-[14px] text-ink-3 hover:text-ink">Remove</button></li>)}</ul> : <p className="text-ink-2">Nothing saved offline.</p>}
      </Panel>
    </div>
  );
}

function Exams({ empId }: { empId: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const res = ptResults(s).find((r) => r.id === empId);
  const mine = [
    { title: `${TRAINING.title} · post-training assessment`, date: '20 Nov 2026', status: s.pta.released && res ? res.status : s.ptaSubmitted ? 'Submitted' : s.attendanceSubmitted ? 'Open' : 'Upcoming', score: s.pta.released && res ? `${res.score}%` : '—', go: () => nav('/learning/training/assessment') },
    { title: 'AML Annual Certification Assessment', date: '30 Nov 2026', status: 'Upcoming', score: '—', go: () => nav('/assessment/take/EX007') },
    { title: 'Market Risk Fundamentals — final quiz', date: '05 Jul 2026', status: 'Passed', score: '91%', go: () => undefined },
    { title: 'Credit Fundamentals — final quiz', date: '20 Aug 2026', status: 'Passed', score: '88%', go: () => undefined },
    { title: 'AML & CFT Refresher 2025', date: '24 Nov 2025', status: 'Passed', score: '84%', go: () => undefined },
  ];
  return (
    <Panel title="Exams & results" sub="Upcoming exams, latest results, enrolled and completed (FR 205, 217)">
      <table className="w-full text-left text-[15px]">
        <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Exam', 'Date', 'Status', 'Score', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{mine.map((e) => <tr key={e.title}><td className="py-2.5 pr-4">{e.title}</td><td className="py-2.5 pr-4 text-ink-2">{e.date}</td><td className="py-2.5 pr-4"><Badge>{e.status}</Badge></td><td className="py-2.5 pr-4 tabular-nums">{e.score}</td><td className="py-2.5 text-right">{['Upcoming', 'Open'].includes(e.status) && <button onClick={e.go} className="rounded-lg border border-line px-3 py-1.5 text-[14px] hover:border-ink/30">Open</button>}</td></tr>)}</tbody>
      </table>
      <p className="mt-3 text-[14px] text-ink-3">{EXAMS.filter((e) => e.status === 'Upcoming' || e.status === 'Live').length} bank exams are upcoming or live this month.</p>
    </Panel>
  );
}

function CalendarTab() {
  const s = useDemo();
  const events: CalEvent[] = useMemo(() => [
    ...(s.participation[s.employeeId] ? [{ day: 18, label: `${TRAINING.title} · Day 1`, tone: 'brand' as const }, { day: 19, label: `${TRAINING.title} · Day 2`, tone: 'brand' as const }] : []),
    { day: 20, label: 'Information Security Awareness due', tone: 'warn' }, { day: 20, label: 'Post-training assessment', tone: 'info' },
    { day: 22, label: 'Training feedback due', tone: 'ok' }, { day: 25, label: 'Islamic Banking Products (batch)', tone: 'info' }, { day: 30, label: 'AML Annual Certification exam', tone: 'brand' },
  ], [s.participation, s.employeeId]);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Panel title="Calendar" sub="Training, course deadlines, exams and feedback (FR 2, 205)"><MonthGrid year={2026} month={10} events={events} /></Panel>
      <Panel title="This month" sub="November 2026"><ul className="divide-y divide-line">{[...events].sort((a, b) => a.day - b.day).map((e, i) => <li key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-2.5 text-[15px]"><span className="font-semibold tabular-nums">{e.day} Nov</span><span>{e.label}</span></li>)}</ul></Panel>
    </div>
  );
}

function Board({ empId }: { empId: string }) {
  const s = useDemo();
  const pts = myPoints(s, empId);
  const board = LEADERBOARD.map((l) => (l.me ? { ...l, points: pts } : l)).sort((a, b) => b.points - a.points);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel title="Leaderboard" sub="Points from courses, exams, feedback and forum help (FR 205)">
        <ol className="divide-y divide-line">{board.map((l, i) => <li key={l.name} className={cx('flex items-center gap-4 py-3', l.me && 'rounded-lg bg-brand-soft/50 px-2')}><span className={cx('grid h-9 w-9 place-items-center rounded-full font-bold', i === 0 ? 'bg-amber-100 text-amber-800' : i < 3 ? 'bg-canvas text-ink' : 'text-ink-3')}>{i + 1}</span><span className="flex-1"><span className="block text-[16px] font-medium">{l.name}{l.me && ' (you)'}</span><span className="text-[14px] text-ink-3">{l.division} · {l.badges} badges</span></span><span className="text-[18px] font-semibold tabular-nums">{l.points.toLocaleString('en-IN')}</span></li>)}</ol>
      </Panel>
      <div className="space-y-6">
        <Panel title="Top scorer gallery" sub="Star for the top exam performer of the month (FR 219)">
          <ul className="grid gap-3">{TOP_SCORERS.map((x) => <li key={x.exam} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[15px] font-bold text-amber-700 ring-1 ring-amber-200">{x.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><span className="flex-1"><span className="block font-medium"><Star size={14} className="mr-1 inline fill-amber-400 text-amber-500" />{x.name} · {x.score}%</span><span className="text-[13px] text-ink-3">{x.exam}</span></span></li>)}</ul>
        </Panel>
        <Panel title="Badges and point rules">
          <ul className="flex flex-wrap gap-2">{BADGES.map((b) => <li key={b.id} title={b.desc} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px]', b.earned ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-canvas text-ink-3')}><Award size={14} />{b.name}</li>)}</ul>
          <ul className="mt-4 divide-y divide-line">{POINT_RULES.map(([r, p]) => <li key={r} className="flex justify-between py-2 text-[15px]"><span>{r}</span><b className="tabular-nums">+{p}</b></li>)}</ul>
        </Panel>
      </div>
    </div>
  );
}

function Manage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All categories');
  const [st, setSt] = useState('All statuses');
  const rows = COURSES.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()) && (cat === 'All categories' || c.category === cat) && (st === 'All statuses' || c.status === st));
  const sim = (msg: string) => useDemo.setState({ toast: `${msg} (simulated)` });
  return (
    <Panel title="Course management · authoring & enrolment" sub="Author SCORM / xAPI / cmi5 / H5P / video courses, manage versions and run targeted enrolments (FR 190–200)"
      action={<div className="flex flex-wrap gap-2"><button onClick={() => sim('Upload SCORM / video package')} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Upload size={16} />Upload SCORM / video</button><button onClick={() => sim('Bulk enrolment by division, grade or designation')} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Users size={16} />Bulk enrol</button><a href="#/trainer/course-setup" className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><Plus size={16} />Course builder</a></div>}>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses by title" className={cx(inputCls, 'w-full pl-9')} /></label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={inputCls} aria-label="Category">{['All categories', ...new Set(COURSES.map((c) => c.category))].map((c) => <option key={c}>{c}</option>)}</select>
        <select value={st} onChange={(e) => setSt(e.target.value)} className={inputCls} aria-label="Status">{['All statuses', 'Published', 'Draft', 'Archived'].map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[15px]">
          <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['ID', 'Course title', 'Version', 'Format', 'Mandatory', 'Enrolled', 'Completion', 'Status', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="py-3 pr-4 font-mono text-[13px] text-ink-2">{c.id}</td>
                <td className="py-3 pr-4"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.title}</td>
                <td className="py-3 pr-4"><span className="rounded border border-line px-1.5 font-mono text-[13px]">{c.version}</span></td>
                <td className="py-3 pr-4"><span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[13px] text-sky-800">{c.format}</span></td>
                <td className="py-3 pr-4">{c.mandatory ? <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[13px] text-amber-800">Yes</span> : <span className="text-ink-3">No</span>}</td>
                <td className="py-3 pr-4 tabular-nums">{c.enrolled}</td>
                <td className="py-3 pr-4"><span className="flex items-center gap-2"><span className="h-1.5 w-20 rounded-full bg-canvas"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${c.completion}%` }} /></span><span className="tabular-nums">{c.completion}%</span></span></td>
                <td className="py-3 pr-4"><Badge>{c.status}</Badge></td>
                <td className="py-3 text-right whitespace-nowrap"><button onClick={() => sim(`${c.id} version history: ${c.version} · updated ${c.updated}`)} title="Version history" className="rounded p-1.5 text-ink-3 hover:bg-canvas hover:text-ink"><History size={17} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-[14px] text-ink-3"><Trophy size={14} />Completion feeds points and the leaderboard · <Star size={14} />Top scorers appear in the gallery</p>
    </Panel>
  );
}
