import { useState, type ReactNode } from 'react';
import { Check, Circle, X } from 'lucide-react';
import { STAGES } from '../store';

export const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ');

export function Logo({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) {
  const dim = size === 'lg' ? 'h-11 w-11 text-xl' : size === 'sm' ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-base';
  return (
    <div className="flex items-center gap-2.5">
      <img src="/brand/citybank-mark.png" alt="City Bank" className={cx('w-auto', size === 'lg' ? 'h-10' : size === 'sm' ? 'h-6' : 'h-8')} />
      <div className="leading-tight">
        <div className={cx('font-extrabold tracking-tight', dark ? 'text-white' : 'text-ink', size === 'lg' ? 'text-xl' : 'text-[15px]')}>
          City Bank
        </div>
        <div className={cx('text-[10px] font-semibold uppercase tracking-[.14em]', dark ? 'text-white/70' : 'text-ink-3')}>ELDP</div>
      </div>
    </div>
  );
}

const tone: Record<string, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand-dark',
  neutral: 'bg-slate-100 text-ink-2',
};

const statusTone: Record<string, string> = {
  Scheduled: 'info', 'Pending HR Review': 'warn', 'Under Review': 'warn', Closed: 'neutral', Completed: 'ok', Draft: 'neutral',
  Invited: 'info', Accepted: 'ok', 'Withdrawal Requested': 'warn', 'Replacement Proposed': 'warn', Approved: 'ok', Attended: 'ok', Absent: 'brand', Withdrawn: 'neutral',
  'Invitation Sent': 'info', Eligible: 'ok', Attention: 'warn', Conflict: 'brand', Clear: 'ok', Present: 'ok', Late: 'warn', Excused: 'info',
  High: 'brand', Medium: 'warn', Low: 'neutral', Passed: 'ok', Failed: 'brand', 'In Progress': 'info', 'Not Started': 'neutral', Overdue: 'brand',
  Connected: 'ok', Upcoming: 'info', 'Under Review ': 'warn', Open: 'info', Finalized: 'ok', 'Conflict Found': 'brand', Submitted: 'info',
};

export function Badge({ children, t }: { children: ReactNode; t?: keyof typeof tone | string }) {
  const k = t ?? statusTone[String(children)] ?? 'neutral';
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold', tone[k] ?? tone.neutral)}>{children}</span>;
}

