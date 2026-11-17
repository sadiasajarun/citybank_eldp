/** Employee dashboard block (FR 205): progress, last viewed course, goals, upcoming, results, points and badges. */
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, Clock, Medal, PlayCircle, ShieldCheck, Star, Target, Trophy } from 'lucide-react';
import { TRAINING } from '../../data';
import { courseOf, ptResults, useDemo, type DemoState } from '../../store';
import { BADGES, COURSES, LEADERBOARD, type Course } from '../../seed/bank';
import { LinkAction, Panel, StatCard } from '../../components/Dash';
import { ProgressRing } from '../../components/charts';
import { cx } from '../../components/ui';
import { useT } from '../../i18n';

/** The learner's course list: the seed courses, with the live mandatory course (EL004) from the story store. */
export function myCourses(s: DemoState, empId: string): (Course & { pct: number })[] {
  const isa = courseOf(s, empId);
  return COURSES.filter((c) => c.status === 'Published' && (c.my !== undefined || c.id === 'EL004')).map((c) => ({ ...c, pct: c.id === 'EL004' ? (isa.completed ? 100 : isa.progress) : c.my ?? 0 }));
}
export const courseRoute = (id: string) => (id === 'EL004' ? '/learning/course' : `/learning/hub?course=${id}`);

export function myPoints(s: DemoState, empId: string): number {
  const base = LEADERBOARD.find((l) => l.me)?.points ?? 2000;
  const passed = ptResults(s).some((r) => r.id === empId && r.status === 'Passed') && s.pta.released;
  return base + (courseOf(s, empId).completed ? 100 : 0) + (passed ? 150 : 0) + (s.feedbackSubmitted ? 15 : 0) + s.learn.extraPoints;
}

