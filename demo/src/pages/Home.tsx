import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BarChart3, CalendarDays, Database, FileCheck2, FileSignature, Fingerprint, GraduationCap, Lock, MessageSquare, Network, Target, TrendingUp, UserCheck, Users,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from '../store';
import { activeStage, MODULE_ACTIVE, MODULES_ALL, ROLE_LABEL, STAGES_LC } from '../lifecycle';
import type { Role } from '../types';
import { AiLabel, Badge, Btn, cx, Drawer } from '../components/ui';

/* =================== LOGIN =================== */
function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let w = 0, h = 0, raf = 0;
    const N = 70;
    const pts = Array.from({ length: N }, (_, i) => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00045, vy: (Math.random() - 0.5) * 0.00045, red: i % 9 === 0 }));
    const resize = () => { w = c.width = c.offsetWidth * devicePixelRatio; h = c.height = c.offsetHeight * devicePixelRatio; };
    resize();
    window.addEventListener('resize', resize);
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; }
      const max = 0.16;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, (a.y - b.y) * (h / w));
        if (d < max) {
          ctx.strokeStyle = a.red || b.red ? `rgba(215,25,32,${(1 - d / max) * 0.5})` : `rgba(255,255,255,${(1 - d / max) * 0.12})`;
          ctx.lineWidth = devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
        }
      }
      for (const p of pts) { ctx.fillStyle = p.red ? '#e0353b' : 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(p.x * w, p.y * h, (p.red ? 2.6 : 1.5) * devicePixelRatio, 0, 7); ctx.fill(); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function Login() {
  const nav = useNavigate();
  const s = useDemo();
  const [busy, setBusy] = useState(false);
  const enter = () => { setBusy(true); setTimeout(() => { s.setRole('hr'); nav('/demo'); }, 650); };
  return (
    <div className="dark-canvas relative h-full overflow-hidden">
      <NetworkCanvas />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0e1014] via-[#0e1014]/85 to-transparent" />
      <div className="relative flex h-full flex-col justify-between px-8 py-8 lg:px-20 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white px-4 py-2.5 shadow-xl"><img src="/brand/citybank-logo.png" alt="City Bank — making sense of money" className="h-24 w-auto" /></span>
          <div className="eyebrow ml-2 hidden text-[9.5px] text-white/45 md:block">Enterprise Learning &amp; Development Platform</div>
        </div>
        <div className="anim-up max-w-2xl">
          <div className="eyebrow mb-6 text-[11px] text-red-300">ELDP</div>
          <h1 className="display text-[56px] lg:text-[84px]">Learning.<br />Capability.<br /><span className="text-brand">Growth.</span></h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65">One secure platform connecting every employee’s development journey.</p>
          <button onClick={enter} className="mt-10 flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-[15px] font-bold text-ink shadow-2xl transition-colors hover:bg-white/90">
            <Fingerprint size={19} className="text-brand" />{busy ? 'Signing in securely…' : 'Continue with City Bank SSO'}<ArrowRight size={17} />
          </button>
          <div className="mt-5 flex items-center gap-2 text-[12px] text-white/45"><Lock size={13} /> City Bank Identity &amp; Access Management</div>
        </div>
        <div className="flex items-center justify-between text-[11.5px] text-white/35">
          <button onClick={() => { s.setRole('employee'); nav('/employee/dashboard'); }} className="hover:text-white">External Trainer / External Trainee Login</button>
          <span>Demonstration environment · simulated data</span>
        </div>
      </div>
    </div>
  );
}

/* =================== LIVING LIFECYCLE =================== */
const ICONS: Record<string, LucideIcon> = { need: Target, request: FileSignature, schedule: CalendarDays, nominate: Users, participate: UserCheck, learn: GraduationCap, assess: FileCheck2, feedback: MessageSquare, record: Database, develop: TrendingUp, analyse: BarChart3 };
const VW = 1200, VH = 230;
const PTS = STAGES_LC.map((_, i) => ({ x: 60 + i * 108, y: 128 + Math.sin(i * 0.78 - 0.4) * 62 }));
function curve(p: { x: number; y: number }[]) {
  if (p.length < 2) return '';
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    d += ` C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`;
  }
  return d;
}

const PEOPLE: { label: string; role: Role; alias?: string }[] = [
  { label: 'Employee', role: 'employee' }, { label: 'Supervisor', role: 'supervisor' }, { label: 'Division Head', role: 'division_head' },
  { label: 'Learning Champion', role: 'division_head', alias: 'lc' }, { label: 'Trainer', role: 'trainer' }, { label: 'HR Admin / L&D', role: 'hr' }, { label: 'System Admin', role: 'admin' },
];