export function Btn({
  children, onClick, v = 'primary', size = 'md', disabled, icon, className,
}: {
  children: ReactNode; onClick?: () => void; v?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; icon?: ReactNode; className?: string;
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors';
  const sz = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : size === 'lg' ? 'px-5 py-3 text-sm' : 'px-3.5 py-2 text-[13px]';
  const vv = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    secondary: 'border border-line bg-white text-ink hover:bg-slate-50',
    ghost: 'text-ink-2 hover:bg-slate-100',
    danger: 'border border-brand/30 bg-white text-brand hover:bg-brand-soft',
  }[v];
  return (
    <button disabled={disabled} onClick={onClick} className={cx(base, sz, vv, className)}>
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, className, title, action, pad = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; pad?: boolean }) {
  return (
    <section className={cx('card', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-[13px] font-bold text-ink">{title}</h3>
          {action}
        </header>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, tone: t }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ok' | 'warn' | 'brand' }) {
  return (
    <div className="card p-4 anim-fade">
      <div className="th">{label}</div>
      <div className={cx('mt-1.5 text-2xl font-extrabold tracking-tight', t === 'brand' && 'text-brand', t === 'ok' && 'text-ok', t === 'warn' && 'text-warn')}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, actions, crumbs }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; crumbs?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {crumbs && <div className="mb-1 text-xs font-medium text-ink-3">{crumbs}</div>}
        <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="mt-0.5 text-[13px] text-ink-2">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export function Progress({ value, tone: t = 'brand' }: { value: number; tone?: 'brand' | 'ok' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx('anim-grow h-full rounded-full transition-all duration-700', t === 'ok' ? 'bg-ok' : 'bg-brand')} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Table({ head, children, className }: { head: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-line bg-slate-50/70">
            {head.map((h) => (
              <th key={h} className="th px-4 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cx('px-4 py-2.5 align-middle', className)}>{children}</td>;

export function Alert({ kind = 'warn', title, children, action }: { kind?: 'warn' | 'brand' | 'info' | 'ok'; title: string; children?: ReactNode; action?: ReactNode }) {
  const c = { warn: 'border-warn/30 bg-warn-soft', brand: 'border-brand/30 bg-brand-soft', info: 'border-info/30 bg-info-soft', ok: 'border-ok/30 bg-ok-soft' }[kind];
  return (
    <div className={cx('anim-slide flex items-start justify-between gap-4 rounded-lg border p-3.5', c)}>
      <div>
        <div className="text-[13px] font-bold">{title}</div>
        {children && <div className="mt-0.5 text-[13px] text-ink-2">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="anim-slide w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="anim-drawer absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-[15px] font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-3 hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cx('whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-semibold', value === t ? 'border-brand text-brand' : 'border-transparent text-ink-2 hover:text-ink')}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', i < current ? 'bg-ok text-white' : i === current ? 'bg-brand text-white' : 'bg-slate-100 text-ink-3')}>
            {i < current ? <Check size={14} /> : i + 1}
          </span>
          <span className={cx('text-[13px] font-semibold', i === current ? 'text-ink' : 'text-ink-3')}>{s}</span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs">{hint}</span>}
    </label>
  );
}
export const inputCls = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15';

export function AiLabel({ children = 'AI-assisted insight — reviewed by L&D' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info-soft px-2.5 py-0.5 text-[11px] font-semibold text-info">
      <span className="h-1.5 w-1.5 rounded-full bg-info" />
      {children}
    </span>
  );
}

export function SimTag({ children = 'Demo Integration · Simulated Connected State' }: { children?: ReactNode }) {
  return <span className="rounded border border-dashed border-ink-3/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">{children}</span>;
}

export function MiniFlow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-ink-2">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className="rounded bg-slate-100 px-1.5 py-0.5">{s}</span>
          {i < steps.length - 1 && <span className="text-ink-3">→</span>}
        </span>
      ))}
    </div>
  );
}

export function WorkflowTimeline({ stage, onJump }: { stage: number; onJump?: (i: number) => void }) {
  return (
    <div className="flex items-center overflow-x-auto rounded-xl border border-line bg-white px-4 py-3 shadow-sm" aria-label="Workflow timeline">
      {STAGES.map((s, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <div key={s} className="flex items-center">
            <button onClick={() => onJump?.(i)} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50">
              <span className={cx('grid h-5 w-5 place-items-center rounded-full text-white', done ? 'bg-ok' : active ? 'bg-brand anim-pulse' : 'border border-line bg-white text-ink-3')}>
                {done ? <Check size={12} /> : active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Circle size={8} className="text-line" />}
              </span>
              <span className={cx('whitespace-nowrap text-xs font-semibold', done ? 'text-ink' : active ? 'text-brand' : 'text-ink-3')}>{s}</span>
            </button>
            {i < STAGES.length - 1 && <span className={cx('mx-1 h-px w-6 shrink-0', done ? 'bg-ok' : 'bg-line')} />}
          </div>
        );
      })}
    </div>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-line py-10 text-center">
      <div className="text-[13px] font-semibold text-ink-2">{title}</div>
      {sub && <div className="mt-1 max-w-sm text-xs text-ink-3">{sub}</div>}
    </div>
  );
}

export function useToggle(init = false): [boolean, () => void, (v: boolean) => void] {
  const [v, set] = useState(init);
  return [v, () => set((x) => !x), set];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-slate-200 font-bold text-ink-2" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ini}
    </span>
  );
}

export function BarChart({ data, max, unit = '%', color = 'bg-brand' }: { data: { label: string; value: number }[]; max?: number; unit?: string; color?: string }) {
  const m = max ?? Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-xs">
          <span className="w-32 shrink-0 truncate text-ink-2">{d.label}</span>
          <div className="h-2.5 flex-1 rounded-full bg-slate-100">
            <div className={cx('anim-grow h-full rounded-full', color)} style={{ width: `${(d.value / m) * 100}%` }} />
          </div>
          <span className="w-12 text-right font-semibold tabular-nums">{d.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ points, labels, height = 120 }: { points: number[]; labels: string[]; height?: number }) {
  const w = 300;
  const max = Math.max(...points) * 1.1;
  const min = Math.min(...points) * 0.85;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * w, height - ((p - min) / (max - min)) * height] as const);
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height + 4}`} className="w-full" role="img" aria-label="Trend chart">
        <path d={`${d} L${w},${height} L0,${height} Z`} fill="rgba(215,25,32,.08)" />
        <path d={d} fill="none" stroke="#d71920" strokeWidth="2.2" strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#d71920" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-3">{labels.map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );
}