export function LearnerOverview({ empId, upcoming }: { empId: string; upcoming: { key: string; date: string; title: string; status: string; go: () => void }[] }) {
  const s = useDemo();
  const nav = useNavigate();
  const t = useT();
  const list = myCourses(s, empId);
  const avg = Math.round(list.reduce((n, c) => n + c.pct, 0) / Math.max(1, list.length));
  const done = list.filter((c) => c.pct >= 100).length;
  const mand = list.filter((c) => c.mandatory);
  const mandDone = mand.filter((c) => c.pct >= 100).length;
  const last = list.find((c) => c.id === s.learn.lastViewed) ?? list.find((c) => c.pct > 0 && c.pct < 100) ?? list[0];
  const inProgress = list.filter((c) => c.pct > 0 && c.pct < 100 && c.id !== last.id).slice(0, 2);
  const res = ptResults(s).find((r) => r.id === empId);
  const results: { name: string; score: string; ok: boolean }[] = [
    ...(s.pta.released && res && (res.status === 'Passed' || res.status === 'Failed') ? [{ name: `${TRAINING.title} · post-training`, score: `${res.score}% · ${res.status}`, ok: res.status === 'Passed' }] : []),
    { name: 'Market Risk Fundamentals', score: '91% · Passed', ok: true },
    { name: 'Credit Fundamentals', score: '88% · Passed', ok: true },
    { name: 'AML & CFT Refresher 2025', score: '84% · Passed', ok: true },
  ].slice(0, 3);
  const pts = myPoints(s, empId);
  const board = [...LEADERBOARD].map((l) => (l.me ? { ...l, points: pts } : l)).sort((a, b) => b.points - a.points);
  const rank = board.findIndex((l) => l.me) + 1;
  const open = (c: Course) => { s.viewCourse(c.id); nav(courseRoute(c.id)); };

  return (
    <div className="mb-8 space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label={t('Enrolled courses')} value={list.length} icon={BookOpen} sub={`${list.filter((c) => c.pct > 0 && c.pct < 100).length} actively in progress`} onClick={() => nav('/learning/hub')} /></li>
        <li><StatCard label={t('Average progress')} value={`${avg}%`} icon={Clock} tone="ink" bar={avg} sub="Across assigned courses" onClick={() => nav('/learning/hub')} /></li>
        <li><StatCard label={t('Completed & certified')} value={done} icon={CheckCircle2} tone="ok" sub="QR-verifiable certificates" onClick={() => nav('/employee/certificates')} /></li>
        <li><StatCard label={t('Mandatory compliance')} value={`${mandDone} / ${mand.length}`} icon={ShieldCheck} tone="amber" sub="Annual BFIU & HR mandates" trend={mandDone < mand.length ? `${mand.length - mandDone} due` : 'On track'} trendTone={mandDone < mand.length ? 'warn' : 'ok'} onClick={() => nav('/learning/hub')} /></li>
      </ul>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={t('Continue where you left off')} sub="Last viewed course and the others you have started" action={<LinkAction onClick={() => nav('/learning/hub')}>{t('Learning hub')}</LinkAction>}>
          <button onClick={() => open(last)} className="flex w-full items-center gap-5 rounded-xl p-4 text-left text-white" style={{ background: last.color }}>
            <ProgressRing value={last.pct} size={64} stroke={6} color="#fff" />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] opacity-80">{last.category} · {last.format}{last.mandatory ? ' · Mandatory' : ''}</span>
              <span className="block text-[20px] font-semibold leading-snug">{last.title}</span>
              <span className="block text-[14px] opacity-80">{last.modules} modules · {last.hours} hrs · {last.level}</span>
            </span>
            <span className="hidden items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-[15px] font-medium sm:flex"><PlayCircle size={18} />{last.pct >= 100 ? t('Review course') : t('Resume lesson')}</span>
          </button>
          <ul className="mt-3 divide-y divide-line">
            {inProgress.map((c) => (
              <li key={c.id}><button onClick={() => open(c)} className="flex w-full items-center gap-4 py-3 text-left hover:text-brand">
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-medium">{c.title}</span><span className="text-[14px] text-ink-3">{c.format} · {c.modules} modules</span></span>
                <span className="w-32"><span className="block h-1.5 rounded-full bg-canvas"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${c.pct}%` }} /></span><span className="text-[13px] tabular-nums text-ink-3">{c.pct}%</span></span>
              </button></li>
            ))}
          </ul>
        </Panel>

        <Panel title={t('My learning goals')} sub="Learning goal and KPI progress (FR 205–206)" action={<LinkAction onClick={() => nav('/learning/hub?tab=goals')}>{t('Set a goal')}</LinkAction>}>
          <ul className="space-y-4">
            {s.learn.goals.slice(0, 4).map((g) => (
              <li key={g.id}>
                <div className="flex items-center justify-between gap-3 text-[15px]"><span className="flex items-center gap-2 font-medium"><Target size={16} className="text-brand" />{g.title}</span><span className="tabular-nums text-ink-3">{g.progress}%</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-canvas"><div className={cx('h-2 rounded-full', g.progress >= 100 ? 'bg-ok' : 'bg-brand')} style={{ width: `${g.progress}%` }} /></div>
                <div className="mt-1 text-[13px] text-ink-3">{g.kind} · by {g.target}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={t('Upcoming')} sub="Training, courses, exams and feedback" action={<LinkAction onClick={() => nav('/learning/hub?tab=calendar')}>{t('Calendar')}</LinkAction>}>
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 4).map((a) => <li key={a.key}><button onClick={a.go} className="grid w-full grid-cols-[64px_minmax(0,1fr)] gap-3 py-2.5 text-left hover:text-brand"><span className="text-[14px] font-semibold tabular-nums text-ink-2">{a.date}</span><span className="min-w-0"><span className="block truncate text-[15px]">{a.title}</span><span className="text-[13px] text-ink-3">{a.status}</span></span></button></li>)}
            {!upcoming.length && <li className="py-3 text-[15px] text-ink-2">Nothing scheduled.</li>}
          </ul>
        </Panel>
        <Panel title={t('Latest results')} sub="Exams and assessments" action={<LinkAction onClick={() => nav('/learning/hub?tab=exams')}>{t('Exams & results')}</LinkAction>}>
          <ul className="divide-y divide-line">
            {results.map((r) => <li key={r.name} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 truncate text-[15px]">{r.name}</span><span className={cx('shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium', r.ok ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand')}>{r.score}</span></li>)}
          </ul>
        </Panel>
        <Panel title={t('Points & badges')} sub={`Rank #${rank} in Corporate Banking · FR 205, 219`} action={<LinkAction onClick={() => nav('/learning/hub?tab=leaderboard')}>{t('Leaderboard')}</LinkAction>}>
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Trophy size={30} /></span>
            <div><div className="text-[30px] font-semibold leading-none tabular-nums">{pts.toLocaleString('en-IN')}</div><div className="text-[14px] text-ink-3">learning points</div></div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {BADGES.map((b) => {
              const earned = b.earned || (b.id === 'b3' && s.pta.released && ptResults(s).some((r) => r.id === empId && r.status === 'Passed'));
              const I = b.id === 'b4' ? Star : b.id === 'b3' ? Medal : Award;
              return <li key={b.id} title={`${b.name}: ${b.desc}`} className={cx('flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px]', earned ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-canvas text-ink-3')}><I size={14} />{b.name}</li>;
            })}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
