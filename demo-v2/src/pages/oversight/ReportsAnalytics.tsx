/** Analytics report tabs (FR 135, 142, 164–166, 207–208, 217, 225–226): investment, e-learning & exams, feedback sentiment, bonds. */
import { useState } from 'react';
import { Award, GraduationCap, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { downloadCsv } from '../../components/DataTable';
import { Badge, Btn, cx } from '../../components/ui';
import { Panel, StatCard } from '../../components/Dash';
import { AreaTrend, Donut, DonutLegend, GroupedBars } from '../../components/charts';
import { useDemo } from '../../store';
import { batchesOf, bdt, BONDS, COURSES, DIVISION_BUDGET, EXAMS, FEEDBACK_PROGRAMS, FEEDBACK_THEMES, FEEDBACK_TREND, HEADLINE, MONTHS } from '../../seed/bank';

const th = 'py-2 pr-4 text-[13px] font-semibold uppercase tracking-wide text-ink-3';
const td = 'py-2.5 pr-4';

export function ReportKpis() {
  return (
    <ul className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <li><StatCard label="Total trainings (2026)" value={HEADLINE.trainings} icon={GraduationCap} sub={`${HEADLINE.employeesTrained} employees trained`} /></li>
      <li><StatCard label="Total L&D investment" value={bdt(HEADLINE.investment)} icon={Wallet} tone="amber" sub={`Avg ${HEADLINE.avgHours} hrs / staff`} /></li>
      <li><StatCard label="Completion rate" value={`${HEADLINE.completion}%`} icon={Award} tone="ok" bar={HEADLINE.completion} sub={`Bank-wide benchmark: ${HEADLINE.completionTarget}%`} /></li>
      <li><StatCard label="Active training bonds" value={BONDS.filter((b) => b.status === 'Active').length} icon={ShieldCheck} tone="ink" sub="Tracked liability schedules" /></li>
    </ul>
  );
}

export function InvestmentReport() {
  const s = useDemo();
  const batches = batchesOf(s).filter((b) => b.budget > 0);
  const rows = DIVISION_BUDGET.map((d) => ({ ...d, util: Math.round((d.actual / d.budget) * 100) }));
  return (
    <div className="space-y-6">
      <Panel title="Division budget vs actual spend (lakh BDT)" sub="FY 2026 division-wise utilisation; actual expense comes from closed trainings (FR 135, 142)"
        action={<Btn v="secondary" onClick={() => downloadCsv('investment-by-division.csv', ['Division', 'Budget (lakh)', 'Actual (lakh)', 'Utilisation %'], rows.map((r) => [r.division, r.budget, r.actual, r.util]))}>Download CSV</Btn>}>
        <GroupedBars data={rows.map((d) => ({ label: d.division, a: d.budget, b: d.actual }))} unit="৳" />
      </Panel>
      <Panel title="Training investment and cost per participant" sub="Budget and actual by batch; cost per participant = actual ÷ enrolled">
        <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left text-[15px]">
          <thead><tr>{['Training', 'Division', 'Status', 'Budget', 'Actual', 'Participants', 'Cost / participant'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{batches.map((b) => <tr key={b.id}><td className={td}><span className="font-medium">{b.title}</span>{b.story && <span className="ml-2 text-[12px] font-semibold text-brand">This story</span>}</td><td className={cx(td, 'text-ink-2')}>{b.division}</td><td className={td}><Badge>{b.status}</Badge></td><td className={cx(td, 'tabular-nums')}>{bdt(b.budget)}</td><td className={cx(td, 'tabular-nums')}>{b.actual ? bdt(b.actual) : '—'}</td><td className={cx(td, 'tabular-nums')}>{b.enrolled}</td><td className={cx(td, 'tabular-nums')}>{b.actual && b.enrolled ? bdt(Math.round(b.actual / b.enrolled)) : '—'}</td></tr>)}</tbody>
        </table></div>
      </Panel>
    </div>
  );
}

export function ElearningReport() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title={`e-Learning course completions (${COURSES.length})`} sub="Enrolled learners and completion per course (FR 207–208)" action={<Btn v="secondary" onClick={() => downloadCsv('elearning.csv', ['Course', 'Format', 'Enrolled', 'Completion %'], COURSES.map((c) => [c.title, c.format, c.enrolled, c.completion]))}>CSV</Btn>}>
        <table className="w-full text-left text-[15px]"><thead><tr>{['Course', 'Enrolled', 'Completion'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{COURSES.map((c) => <tr key={c.id}><td className={td}>{c.title}</td><td className={cx(td, 'tabular-nums')}>{c.enrolled}</td><td className={cx(td, 'tabular-nums font-semibold')}>{c.completion}%</td></tr>)}</tbody></table>
      </Panel>
      <Panel title={`Assessment outcomes (${EXAMS.length})`} sub="Average score and pass rate per exam (FR 217)" action={<Btn v="secondary" onClick={() => downloadCsv('exams.csv', ['Exam', 'Status', 'Avg score', 'Pass rate %'], EXAMS.map((e) => [e.title, e.status, e.avg ?? '', e.pass ?? '']))}>CSV</Btn>}>
        <table className="w-full text-left text-[15px]"><thead><tr>{['Exam', 'Avg score', 'Pass rate'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{EXAMS.map((e) => <tr key={e.id}><td className={td}>{e.title}</td><td className={cx(td, 'tabular-nums')}>{e.avg === null ? '—' : `${e.avg}/100`}</td><td className={cx(td, 'tabular-nums font-semibold')}>{e.pass === null ? '—' : `${e.pass}%`}</td></tr>)}</tbody></table>
      </Panel>
    </div>
  );
}

export function SentimentReport() {
  const s = useDemo();
  const [approved, setApproved] = useState<string[]>([]);
  const pos = Math.round(FEEDBACK_PROGRAMS.reduce((n, f) => n + f.positive * f.responses, 0) / FEEDBACK_PROGRAMS.reduce((n, f) => n + f.responses, 0));
  const parts = [{ label: 'Positive', value: pos, color: '#15803d' }, { label: 'Neutral', value: Math.round((100 - pos) * 0.6), color: '#f59e0b' }, { label: 'Negative', value: 100 - pos - Math.round((100 - pos) * 0.6), color: '#d71920' }];
  const trainers = Object.values(FEEDBACK_PROGRAMS.reduce<Record<string, { name: string; sum: number; n: number }>>((m, f) => { m[f.trainerName] = m[f.trainerName] ?? { name: f.trainerName, sum: 0, n: 0 }; m[f.trainerName].sum += f.trainer; m[f.trainerName].n += 1; return m; }, {}));
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Overall rating trend (out of 5)" sub="Monthly average across all programmes (FR 225)"><AreaTrend actual={FEEDBACK_TREND} labels={MONTHS} height={220} ticks={5} format={(v) => v.toFixed(1)} /></Panel>
        <Panel title="Sentiment" sub="Comment sentiment, AI-assisted"><Donut parts={parts} size={170} center={<div><div className="text-[26px] font-semibold">{pos}%</div><div className="text-[13px] text-ink-3">positive</div></div>} /><div className="mt-3"><DonutLegend parts={parts.map((p) => ({ ...p, label: `${p.label} %` }))} /></div></Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={`Post-training feedback (${FEEDBACK_PROGRAMS.length})`} sub="Content, trainer and overall ratings" action={<Btn v="secondary" onClick={() => downloadCsv('feedback.csv', ['Programme', 'Responses', 'Content', 'Trainer', 'Overall', 'Positive %'], FEEDBACK_PROGRAMS.map((f) => [f.program, f.responses, f.content, f.trainer, f.overall, f.positive]))}>Export Excel (CSV)</Btn>}>
          <table className="w-full text-left text-[15px]"><thead><tr>{['Programme', 'Resp.', 'Content', 'Trainer', 'Overall', 'Positive'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{FEEDBACK_PROGRAMS.map((f) => <tr key={f.program}><td className={td}>{f.program}</td><td className={cx(td, 'tabular-nums')}>{f.responses}</td><td className={cx(td, 'tabular-nums')}>{f.content}</td><td className={cx(td, 'tabular-nums')}>{f.trainer}</td><td className={cx(td, 'tabular-nums font-semibold')}>{f.overall}/5</td><td className={td}><span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-[13px] text-ok">{f.positive}%</span></td></tr>)}</tbody></table>
        </Panel>
        <div className="space-y-6">
          <Panel title="Trainer comparison" sub="Average trainer rating (out of 5)">
            <ul className="space-y-3">{trainers.map((t) => { const v = +(t.sum / t.n).toFixed(1); return <li key={t.name}><div className="flex justify-between text-[15px]"><span>{t.name}</span><b className="tabular-nums">{v}</b></div><div className="mt-1 h-2 rounded-full bg-canvas"><div className="h-2 rounded-full bg-brand" style={{ width: `${(v / 5) * 100}%` }} /></div></li>; })}</ul>
          </Panel>
          <Panel title={<span className="flex items-center gap-2"><Sparkles size={17} className="text-brand" />AI themes and recurring issues</span>} sub="AI-assisted · L&D approves before themes are shared (FR 226)">
            <ul className="divide-y divide-line">{FEEDBACK_THEMES.map((t) => <li key={t.theme} className="flex items-center gap-3 py-2.5"><span className={cx('h-2.5 w-2.5 rounded-full', t.tone === 'positive' ? 'bg-ok' : t.tone === 'negative' ? 'bg-brand' : 'bg-amber-500')} /><span className="flex-1 text-[15px]">{t.theme}</span><span className="tabular-nums text-ink-3">{t.share}%</span><button onClick={() => { if (!approved.includes(t.theme)) { setApproved([...approved, t.theme]); s.logEvent('hr', 'Feedback theme approved', t.theme); } }} className={cx('rounded-lg border px-2.5 py-1 text-[13px]', approved.includes(t.theme) ? 'border-ok bg-ok-soft text-ok' : 'border-line')}>{approved.includes(t.theme) ? 'Approved' : 'Approve'}</button></li>)}</ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function BondsReport() {
  const total = BONDS.reduce((n, b) => n + b.amount, 0);
  const remaining = BONDS.reduce((n, b) => n + b.remaining, 0);
  return (
    <Panel title={`Training bond liability report (${BONDS.length})`} sub={`Bond amount ${bdt(total)} · remaining liability ${bdt(remaining)} (FR 164–166)`}
      action={<Btn v="secondary" onClick={() => downloadCsv('training-bonds.csv', ['Employee', 'EID', 'Programme', 'Period', 'Bond amount', 'Remaining liability', 'Status'], BONDS.map((b) => [b.employee, b.eid, b.program, b.period, b.amount, b.remaining, b.status]))}>Download CSV</Btn>}>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-[15px]">
        <thead><tr>{['Employee', 'Programme', 'Period', 'Bond amount', 'Remaining liability', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{BONDS.map((b) => <tr key={b.eid + b.program}><td className={td}><span className="font-medium">{b.employee}</span><span className="block text-[13px] text-ink-3">{b.eid}</span></td><td className={cx(td, 'text-ink-2')}>{b.program}</td><td className={cx(td, 'whitespace-nowrap text-ink-2')}>{b.period}</td><td className={cx(td, 'tabular-nums')}>{bdt(b.amount)}</td><td className={cx(td, 'tabular-nums font-semibold', b.remaining ? 'text-brand' : 'text-ink-3')}>{bdt(b.remaining)}</td><td className={td}><Badge>{b.status}</Badge></td></tr>)}</tbody>
      </table></div>
    </Panel>
  );
}
