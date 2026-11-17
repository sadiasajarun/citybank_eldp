/** Inspiration-style insight blocks added to each role's home (fictional bank data + the live story). */
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, ClipboardCheck, GraduationCap, PieChart, ShieldCheck, Star, TrendingUp, Trophy, Users, Wallet } from 'lucide-react';
import { useDemo } from '../../store';
import { CREDIT_TARGET, directReports } from '../../org';
import { Badge, cx } from '../../components/ui';
import { LinkAction, Panel, StatCard } from '../../components/Dash';
import { AreaTrend, Donut, DonutLegend, GroupedBars } from '../../components/charts';
import { BATCHES, batchesOf, bdt, BONDS, DIVISION_BUDGET, FEEDBACK_PROGRAMS, GRADING, HEADLINE, LEADERBOARD, MONTHS, SPEND_ACTUAL, SPEND_TARGET, type Batch } from '../../seed/bank';
import { MANDATORY_COURSE, personRows, SUPERVISOR_NAME } from './dash';
import { TRAINING } from '../../data';
import { useT } from '../../i18n';

const STATUS_COLORS: Record<string, string> = { Ongoing: '#d71920', Completed: '#15803d', Scheduled: '#f59e0b', Draft: '#475569', Closed: '#94a3b8' };
function statusParts(list: Batch[]) {
  return (['Ongoing', 'Completed', 'Scheduled', 'Draft', 'Closed'] as const).map((k) => ({ label: k, value: list.filter((b) => b.status === k).length, color: STATUS_COLORS[k] })).filter((p) => p.value > 0);
}
function BatchTable({ rows, onOpen }: { rows: Batch[]; onOpen?: (b: Batch) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[15px]">
        <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Programme', 'Dates', 'Trainer', 'Seats', 'Status'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((b) => (
            <tr key={b.id} onClick={onOpen ? () => onOpen(b) : undefined} className={cx(onOpen && 'cursor-pointer hover:bg-canvas/60')}>
              <td className="py-2.5 pr-4"><span className="block font-medium">{b.title}{b.story && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">This story</span>}</span><span className="text-[13px] text-ink-3">{b.id} · {b.venue}</span></td>
              <td className="py-2.5 pr-4 whitespace-nowrap text-ink-2">{b.start}{b.end !== b.start ? ` – ${b.end}` : ''}</td>
              <td className="py-2.5 pr-4 text-ink-2">{b.trainer}</td>
              <td className="py-2.5 pr-4 tabular-nums">{b.enrolled} / {b.seats}</td>
              <td className="py-2.5"><Badge>{b.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Division Head ---------------- */
export function DivisionInsight() {
  const s = useDemo();
  const nav = useNavigate();
  const mine = batchesOf(s).filter((b) => b.division === 'Corporate Banking' || b.division === 'All divisions');
  const parts = statusParts(mine);
  const cb = DIVISION_BUDGET.find((d) => d.division === 'Corporate Banking')!;
  const share = cb.actual / DIVISION_BUDGET.reduce((n, d) => n + d.actual, 0);
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Corporate Banking learning investment" sub={`Monthly spend vs budget benchmark · ${bdt(Math.round(cb.actual * 100000))} of ${bdt(Math.round(cb.budget * 100000))} used`} action={<LinkAction onClick={() => nav('/reports?type=investment')}>Full report</LinkAction>}>
          <AreaTrend actual={SPEND_ACTUAL.map((v) => +(v * share).toFixed(1))} target={SPEND_TARGET.map((v) => +(v * share).toFixed(1))} labels={MONTHS} height={220} format={(v) => `৳${v}L`} />
        </Panel>
        <Panel title="Division batches" sub="Corporate Banking and bank-wide programmes, 2026">
          <Donut parts={parts} size={180} center={<div><div className="text-[28px] font-semibold leading-none">{mine.length}</div><div className="text-[13px] text-ink-3">batches</div></div>} />
          <div className="mt-3"><DonutLegend parts={parts} /></div>
        </Panel>
      </div>
      <Panel title="Training batches for your division" sub="Who is learning what, and when" action={<LinkAction onClick={() => nav('/overview')}>Training requests</LinkAction>}>
        <BatchTable rows={mine.slice().sort((a, b) => (a.story ? -1 : b.story ? 1 : 0)).slice(0, 6)} />
      </Panel>
    </div>
  );
}

/* ---------------- Trainer ---------------- */
export function TrainerInsight() {
  const nav = useNavigate();
  const byTrainer = Object.values(FEEDBACK_PROGRAMS.reduce<Record<string, { name: string; sum: number; n: number }>>((m, f) => { const k = f.trainerName; m[k] = m[k] ?? { name: k, sum: 0, n: 0 }; m[k].sum += f.trainer; m[k].n += 1; return m; }, {})).map((x) => ({ name: x.name, score: +(x.sum / x.n).toFixed(1) })).sort((a, b) => b.score - a.score);
  const mine = BATCHES.filter((b) => ['Sabina Yasmin', 'Nafis Ahmed', 'Dr. Farhan Chowdhury'].some((n) => b.trainer.includes(n)) && b.status !== 'Completed');
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Descriptive grading queue" sub="AI rubric suggestions · you decide" action={<LinkAction onClick={() => nav('/assessment?tab=grading')}>Open queue</LinkAction>}>
        <ul className="divide-y divide-line">{GRADING.slice(0, 5).map((g) => <li key={g.examId}><button onClick={() => nav(`/assessment/grading/${g.examId}`)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-brand"><span className="min-w-0"><span className="block truncate text-[15px]">{g.exam}</span><span className="text-[13px] text-ink-3">{g.scripts} scripts · {g.date}</span></span><ArrowRight size={15} className="shrink-0 text-ink-3" /></button></li>)}</ul>
      </Panel>
      <Panel title="Upcoming batches you facilitate" sub="From the training calendar">
        <ul className="divide-y divide-line">{mine.map((b) => <li key={b.id} className="py-2.5"><span className="block text-[15px] font-medium">{b.title}</span><span className="text-[13px] text-ink-3">{b.start} · {b.venue} · {b.enrolled} participants</span></li>)}</ul>
      </Panel>
      <Panel title="Trainer feedback benchmark" sub="Average trainer rating, 2026 programmes (out of 5)">
        <ul className="space-y-3">{byTrainer.map((t) => <li key={t.name}><div className="flex justify-between text-[15px]"><span>{t.name}</span><span className="font-semibold tabular-nums">{t.score}</span></div><div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${(t.score / 5) * 100}%` }} /></div></li>)}</ul>
      </Panel>
    </div>
  );
}

/* ---------------- Supervisor ---------------- */
export function SupervisorInsight() {
  const s = useDemo();
  const nav = useNavigate();
  const team = directReports(SUPERVISOR_NAME);
  const goals = personRows(s, team).slice(0, 6).map((r) => r.course && r.course.status !== 'Completed'
    ? { p: r.p, goal: `Complete ${MANDATORY_COURSE}`, pct: r.course.progress }
    : r.p.creditLevel < CREDIT_TARGET
      ? { p: r.p, goal: `Reach Credit Analysis level ${CREDIT_TARGET}`, pct: Math.round((r.p.creditLevel / CREDIT_TARGET) * 100) }
      : { p: r.p, goal: r.completed ? `Pass ${TRAINING.title}` : 'Keep mandatory learning current', pct: 100 });
  const wd = [s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => w.status !== 'none');
  const board = LEADERBOARD.filter((l) => l.division === 'Corporate Banking');
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Reportee learning goals" sub="Goal and KPI progress of your team, from their courses and competency (FR 206)">
        <ul className="space-y-3">{goals.map(({ p, goal, pct }) => <li key={p.id}><div className="flex justify-between gap-3 text-[15px]"><span className="min-w-0 truncate"><b className="font-medium">{p.name}</b> <span className="text-ink-3">· {goal}</span></span><span className="tabular-nums text-ink-3">{pct}%</span></div><div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></li>)}</ul>
      </Panel>
      <Panel title="Team leaderboard" sub="Points from courses, exams and forum help">
        <ol className="divide-y divide-line">{board.map((l, i) => <li key={l.name} className="flex items-center gap-3 py-2.5"><span className={cx('grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold', i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-canvas text-ink-2')}>{i + 1}</span><span className="flex-1 text-[15px]">{l.name}</span><span className="tabular-nums font-semibold">{l.points.toLocaleString('en-IN')}</span></li>)}</ol>
      </Panel>
      <Panel title="Withdrawals & replacements" sub="Requests from your team" action={<LinkAction onClick={() => nav('/supervisor')}>Open</LinkAction>}>
        {wd.length ? <ul className="divide-y divide-line">{wd.map((w) => <li key={w.empId} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0 truncate text-[15px]">{w.reason || 'Withdrawal request'}</span><Badge t={w.status === 'requested' ? 'warn' : 'ok'}>{w.status === 'requested' ? 'Waiting for you' : w.status === 'proposed' ? 'With HR' : w.status}</Badge></li>)}</ul> : <p className="text-[15px] text-ink-2">No withdrawal requests yet.</p>}
      </Panel>
    </div>
  );
}

/* ---------------- Finance ---------------- */
export function FinanceInsight() {
  const nav = useNavigate();
  const budget = DIVISION_BUDGET.reduce((n, d) => n + d.budget, 0);
  const actual = DIVISION_BUDGET.reduce((n, d) => n + d.actual, 0);
  const liability = BONDS.reduce((n, b) => n + b.remaining, 0);
  return (
    <div className="mt-6 space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="FY2026 L&D budget" value={`৳${budget.toFixed(1)}L`} icon={Banknote} tone="ink" sub="All divisions" /></li>
        <li><StatCard label="Actual spend" value={`৳${actual.toFixed(1)}L`} icon={Wallet} tone="amber" sub="Year to date" trend={`${Math.round((actual / budget) * 100)}% used`} trendTone="warn" /></li>
        <li><StatCard label="Cost per employee" value={bdt(Math.round(HEADLINE.investment / HEADLINE.employeesTrained))} icon={PieChart} tone="info" sub={`${HEADLINE.employeesTrained} employees trained`} /></li>
        <li><StatCard label="Bond liability" value={bdt(liability)} icon={ShieldCheck} tone="brand" sub={`${BONDS.filter((b) => b.status === 'Active').length} active bonds`} onClick={() => nav('/reports?type=bonds')} /></li>
      </ul>
      <Panel title="Division budget vs actual spend (lakh BDT)" sub="FY 2026 division-wise utilisation" action={<LinkAction onClick={() => nav('/reports?type=investment')}>Full report</LinkAction>}>
        <GroupedBars data={DIVISION_BUDGET.map((d) => ({ label: d.division, a: d.budget, b: d.actual }))} unit="৳" />
      </Panel>
    </div>
  );
}

/* ---------------- Management ---------------- */
export function ManagementInsight() {
  const s = useDemo();
  const nav = useNavigate();
  const t = useT();
  const parts = statusParts(batchesOf(s));
  return (
    <div className="mt-6 space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label={t('Total trainings (2026)')} value={HEADLINE.trainings} icon={GraduationCap} sub={`${HEADLINE.employeesTrained} employees trained`} trend={HEADLINE.trainingsGrowth} /></li>
        <li><StatCard label={t('Training investment (BDT)')} value={bdt(HEADLINE.investment)} icon={Wallet} tone="amber" sub={`Avg ${HEADLINE.avgHours} hrs / employee`} trend={HEADLINE.withinBudget} trendTone="warn" /></li>
        <li><StatCard label={t('Avg completion rate')} value={`${HEADLINE.completion}%`} icon={TrendingUp} tone="ok" bar={HEADLINE.completion} sub={`Target ${HEADLINE.completionTarget}%`} trend={HEADLINE.mom} /></li>
        <li><StatCard label="Exam pass rate" value="92%" icon={ClipboardCheck} tone="info" sub="Bank benchmark 85%" trend="+4 pts" /></li>
      </ul>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title={t('Training investment vs target')} sub="Monthly L&D spend vs FY26 budget (lakh BDT)" action={<LinkAction onClick={() => nav('/reports?type=investment')}>{t('Full report')}</LinkAction>}>
          <AreaTrend actual={SPEND_ACTUAL} target={SPEND_TARGET} labels={MONTHS} format={(v) => `৳${v}L`} />
        </Panel>
        <Panel title={t('Training programme status')} sub="2026 batches">
          <Donut parts={parts} size={180} />
          <div className="mt-3"><DonutLegend parts={parts} /></div>
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Division budget vs actual (lakh BDT)" sub="FY 2026"><GroupedBars data={DIVISION_BUDGET.map((d) => ({ label: d.division, a: d.budget, b: d.actual }))} unit="৳" height={240} /></Panel>
        <Panel title="Top performers this quarter" sub="Exam top scorers and leaderboard (FR 219)" action={<LinkAction onClick={() => nav('/learning/hub?tab=leaderboard')}>Leaderboard</LinkAction>}>
          <ol className="divide-y divide-line">{LEADERBOARD.slice(0, 5).map((l, i) => <li key={l.name} className="flex items-center gap-3 py-2.5">{i === 0 ? <Star size={18} className="text-amber-500" /> : <Trophy size={16} className="text-ink-3" />}<span className="flex-1 text-[15px]">{l.name} <span className="text-ink-3">· {l.division}</span></span><span className="font-semibold tabular-nums">{l.points.toLocaleString('en-IN')}</span></li>)}</ol>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-3"><Users size={13} />Points: course 100 · exam pass 150 · top scorer 250</p>
        </Panel>
      </div>
    </div>
  );
}
