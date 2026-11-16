import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Bookmark, Bot, Check, CheckCircle2, Clock, Download, FileText, Flag, Lock, MapPin, PlayCircle, QrCode, ShieldCheck, Subtitles, Video, WifiOff, X,
} from 'lucide-react';
import { CONFLICT_IDS, NOMINEE_LIST, SADIA, TRAINING } from '../data';
import { roster, trainingStatus, useDemo } from '../store';
import type { Attendance, Employee } from '../types';
import { AiLabel, Alert, Avatar, Badge, Btn, cx, Empty, Field, inputCls, LineChart, Progress } from '../components/ui';
import { RequestDetail as LegacyRequestDetail } from './Hr';
import { CertificateCard } from './Learning';

const T = 'TRN-2026-00182';

function Eyebrow({ children, tone = 'brand' }: { children: React.ReactNode; tone?: 'brand' | 'muted' }) {
  return <div className={cx('eyebrow text-[10px]', tone === 'brand' ? 'text-brand' : 'text-ink-3')}>{children}</div>;
}

/* ================= HR REVIEW — decision workspace ================= */
export function RequestReview() {
  const { id } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const [mode, setMode] = useState<'forward' | 'return' | null>(null);
  if (id !== 'TR-2026-00418') return <LegacyRequestDetail />;
  if (!s.requestSubmitted) {
    return <Empty title="TR-2026-00418 has not been submitted yet" sub="Switch to the Division Head in the people ribbon to create it." />;
  }
  const converted = s.scheduleStarted;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{converted ? 'Converted to training program' : 'New request · review required'}</Eyebrow>
          <h1 className="display mt-2 text-[32px]">{TRAINING.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-ink-2"><b className="text-ink">TR-2026-00418</b><span>·</span><span>Received 12 Nov 2026 11:40</span><Badge>{converted ? 'Under Review' : 'Pending HR Review'}</Badge></div>
        </div>
      </div>
      <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-5 border-y border-line py-6 md:grid-cols-3">
            {([['Source', 'Corporate Banking Division'], ['Requested by', 'Farzana Haque, Division Head'], ['Participants', '32 proposed'], ['Business need', 'Credit Risk Capability Enhancement'], ['Audience', TRAINING.audience], ['Mode', TRAINING.mode], ['Proposed dates', TRAINING.dates], ['Venue', TRAINING.venue], ['Competency', 'Credit Analysis · L2 → L4']] as [string, string][]).map(([k, v]) => (
              <div key={k}><div className="th">{k}</div><div className="mt-1 text-[14px] font-semibold">{v}</div></div>
            ))}
          </div>
          <div className="mt-6"><div className="th mb-2">Business justification</div><p className="max-w-2xl text-[14px] leading-relaxed text-ink-2">{s.draft.justification || 'Credit Analysis gap of 2 levels across Relationship Managers and Credit Analysts; portfolio quality targets for FY2027 require uplift before the Q1 lending cycle.'}</p></div>
          <div className="mt-8">
            <div className="th mb-3">Decision</div>
            <div className="grid gap-3 md:grid-cols-3">
              <button onClick={() => { s.startScheduling(); nav(`/hr/training/${T}/schedule`); }} className="group rounded-2xl bg-ink p-5 text-left text-white transition-colors hover:bg-black md:col-span-1">
                <div className="text-[15px] font-extrabold">Convert to Training Program</div>
                <div className="mt-1 text-[12px] text-white/55">Generates {T} and opens scheduling with every field pre-loaded.</div>
                <div className="mt-4 flex items-center gap-1.5 text-[12.5px] font-bold text-red-300">Continue <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></div>
              </button>
              <button onClick={() => setMode('forward')} className="rounded-2xl border border-line bg-white p-5 text-left hover:border-ink/30"><div className="text-[14px] font-bold">Forward</div><div className="mt-1 text-[12px] text-ink-3">To Senior HR Admin or Budget Committee.</div></button>
              <button onClick={() => setMode('return')} className="rounded-2xl border border-line bg-white p-5 text-left hover:border-ink/30"><div className="text-[14px] font-bold">Return for Information</div><div className="mt-1 text-[12px] text-ink-3">Ask the Division Head to clarify.</div></button>
            </div>
            {mode && (
              <div className="anim-slide mt-4 max-w-xl rounded-2xl border border-line bg-white p-4">
                <Field label={mode === 'forward' ? 'Forward to' : 'Information needed'}>{mode === 'forward' ? <select className={inputCls}><option>Shahana Parvin — Senior HR Admin</option><option>Budget Committee Secretariat</option></select> : <textarea rows={2} className={inputCls} placeholder="What should the Division Head clarify?" />}</Field>
                <div className="mt-3 flex justify-end gap-2"><Btn v="secondary" size="sm" onClick={() => setMode(null)}>Cancel</Btn><Btn size="sm" onClick={() => setMode(null)}>{mode === 'forward' ? 'Forward' : 'Return'}</Btn></div>
              </div>
            )}
          </div>
        </div>
        <aside className="rounded-2xl bg-graphite p-6 text-white">
          <div className="eyebrow text-[9.5px] text-red-300">Decision context</div>
          <div className="mt-1 text-[18px] font-extrabold">What ELDP already knows</div>
          <ul className="mt-5 space-y-4 text-[13px]">
            {[
              ['Competency evidence', 'Credit Analysis at L2 for 27 of 32 target officers (Competency module).', 'ok'],
              ['Duplicate check', 'Title exists in Training Setup — linked, not duplicated.', 'ok'],
              ['Budget', 'BDT 14,40,000 within FY26 Functional budget · approval BUD-APP-2026-077 pending.', 'warn'],
              ['Trainer availability', 'Nafis Ahmed and Dr. Farhan Chowdhury free on 18–19 Nov.', 'ok'],
              ['Venue', 'Learning Center available · Executive Training Room booked 10:00–12:00.', 'warn'],
              ['Previous delivery', 'Last run Mar 2025 · 4.4 / 5 feedback · 88% attendance.', 'ok'],
            ].map(([h, d, t]) => (
              <li key={h} className="flex gap-3"><span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', t === 'ok' ? 'bg-emerald-400' : 'bg-amber-400')} /><div><div className="font-bold">{h}</div><div className="text-white/55">{d}</div></div></li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

/* ================= Scheduling intelligence panel ================= */
export function IntelligencePanel({ venueOk }: { venueOk: boolean }) {
  const rows: [string, string, 'ok' | 'warn' | 'brand'][] = [
    ['Venue', venueOk ? 'Available' : 'Conflict 10:00–12:00', venueOk ? 'ok' : 'brand'],
    ['Participants', '32 proposed', 'ok'],
    ['Calendar conflicts', '3', 'warn'],
    ['Leave conflicts', '1', 'warn'],
    ['Trainer availability', 'Available', 'ok'],
    ['Budget status', 'Pending Approval', 'warn'],
  ];
  return (
    <aside className="rounded-2xl bg-graphite p-5 text-white">
      <div className="flex items-center justify-between"><div className="eyebrow text-[9.5px] text-red-300">Intelligence</div><span className="flex items-center gap-1.5 text-[10.5px] text-white/50"><span className="anim-scan h-1.5 w-1.5 rounded-full bg-emerald-400" />Live checks</span></div>
      <ul className="mt-3 divide-y divide-white/8">
        {rows.map(([k, v, t]) => (
          <li key={k} className="flex items-center justify-between py-3 text-[13px]"><span className="text-white/60">{k}</span><span className={cx('font-bold', t === 'ok' ? 'text-emerald-300' : t === 'warn' ? 'text-amber-300' : 'text-red-300')}>{v}</span></li>
        ))}
      </ul>
      <div className="mt-2 text-[10.5px] text-white/35">Sources: Meeting Room, HRIS, Leave, Outlook · simulated</div>
    </aside>
  );
}

/* ================= NOMINATION BOARD ================= */
type Check = { src: string; ok: boolean; note: string };
export function checksFor(e: Employee): Check[] {
  return [
    { src: 'HRIS', ok: e.id !== 'c2', note: e.id === 'c2' ? 'Retirement effective 30 Nov 2026' : 'Active · grade verified' },
    { src: 'Leave Management', ok: e.id !== 'e2', note: e.id === 'e2' ? 'Approved leave 19 Nov' : 'Clear' },
    { src: 'Outlook Calendar', ok: !['e2', 'c3'].includes(e.id), note: e.id === 'e2' ? 'Client Strategy Meeting 18 Nov 14:00' : e.id === 'c3' ? 'Credit Committee 19 Nov 10:00' : 'Clear' },
    { src: 'Training Database', ok: e.id !== 'c1', note: e.id === 'c1' ? 'Overlap: Retail Lending Workshop 18 Nov' : 'No overlap' },
    { src: 'Competency Eligibility', ok: true, note: 'Credit Analysis target role' },
  ];
}
const historyFor = (i: number) => ['Credit Fundamentals ✓', 'AML Refresher ✓', 'Financial Analysis ✓', 'New to track'][i % 4];

function SourceChecks({ e, onDone }: { e: Employee; onDone?: () => void }) {
  const checks = checksFor(e);
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((x) => { if (x >= checks.length) { clearInterval(t); return x; } return x + 1; }), 380);
    return () => clearInterval(t);
  }, [e.id]);
  useEffect(() => { if (n === checks.length) onDone?.(); }, [n]);
  return (
    <ul className="space-y-1.5">
      {checks.map((c, i) => {
        const shown = i < n;
        const running = i === n;
        return (
          <li key={c.src} className={cx('flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300', !shown ? 'border-line bg-white' : c.ok ? 'border-emerald-200 bg-ok-soft' : 'border-red-200 bg-brand-soft')}>
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', !shown ? 'bg-line' : c.ok ? 'bg-emerald-600' : 'bg-brand')}>
              {!shown ? <span className={cx('h-1.5 w-1.5 rounded-full bg-white', running && 'anim-scan')} /> : c.ok ? <Check size={13} /> : <AlertTriangle size={12} />}
            </span>
            <div className="min-w-0 flex-1"><div className="text-[12.5px] font-bold">{c.src}</div><div className="truncate text-[11.5px] text-ink-2">{shown ? c.note : running ? 'Checking…' : 'Queued'}</div></div>
            {shown && <span className={cx('text-[10.5px] font-extrabold uppercase', c.ok ? 'text-ok' : 'text-brand')}>{c.ok ? '✓' : 'Conflict'}</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function NominationBoard({ mode }: { mode: 'lc' | 'hr' }) {
  const s = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState<Employee | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(NOMINEE_LIST.map((e) => [e.id, true])));
  const attention = NOMINEE_LIST.filter((e) => e.eligibility !== 'Eligible');
  const clear = NOMINEE_LIST.filter((e) => e.eligibility === 'Eligible');
  const count = Object.values(sel).filter(Boolean).length;
  const resolvedCount = CONFLICT_IDS.filter((id) => s.resolutions[id]).length;

  if (mode === 'lc' && !s.nominationRequested) {
    return (
      <div className="py-10">
        <Empty title="No nomination request open" sub={s.scheduled ? 'HR has scheduled the training but not yet requested nominations.' : 'HR must first convert and schedule the request.'} />
        {s.requestSubmitted && <div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => { s.setRole('hr'); nav(s.scheduled ? `/hr/training/${T}/schedule?tab=Participants` : '/hr/requests/TR-2026-00418'); }}>Open HR view of this training</Btn></div>}
      </div>
    );
  }

  const row = (e: Employee, i: number) => {
    const attn = e.eligibility !== 'Eligible';
    const res = s.resolutions[e.id];
    return (
      <button key={e.id} onClick={() => setOpen(e)} className={cx('group grid w-full grid-cols-[28px_1.6fr_1.1fr_.9fr_.9fr_1.1fr_.9fr] items-center gap-3 border-b border-line px-4 py-3 text-left text-[13px] transition-colors hover:bg-canvas', open?.id === e.id && 'bg-canvas', res === 'remove' && 'opacity-45')}>
        {mode === 'lc' ? (
          <input aria-label={`Select ${e.name}`} type="checkbox" disabled={s.nominationSubmitted} checked={sel[e.id]} onClick={(ev) => ev.stopPropagation()} onChange={(ev) => setSel({ ...sel, [e.id]: ev.target.checked })} />
        ) : <span className={cx('h-2 w-2 rounded-full', attn ? (res ? 'bg-ink-3' : 'bg-brand') : 'bg-emerald-500')} />}
        <span className="flex items-center gap-2.5"><Avatar name={e.name} size={28} /><span><b className="block">{e.name}</b><span className="text-[11px] text-ink-3">{e.role} · {e.eid}</span></span></span>
        <span className="text-ink-2">{e.division}</span>
        <span className={e.calendar === 'Clear' ? 'text-ink-2' : 'font-bold text-brand'}>{e.calendar === 'Clear' ? 'Clear' : 'Conflict'}</span>
        <span className={e.leave === 'Clear' ? 'text-ink-2' : 'font-bold text-warn'}>{e.leave === 'Clear' ? 'Clear' : '1-day leave'}</span>
        <span className="text-[12px] text-ink-3">{historyFor(i)}</span>
        <span>{res ? <Badge t={res === 'keep' ? 'ok' : 'neutral'}>{res === 'keep' ? 'Kept' : 'Removed'}</Badge> : <Badge>{e.eligibility}</Badge>}</span>
      </button>
    );
  };

  return (
    <div className="relative">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{mode === 'lc' ? 'Learning Champion · Nomination Board' : 'HR · Nomination Board'}</Eyebrow>
          <h1 className="display mt-2 text-[30px]">{mode === 'lc' ? 'Nomination required: Advanced Credit Risk Management' : 'Resolve nominations and finalise participants'}</h1>
          <p className="mt-1.5 text-[13px] text-ink-2">Deadline 14 Nov 2026 · Corporate Banking, SME, Risk, Credit Administration · 18–19 Nov 2026</p>
        </div>
        {mode === 'lc' && (s.nominationSubmitted ? <Btn v="secondary" onClick={() => { s.setRole('hr'); nav(`/hr/training/${T}/schedule?tab=Participants`); }}>Open HR view <ArrowRight size={14} /></Btn> : <Btn disabled={count === 0} onClick={s.submitNominations}>Submit {count} nominations</Btn>)}
        {mode === 'hr' && !s.finalized && <Btn onClick={s.finalize}>Finalize participants</Btn>}
      </div>
      <div className="mb-6 flex flex-wrap items-stretch divide-x divide-line border-y border-line">
        {[['35', 'nominated', ''], ['31', 'eligible', 'text-ok'], [s.finalized ? '0' : String(4 - (mode === 'hr' ? resolvedCount : 0)), 'attention required', s.finalized ? 'text-ok' : 'text-brand'], [s.finalized ? String(roster(s).length) : '—', 'final participants', '']].map(([n, l, c]) => (
          <div key={l} className="flex-1 px-6 py-4 first:pl-0"><div className={cx('num text-[34px] leading-none', c)}>{n}</div><div className="mt-1 text-[12px] text-ink-3">{l}</div></div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid grid-cols-[28px_1.6fr_1.1fr_.9fr_.9fr_1.1fr_.9fr] gap-3 border-b border-line bg-canvas px-4 py-2.5">{['', 'Employee', 'Division', 'Calendar', 'Leave', 'Training history', 'Eligibility'].map((h) => <span key={h} className="th">{h}</span>)}</div>
        <div className="border-b border-line bg-brand-soft/60 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-brand-dark">Attention required · {attention.length}</div>
        {attention.map((e, i) => row(e, i))}
        <div className="border-b border-line bg-canvas px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.1em] text-ink-3">Eligible · {clear.length}</div>
        <div className="max-h-[420px] overflow-y-auto scroll-thin">{clear.map((e, i) => row(e, i + 4))}</div>
      </div>

      {open && (
        <div className="anim-fade fixed inset-0 z-50 bg-ink/25" onClick={() => setOpen(null)}>
          <aside className="anim-drawer absolute right-0 top-0 h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-line p-6">
              <div className="flex items-center gap-3"><Avatar name={open.name} size={44} /><div><div className="text-[17px] font-extrabold">{open.name}</div><div className="text-[12px] text-ink-3">{open.role} · {open.division} · {open.eid}</div></div></div>
              <button onClick={() => setOpen(null)} aria-label="Close" className="text-ink-3 hover:text-ink"><X size={18} /></button>
            </div>
            <div className="p-6">
              {open.eligibility !== 'Eligible' ? (
                <div className="mb-5 rounded-2xl bg-brand-soft p-4">
                  <div className="eyebrow text-[9.5px] text-brand">Attention required</div>
                  {open.id === 'e2' ? (
                    <dl className="mt-2 space-y-1.5 text-[13px]"><div><dt className="inline font-semibold">Approved leave: </dt><dd className="inline">19 Nov</dd></div><div><dt className="inline font-semibold">Calendar conflict: </dt><dd className="inline">Client Strategy Meeting</dd></div><div><dt className="inline font-semibold">Recommendation: </dt><dd className="inline">Replace or adjust schedule</dd></div></dl>
                  ) : <p className="mt-2 text-[13px]">{open.issue}<br /><b>Recommendation:</b> {open.id === 'c2' ? 'Remove — separation before bond period' : 'Remove or reschedule'}</p>}
                </div>
              ) : <div className="mb-5 rounded-2xl bg-ok-soft p-4 text-[13px] font-semibold text-ok">Eligible — all sources clear</div>}
              <div className="th mb-2">Connected sources</div>
              <SourceChecks e={open} />
              {mode === 'hr' && open.eligibility !== 'Eligible' && !s.finalized && (
                <div className="mt-5 flex gap-2">
                  <Btn className="flex-1" v="secondary" onClick={() => { s.resolve(open.id, 'keep'); setOpen(null); }}>Keep (override logged)</Btn>
                  <Btn className="flex-1" v="danger" onClick={() => { s.resolve(open.id, 'remove'); setOpen(null); }}>Remove</Btn>
                </div>
              )}
              <p className="mt-4 text-[11px] text-ink-3">Integrations are simulated in this demo. Production reads HRIS, Leave Management and Outlook through adapters.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export function NominationsPage() { return <NominationBoard mode="lc" />; }

/* ================= WITHDRAWAL / REPLACEMENT ================= */
const REPL_CHECKS = [['HRIS', 'Active'], ['Leave', 'Clear'], ['Calendar', 'Clear'], ['Mandatory requirement', 'Eligible'], ['Training conflict', 'None']];
export function ReplacementExperience() {
  const s = useDemo();
  const nav = useNavigate();
  const w = s.withdrawal;
  const [picking, setPicking] = useState(false);
  const [checked, setChecked] = useState(0);
  const [running, setRunning] = useState(false);
  const run = () => {
    setRunning(true); setChecked(0);
    let n = 0;
    const t = setInterval(() => { n += 1; setChecked(n); if (n >= REPL_CHECKS.length) { clearInterval(t); setRunning(false); } }, 420);
  };
  const flowPos = w.status === 'none' ? -1 : w.status === 'requested' ? 1 : w.status === 'proposed' ? 2 : 4;
  const r = roster(s);
  return (
    <div>
      <div className="mb-6"><Eyebrow>Supervisor · Mahmud Karim</Eyebrow><h1 className="display mt-2 text-[30px]">Withdrawal &amp; replacement</h1><p className="mt-1.5 text-[13px] text-ink-2">{TRAINING.title} · {TRAINING.dates}</p></div>
      {w.status === 'none' ? (
        <div className="py-8"><Empty title="No pending withdrawal requests" sub="When a team member requests withdrawal, it appears here with the full context." /><div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => { s.setRole('employee'); s.setEmployee('e2'); nav('/employee/dashboard'); }}>See Tanvir Hasan’s invitation</Btn></div></div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[1.25fr_1fr]">
          <div>
            {/* flow */}
            <div className="mb-6 flex items-center">
              {['Employee', 'Supervisor', 'HR Admin', 'Roster updated'].map((x, i) => (
                <div key={x} className="flex flex-1 items-center">
                  <div className="flex items-center gap-2"><span className={cx('grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold transition-all duration-500', i < flowPos ? 'bg-ink text-white' : i === flowPos ? 'anim-pulse bg-brand text-white' : 'bg-line text-ink-3')}>{i < flowPos ? <Check size={14} /> : i + 1}</span><span className={cx('text-[13px] font-bold', i === flowPos ? 'text-brand' : i < flowPos ? 'text-ink' : 'text-ink-3')}>{x}</span></div>
                  {i < 3 && <span className={cx('mx-3 h-px flex-1 transition-colors duration-500', i < flowPos ? 'bg-ink' : 'bg-line')} />}
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3"><Avatar name="Tanvir Hasan" size={46} /><div><div className="text-[17px] font-extrabold">Tanvir Hasan</div><div className="text-[12px] text-ink-3">Credit Analyst · Corporate Banking · CBL-09371</div></div></div>
                <Badge>{w.status === 'requested' ? 'Withdrawal Requested' : w.status === 'rejected' ? 'Rejected' : w.replacementId ? (w.status === 'approved' ? 'Approved' : 'Replacement Proposed') : 'Approved'}</Badge>
              </div>
              <div className="mt-4 rounded-xl bg-canvas p-4"><div className="th mb-1">Reason</div><div className="text-[14px]">{w.reason}</div></div>
              {w.status === 'requested' && !picking && (
                <div className="mt-5 flex flex-wrap gap-2"><Btn v="secondary" onClick={() => s.decideWithdrawal('approve')}>Approve</Btn><Btn onClick={() => { setPicking(true); }}>Approve with Replacement</Btn><Btn v="danger" onClick={() => s.decideWithdrawal('reject')}>Reject</Btn></div>
              )}
              {w.status === 'requested' && picking && (
                <div className="anim-slide mt-5">
                  <div className="th mb-2">Replacement candidate</div>
                  <div className="flex items-center gap-3 rounded-xl border-2 border-ink p-3"><Avatar name={SADIA.name} size={38} /><div className="flex-1"><div className="text-[14px] font-bold">{SADIA.name}</div><div className="text-[12px] text-ink-3">{SADIA.role} · {SADIA.division} · {SADIA.eid}</div></div><AiLabel>Suggested: same competency target</AiLabel></div>
                  <div className="mt-4 space-y-1.5">
                    {REPL_CHECKS.map(([k, v], i) => (
                      <div key={k} className={cx('flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-all duration-300', i < checked ? 'bg-ok-soft' : 'bg-canvas')}>
                        <span className={cx('grid h-5 w-5 place-items-center rounded-full text-white', i < checked ? 'bg-emerald-600' : 'bg-line')}>{i < checked ? <Check size={11} /> : <span className={cx('h-1.5 w-1.5 rounded-full bg-white', running && i === checked && 'anim-scan')} />}</span>
                        <span className="w-44 font-bold">{k}</span><span className={i < checked ? 'font-semibold text-ok' : 'text-ink-3'}>{i < checked ? `✓ ${v}` : running && i === checked ? 'Checking…' : 'Queued'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">{checked < REPL_CHECKS.length ? <Btn disabled={running} onClick={run}>{running ? 'Running eligibility check…' : 'Run live eligibility check'}</Btn> : <Btn onClick={() => s.decideWithdrawal('replace')}>Propose Sadia Islam as replacement</Btn>}<Btn v="ghost" onClick={() => setPicking(false)}>Cancel</Btn></div>
                </div>
              )}
              {w.status === 'proposed' && <div className="mt-5"><Alert kind="info" title="Replacement proposed — awaiting HR Admin" action={<Btn size="sm" onClick={() => { s.setRole('hr'); nav(`/hr/training/${T}/schedule?tab=Participants`); }}>Open HR view</Btn>}>Maker-checker: HR Admin gives final approval; Senior HR Admin co-signs.</Alert></div>}
              {w.status === 'approved' && <div className="anim-slide mt-5 rounded-xl bg-ink p-4 text-white"><div className="text-[16px] font-extrabold">Replacement Approved</div><div className="text-[12.5px] text-white/60">Participant count remains {r.length}. Audit trail and notifications updated.</div></div>}
              {w.status === 'rejected' && <div className="mt-5"><Alert kind="brand" title="Rejected — Tanvir Hasan remains a participant" /></div>}
            </div>
          </div>
          {/* roster swap */}
          <div>
            <div className="th mb-2">Participant position #2 · live roster</div>
            <div className="space-y-2">
              {w.status !== 'approved' ? (
                <div className={cx('flex items-center gap-3 rounded-xl border border-line bg-white p-3', w.status === 'proposed' && 'border-dashed')}>
                  <Avatar name="Tanvir Hasan" /><div className="flex-1"><div className="text-[13px] font-bold">Tanvir Hasan</div><div className="text-[11px] text-ink-3">Credit Analyst</div></div><Badge>{s.participation.e2 ?? 'Invited'}</Badge>
                </div>
              ) : (
                <>
                  <div className="anim-out flex items-center gap-3 rounded-xl border border-line bg-white p-3"><Avatar name="Tanvir Hasan" /><div className="flex-1 text-[13px] font-bold line-through">Tanvir Hasan</div><Badge t="neutral">Withdrawn</Badge></div>
                  <div className="anim-in-right flex items-center gap-3 rounded-xl border-2 border-emerald-500 bg-ok-soft p-3" style={{ animationDelay: '.45s' }}><Avatar name="Sadia Islam" /><div className="flex-1"><div className="text-[13px] font-bold">Sadia Islam</div><div className="text-[11px] text-ink-3">Senior Credit Analyst · Risk Management</div></div><Badge>{s.participation.e4 ?? 'Invited'}</Badge></div>
                </>
              )}
              {['Ayesha Rahman', 'Nusrat Karim', 'Rashed Chowdhury'].map((n) => <div key={n} className="flex items-center gap-3 rounded-xl border border-line bg-white/60 p-3 opacity-60"><Avatar name={n} /><div className="flex-1 text-[13px] font-semibold">{n}</div><Badge>{s.participation[NOMINEE_LIST.find((x) => x.name === n)!.id] ?? 'Invited'}</Badge></div>)}
            </div>
            <div className="mt-5 flex items-baseline gap-3 border-t border-line pt-4"><span className="num text-[40px] leading-none">{s.finalized ? r.length : 32}</span><span className="text-[13px] text-ink-3">participants — unchanged after replacement</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= ATTENDANCE ================= */
const ATT: Attendance[] = ['Present', 'Absent', 'Late', 'Excused'];
export function AttendanceV2() {
  const s = useDemo();
  const nav = useNavigate();
  const [prop, setProp] = useState(s.attendanceSubmitted ? 4 : 0);
  const [synced, setSynced] = useState(false);
  const r = roster(s);
  if (!s.invitesSent) return <div className="py-10"><Empty title="Attendance opens after invitations are sent" sub="Complete nomination, finalisation and invitation first." /><div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => nav(`/hr/training/${T}/schedule?tab=Participants`)}>Open scheduling workspace</Btn></div></div>;
  const online = r.slice(0, 12), physical = r.slice(12);
  const c = (a: Attendance) => r.filter((e) => s.attendance[e.id] === a).length;
  const onlineSynced = online.filter((e) => s.attendance[e.id]).length;
  const submit = () => { s.submitAttendance(); setProp(0); let n = 0; const t = setInterval(() => { n += 1; setProp(n); if (n >= 4) clearInterval(t); }, 450); };
  const attended = r.filter((e) => ['Present', 'Late'].includes(s.attendance[e.id] ?? '')).length;
  const list = (rows: Employee[], label: string) => (
    <div>
      <div className="th mb-2">{label} · {rows.length}</div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="max-h-[420px] overflow-y-auto scroll-thin">
          {rows.map((e) => (
            <div key={e.id} className={cx('flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0', e.id === 'e4' && 'bg-ok-soft/50')}>
              <Avatar name={e.name} size={28} /><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-bold">{e.name}</div><div className="text-[11px] text-ink-3">{e.role}{e.id === 'e4' && ' · replacement'}</div></div>
              {s.attendanceSubmitted ? <Badge>{s.attendance[e.id] ?? 'Absent'}</Badge> : (
                <div className="flex gap-0.5 rounded-lg bg-canvas p-0.5">{ATT.map((a) => <button key={a} onClick={() => s.mark(e.id, a)} className={cx('rounded-md px-2 py-1 text-[11px] font-bold', s.attendance[e.id] === a ? (a === 'Present' ? 'bg-emerald-600 text-white' : a === 'Absent' ? 'bg-brand text-white' : 'bg-ink text-white') : 'text-ink-3 hover:text-ink')}>{a}</button>)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow>Planned Training · Attendance</Eyebrow><h1 className="display mt-2 text-[30px]">{TRAINING.title}</h1><p className="mt-1.5 text-[13px] text-ink-2">{T} · {TRAINING.dates} · {TRAINING.venue} · <Badge>{trainingStatus(s)}</Badge></p></div>
        {!s.attendanceSubmitted && <div className="flex gap-2"><Btn v="secondary" onClick={s.markAll}>Mark All Present</Btn><Btn v="secondary">Add Participant</Btn><Btn v="secondary">Save Draft</Btn><Btn disabled={!r.some((e) => s.attendance[e.id])} onClick={submit}>Submit Attendance</Btn></div>}
      </div>
      <div className="mb-6 flex flex-wrap divide-x divide-line border-y border-line">
        {[[c('Present') + c('Late'), 'Present', 'text-ok'], [c('Absent'), 'Absent', 'text-brand'], [c('Excused'), 'Excused', ''], [onlineSynced, 'Online (synced)', ''], [r.length, 'Participants', '']].map(([n, l, cl]) => (
          <div key={l as string} className="flex-1 px-6 py-4 first:pl-0"><div className={cx('num text-[34px] leading-none', cl as string)}>{n}</div><div className="mt-1 text-[12px] text-ink-3">{l}</div></div>
        ))}
      </div>
      {(s.attendanceSubmitted) && (
        <div className="mb-6 rounded-2xl bg-graphite p-6 text-white">
          <div className="eyebrow text-[9.5px] text-red-300">Data propagation</div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {['Attendance', 'Employee Learning Record', 'Training Analytics', 'Manager Dashboard'].map((x, i) => (
              <div key={x} className="flex items-center gap-3">
                <span className={cx('rounded-xl border px-4 py-2.5 text-[13px] font-bold transition-all duration-500', i < prop ? 'border-white bg-white text-ink' : 'border-white/15 text-white/40')}>{i < prop && <Check size={13} className="mr-1.5 inline text-emerald-600" />}{x}</span>
                {i < 3 && <ArrowRight size={16} className={i < prop - 1 ? 'text-red-300' : 'text-white/20'} />}
              </div>
            ))}
            {prop >= 4 && <button onClick={() => { s.setRole('employee'); s.setEmployee('e1'); nav('/employee/learning-history'); }} className="anim-slide ml-auto flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold">Open Ayesha’s learning record <ArrowRight size={14} /></button>}
          </div>
          <div className="mt-3 text-[12px] text-white/50">Employee learning records updated · learning hours +{attended * 16} · cost per participant recalculated</div>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_320px]">
        {list(physical, 'Physical participants')}
        {list(online, 'Online participants')}
        <div className="space-y-4">
          <div className="rounded-2xl bg-graphite p-5 text-white">
            <div className="flex items-center gap-2"><Video size={16} className="text-red-300" /><span className="text-[14px] font-extrabold">Microsoft Teams</span><span className="ml-auto text-[10px] uppercase tracking-wider text-white/40">simulated</span></div>
            <div className="mt-3 num text-[30px]">{synced || onlineSynced >= 12 ? '12' : '0'}<span className="ml-2 text-[13px] font-semibold text-white/50">attendance records synced</span></div>
            <div className="text-[12px] text-white/45">Last sync: {synced || onlineSynced >= 12 ? '11:42 AM' : '—'}</div>
            <button disabled={s.attendanceSubmitted} onClick={() => { s.syncOnline(); setSynced(true); }} className="mt-4 w-full rounded-xl bg-white/10 py-2.5 text-[12.5px] font-bold hover:bg-white/15">Sync now</button>
          </div>
          {s.attendanceSubmitted && <Completion attended={attended} total={r.length} />}
        </div>
      </div>
    </div>
  );
}

function Completion({ attended, total }: { attended: number; total: number }) {
  const s = useDemo();
  const nav = useNavigate();
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="th">Feedback &amp; completion</div>
      {!s.feedbackSubmitted ? (
        <><p className="mt-2 text-[13px] text-ink-2">Feedback released to {attended} attendees.</p><Btn size="sm" className="mt-3" v="secondary" onClick={() => { s.setRole('employee'); nav('/employee/feedback'); }}>Open employee feedback</Btn></>
      ) : (
        <div className="anim-slide mt-2">
          <AiLabel />
          <div className="mt-3 text-[13px]"><b className="text-ok">89% positive sentiment</b><br />Most mentioned strength: practical case studies<br />Common improvement theme: session duration</div>
          {!s.completed ? <Btn size="sm" className="mt-4 w-full" onClick={s.complete}>Complete Training</Btn> : (
            <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
              {[['Participants', total], ['Attended', attended], ['Completion', `${((attended / total) * 100).toFixed(1)}%`], ['Total cost', 'BDT 14.4 lakh'], ['Cost / participant', `BDT ${Math.round(1440000 / total).toLocaleString('en-IN')}`], ['Feedback', '4.6 / 5'], ['Learning hours', `${attended * 16}`], ['Investment', 'BDT 14.4 lakh']].map(([k, v]) => <div key={k as string} className="rounded-lg bg-canvas p-2"><div className="text-ink-3">{k}</div><div className="text-[14px] font-extrabold">{v}</div></div>)}
              <Btn size="sm" className="col-span-2" onClick={() => nav('/hr/analytics')}>Executive Command Center</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= DEVELOPMENT JOURNEY ================= */
const VIEWS = [{ id: 'e1', name: 'Ayesha Rahman', title: 'Relationship Manager', eid: 'CBL-10482', div: 'Corporate Banking' }, { id: 'e2', name: 'Tanvir Hasan', title: 'Credit Analyst', eid: 'CBL-09371', div: 'Corporate Banking' }, { id: 'e4', name: 'Sadia Islam', title: 'Senior Credit Analyst', eid: 'CBL-11804', div: 'Risk Management' }];
export function DevelopmentJourney() {
  const s = useDemo();
  const me = VIEWS.find((v) => v.id === s.employeeId) ?? VIEWS[0];
  const part = s.participation[me.id];
  const att = s.attendanceSubmitted && part === 'Attended';
  const examPassed = s.aiScore.state !== 'suggested';
  const items = [
    { d: 'Nov 2026', t: TRAINING.title, k: 'Classroom + Webinar · 16 h', st: att ? 'Completed' : part === 'Withdrawn' ? 'Withdrawn' : s.invitesSent ? (part ?? 'Invited') : 'Requested', fresh: att },
    { d: 'Nov 2026', t: 'AML Annual Certification', k: 'Proctored assessment', st: examPassed ? 'Passed' : 'Upcoming', fresh: examPassed },
    { d: 'Nov 2026', t: 'Information Security Awareness 2026', k: 'Mandatory e-learning · 3 h', st: s.courseCompleted ? 'Completed' : `In Progress · ${s.courseProgress}%`, fresh: s.courseCompleted },
    { d: 'Dec 2026', t: 'Leadership Essentials for Managers', k: 'Classroom · 16 h', st: 'Scheduled', fresh: false },
    { d: 'Oct 2026', t: 'Customer Experience Excellence', k: 'Classroom · 8 h', st: 'Completed', fresh: false },
    { d: 'Aug 2026', t: 'Credit Fundamentals', k: 'Learning journey step 1 · e-learning', st: 'Completed', fresh: false },
  ];
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar name={me.name} size={72} />
          <div><Eyebrow>My Development Journey</Eyebrow><h1 className="display mt-1.5 text-[34px]">{me.name}</h1><p className="text-[13px] text-ink-2">{me.title} · {me.div} · {me.eid} · Supervisor Mahmud Karim</p></div>
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1 text-[12px] font-bold">{VIEWS.map((v) => <button key={v.id} onClick={() => s.setEmployee(v.id)} className={cx('rounded-lg px-3 py-1.5', s.employeeId === v.id ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas')}>{v.name.split(' ')[0]}</button>)}</div>
      </div>
      <div className="mb-10 flex flex-wrap divide-x divide-line border-y border-line">
        {[[att ? 76 : 60, 'Learning hours (YTD)', att], [s.courseCompleted ? 7 : 6, 'Certificates', s.courseCompleted], ['7', 'Competencies tracked', false], [`${s.journeyDone}/5`, 'Learning journey', false], [examPassed ? 5 : 4, 'Assessments passed', examPassed], [att ? 9 : 8, 'Programmes attended', att]].map(([n, l, f]) => (
          <div key={l as string} className="flex-1 px-6 py-5 first:pl-0"><div className={cx('num text-[32px] leading-none', f ? 'text-ok' : '')}>{n}</div><div className="mt-1 text-[12px] text-ink-3">{l}</div></div>
        ))}
      </div>
      <div className="grid gap-12 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline gap-3"><span className="display text-[44px] text-ink/10">2026</span><span className="text-[13px] text-ink-3">Everything accumulates into one employee record</span></div>
          <ol className="relative border-l-2 border-line">
            {items.map((x, i) => (
              <li key={x.t} className={cx('relative pb-7 pl-8', x.fresh && 'anim-slide')} style={{ animationDelay: `${i * 80}ms` }}>
                <span className={cx('absolute -left-[9px] top-1 h-4 w-4 rounded-full border-[3px] border-canvas', x.st.startsWith('Completed') || x.st === 'Passed' ? 'bg-ink' : x.st === 'Scheduled' || x.st.startsWith('In Progress') ? 'bg-brand' : 'bg-ink-3/40')} />
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-3">{x.d}{x.fresh && <span className="ml-2 text-brand">Just updated</span>}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3"><span className="text-[16px] font-extrabold tracking-tight">{x.t}</span><Badge t={x.st.startsWith('Completed') || x.st === 'Passed' ? 'ok' : x.st === 'Scheduled' ? 'info' : 'neutral'}>{x.st}</Badge></div>
                <div className="text-[12.5px] text-ink-3">{x.k}</div>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-8">
          <div>
            <div className="th mb-3">Competencies · Relationship Manager</div>
            {[['Communication', 4, 4], ['Customer Relationship', 3, 4], ['Credit Analysis', s.journeyDone >= 5 ? 4 : s.journeyDone >= 3 ? 3 : 2, 4], ['AML & Compliance', 4, 4], ['Leadership', 2, 3]].map(([n, c, t]) => (
              <div key={n as string} className="mb-3 flex items-center gap-3 text-[13px]"><span className="w-44 font-semibold">{n}</span><div className="flex flex-1 gap-1">{[1, 2, 3, 4].map((l) => <span key={l} className={cx('h-2 flex-1 rounded-full', l <= (c as number) ? 'bg-ink' : l <= (t as number) ? 'bg-brand/25' : 'bg-line')} />)}</div><span className="w-10 text-right tabular-nums text-ink-3">{c}/{t}</span></div>
            ))}
          </div>
          <div><div className="th mb-2">Learning journey · Credit Analysis L4</div><Progress value={(s.journeyDone / 5) * 100} /><div className="mt-1.5 text-[12px] text-ink-3">{s.journeyDone} of 5 complete · next: {['Credit Fundamentals', 'Advanced Financial Analysis', 'Credit Risk Workshop', 'Case Study Assessment', 'Final Competency Review'][Math.min(s.journeyDone, 4)]}</div></div>
          <div><div className="th mb-2">Assessment history</div>{[['AML Annual Certification', examPassed ? '82% · Passed' : 'Scheduled 30 Nov'], ['Information Security quiz', s.courseCompleted ? '90%' : '—'], ['Credit Fundamentals', '88%']].map(([a, b]) => <div key={a} className="flex justify-between border-b border-line py-2 text-[13px]"><span>{a}</span><b>{b}</b></div>)}</div>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPETENCY ================= */
const PROFILE: [string, number, number][] = [['Communication', 4, 4], ['Customer Relationship', 3, 4], ['Credit Analysis', 2, 4], ['AML', 4, 4], ['Leadership', 2, 3]];
const PATH = ['Credit Fundamentals', 'Financial Analysis', 'Credit Risk Workshop', 'Assessment', 'Competency Review'];
export function CapabilityProfile() {
  const s = useDemo();
  const nav = useNavigate();
  return (
    <div>
      <div className="mb-8"><Eyebrow>Role Capability Profile</Eyebrow><h1 className="display mt-2 text-[34px]">Relationship Manager</h1><p className="mt-1.5 text-[13px] text-ink-2">Current → Target · 32 officers in Corporate Banking · framework FY2026</p></div>
      <div className="grid items-center gap-10 xl:grid-cols-[1.1fr_auto_1fr]">
        <div className="space-y-2">
          {PROFILE.map(([n, c, t]) => {
            const gap = t - c;
            const pri = n === 'Credit Analysis';
            return (
              <div key={n} className={cx('flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors', pri ? 'bg-ink text-white' : 'bg-white')}>
                <span className="w-44 text-[14px] font-bold">{n}</span>
                <div className="flex flex-1 items-center gap-1.5">{[1, 2, 3, 4].map((l) => <span key={l} className={cx('h-3 flex-1 rounded-full', l <= c ? (pri ? 'bg-white' : 'bg-ink') : l <= t ? 'bg-brand' : pri ? 'bg-white/10' : 'bg-line')} />)}</div>
                <span className="w-16 text-right text-[14px] font-extrabold tabular-nums">{c} → {t}</span>
                <span className={cx('w-20 text-right text-[11px] font-bold uppercase', gap === 0 ? (pri ? 'text-white/50' : 'text-ok') : pri ? 'text-red-300' : 'text-warn')}>{gap === 0 ? 'Met' : `Gap ${gap}`}</span>
              </div>
            );
          })}
          <div className="flex gap-4 pt-2 text-[11.5px] text-ink-3"><span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-ink" />Current</span><span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-brand" />Gap to target</span></div>
        </div>
        <div className="hidden flex-col items-center xl:flex">
          <div className="rounded-2xl bg-brand px-5 py-4 text-center text-white"><div className="eyebrow text-[9px] text-white/70">Priority gap</div><div className="mt-1 text-[18px] font-extrabold">Credit Analysis</div><div className="text-[12px] text-white/80">2 levels · 27 officers</div></div>
          <svg width="120" height="40" className="my-2"><path d="M0,20 L110,20" stroke="#d71920" strokeWidth="2" className="anim-dash" /><path d="M104,14 L112,20 L104,26" stroke="#d71920" strokeWidth="2" fill="none" /></svg>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between"><div className="th">Recommended learning journey</div><AiLabel>AI-suggested · approved by L&amp;D</AiLabel></div>
          <ol className="relative border-l-2 border-line">
            {PATH.map((p, i) => {
              const done = i < s.journeyDone;
              return (
                <li key={p} className="relative pb-5 pl-7">
                  <span className={cx('absolute -left-[11px] top-0 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold', done ? 'bg-ink text-white' : i === s.journeyDone ? 'anim-pulse bg-brand text-white' : 'border-2 border-line bg-white text-ink-3')}>{done ? <Check size={11} /> : i + 1}</span>
                  <div className="text-[14px] font-bold">{p}</div>
                  <div className="text-[12px] text-ink-3">{done ? 'Complete' : i === s.journeyDone ? 'Current milestone' : ['e-Learning', 'e-Learning', `Classroom · ${T}`, 'Case study assessment', 'Supervisor review'][i]}</div>
                </li>
              );
            })}
          </ol>
          <div className="flex gap-2"><Btn onClick={() => nav('/employee/journey')}>Create Learning Journey</Btn><Btn v="secondary" onClick={() => nav('/hr/tna')}>Open TNA</Btn></div>
        </div>
      </div>
    </div>
  );
}

/* ================= COURSE PLAYER ================= */
const MODS = ['Phishing & Social Engineering', 'Data Handling & Classification', 'Scenario Exercise', 'Assessment checkpoint', 'Course Feedback', 'Certificate'];
export function CoursePlayerV2() {
  const s = useDemo();
  const nav = useNavigate();
  const [mod, setMod] = useState(s.courseCompleted ? 5 : 1);
  const [panel, setPanel] = useState<'Resources' | 'Notes' | 'AI Assistant'>('Resources');
  const [bm, setBm] = useState(false);
  const done = s.courseCompleted;
  const unlocked = (i: number) => done || i <= Math.max(1, mod);
  return (
    <div>
      <div className="grid min-h-[calc(100vh-100px)] xl:grid-cols-[260px_1fr_320px]">
        <aside className="border-r border-line bg-white p-5">
          <Eyebrow>Mandatory · due 20 Nov</Eyebrow>
          <div className="mt-1 text-[16px] font-extrabold leading-snug">Information Security Awareness 2026</div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-3"><span className="num text-[20px] text-ink">{s.courseProgress}%</span>complete</div>
          <ol className="relative mt-5 border-l-2 border-line">
            {MODS.map((x, i) => (
              <li key={x} className="relative pb-4 pl-6">
                <span className={cx('absolute -left-[9px] top-0.5 grid h-4 w-4 place-items-center rounded-full', i < mod || done ? 'bg-ink' : i === mod ? 'bg-brand' : 'border-2 border-line bg-white')}>{(i < mod || done) && <Check size={9} className="text-white" />}{!unlocked(i) && <Lock size={8} className="text-ink-3" />}</span>
                <button disabled={!unlocked(i)} onClick={() => setMod(i)} className={cx('text-left text-[13px]', i === mod ? 'font-extrabold text-ink' : 'font-semibold text-ink-2')}>{x}</button>
                <div className="text-[11px] text-ink-3">{i < 2 ? 'Video · 12 min' : i === 2 ? 'H5P interaction' : i === 3 ? '10 questions · pass 80%' : i === 4 ? '2 min' : 'QR-verified'}</div>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-3"><Lock size={11} />Mandatory sequence enforced</div>
        </aside>
        <div className="flex flex-col bg-canvas">
          <div className="flex-1 p-6">
            {done && mod === 5 ? <div className="pt-4"><CertificateCard /><div className="mt-4 flex justify-center gap-2"><Btn icon={<Download size={14} />}>Download</Btn><Btn v="secondary" onClick={() => nav('/employee/certificates')}>View</Btn></div><div className="mx-auto mt-4 max-w-2xl"><Alert kind="ok" title="Completion propagated">Employee dashboard, manager dashboard and compliance reporting updated.</Alert></div></div>
              : mod === 3 ? (
                <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8"><Eyebrow tone="muted">Assessment checkpoint · 1 of 10</Eyebrow><p className="mt-3 text-[18px] font-bold leading-snug">An email from “IT Helpdesk” asks you to confirm your password via a link. What do you do?</p><div className="mt-5 space-y-2">{['Click and comply', 'Report to the Information Security desk', 'Forward to colleagues'].map((o, i) => <label key={o} className="flex items-center gap-3 rounded-xl border border-line p-4 text-[14px] hover:bg-canvas"><input type="radio" name="q" defaultChecked={i === 1} />{o}</label>)}</div><Btn className="mt-6" onClick={() => { s.setCourseProgress(90); setMod(4); }}>Submit · score 90%</Btn></div>
              ) : mod === 4 ? (
                <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8"><Eyebrow tone="muted">Course feedback</Eyebrow><p className="mt-3 text-[18px] font-bold">How relevant was this course to your role?</p><div className="mt-4 text-3xl text-amber-400">★★★★★</div><Btn className="mt-6" onClick={() => { s.completeCourse(); setMod(5); }}>Submit feedback &amp; issue certificate</Btn></div>
              ) : (
                <div>
                  <div className="relative overflow-hidden rounded-2xl bg-graphite text-white" style={{ aspectRatio: '16/8.2' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(600px 300px at 70% 30%, rgba(215,25,32,.35), transparent 70%)' }} />
                    <div className="relative grid h-full place-items-center text-center"><div><PlayCircle size={72} strokeWidth={1.2} className="mx-auto" /><div className="mt-3 text-[20px] font-extrabold">{MODS[mod]}</div><div className="text-[12px] text-white/55">Resume from 06:40 · HLS adaptive 720p · watermark CBL-10482</div></div></div>
                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 p-4 text-[11.5px] font-semibold">
                      <span>06:40 / 12:05</span><div className="h-1 flex-1 rounded-full bg-white/20"><div className="h-full w-[55%] rounded-full bg-brand" /></div>
                      <span className="flex items-center gap-1"><Subtitles size={14} />EN / বাংলা</span><span>1.0x</span><span className="flex items-center gap-1"><Lock size={12} />Seek locked</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Btn onClick={() => { s.setCourseProgress(Math.min(85, s.courseProgress + 10)); setMod(mod + 1); }}>Complete module &amp; continue</Btn>
                    <Btn v="secondary" icon={<Bookmark size={14} className={bm ? 'fill-brand text-brand' : ''} />} onClick={() => setBm(!bm)}>{bm ? 'Bookmarked' : 'Bookmark'}</Btn>
                    <span className="ml-auto flex items-center gap-1.5 text-[12px] font-semibold text-ok"><WifiOff size={14} />Available offline</span>
                  </div>
                </div>
              )}
          </div>
          <div className="border-t border-line bg-white px-6 py-4">
            <div className="flex items-center gap-2">
              {MODS.map((x, i) => <div key={x} className="flex-1"><div className={cx('h-1.5 rounded-full', i < mod || done ? 'bg-ink' : i === mod ? 'bg-brand' : 'bg-line')} /><div className={cx('mt-1.5 truncate text-[10.5px] font-semibold', i === mod ? 'text-ink' : 'text-ink-3')}>{i === 3 ? '◆ ' : ''}{x}</div></div>)}
            </div>
          </div>
        </div>
        <aside className="border-l border-line bg-white">
          <div className="flex border-b border-line">{(['Resources', 'Notes', 'AI Assistant'] as const).map((p) => <button key={p} onClick={() => setPanel(p)} className={cx('flex-1 border-b-2 py-3 text-[12px] font-bold', panel === p ? 'border-brand text-ink' : 'border-transparent text-ink-3')}>{p}</button>)}</div>
          <div className="p-5 text-[13px]">
            {panel === 'Resources' && <ul className="space-y-3">{['Information Security Policy v4.2.pdf', 'Phishing examples (preview-only)', 'Data classification matrix.xlsx'].map((r) => <li key={r} className="flex items-center gap-2"><FileText size={15} className="text-ink-3" />{r}</li>)}<li className="pt-2 text-[12px] text-ink-3">Time spent 1h 42m · resumes on any device</li></ul>}
            {panel === 'Notes' && <textarea rows={8} className={inputCls} defaultValue="Report suspicious emails via the Phish button in Outlook." />}
            {panel === 'AI Assistant' && (
              <div>
                <div className="flex items-center gap-2"><Bot size={16} className="text-brand" /><b>Learning assistant</b></div>
                <div className="mt-3 rounded-xl bg-canvas p-3">Q: What counts as Confidential data?</div>
                <div className="mt-2 rounded-xl border border-line p-3">Customer account details, internal credit memos and HR records are <b>Confidential</b>. <span className="text-[11px] text-ink-3">Source: Information Security Policy v4.2, §3.1</span></div>
                <p className="mt-3 text-[11px] text-ink-3">Retrieval-grounded on approved course content; cites sources; falls back to a human contact. Hosted on-premise.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ================= ASSESSMENT ================= */
export function ExamV2() {
  const s = useDemo();
  const [tab, setTab] = useState<'setup' | 'take' | 'integrity' | 'eval'>(s.role === 'trainer' ? 'integrity' : 'take');
  const [secure, setSecure] = useState(false);
  const [q, setQ] = useState(1);
  const [flag, setFlag] = useState<Record<number, boolean>>({});
  const tabs = [['setup', 'Exam Setup'], ['take', 'Candidate'], ['integrity', 'Integrity Review'], ['eval', 'Evaluation']] as const;
  const EVID = [['00:04:12', 'Tab switch', 'Browser focus lost 6s'], ['00:11:40', 'Look-away', '3 events in 40s'], ['00:19:05', 'Face not visible', '4s · lighting change'], ['00:27:31', 'Tab switch', 'Browser focus lost 3s'], ['00:41:18', 'Look-away', '3 events']];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow>Assessment</Eyebrow><h1 className="display mt-2 text-[30px]">AML Annual Certification Assessment</h1><p className="mt-1.5 text-[13px] text-ink-2">420-question bank · 20 drawn · 60 minutes · pass 70% · proctored</p></div>
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1 text-[12.5px] font-bold">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('rounded-lg px-3 py-1.5', tab === k ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas')}>{l}</button>)}</div>
      </div>
      {tab === 'setup' && (
        <div className="grid gap-x-12 gap-y-6 border-t border-line pt-6 md:grid-cols-3 xl:grid-cols-5">
          {[['Question bank', 'AML & CFT · 420'], ['Difficulty', '30 / 50 / 20'], ['Randomization', 'Questions + options'], ['Passing score', '70%'], ['Negative marking', '0.25 per MCQ'], ['Attempts', '2'], ['Time limit', '60 min'], ['Result release', 'After evaluation'], ['Proctoring', 'Face · tab · gaze'], ['Question types', 'MCQ · T/F · Essay · Case Study · Image · Matching · Drag & Drop']].map(([k, v]) => <div key={k}><div className="th">{k}</div><div className="mt-1 text-[14px] font-semibold">{v}</div></div>)}
        </div>
      )}
      {tab === 'take' && (
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8">
          <Eyebrow tone="muted">Pre-check</Eyebrow>
          <div className="mt-4 space-y-2">{['Camera', 'Identity (face matched to Employee ID photo)', 'Browser lock', 'Connection', 'Exam rules accepted'].map((c) => <div key={c} className="flex items-center gap-3 rounded-xl bg-ok-soft px-4 py-3 text-[13.5px] font-semibold"><CheckCircle2 size={17} className="text-ok" />{c}</div>)}</div>
          <Btn size="lg" className="mt-6 w-full" icon={<ShieldCheck size={16} />} onClick={() => { setSecure(true); s.setExam('in_progress'); }}>Begin Secure Assessment</Btn>
        </div>
      )}
      {tab === 'integrity' && (
        <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-4"><Avatar name="Ayesha Rahman" size={48} /><div><div className="text-[18px] font-extrabold">Assessment Integrity Review</div><div className="text-[12.5px] text-ink-3">Candidate: Ayesha Rahman · CBL-10482 · submitted 11:38</div></div><span className="ml-auto"><Badge t={s.proctorFlag === 'Cleared' ? 'ok' : s.proctorFlag === 'Flagged' ? 'brand' : 'warn'}>{s.proctorFlag === 'Review Required' ? 'Review Recommended' : s.proctorFlag}</Badge></span></div>
            <div className="mt-6 flex divide-x divide-line border-y border-line">{[['2', 'Tab switches'], ['1', 'Face not visible'], ['6', 'Look-away events'], ['0', 'Copy attempts']].map(([n, l]) => <div key={l} className="flex-1 px-5 py-4 first:pl-0"><div className="num text-[32px] leading-none">{n}</div><div className="mt-1 text-[12px] text-ink-3">{l}</div></div>)}</div>
            <div className="mt-6"><div className="mb-3 flex items-center justify-between"><div className="th">Evidence timeline</div><AiLabel>AI-assisted observations</AiLabel></div>
              <div className="relative h-2 rounded-full bg-line">{EVID.map(([t], i) => { const [h, m, sec] = t.split(':').map(Number); const pct = ((h * 3600 + m * 60 + sec) / 3600) * 100; return <span key={i} className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-warn" style={{ left: `${pct}%` }} />; })}</div>
              <ul className="mt-4 divide-y divide-line">{EVID.map(([t, k, d]) => <li key={t} className="flex items-center gap-4 py-2.5 text-[13px]"><span className="w-20 font-mono text-[12px] text-ink-3">{t}</span><b className="w-36">{k}</b><span className="text-ink-2">{d}</span><span className="ml-auto text-[11px] font-semibold text-ink-3">frame captured</span></li>)}</ul>
            </div>
          </div>
          <div className="self-start rounded-2xl bg-graphite p-6 text-white">
            <div className="eyebrow text-[9.5px] text-red-300">Human decision</div>
            <p className="mt-2 text-[15px] font-semibold leading-snug">AI provides evidence. Authorized evaluators make the final decision.</p>
            <div className="mt-5 grid grid-cols-3 gap-2"><button onClick={() => s.setProctor('Cleared')} className="rounded-xl bg-white py-2.5 text-[13px] font-bold text-ink">Clear</button><button onClick={() => s.setProctor('Flagged')} className="rounded-xl bg-brand py-2.5 text-[13px] font-bold"><Flag size={13} className="mr-1 inline" />Flag</button><button className="rounded-xl border border-white/15 py-2.5 text-[13px] font-bold">Add Note</button></div>
            <p className="mt-4 text-[11.5px] text-white/45">No participant is failed automatically. Decision, reviewer and justification are written to the audit log and forwarded to SIEM.</p>
          </div>
        </div>
      )}
      {tab === 'eval' && (
        <div className="grid gap-8 xl:grid-cols-2">
          <div><div className="th">Objective questions · auto-scored</div><div className="num mt-2 text-[56px] leading-none">34<span className="text-[24px] text-ink-3"> / 40</span></div><p className="mt-2 text-[13px] text-ink-2">MCQ, True/False, matching and drag &amp; drop scored instantly with negative marking applied.</p></div>
          <div className="rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between"><div className="th">Descriptive answer · Q9 · 10 marks</div><AiLabel>AI-assisted — trainer decides</AiLabel></div>
            <p className="mt-3 rounded-xl bg-canvas p-4 text-[13px] italic">“Structuring splits deposits to avoid reporting thresholds; the bank must file an STR with BFIU, preserve records and avoid tipping off…”</p>
            <div className="mt-4 flex items-baseline gap-3"><span className="num text-[30px]">7/10</span><span className="text-[13px] text-ink-2">Suggested · candidate covered 4 of 5 rubric concepts</span></div>
            <div className="mt-2 text-[13px]">Final: <b>{s.aiScore.score}/10</b> {s.aiScore.state !== 'suggested' && <Badge t="ok">{s.aiScore.state} · logged</Badge>}</div>
            <div className="mt-4 flex gap-2"><Btn onClick={() => s.setAi('accepted', 7)}>Accept</Btn><Btn v="secondary" onClick={() => s.setAi('adjusted', 8)}>Adjust to 8</Btn></div>
          </div>
        </div>
      )}

      {secure && (
        <div className="anim-fade fixed inset-0 z-[80] flex flex-col bg-white">
          <header className="flex h-14 items-center gap-4 border-b border-line px-6">
            <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[.12em] text-ink"><ShieldCheck size={16} className="text-brand" />Secure Assessment Mode</span>
            <span className="text-[12.5px] text-ink-3">AML Annual Certification · Ayesha Rahman</span>
            <span className="ml-auto flex items-center gap-1.5 text-[12px] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Autosaved</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 font-mono text-[14px] font-bold text-white"><Clock size={14} />42:18</span>
          </header>
          <div className="h-1 bg-line"><div className="h-full bg-brand transition-all" style={{ width: `${(q / 20) * 100}%` }} /></div>
          <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_300px]">
            <div className="overflow-y-auto px-8 py-12">
              <div className="mx-auto max-w-2xl">
                <div className="text-[12px] font-bold text-ink-3">Question {q} of 20 · Multiple choice · 2 marks</div>
                <p className="mt-3 text-[22px] font-semibold leading-snug">A customer deposits BDT 9,50,000 in cash in three same-day transactions just below the reporting threshold. This is best described as:</p>
                <div className="mt-8 space-y-3">{['Normal customer behaviour', 'Structuring — file a Suspicious Transaction Report', 'A currency conversion issue', 'Only reportable if the customer is a PEP'].map((o, i) => <label key={o} className="flex items-center gap-4 rounded-2xl border border-line p-5 text-[15px] hover:border-ink/30"><input type="radio" name="sq" defaultChecked={i === 1} /><span className="font-bold text-ink-3">{'ABCD'[i]}</span>{o}</label>)}</div>
                <div className="mt-8 flex items-center gap-2"><Btn v="secondary" onClick={() => setFlag({ ...flag, [q]: !flag[q] })} icon={<Flag size={14} />}>{flag[q] ? 'Flagged' : 'Flag question'}</Btn><span className="flex-1" /><Btn v="secondary" disabled={q === 1} onClick={() => setQ(q - 1)}>Previous</Btn><Btn onClick={() => setQ(Math.min(20, q + 1))}>Next</Btn></div>
              </div>
            </div>
            <aside className="border-l border-line bg-canvas p-6">
              <div className="th mb-3">Question navigator</div>
              <div className="grid grid-cols-5 gap-1.5">{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => setQ(n)} className={cx('h-9 rounded-lg text-[12px] font-bold', n === q ? 'bg-ink text-white' : flag[n] ? 'bg-warn-soft text-warn' : n < q ? 'bg-white text-ink' : 'bg-white/50 text-ink-3')}>{n}</button>)}</div>
              <div className="mt-6 space-y-1.5 text-[12px] text-ink-3"><div>Answered {q - 1} · Flagged {Object.values(flag).filter(Boolean).length}</div><div>Copy-paste disabled · tab detection on</div></div>
              <Btn className="mt-6 w-full" onClick={() => { setSecure(false); s.setExam('submitted'); setTab('integrity'); }}>Submit assessment</Btn>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= EXECUTIVE COMMAND CENTER ================= */
const DIVS = ['Corporate', 'SME', 'Retail', 'Risk', 'Operations', 'Treasury'];
const COMPS = ['Credit', 'AML', 'Digital', 'Leadership', 'Customer', 'Risk'];
const HEAT = [[48, 92, 71, 63, 80, 74], [62, 95, 66, 58, 84, 70], [77, 97, 69, 61, 91, 68], [88, 99, 75, 70, 72, 93], [55, 90, 81, 52, 76, 79], [83, 96, 85, 74, 70, 88]];
export function ExecutiveCenter() {
  const s = useDemo();
  const done = s.completed;
  const hours = 38420 + (s.attendanceSubmitted ? roster(s).length * 16 : 0);
  const heat = (v: number) => (v >= 90 ? 'bg-ink text-white' : v >= 80 ? 'bg-ink/70 text-white' : v >= 70 ? 'bg-ink/35 text-ink' : v >= 60 ? 'bg-brand/30 text-ink' : 'bg-brand text-white');
  return (
    <div>
      <section className="dark-canvas px-6 pb-10 pt-10 lg:px-12">
        <div className="mx-auto max-w-[1720px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><div className="eyebrow text-[10.5px] text-red-300">Executive L&amp;D Command Center</div><h1 className="display mt-2 text-[44px]">Workforce Development Intelligence</h1><p className="mt-2 text-[14px] text-white/55">FY2026 year to date · all divisions · {done ? 'includes TRN-2026-00182 just completed' : 'live'}</p></div>
            <div className="flex gap-2 text-[12px]">{['All divisions', 'FY2026', 'All grades'].map((f) => <span key={f} className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/70">{f}</span>)}</div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-y-8 md:grid-cols-5">
            {[[s.courseCompleted ? '94.7%' : '94.6%', 'Mandatory Learning Compliance'], [hours.toLocaleString('en-IN'), 'Learning Hours'], ['91%', 'Assessment Pass Rate'], ['4.6 / 5', 'Learning Experience'], ['12', 'Priority Competency Gaps']].map(([n, l], i) => (
              <div key={l} className={cx('pr-6', i > 0 && 'md:border-l md:border-white/10 md:pl-8')}><div className="num text-[48px] leading-none lg:text-[60px]">{n}</div><div className="mt-2 text-[13px] text-white/55">{l}</div></div>
            ))}
          </div>
        </div>
      </section>
      <section className="px-6 py-10 lg:px-12">
        <div className="mx-auto grid max-w-[1720px] gap-x-12 gap-y-12 xl:grid-cols-3">
          <div>
            <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">Completion by division</h3><span className="text-[11px] text-ink-3">target 98%</span></div>
            {[['Risk Management', 99], ['Retail Banking', 97], ['SME Banking', 95], ['Corporate Banking', 92], ['Operations', 90], ['Treasury', 96]].sort((a, b) => (b[1] as number) - (a[1] as number)).map(([d, v]) => (
              <div key={d as string} className="mb-3 flex items-center gap-3 text-[13px]"><span className="w-36 font-semibold">{d}</span><div className="relative h-2.5 flex-1 rounded-full bg-line"><div className={cx('anim-grow h-full rounded-full', (v as number) < 93 ? 'bg-brand' : 'bg-ink')} style={{ width: `${((v as number) - 80) * 5}%` }} /><span className="absolute top-[-3px] h-4 w-px bg-ink-3" style={{ left: '90%' }} /></div><span className="w-10 text-right font-bold tabular-nums">{v}%</span></div>
            ))}
          </div>
          <div className="xl:col-span-2">
            <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">Capability heatmap · % at target level</h3><span className="flex items-center gap-2 text-[11px] text-ink-3"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />below 60<span className="h-2.5 w-2.5 rounded-sm bg-ink" />90+</span></div>
            <div className="grid grid-cols-[110px_repeat(6,1fr)] gap-1 text-[12px]">
              <span />{COMPS.map((c) => <span key={c} className="pb-1 text-center font-bold text-ink-3">{c}</span>)}
              {DIVS.map((d, r) => [<span key={d} className="flex items-center font-semibold">{d}</span>, ...HEAT[r].map((v, c) => <span key={c} className={cx('grid h-10 place-items-center rounded-md font-bold tabular-nums transition-colors', heat(r === 0 && c === 0 && s.journeyDone >= 5 ? 61 : v))}>{r === 0 && c === 0 && s.journeyDone >= 5 ? 61 : v}</span>)])}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-baseline justify-between"><h3 className="text-[15px] font-extrabold">Compliance risk</h3><AiLabel>Explainable · no automatic action</AiLabel></div>
            {[['Data Privacy', 'High', '412 employees · 9 days to deadline'], ['Information Security', 'Medium', '286 employees · velocity slowing'], ['AML & CFT', 'Low', '61 employees']].map(([n, r, d]) => <div key={n} className="flex items-center gap-3 border-b border-line py-3"><span className={cx('h-9 w-1.5 rounded-full', r === 'High' ? 'bg-brand' : r === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600')} /><div className="flex-1"><div className="text-[13.5px] font-bold">{n}</div><div className="text-[12px] text-ink-3">{d}</div></div><span className="text-[12px] font-bold">{r}</span></div>)}
          </div>
          <div><h3 className="mb-4 text-[15px] font-extrabold">Training investment trend · BDT M</h3><LineChart points={[0.6, 0.7, 0.9, 0.8, 1.1, done ? 1.6 : 1.1]} labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} /><div className="mt-3 flex gap-8 text-[13px]"><div><div className="num text-[22px]">{done ? 'BDT 6.42M' : 'BDT 4.98M'}</div><div className="text-[11.5px] text-ink-3">Training investment YTD</div></div><div><div className="num text-[22px]">{done ? 'BDT 734' : 'BDT 570'}</div><div className="text-[11.5px] text-ink-3">Avg. cost / employee</div></div></div></div>
          <div><h3 className="mb-4 text-[15px] font-extrabold">Learning velocity · hours per learner</h3><LineChart points={[3.1, 3.4, 3.6, 3.8, 4.1, hours / 8742 / 1.1]} labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']} /></div>
          <div>
            <h3 className="mb-4 text-[15px] font-extrabold">Training effectiveness · pre → post score</h3>
            {[['Advanced Credit Risk Mgmt', 54, done ? 81 : 0], ['AML & CFT Refresher', 68, 89], ['Leadership Essentials', 61, 78], ['Customer Experience', 66, 84]].map(([n, a, b]) => (
              <div key={n as string} className="mb-3 text-[13px]"><div className="mb-1 flex justify-between"><span className="font-semibold">{n}</span><span className="tabular-nums text-ink-3">{b ? `${a} → ${b}` : 'after completion'}</span></div><div className="relative h-2 rounded-full bg-line">{b ? <div className="anim-grow absolute h-full rounded-full bg-ink" style={{ left: `${a}%`, width: `${(b as number) - (a as number)}%` }} /> : null}<span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-ink-3" style={{ left: `${a}%` }} /></div></div>
            ))}
          </div>
          <div className="xl:col-span-2">
            <h3 className="mb-4 text-[15px] font-extrabold">Top competency gaps · officers below target</h3>
            <div className="flex items-end gap-3" style={{ height: 150 }}>
              {[['Credit Analysis', s.journeyDone >= 5 ? 22 : 27], ['Digital Banking', 21], ['Leadership', 17], ['Risk Awareness', 13], ['Trade Finance', 11], ['Customer', 8]].map(([n, v]) => (
                <div key={n as string} className="flex flex-1 flex-col items-center justify-end gap-2"><span className="text-[12px] font-bold tabular-nums">{v}</span><div className={cx('w-full rounded-t-lg transition-all duration-700', n === 'Credit Analysis' ? 'bg-brand' : 'bg-ink/80')} style={{ height: `${(v as number) * 4.5}px` }} /><span className="text-center text-[11px] font-semibold text-ink-3">{n}</span></div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-[15px] font-extrabold">Upcoming & feedback</h3>
            {[['AML & CFT Refresher', '24 Nov · 118'], ['Leadership Essentials', '02 Dec · 36'], ['Customer Experience', '15 Dec · 60']].map(([a, b]) => <div key={a} className="flex justify-between border-b border-line py-2 text-[13px]"><b>{a}</b><span className="text-ink-3">{b}</span></div>)}
            <div className="mt-4 flex items-baseline gap-2"><span className="num text-[28px] text-ok">89%</span><span className="text-[12.5px] text-ink-3">positive sentiment · themes: practical examples, trainer expertise, session duration</span></div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[1720px] text-[11.5px] text-ink-3"><MapPin size={11} className="mr-1 inline" />Power BI reads the same reporting schema. Integrations simulated in this demo.</p>
      </section>
    </div>
  );
}
