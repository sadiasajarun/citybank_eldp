/** Hand-built SVG charts (no chart library): area trend, donut, grouped bars, radar, progress ring, sparkline. */
import { useId, type ReactNode } from 'react';

const BRAND = '#d71920';
const INK = '#16181d';
const GRID = '#e8e9ed';
const MUTED = '#7c8492';

/** Smooth path through points (Catmull-Rom → cubic Bézier). */
function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Actual (filled red area) against a dashed target line. Values share one scale. */
export function AreaTrend({ actual, target, labels, unit = '', height = 260, ticks = 4, format }: { actual: number[]; target?: number[]; labels: string[]; unit?: string; height?: number; ticks?: number; format?: (v: number) => string }) {
  const id = useId();
  const W = 760;
  const H = height;
  const pad = { l: 46, r: 12, t: 12, b: 28 };
  const all = [...actual, ...(target ?? [])];
  const max = Math.ceil(Math.max(1, ...all) / ticks) * ticks;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, labels.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ap = actual.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smooth(ap);
  const area = `${line} L${x(actual.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const fmt = format ?? ((v: number) => `${unit}${v}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Trend chart">
      <defs>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={BRAND} stopOpacity="0.22" /><stop offset="100%" stopColor={BRAND} stopOpacity="0.02" /></linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }, (_, k) => {
        const v = (max / ticks) * k;
        return <g key={k}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} strokeDasharray="3 4" /><text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill={MUTED}>{fmt(v)}</text></g>;
      })}
      {labels.map((l, i) => <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill={MUTED}>{l}</text>)}
      <path d={area} fill={`url(#g${id})`} />
      {target && <path d={smooth(target.map((v, i) => [x(i), y(v)] as [number, number]))} fill="none" stroke="#9aa1ad" strokeWidth="2" strokeDasharray="6 5" />}
      <path d={line} fill="none" stroke={BRAND} strokeWidth="2.5" />
    </svg>
  );
}

/** Donut with an optional centre label; legend rendered by the caller via `DonutLegend`. */
export function Donut({ parts, size = 200, thickness = 26, center }: { parts: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: ReactNode }) {
  const total = Math.max(1, parts.reduce((n, p) => n + p.value, 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {parts.filter((p) => p.value > 0).map((p) => {
            const len = (p.value / total) * c;
            const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth={thickness} strokeDasharray={`${Math.max(0, len - 3)} ${c}`} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
        </g>
      </svg>
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}
export function DonutLegend({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="divide-y divide-line">
      {parts.map((p) => <li key={p.label} className="flex items-center gap-2.5 py-2 text-[15px]"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} /><span className="flex-1 text-ink-2">{p.label}</span><span className="font-semibold tabular-nums">{p.value}</span></li>)}
    </ul>
  );
}

/** Two bars per group (e.g. budget vs actual). */
export function GroupedBars({ data, a = 'Budget', b = 'Actual', unit = '', height = 280 }: { data: { label: string; a: number; b: number }[]; a?: string; b?: string; unit?: string; height?: number }) {
  const W = 760;
  const H = height;
  const pad = { l: 46, r: 8, t: 10, b: 34 };
  const max = Math.ceil(Math.max(1, ...data.flatMap((d) => [d.a, d.b])) / 8) * 8;
  const gw = (W - pad.l - pad.r) / data.length;
  const bw = Math.min(34, gw * 0.34);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${a} and ${b} by group`}>
        {[0, 1, 2, 3, 4].map((k) => { const v = (max / 4) * k; return <g key={k}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} strokeDasharray="3 4" /><text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill={MUTED}>{unit}{v}</text></g>; })}
        {data.map((d, i) => {
          const cx = pad.l + gw * i + gw / 2;
          return (
            <g key={d.label}>
              <rect x={cx - bw - 2} y={y(d.a)} width={bw} height={y(0) - y(d.a)} rx="3" fill="#94a3b8"><title>{`${a}: ${unit}${d.a}`}</title></rect>
              <rect x={cx + 2} y={y(d.b)} width={bw} height={y(0) - y(d.b)} rx="3" fill={BRAND}><title>{`${b}: ${unit}${d.b}`}</title></rect>
              <text x={cx} y={H - 12} textAnchor="middle" fontSize="12" fill={MUTED}>{d.label.length > 14 ? `${d.label.slice(0, 13)}…` : d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-center gap-5 text-[14px] text-ink-2"><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-slate-400" />{a}</span><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand" />{b}</span></div>
    </div>
  );
}

/** Radar: current (red, filled) vs target (dashed ink) on a 0–max scale. */
export function Radar({ axes, current, target, max = 5, size = 380 }: { axes: string[]; current: number[]; target: number[]; max?: number; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 70;
  const pt = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [cx + Math.cos(a) * R * (v / max), cy + Math.sin(a) * R * (v / max)];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Competency radar">
        {[1, 2, 3, 4, 5].filter((k) => k <= max).map((k) => <polygon key={k} points={poly(axes.map(() => k))} fill="none" stroke={GRID} />)}
        {axes.map((a, i) => { const [x, y] = pt(i, max); const [lx, ly] = pt(i, max + 0.95); return <g key={a}><line x1={cx} y1={cy} x2={x} y2={y} stroke={GRID} /><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="600" fill={INK}>{a}</text></g>; })}
        <polygon points={poly(target)} fill="none" stroke={INK} strokeWidth="2" strokeDasharray="6 5" />
        <polygon points={poly(current)} fill={BRAND} fillOpacity="0.2" stroke={BRAND} strokeWidth="2.5" />
        {current.map((v, i) => { const [x, y] = pt(i, v); return <circle key={i} cx={x} cy={y} r="4" fill={BRAND} />; })}
      </svg>
      <div className="mt-1 flex justify-center gap-5 text-[14px]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-ink" />Role target</span><span className="flex items-center gap-1.5 text-brand"><span className="h-3 w-3 rounded-sm bg-brand/60" />Current score</span></div>
    </div>
  );
}

export function ProgressRing({ value, size = 52, stroke = 5, color = BRAND, label }: { value: number; size?: number; stroke?: number; color?: string; label?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(Math.min(100, value) / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="absolute text-[12px] font-bold">{label ?? `${Math.round(value)}%`}</span>
    </span>
  );
}

export function Sparkline({ values, width = 120, height = 32, color = BRAND }: { values: number[]; width?: number; height?: number; color?: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => [(i * width) / Math.max(1, values.length - 1), height - 3 - ((v - min) / Math.max(1e-6, max - min)) * (height - 6)] as [number, number]);
  return <svg width={width} height={height} aria-hidden><path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" /></svg>;
}