export function LivingLifecycle() {
  const s = useDemo();
  const nav = useNavigate();
  const a = activeStage(s);
  const [sel, setSel] = useState(Math.min(a, STAGES_LC.length - 1));
  useEffect(() => setSel(Math.min(a, STAGES_LC.length - 1)), [a]);
  const st = STAGES_LC[sel];
  const det = st.detail(s);
  const full = useMemo(() => curve(PTS), []);
  const done = curve(PTS.slice(0, Math.max(1, Math.min(a, PTS.length - 1)) + 1));
  const lit = MODULE_ACTIVE[st.key] ?? [];
  const peopleState = (p: (typeof PEOPLE)[number]) => {
    if (p.alias === 'lc') return st.key === 'nominate' ? 'active' : 'idle';
    if (st.owner === p.role && !(st.key === 'nominate' && p.role === 'division_head')) return 'active';
    if (st.affected.includes(p.role)) return 'involved';
    if (p.role === 'admin' && (st.key === 'analyse' || st.key === 'request')) return 'involved';
    return 'idle';
  };
  return (
    <div>
      <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
        {/* canvas */}
        <div className="relative">
          <div className="relative w-full" style={{ aspectRatio: `${VW}/${VH + 40}` }}>
            <svg viewBox={`0 0 ${VW} ${VH + 40}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="#ff5a5f" /><stop offset="1" stopColor="#d71920" /></linearGradient>
              </defs>
              <path d={full} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
              <path d={full} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" className="anim-dash" />
              <path d={done} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" style={{ transition: 'all .8s' }} />
              <circle r="5" fill="#fff"><animateMotion dur="5s" repeatCount="indefinite" path={full} /></circle>
              <circle r="9" fill="rgba(215,25,32,.35)"><animateMotion dur="5s" repeatCount="indefinite" path={full} /></circle>
            </svg>
            {STAGES_LC.map((x, i) => {
              const Icon = ICONS[x.key];
              const isDone = x.done(s) && i !== a;
              const isActive = i === a;
              const p = PTS[i];
              return (
                <button
                  key={x.key}
                  onMouseEnter={() => setSel(i)}
                  onFocus={() => setSel(i)}
                  onClick={() => { setSel(i); }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  style={{ left: `${(p.x / VW) * 100}%`, top: `${(p.y / (VH + 40)) * 100}%` }}
                >
                  <span className={cx(
                    'mx-auto grid h-12 w-12 place-items-center rounded-full border transition-all duration-300',
                    isActive ? 'anim-pulse border-brand bg-brand text-white' : isDone ? 'border-white/30 bg-white text-ink' : 'border-white/15 bg-graphite-2 text-white/50',
                    sel === i && !isActive && 'ring-2 ring-white/60',
                  )}>
                    <Icon size={19} />
                  </span>
                  <span className={cx('absolute left-1/2 top-[56px] w-28 -translate-x-1/2 text-[12.5px] font-bold', isActive ? 'text-white' : isDone ? 'text-white/85' : 'text-white/45')}>{x.label}</span>
                  <span className="absolute left-1/2 top-[74px] w-28 -translate-x-1/2 text-[10px] text-white/35">{isActive ? 'In progress' : isDone ? 'Complete' : 'Upcoming'}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* detail */}
        <div key={st.key} className="glass anim-fade self-start rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[9.5px] text-red-300">Stage {sel + 1} of {STAGES_LC.length}</span>
            <span className={cx('rounded-full px-2 py-0.5 text-[10.5px] font-bold', sel === a ? 'bg-brand text-white' : st.done(s) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60')}>{sel === a ? 'Live' : st.done(s) ? 'Complete' : 'Upcoming'}</span>
          </div>
          <div className="mt-2 text-[24px] font-extrabold tracking-tight">{st.label}</div>
          <div className="text-[12px] text-white/50">{st.module}</div>
          <dl className="mt-4 space-y-3 text-[12.5px]">
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Responsible</dt><dd className="font-semibold">{st.owner === 'system' ? 'ELDP (automatic)' : ROLE_LABEL[st.owner]}</dd></div>
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Affected</dt><dd>{st.affected.map((r) => ROLE_LABEL[r]).join(' · ')}</dd></div>
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Record</dt><dd>{det.records}</dd></div>
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Pending</dt><dd>{det.pending}</dd></div>
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Integrations</dt><dd>{st.integrations.join(' · ')}</dd></div>
            <div className="flex gap-3"><dt className="w-24 shrink-0 text-white/45">Next</dt><dd className="font-semibold">{st.next}</dd></div>
          </dl>
          <button onClick={() => { s.setRole(st.route.role); nav(st.route.to); }} className="mt-5 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-ink hover:bg-white/90">
            Open as {st.owner === 'system' ? ROLE_LABEL[st.route.role] : ROLE_LABEL[st.route.role]} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* layer 2 people */}
      <div className="mt-6 border-t hairline pt-5">
        <div className="mb-3 flex items-baseline gap-3"><span className="eyebrow text-[9.5px] text-white/40">People</span><span className="text-[12px] text-white/40">who acts at <b className="text-white/70">{st.label}</b></span></div>
        <div className="flex flex-wrap gap-2">
          {PEOPLE.map((p) => {
            const ps = peopleState(p);
            return (
              <div key={p.label} className={cx('flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-all duration-300', ps === 'active' ? 'border-brand bg-brand/15' : ps === 'involved' ? 'border-white/25 bg-white/5' : 'border-white/8 opacity-45')}>
                <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold', ps === 'active' ? 'bg-brand text-white' : 'bg-white/10 text-white/70')}>{p.label.split(' ').map((w) => w[0]).join('').slice(0, 2)}</span>
                <span className="text-[12px] font-semibold">{p.label}</span>
                <span className={cx('text-[9.5px] font-bold uppercase tracking-wider', ps === 'active' ? 'text-red-300' : ps === 'involved' ? 'text-white/50' : 'text-white/30')}>{ps === 'active' ? 'Active' : ps === 'involved' ? 'Involved' : 'Not involved'}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* layer 3 modules */}
      <div className="mt-5">
        <div className="mb-3 flex items-baseline gap-3"><span className="eyebrow text-[9.5px] text-white/40">Platform modules</span><span className="text-[12px] text-white/40">illuminated for this stage</span></div>
        <div className="flex flex-wrap gap-1.5">
          {MODULES_ALL.map((m) => {
            const on = lit.includes(m);
            return <span key={m} className={cx('rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-all duration-300', on ? 'bg-white text-ink shadow-[0_0_24px_rgba(255,255,255,.25)]' : 'bg-white/5 text-white/35')}>{m}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

/* =================== COMMAND CENTER =================== */
const SEED_ACTIVITY = [
  ['10:32', 'Corporate Banking', 'opened a training need for Credit Analysis'],
  ['10:28', 'AML assessment', 'completed by 48 employees'],
  ['10:21', 'HR', 'finalised 32 participants for Leadership Essentials'],
  ['10:18', 'AI risk model', 'flagged compliance risk for 6 employees · L&D reviewing'],
  ['10:05', 'Microsoft Teams', 'synced 41 online attendance records'],
  ['09:52', 'Retail Banking', 'issued 112 Information Security certificates'],
];

export function DemoHome() {
  const s = useDemo();
  const nav = useNavigate();
  const pending = (s.requestSubmitted && !s.scheduleStarted ? 1 : 0) + (s.withdrawal.status === 'proposed' || s.withdrawal.status === 'requested' ? 1 : 0) + 5;
  const live = s.audit.slice(0, 4).map((a) => [a.at.slice(12), a.actor, a.action.toLowerCase() + ' · ' + a.detail] as const);
  const startStory = () => { s.setStoryStep(2); s.setRole('division_head'); nav(s.requestSubmitted ? '/workflow' : '/division-head/training-request/new'); };
  return (
    <div>
      <section className="dark-canvas grid-bg relative overflow-hidden px-6 pb-10 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1720px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="anim-up">
              <div className="eyebrow text-[10.5px] text-red-300">Enterprise Learning Command Center</div>
              <h1 className="display mt-3 text-[40px] lg:text-[54px]">Enterprise Learning &amp; Development Platform</h1>
              <p className="mt-3 text-[17px] text-white/60">One connected ecosystem for learning, capability and workforce development.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={startStory} className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[13.5px] font-bold hover:bg-brand-dark">Explore Training Lifecycle <ArrowRight size={15} /></button>
              <button onClick={() => nav('/platform')} className="flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-[13.5px] font-bold hover:bg-white/10"><Network size={15} />Explore the Platform</button>
              <button onClick={() => nav('/workflow')} className="rounded-xl border border-white/20 px-5 py-3 text-[13.5px] font-bold hover:bg-white/10">Workflow Explorer</button>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/8 md:grid-cols-5">
            {[['Business Need', 'Training'], ['Learning', 'Course'], ['Assessment', 'Capability'], ['Competency', 'Workforce Development'], ['Analytics', 'Management Insight']].map(([a, b]) => (
              <div key={a} className="bg-graphite/80 px-4 py-3"><div className="text-[12px] font-bold text-white/85">{a}</div><div className="text-[11.5px] text-white/45">→ {b}</div></div>
            ))}
          </div>
          <div className="mt-8"><LivingLifecycle /></div>
        </div>
      </section>

      {/* pulse */}
      <section className="border-b border-line bg-white px-6 lg:px-12">
        <div className="mx-auto flex max-w-[1720px] flex-wrap items-stretch divide-x divide-line">
          <div className="flex items-center py-5 pr-8"><div><div className="eyebrow text-[9.5px] text-brand">Today’s L&amp;D Pulse</div><div className="text-[12px] text-ink-3">Thursday, 12 November 2026</div></div></div>
          {[['74', 'Active Programs'], ['94.6%', 'Mandatory Compliance'], ['18', 'Assessments this week'], [String(pending), 'Approvals waiting'], ['3,842', 'Learning hours this month']].map(([n, l]) => (
            <div key={l} className="flex-1 px-8 py-5"><div className="num text-[34px] leading-none">{n}</div><div className="mt-1.5 text-[12px] font-medium text-ink-3">{l}</div></div>
          ))}
        </div>
      </section>

      <section className="px-6 py-10 lg:px-12">
        <div className="mx-auto grid max-w-[1720px] gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="mb-5 flex items-baseline justify-between"><h2 className="text-[18px] font-extrabold tracking-tight">Current enterprise activity</h2><button onClick={() => nav('/admin/audit')} className="text-[12px] font-semibold text-brand">Audit log</button></div>
            <ol className="relative border-l border-line">
              {[...live, ...SEED_ACTIVITY].slice(0, 7).map(([t, who, what], i) => (
                <li key={i} className={cx('anim-slide relative pb-5 pl-6', i < live.length && 'font-semibold')} style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={cx('absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-canvas', i < live.length ? 'bg-brand' : 'bg-ink-3/50')} />
                  <div className="text-[11px] font-bold tabular-nums text-ink-3">{t}{i < live.length && <span className="ml-2 text-brand">LIVE</span>}</div>
                  <div className="text-[13.5px] text-ink"><b>{who}</b> <span className="font-normal text-ink-2">{what}</span></div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="mb-5 flex items-baseline justify-between"><h2 className="text-[18px] font-extrabold tracking-tight">Development intelligence</h2><AiLabel>AI-assisted · human reviewed</AiLabel></div>
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div>
                <div className="th mb-3">Compliance risk</div>
                {[['Data Privacy', 'High', 74], ['Information Security', 'Medium', 88], ['AML & CFT', 'Low', 96]].map(([n, r, v]) => (
                  <div key={n as string} className="mb-3"><div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">{n}</span><span className={cx('text-[11px] font-bold', r === 'High' ? 'text-brand' : r === 'Medium' ? 'text-warn' : 'text-ok')}>{r} · {v}%</span></div><div className="h-1.5 rounded-full bg-line"><div className={cx('anim-grow h-full rounded-full', r === 'High' ? 'bg-brand' : r === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600')} style={{ width: `${v}%` }} /></div></div>
                ))}
              </div>
              <div>
                <div className="th mb-3">Priority competency gaps</div>
                {[['Credit Analysis', 'Relationship Managers', 2], ['Digital Banking', 'Branch Officers', 1], ['Leadership', 'New Managers', 1]].map(([n, w, g]) => (
                  <div key={n as string} className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-0"><div><b>{n}</b><div className="text-[11px] text-ink-3">{w}</div></div><span className="text-[12px] font-bold text-brand">−{g} level{(g as number) > 1 && 's'}</span></div>
                ))}
              </div>
              <div>
                <div className="th mb-3">Learning recommendation</div>
                <div className="text-[14px] font-bold">Advanced Credit Analysis</div>
                <div className="mt-1 text-[12.5px] text-ink-2">For 32 Relationship Managers, Corporate Banking</div>
                <div className="mt-2 text-[12px] text-ink-3">Why: role requirement · skill gap · previous learning history</div>
                <button onClick={startStory} className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-brand">Act on this need <ArrowRight size={13} /></button>
              </div>
              <div>
                <div className="th mb-3">Upcoming programs</div>
                {[['Advanced Credit Risk Management', '18–19 Nov', s.scheduled ? 'Scheduled' : 'Requested'], ['AML & CFT Refresher', '24 Nov', 'Scheduled'], ['Leadership Essentials for Managers', '02 Dec', 'Scheduled']].map(([t, d, st]) => (
                  <div key={t} className="flex items-center justify-between py-1.5 text-[13px]"><span><b>{t}</b> <span className="text-ink-3">· {d}</span></span><Badge>{st === 'Requested' ? 'Pending HR Review' : st}</Badge></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =================== WORKFLOW EXPLORER =================== */
type S = ReturnType<typeof useDemo.getState>;
const LANES: { key: string; label: string; role: Role }[] = [
  { key: 'dh', label: 'Division Head', role: 'division_head' },
  { key: 'hr', label: 'HR / L&D', role: 'hr' },
  { key: 'lc', label: 'Learning Champion', role: 'division_head' },
  { key: 'sys', label: 'System', role: 'hr' },
  { key: 'emp', label: 'Employee', role: 'employee' },
  { key: 'sup', label: 'Supervisor', role: 'supervisor' },
  { key: 'hr2', label: 'HR / L&D', role: 'hr' },
  { key: 'eldp', label: 'ELDP', role: 'hr' },
];
const TT = 'TRN-2026-00182';
interface WNode { lane: string; label: string; done: (s: S) => boolean; to: string; role?: Role; desc: string; emp?: string }
const WNODES: WNode[] = [
  { lane: 'dh', label: 'Identify Need', done: () => true, to: '/division-head/dashboard', desc: 'Competency matrix shows Credit Analysis 2 levels below target for Relationship Managers.' },
  { lane: 'dh', label: 'Submit Request', done: (s) => s.requestSubmitted, to: '/division-head/training-request/new', desc: 'Stepped request with duplicate-title check, venue availability and autosave. Sequential ID TR-2026-00418.' },
  { lane: 'hr', label: 'Review', done: (s) => s.scheduleStarted, to: '/hr/requests/TR-2026-00418', desc: 'HR sees the same record as a new request: Schedule, Forward or Return for Information.' },
  { lane: 'hr', label: 'Schedule', done: (s) => s.scheduled, to: `/hr/training/${TT}/schedule`, desc: 'Training ID generated, venue-and-date conflict check, budget and approval number.' },
  { lane: 'hr', label: 'Request Nomination', done: (s) => s.nominationRequested, to: `/hr/training/${TT}/schedule?tab=Participants`, desc: 'Divisions, deadline and customizable email with nomination link.' },
  { lane: 'lc', label: 'Nominate Employees', done: (s) => s.nominationSubmitted, to: '/learning-champion/nominations', desc: 'Learning Champion nominates 35 employees on the nomination board.' },
  { lane: 'sys', label: 'Check HRIS', done: (s) => s.nominationSubmitted, to: `/hr/training/${TT}/schedule?tab=Participants`, desc: 'Employment status, grade, retirement and resignation from HRIS.' },
  { lane: 'sys', label: 'Check Leave', done: (s) => s.nominationSubmitted, to: `/hr/training/${TT}/schedule?tab=Participants`, desc: 'Approved leave from the Leave Management system. Tanvir Hasan: leave on 19 Nov.' },
  { lane: 'sys', label: 'Check Calendar', done: (s) => s.finalized, to: `/hr/training/${TT}/schedule?tab=Participants`, desc: 'Outlook calendar and training overlaps. HR resolves 4 conflicts → 32 participants.' },
  { lane: 'emp', label: 'Receive Invitation', done: (s) => s.invitesSent, to: '/employee/dashboard', emp: 'e1', desc: 'Email, Outlook, SMS, WhatsApp and push. Supervisor in CC.' },
  { lane: 'emp', label: 'Accept', done: (s) => s.participation.e1 === 'Accepted' || s.attendanceSubmitted, to: '/employee/dashboard', emp: 'e1', desc: 'Ayesha Rahman accepts. Tanvir Hasan requests withdrawal.' },
  { lane: 'sup', label: 'Withdrawal Approval', done: (s) => s.withdrawal.status === 'proposed' || s.withdrawal.status === 'approved', to: '/supervisor/approvals', desc: 'Supervisor: Approve, Approve with Replacement, or Reject.' },
  { lane: 'sup', label: 'Replacement', done: (s) => s.withdrawal.status === 'approved', to: '/supervisor/approvals', desc: 'Sadia Islam proposed after live HRIS, leave, calendar and eligibility checks; HR approves (maker-checker).' },
  { lane: 'emp', label: 'Attend', done: (s) => s.attendanceSubmitted, to: '/employee/dashboard', emp: 'e1', desc: 'Classroom + webinar. Teams attendance synced automatically.' },
  { lane: 'hr2', label: 'Attendance', done: (s) => s.attendanceSubmitted, to: `/hr/training/${TT}/attendance`, desc: 'Mark All, Teams sync, Submit — updates the training database and every learning record.' },
  { lane: 'hr2', label: 'Completion', done: (s) => s.completed, to: `/hr/training/${TT}/attendance`, desc: 'Cost per participant, learning hours, investment and feedback score published.' },
  { lane: 'eldp', label: 'Learning Record', done: (s) => s.attendanceSubmitted, to: '/employee/learning-history', role: 'employee', emp: 'e1', desc: 'One continuous learning record per employee.' },
  { lane: 'eldp', label: 'Analytics', done: (s) => s.completed, to: '/hr/analytics', desc: 'Executive dashboard and Power BI read the same reporting schema.' },
  { lane: 'eldp', label: 'Competency', done: (s) => s.journeyDone >= 5, to: '/hr/competencies', desc: 'Credit Analysis level recalculated; learning journey progresses.' },
];

export function WorkflowView() {
  const s = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState<number | null>(null);
  const COL = 86, ROW = 74, LX = 170, TOP = 46;
  const activeIdx = WNODES.findIndex((n) => !n.done(s));
  const pos = WNODES.map((n, i) => ({ x: LX + 40 + i * COL, y: TOP + LANES.findIndex((l) => l.key === n.lane) * ROW + ROW / 2 }));
  const W = LX + 80 + WNODES.length * COL, H = TOP + LANES.length * ROW + 10;
  const seg = (i: number) => { const a = pos[i], b = pos[i + 1]; return `M${a.x},${a.y} C${a.x + 46},${a.y} ${b.x - 46},${b.y} ${b.x},${b.y}`; };
  const donePath = pos.slice(0, Math.max(1, activeIdx === -1 ? pos.length : activeIdx + 1)).map((p, i, arr) => i === 0 ? `M${p.x},${p.y}` : (() => { const a = arr[i - 1]; return ` C${a.x + 46},${a.y} ${p.x - 46},${p.y} ${p.x},${p.y}`; })()).join('');
  const node = open !== null ? WNODES[open] : null;
  const lane = node ? LANES.find((l) => l.key === node.lane)! : null;
  return (
    <div className="px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-[1840px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-[10.5px] text-brand">Workflow Explorer</div>
            <h1 className="display mt-2 text-[34px]">One record, travelling across City Bank</h1>
            <p className="mt-2 text-[14px] text-ink-2">TR-2026-00418 · Advanced Credit Risk Management — click any step to open that stakeholder’s exact screen.</p>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" />Complete</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" />Current</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-ink-3" />Upcoming</span>
            <Btn v="secondary" onClick={() => nav('/platform')}>View ELDP Ecosystem</Btn>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white scroll-thin">
          <div className="relative" style={{ width: W, height: H }}>
            {LANES.map((l, i) => (
              <div key={l.key} className={cx('absolute left-0 right-0 flex items-center border-b border-line', i % 2 === 1 && 'bg-canvas/60')} style={{ top: TOP + i * ROW, height: ROW }}>
                <div className="sticky left-0 z-10 flex h-full w-[170px] items-center border-r border-line bg-white px-5"><span className={cx('text-[11px] font-extrabold uppercase tracking-[.1em]', l.key === 'sys' || l.key === 'eldp' ? 'text-brand' : 'text-ink-2')}>{l.label}</span></div>
              </div>
            ))}
            <div className="absolute left-[170px] right-0 top-0 flex h-[46px] items-center border-b border-line px-5 text-[11px] font-semibold text-ink-3">Need → Request → Schedule → Nominate → Validate → Participate → Replace → Attend → Record → Analyse</div>
            <svg width={W} height={H} className="pointer-events-none absolute inset-0">
              {pos.slice(0, -1).map((_, i) => <path key={i} d={seg(i)} fill="none" stroke={i < activeIdx || activeIdx === -1 ? '#16181d' : '#d4d7dd'} strokeWidth={i < activeIdx || activeIdx === -1 ? 2 : 1.5} strokeDasharray={i < activeIdx || activeIdx === -1 ? '' : '4 5'} />)}
              <circle r="5" fill="#d71920"><animateMotion dur="4s" repeatCount="indefinite" path={donePath} /></circle>
            </svg>
            {WNODES.map((n, i) => {
              const done = n.done(s) && i !== activeIdx;
              const act = i === activeIdx;
              return (
                <button key={i} onClick={() => setOpen(i)} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos[i].x, top: pos[i].y }}>
                  <span className={cx('mx-auto block h-[18px] w-[18px] rounded-full border-2 transition-transform', act ? 'anim-pulse border-brand bg-brand' : done ? 'border-ink bg-ink' : 'border-ink-3/60 bg-white', 'group-hover:ring-4 group-hover:ring-brand/15')} />
                  <span className={cx('absolute left-1/2 top-[22px] w-[88px] -translate-x-1/2 text-center text-[11px] font-bold leading-tight', act ? 'text-brand' : done ? 'text-ink' : 'text-ink-3')}>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[12px] text-ink-3">The red marker shows where the record currently is. System lanes are automatic checks against HRIS, Leave Management and Outlook (simulated integrations).</p>
      </div>
      <Drawer open={!!node} onClose={() => setOpen(null)} title={node ? node.label : ''}>
        {node && lane && (
          <div>
            <div className="th">{lane.label}</div>
            <div className="mt-2"><Badge t={node.done(s) && open !== activeIdx ? 'ok' : open === activeIdx ? 'brand' : 'neutral'}>{node.done(s) && open !== activeIdx ? 'Complete' : open === activeIdx ? 'Current step' : 'Upcoming'}</Badge></div>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{node.desc}</p>
            <div className="mt-5 rounded-xl bg-canvas p-4 text-[13px]"><div className="th mb-1">Record</div>TR-2026-00418 · {TT} · Advanced Credit Risk Management</div>
            <Btn className="mt-5 w-full" onClick={() => { const r = node.role ?? lane.role; s.setRole(r); if (node.emp) s.setEmployee(node.emp); nav(node.to); }}>Open this screen as {ROLE_LABEL[node.role ?? lane.role]} <ArrowRight size={14} /></Btn>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* =================== PLATFORM MAP =================== */
interface Mod { name: string; to: string; role: Role; desc: string }
const m = (name: string, to: string, role: Role, desc: string): Mod => ({ name, to, role, desc });
const GROUPS: { title: string; tag: string; mods: Mod[] }[] = [
  { title: 'Training Operations', tag: 'Plan & Deliver', mods: [m('Training Request', '/division-head/training-request/new', 'division_head', 'Program, Trainer and Nominations tabs; sequential request ID fixed on save.'), m('Nomination', '/learning-champion/nominations', 'division_head', 'Nomination request setup, deadline, customizable email; leave and calendar conflict indicators.'), m('Scheduling', `/hr/training/${TT}/schedule`, 'hr', 'Program, Trainer, Participants, Notification, Feedback, Undertaking tabs; venue-and-date conflict pop-up.'), m('Attendance', `/hr/training/${TT}/attendance`, 'hr', 'Mark All, add participant, Teams / Zoom attendance; Submit updates the training database.'), m('Training Database', '/hr/training-database', 'hr', 'One record per employee incl. migrated history; cost per employee and investment.'), m('Training Bonds', `/hr/training/${TT}/schedule?tab=Undertaking / Bond`, 'hr', 'New Training Bond setup, Legal-page print, remaining-liability calculation.'), m('TNA', '/hr/tna', 'hr', 'Divisional requirement, programme-wise TNA via survey, IDP.')] },
  { title: 'Digital Learning', tag: 'Deliver', mods: [m('Courses', '/learning/course/info-security-2026', 'employee', 'SCORM 1.2/2004, xAPI/cmi5, H5P, protected video with Bangla / English subtitles.'), m('Learning Paths', '/employee/journey', 'employee', 'Prerequisites and role-based mandatory learning.'), m('Enrollment', '/learning/course/info-security-2026', 'hr', 'Individual, bulk Excel, by role, grade, branch, division; self-request; external learners.'), m('Certificates', '/employee/certificates', 'employee', 'Multiple templates, digital signature, QR verification.')] },
  { title: 'Assessment', tag: 'Evaluate', mods: [m('Exams', '/assessment/aml-certification', 'employee', 'Nine question types, randomization, negative marking, time and attempt limits.'), m('Question Bank', '/assessment/aml-certification', 'hr', 'By topic, category, difficulty and tag; duplicate detection; bulk upload.'), m('Evaluation', '/assessment/aml-certification', 'trainer', 'Automatic, manual and AI-assisted evaluation with auditable overrides.'), m('Results', '/assessment/aml-certification', 'hr', 'Instant or scheduled release; grades; top-scorer gallery.')] },
  { title: 'Workforce Development', tag: 'Develop', mods: [m('Competencies', '/hr/competencies', 'hr', 'Framework, categories and levels by management level.'), m('IDP', '/hr/tna', 'supervisor', 'Individual Development Plans linked to TNA.'), m('Learning Journeys', '/employee/journey', 'employee', 'Training and course assignment by competency level; progress at all levels.')] },
  { title: 'Engagement', tag: 'Evaluate', mods: [m('Feedback', '/employee/feedback', 'employee', 'Attached to training, course or exam; AI sentiment and themes, reviewed by L&D.'), m('Surveys', '/hr/tna', 'hr', 'Likert, star, drop-down, open-text; distribution by email, SMS, WhatsApp, QR.')] },
  { title: 'Knowledge', tag: 'Deliver', mods: [m('Knowledge Corner', '/resources/knowledge', 'employee', 'Nested folders, protection options, bookmarks, sharing, global search.'), m('Physical Library', '/resources/library', 'employee', 'Book entry, availability, assignment with return date, overdue reports.')] },
  { title: 'Intelligence', tag: 'Measure', mods: [m('Dashboards', '/hr/analytics', 'hr', 'Executive, trainee and manager dashboards.'), m('Reports', '/hr/analytics', 'hr', 'Employee, division, tag, period, gender, multi-criteria, scheduled distribution.'), m('Power BI', '/hr/analytics', 'hr', 'Read-only reporting schema and scheduled extracts.'), m('AI Insights', '/hr/analytics', 'hr', 'Explainable recommendations, compliance risk and sentiment — on-premise, human-reviewed.')] },
  { title: 'Platform', tag: 'Govern', mods: [m('Integrations', '/admin/integrations', 'admin', 'HRIS, IAM, Leave, Meeting Room, Teams, Zoom, Outlook, SMS, WhatsApp, Power BI, SIEM.'), m('Notifications', '/admin/integrations', 'admin', 'Email, SMS, WhatsApp, push and calendar with templates and reminders.'), m('Roles', '/admin/security', 'admin', 'Eight profiles with inherited permissions; role, record and field level.'), m('Maker-Checker', '/admin/security', 'admin', 'Critical actions require a second authorised approver.'), m('Audit', '/admin/audit', 'admin', 'Append-only log forwarded to the Bank SIEM.'), m('Security', '/admin/security', 'admin', 'SSO via SAML/OIDC, session policies, encryption, OWASP, BB ICT guideline.'), m('Mobile', '/mobile', 'employee', 'Android and iOS with offline playback and low-bandwidth mode.')] },
];

export function PlatformMap() {
  const s = useDemo();
  const nav = useNavigate();
  const [sel, setSel] = useState<{ g: string; m: Mod } | null>(null);
  const [hoverG, setHoverG] = useState<string | null>(null);
  const row = (gs: typeof GROUPS, top: boolean) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {gs.map((g, gi) => (
        <div key={g.title} onMouseEnter={() => setHoverG(g.title)} onMouseLeave={() => setHoverG(null)} className="anim-up relative" style={{ animationDelay: `${gi * 70}ms` }}>
          <span className={cx('absolute left-1/2 hidden w-px xl:block', top ? '-bottom-8 h-8' : '-top-8 h-8', hoverG === g.title ? 'bg-brand' : 'bg-ink/15')} />
          <div className={cx('h-full rounded-2xl border bg-white p-5 transition-colors', hoverG === g.title ? 'border-ink/30' : 'border-line')}>
            <div className="flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold tracking-tight">{g.title}</h3><span className="eyebrow text-[9px] text-ink-3">{g.tag}</span></div>
            <ul className="mt-3">
              {g.mods.map((x) => (
                <li key={x.name}><button onClick={() => setSel({ g: g.title, m: x })} className="group flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-[13px] font-medium text-ink-2 hover:text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink/25 group-hover:bg-brand" />{x.name}<ArrowRight size={12} className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
                </button></li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-[1720px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-[10.5px] text-brand">Platform Map</div>
            <h1 className="display mt-2 text-[34px]">The complete ELDP ecosystem</h1>
            <p className="mt-2 max-w-2xl text-[14px] text-ink-2">Every module the Bank specified, organised by business purpose and connected through one learning record, one identity and one audit trail. Click any module for a quick preview.</p>
          </div>
          <div className="flex gap-6 text-right">{[['8', 'capability areas'], [String(GROUPS.reduce((n, g) => n + g.mods.length, 0)), 'modules'], ['12', 'integrations']].map(([n, l]) => <div key={l}><div className="num text-[30px] leading-none">{n}</div><div className="text-[11.5px] text-ink-3">{l}</div></div>)}</div>
        </div>
        {row(GROUPS.slice(0, 4), true)}
        <div className="relative my-8 overflow-hidden rounded-2xl bg-graphite px-8 py-6 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(600px 160px at 50% 0%, rgba(215,25,32,.35), transparent 70%)' }} />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div><div className="eyebrow text-[9.5px] text-red-300">Connected core</div><div className="mt-1 text-[22px] font-extrabold tracking-tight">One Connected Development Ecosystem</div></div>
            <div className="flex flex-wrap gap-2">{['Unified Learning Record', 'City Bank IAM · SSO', 'Workflow & Maker-Checker Engine', 'Notification Engine', 'Append-only Audit', 'Reporting Schema'].map((x) => <span key={x} className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-[12px] font-semibold">{x}</span>)}</div>
          </div>
        </div>
        {row(GROUPS.slice(4), false)}
      </div>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.m.name ?? ''}>
        {sel && (
          <div>
            <div className="th">{sel.g}</div>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{sel.m.desc}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl bg-canvas p-3"><div className="th mb-0.5">Primary user</div><b>{ROLE_LABEL[sel.m.role]}</b></div>
              <div className="rounded-xl bg-canvas p-3"><div className="th mb-0.5">Shares</div><b>Learning record · audit</b></div>
            </div>
            <Btn className="mt-5 w-full" onClick={() => { s.setRole(sel.m.role); nav(sel.m.to); }}>Open {sel.m.name} <ArrowRight size={14} /></Btn>
          </div>
        )}
      </Drawer>
    </div>
  );
}
