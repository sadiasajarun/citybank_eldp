/** HR Operations (FR 20–21, 65–184): what needs attention across City Bank's learning operations. */
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, GraduationCap, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { CONFLICT_IDS, REQUEST_QUEUE, TRAINING } from '../../data';
import { VENUES } from '../../org';
import { attendedIds, roster, useDemo, type DemoState } from '../../store';
import { IMPACTS } from '../../lifecycle';
import { greeting } from '../Command';
import { Badge, cx } from '../../components/ui';
import { LifecycleStrip, LinkAction, Panel, StatCard } from '../../components/Dash';
import { AreaTrend, Donut, DonutLegend } from '../../components/charts';
import { SourceTag } from '../../components/Source';
import { AI_SUGGESTIONS, batchesOf, bdt, HEADLINE, MONTHS, SPEND_ACTUAL, SPEND_TARGET, type Batch } from '../../seed/bank';
import { useT } from '../../i18n';

const card = 'rounded-2xl bg-white ring-1 ring-line';
const btn2 = 'min-h-9 shrink-0 rounded-lg border border-line bg-white px-3 text-[14px] hover:border-ink/30';

interface Q { task: string; name: string; source: string; deadline: string; affected: string; to: string; cta: string; done: boolean; active: boolean }
function queue(s: DemoState): Q[] {
  const open = CONFLICT_IDS.filter((id) => !s.resolutions[id]).length;
  const wdDecided = s.withdrawal.status === 'approved' || s.withdrawal.status === 'rejected';
  const n = s.draft.participantIds.length || s.draft.participants;
  return [
    { task: 'Review training request', name: TRAINING.requestId, source: 'Division Head', deadline: '13 Nov', affected: `${n} proposed`, to: `/hr/requests/${TRAINING.requestId}`, cta: 'Review new request', done: s.reviewed, active: s.requestSubmitted },
    { task: 'Create nomination request', name: TRAINING.title, source: 'HR Admin', deadline: '13 Nov', affected: '4 divisions', to: '/hr/nomination-request', cta: 'Create nomination request', done: s.nominationRequested, active: s.reviewed },
    { task: 'Review nomination status', name: TRAINING.nominationId, source: 'Learning Champions', deadline: '14 Nov', affected: `${s.nominatedCount || 35} nominated`, to: '/hr/nomination-status', cta: 'Review nomination status', done: Object.keys(s.resolutions).length > 0 || s.finalized, active: s.nominationSubmitted },
    { task: 'Resolve employee conflicts', name: 'Leave, calendar, overlap, retirement', source: 'System checks', deadline: '14 Nov', affected: `${open} open`, to: '/hr/nomination-status', cta: 'Resolve conflicts', done: s.nominationSubmitted && open === 0, active: s.nominationSubmitted },
    { task: 'Finalise participants', name: TRAINING.title, source: 'HR Admin', deadline: '14 Nov', affected: `${roster(s).length} participants`, to: '/hr/nomination-status', cta: 'Finalise participants', done: s.finalized, active: s.nominationSubmitted && open === 0 },
    { task: 'Create training programme', name: `Training ${TRAINING.trainingId}`, source: 'HR Admin', deadline: '15 Nov', affected: 'Trainers, venue, participants', to: '/hr/schedule', cta: 'Schedule training', done: s.scheduled, active: s.finalized },
    { task: 'Configure notifications', name: 'Organizer, trainer, participants', source: 'HR Admin', deadline: '16 Nov', affected: `${roster(s).length} participants`, to: '/hr/schedule?tab=Notifications', cta: 'Send invitations', done: s.invitesSent, active: s.scheduled },
    { task: 'Approve replacement', name: 'Tanvir Hasan → Sadia Islam', source: 'Supervisor', deadline: '17 Nov', affected: '2 employees', to: '/hr/approvals', cta: 'Approve replacement', done: wdDecided, active: s.withdrawal.status === 'proposed' },
    { task: 'Submit attendance', name: `${TRAINING.title} · Day 1 and 2`, source: 'Training day', deadline: '19 Nov', affected: `${roster(s).length} participants`, to: '/hr/attendance', cta: 'Take attendance', done: s.attendanceSubmitted, active: s.invitesSent && wdDecided },
    { task: 'Close planned training', name: `Training ${TRAINING.trainingId}`, source: 'Feedback received', deadline: '22 Nov', affected: 'Actual expense, documents', to: '/hr/planned', cta: 'Close planned training', done: s.completed, active: s.feedbackSubmitted },
    { task: 'Validate employee record request', name: s.recordDetails.title, source: 'Employee', deadline: '25 Nov', affected: 'Ayesha Rahman', to: '/hr/approvals', cta: 'Validate record', done: s.recordRequest === 'approved', active: s.recordRequest === 'pending' },
  ];
}

