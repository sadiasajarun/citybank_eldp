/** Shared dashboard pieces: StatCard (KPI card), Panel (titled card), LifecycleStrip (the five-stage TMS flow). */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, TrendingUp, type LucideIcon } from 'lucide-react';
import { useDemo, type DemoState } from '../store';
import { CONFLICT_IDS } from '../data';
import { cx } from './ui';
import { useT } from '../i18n';

const TONE_ICON: Record<string, string> = { brand: 'bg-brand-soft text-brand', amber: 'bg-amber-50 text-amber-700', ok: 'bg-ok-soft text-ok', ink: 'bg-canvas text-ink-2', info: 'bg-sky-50 text-sky-700' };

export interface StatProps { label: ReactNode; value: ReactNode; sub?: ReactNode; trend?: ReactNode; trendTone?: 'ok' | 'warn' | 'bad'; icon?: LucideIcon; tone?: keyof typeof TONE_ICON; bar?: number; onClick?: () => void }
/** KPI card: label + icon, big value, optional progress bar, footer with sub-line and trend. */
export function StatCard({ label, value, sub, trend, trendTone = 'ok', icon: Icon, tone = 'brand', bar, onClick }: StatProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] text-ink-2">{label}</div>
        {Icon && <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', TONE_ICON[tone])}><Icon size={18} /></span>}
      </div>
      <div className="mt-3 text-[32px] font-semibold leading-none tracking-tight tabular-nums">{value}</div>
      {bar !== undefined && <div className="mt-3 h-1.5 rounded-full bg-canvas"><div className="h-1.5 rounded-full bg-ok" style={{ width: `${Math.min(100, bar)}%` }} /></div>}
      {(sub || trend) && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[14px]">
          <span className="text-ink-3">{sub}</span>
          {trend && <span className={cx('flex items-center gap-1 font-medium', trendTone === 'ok' ? 'text-ok' : trendTone === 'warn' ? 'text-amber-700' : 'text-brand')}>{trendTone === 'ok' && <TrendingUp size={14} />}{trend}</span>}
        </div>
      )}
    </>
  );
  const cls = 'h-full w-full rounded-2xl bg-white px-5 py-4 text-left ring-1 ring-line';
  return onClick ? <button onClick={onClick} className={cx(cls, 'transition-shadow hover:shadow-md hover:ring-ink/20')}>{body}</button> : <div className={cls}>{body}</div>;
}

/** Titled card with an optional sub-line and right-side link/action. */
export function Panel({ title, sub, action, children, className, id }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cx('scroll-mt-4 rounded-2xl bg-white px-6 py-5 ring-1 ring-line', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-[20px] font-semibold">{title}</h2>{sub && <p className="text-[14px] text-ink-3">{sub}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function LinkAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1 text-[15px] font-medium text-brand hover:underline">{children}<ArrowRight size={15} /></button>;
}

/* ---------------- the five-stage TMS lifecycle (FR 49–167) ---------------- */
interface Stage { key: string; title: string; sub: string; count: number; to: string; done: boolean; current: boolean }
export function stagesOf(s: DemoState): Stage[] {
  const open = CONFLICT_IDS.filter((id) => !s.resolutions[id]).length;
  const wd = [s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => w.status === 'requested' || w.status === 'proposed').length;
  const st = [
    { key: 'req', title: 'Training requests', sub: 'Division need & auto ID', count: (s.requestSubmitted && !s.reviewed ? 1 : 0) + 2, to: '/hr/requests', done: s.reviewed },
    { key: 'nom', title: 'Nominations', sub: 'Conflict & leave check', count: s.nominationSubmitted ? (s.finalized ? s.nominatedCount || 35 : open) : 23, to: '/hr/nomination-status', done: s.finalized },
    { key: 'sch', title: 'Schedule & attendance', sub: 'Venue, Teams & expense', count: 6 + (s.scheduled ? 1 : 0), to: '/hr/schedule', done: s.attendanceSubmitted },
    { key: 'wd', title: 'Withdrawals & bonds', sub: 'Replacement & legal print', count: wd + 3, to: '/hr/approvals', done: s.withdrawal.status === 'approved' || s.withdrawal.status === 'rejected' },
    { key: 'db', title: 'Training database', sub: 'Unified record & import', count: s.dbRows.length || 18, to: '/hr/training-db', done: s.completed },
  ];
  const cur = st.findIndex((x) => !x.done);
  return st.map((x, i) => ({ ...x, current: i === cur }));
}
export function LifecycleStrip() {
  const s = useDemo();
  const nav = useNavigate();
  const t = useT();
  return (
    <section className="rounded-2xl bg-white px-5 py-4 ring-1 ring-line" aria-label="Training lifecycle">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">{t('City Bank training lifecycle (5-step flow)')}</h2>
        <span className="text-[14px] text-ink-3">{t('Click any stage to continue the workflow')}</span>
      </div>
      <ol className="grid gap-3 md:grid-cols-5">
        {stagesOf(s).map((x, i) => (
          <li key={x.key}>
            <button onClick={() => nav(x.to)} className={cx('flex h-full w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors', x.current ? 'border-brand bg-brand-soft/50' : 'border-line hover:border-ink/30')}>
              <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-semibold', x.done ? 'bg-ok-soft text-ok ring-1 ring-ok/40' : x.current ? 'bg-brand text-white' : 'bg-white text-ink-2 ring-1 ring-line')}>{x.done ? <Check size={16} /> : i + 1}</span>
              <span className="min-w-0 flex-1"><span className={cx('block text-[15px] font-semibold leading-tight', x.current && 'text-brand')}>{t(x.title)}</span><span className="block truncate text-[13px] text-ink-3">{t(x.sub)}</span></span>
              {!x.done && <span className="rounded-md bg-canvas px-1.5 text-[13px] font-semibold tabular-nums text-ink-2">{x.count}</span>}
              <ChevronRight size={15} className="shrink-0 text-ink-3" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