const ORDER: Record<Batch['status'], number> = { Ongoing: 0, Scheduled: 1, Draft: 2, Completed: 3, Closed: 4 };
const AI_TONE = { warn: 'bg-amber-100 text-amber-900', brand: 'bg-brand-soft text-brand-dark', info: 'bg-sky-100 text-sky-900' };

export function HrOperations() {
  const s = useDemo();
  const nav = useNavigate();
  const t = useT();
  const batches = batchesOf(s);
  const shown = [...batches].sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.story ? -1 : 0)).slice(0, 6);
  const count = (st: Batch['status'][]) => batches.filter((b) => st.includes(b.status)).length;
  const parts = [
    { label: 'Ongoing batches', value: count(['Ongoing']), color: '#d71920' },
    { label: 'Completed', value: count(['Completed']), color: '#15803d' },
    { label: 'Scheduled', value: count(['Scheduled']), color: '#f59e0b' },
    { label: 'Draft / closed', value: count(['Draft', 'Closed']), color: '#475569' },
  ];
  const q = queue(s);
  const now = q.filter((x) => x.active && !x.done);
  const first = now[0];
  const open = CONFLICT_IDS.filter((id) => !s.resolutions[id]).length;
  const clash = VENUES.find((v) => v.name === s.sched.venue)?.bookedOn.includes('18 Nov 2026') ? 1 : 0;
  const upcoming = s.programmes.filter((p) => p.status === 'Scheduled' || p.status === 'Today').length + (s.scheduled && !s.attendanceSubmitted ? 1 : 0);
  const metrics: [number, string, string][] = [
    [s.requestSubmitted && !s.reviewed ? 1 : 0, 'New training requests', '/hr/requests'],
    [s.nominationRequested && !s.nominationSubmitted ? 1 : 0, 'Nomination requests open', '/hr/nomination-request'],
    [s.nominationSubmitted && !s.finalized ? open : 0, 'Nominations needing review', '/hr/nomination-status'],
    [s.finalized && !s.scheduled ? 1 : 0, 'Trainings to schedule', '/hr/schedule'],
    [s.scheduled && !s.budgetApproved ? 1 : 0, 'Budgets awaiting approval', '/hr/schedule'],
    [upcoming, 'Upcoming training', '/hr/calendar'],
    [s.invitesSent && !s.attendanceSubmitted ? 1 : 0, 'Attendance pending', '/hr/attendance'],
    [s.recordRequest === 'pending' ? 1 : 0, 'Employee record requests', '/hr/approvals'],
  ];
  const others = REQUEST_QUEUE.filter((r) => r.id !== TRAINING.requestId);
  const sections: { title: string; items: [string, number, string][] }[] = [
    { title: 'Requests', items: [['New', (s.requestSubmitted && !s.reviewed ? 1 : 0) + 1, '/hr/requests'], ['Under review', (s.reviewed && !s.nominationRequested ? 1 : 0) + 1, '/hr/requests'], ['Forwarded', s.requestForward ? 1 : 0, '/hr/requests'], ['Accepted', (s.reviewed ? 1 : 0) + Math.max(0, others.length - 2), '/hr/requests']] },
    { title: 'Nomination', items: [['Open requests', s.nominationRequested && !s.nominationSubmitted ? 1 : 0, '/hr/nomination-request'], ['Nominations received', s.nominationSubmitted ? s.nominatedCount || 35 : 0, '/hr/nomination-status'], ['Conflict cases', s.nominationSubmitted ? open : 0, '/hr/nomination-status'], ['Pending divisions', s.nominationRequested && !s.nominationSubmitted ? 4 : 0, '/hr/nomination-status']] },
    { title: 'Scheduling', items: [['To schedule', s.finalized && !s.scheduled ? 1 : 0, '/hr/schedule'], ['Venue conflicts', s.finalized && !s.scheduled ? clash : 0, '/hr/schedule'], ['Trainer conflicts', 0, '/hr/schedule'], ['Participant conflicts', s.nominationSubmitted && !s.finalized ? open : 0, '/hr/nomination-status']] },
    { title: 'Planned training', items: [['Upcoming', upcoming, '/hr/planned'], ['Attendance pending', s.invitesSent && !s.attendanceSubmitted ? 1 : 0, '/hr/attendance'], ['Feedback pending', s.attendanceSubmitted && !s.feedbackSubmitted ? attendedIds(s).length : 0, '/hr/planned'], ['Expense pending', s.feedbackSubmitted && !s.completed ? 1 : 0, '/hr/planned']] },
    { title: 'Records', items: [['Record requests', s.recordRequest === 'pending' ? 1 : 0, '/hr/approvals'], ['External trainee records', s.addedParticipants.length, '/hr/training-db'], ['Training database rows', s.dbRows.length, '/hr/training-db']] },
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{t('HR & L&D Operations Dashboard')}</h1>
            <span className="rounded-full bg-canvas px-3 py-0.5 text-[14px] text-ink-2 ring-1 ring-line">HR Admin</span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">{t(greeting())}, Nusrat · {t('Training management overview')} <SourceTag kind="fictional" /></p>
        </div>
        <div className="flex flex-wrap gap-3">
          {first && <button onClick={() => nav(first.to)} className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[16px] hover:border-ink/30">{first.cta} <ArrowRight size={17} /></button>}
          <button onClick={() => nav('/hr/schedule')} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark">{t('+ Schedule batch')}</button>
        </div>
      </header>

      <div className="mt-5"><LifecycleStrip /></div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label={t('Total trainings (2026)')} value={HEADLINE.trainings + (s.scheduled ? 1 : 0)} icon={GraduationCap} sub={`${HEADLINE.employeesTrained} employees participated`} trend={HEADLINE.trainingsGrowth} onClick={() => nav('/reports')} /></li>
        <li><StatCard label={t('Training investment (BDT)')} value={bdt(HEADLINE.investment + (s.completed ? 1386000 : 0))} icon={Wallet} tone="amber" sub={`Avg ${HEADLINE.avgHours} hrs / employee`} trend={HEADLINE.withinBudget} trendTone="warn" onClick={() => nav('/reports?type=investment')} /></li>
        <li><StatCard label={t('Avg completion rate')} value={`${HEADLINE.completion}%`} icon={TrendingUp} tone="ok" bar={HEADLINE.completion} sub={`Target compliance: ${HEADLINE.completionTarget}%`} trend={HEADLINE.mom} onClick={() => nav('/reports')} /></li>
        <li><StatCard label={t('Active bond liability')} value={bdt(HEADLINE.bondLiability)} icon={ShieldCheck} tone="ink" sub={`${HEADLINE.activeBonds} active legal training bonds`} trend={`${HEADLINE.withdrawals} withdrawals`} trendTone="warn" onClick={() => nav('/hr/bonds')} /></li>
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Panel title={t('Training investment vs target')} sub="Jan–Dec 2026 monthly L&D expenditure vs FY26 budget benchmark (lakh BDT)" action={<LinkAction onClick={() => nav('/reports?type=investment')}>{t('Full report')}</LinkAction>}>
          <AreaTrend actual={SPEND_ACTUAL} target={SPEND_TARGET} labels={MONTHS} format={(v) => `৳${v}L`} />
          <div className="mt-2 flex gap-5 text-[14px] text-ink-2"><span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-brand" />Actual spend</span><span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-slate-400" />Budget benchmark</span></div>
        </Panel>
        <Panel title={t('Training programme status')} sub="2026 batch lifecycle distribution" action={<LinkAction onClick={() => nav('/hr/calendar')}>{t('All batches')}</LinkAction>}>
          <Donut parts={parts} center={<div><div className="text-[30px] font-semibold leading-none">{batches.length}</div><div className="text-[13px] text-ink-3">batches</div></div>} />
          <div className="mt-4"><DonutLegend parts={parts} /></div>
        </Panel>
      </div>

      <Panel className="mt-6" title={t('Active & upcoming training batches')} sub="Click a batch to manage budget, expenses and attendance" action={<LinkAction onClick={() => nav('/hr/calendar')}>{t('All batches')}</LinkAction>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[15px]">
            <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Programme title', 'Date', 'Mode', 'Seats', 'Status'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {shown.map((b) => (
                <tr key={b.id} onClick={() => nav(b.story && !s.scheduled ? '/hr/schedule' : '/hr/planned')} className="cursor-pointer hover:bg-canvas/60">
                  <td className="py-3 pr-4"><span className="block font-medium">{b.title}{b.story && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[12px] font-semibold text-brand">This story</span>}</span><span className="text-[14px] text-ink-3">{b.venue}</span></td>
                  <td className="py-3 pr-4 tabular-nums text-ink-2">{b.start}</td>
                  <td className="py-3 pr-4"><span className="rounded-full border border-line px-2.5 py-0.5 text-[13px]">{b.mode}</span></td>
                  <td className="py-3 pr-4 tabular-nums">{b.enrolled} / {b.seats}</td>
                  <td className="py-3"><Badge>{b.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-6" title={<span className="flex items-center gap-2"><Sparkles size={18} className="text-brand" />{t('AI-suggested trainings & compliance deadline risk')}</span>} sub="Explainable on-prem suggestions from competency gaps, role transitions and compliance due dates · AI-assisted · human decision" action={<LinkAction onClick={() => nav('/competency')}>View skill matrix</LinkAction>}>
        <ul className="grid gap-4 md:grid-cols-3">
          {AI_SUGGESTIONS.map((a) => (
            <li key={a.title} className="flex flex-col rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-2"><span className={cx('rounded-full px-2.5 py-0.5 text-[13px] font-medium', AI_TONE[a.tone])}>{a.kind}</span><span className="text-[13px] text-ink-3">{a.division}</span></div>
              <div className="mt-2 text-[17px] font-semibold">{a.title}</div>
              <p className="mt-1 flex-1 text-[14px] text-ink-2">{a.why}</p>
              <button onClick={() => { s.logEvent('hr', 'AI suggestion reviewed', `${a.title} · added to the planning list`); useDemo.setState({ toast: `${a.title} added to the planning list` }); }} className="mt-3 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[15px] hover:border-ink/30">{t('Review & schedule')}<ArrowRight size={15} className="text-brand" /></button>
            </li>
          ))}
        </ul>
      </Panel>

      <h2 className="mt-8 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Today’s operations</h2>
      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {metrics.map(([n, l, to]) => (
          <li key={l}><button onClick={() => nav(to)} className={cx(card, 'h-full w-full px-4 py-3.5 text-left hover:shadow-md')}>
            <div className={cx('text-[32px] font-semibold leading-none tabular-nums', n > 0 && l !== 'Upcoming training' && 'text-amber-700')}>{n}</div>
            <div className="mt-1.5 text-[14px] leading-snug text-ink-2">{l}</div>
          </button></li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={cx(card, 'px-6 py-5')}>
          <h2 className="text-[22px] font-semibold">{t('Operational queue')} <span className="text-[15px] font-normal text-ink-3">· {now.length} now</span></h2>
          <ol className="mt-2 divide-y divide-line">
            {q.map((x, i) => {
              const state = x.done ? 'Done' : x.active ? 'Now' : 'Later';
              return (
                <li key={x.task} className={cx('flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5', state === 'Later' && 'opacity-60')}>
                  <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px]', state === 'Done' ? 'bg-ok text-white' : state === 'Now' ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{state === 'Done' ? <Check size={14} /> : i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[16px] font-medium">{x.task}</span><span className="block truncate text-[14px] text-ink-3">{x.name} · from {x.source} · {x.affected} · due {x.deadline}</span></span>
                  <Badge t={state === 'Done' ? 'ok' : state === 'Now' ? 'warn' : 'neutral'}>{state}</Badge>
                  {state === 'Now' && <button onClick={() => nav(x.to)} className={btn2}>{x.cta}</button>}
                </li>
              );
            })}
          </ol>
        </section>
        <div className="space-y-6">
          <section className={cx(card, 'px-6 py-5')}>
            <h2 className="text-[22px] font-semibold">{t('Recent activity')}</h2>
            <ul className="mt-2 divide-y divide-line">
              {s.audit.slice(0, 6).map((a) => <li key={a.id} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 py-2"><span className="text-[14px] tabular-nums text-ink-3">{a.at.slice(12)}</span><span className="min-w-0"><span className="block truncate text-[15px]">{IMPACTS[a.action]?.headline ?? a.action}</span><span className="text-[14px] text-ink-3">{a.actor}</span></span></li>)}
              {!s.audit.length && <li className="py-2 text-[15px] text-ink-2">No activity yet. A Division Head request will appear here.</li>}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {sections.map((sec) => (
          <section key={sec.title} className={cx(card, 'px-5 py-4')}>
            <h3 className="text-[18px] font-semibold">{sec.title}</h3>
            <ul className="mt-2 space-y-1">{sec.items.map(([l, n, to]) => <li key={l}><button onClick={() => nav(to)} className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-[15px] hover:bg-canvas"><span className="text-ink-2">{l}</span><span className="font-medium tabular-nums">{n}</span></button></li>)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}
