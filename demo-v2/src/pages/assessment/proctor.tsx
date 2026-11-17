/**
 * Shared simulated proctoring (FR 212), used by every secure exam: the AML exam and the story's post-training assessment.
 * Pre-check (face match to the Employee ID photo, system check, rules), a scripted event timer, copy-paste blocking,
 * the live proctor panel and the event toast. Events are recorded for a human reviewer; nothing fails automatically.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Lock, ShieldCheck, Wifi } from 'lucide-react';
import { PROCTOR_SCRIPT, useDemo, type ProctorEvent } from '../../store';
import { personaFor } from '../../components/perspective';
import { cx } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { Frame, KIND } from './common';

/** Scripted events fire at script time ÷ SPEED seconds, so a short demo still produces evidence. */
export const SPEED = 6;

/** Timer + scripted proctoring events + copy blocking for one attempt. */
export function useProctoring(attemptId: string | null, active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<ProctorEvent | null>(null);
  const fired = useRef(new Set<number>());
  useEffect(() => {
    if (!active || !attemptId) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [active, attemptId]);
  useEffect(() => {
    if (!active || !attemptId) return;
    const due = PROCTOR_SCRIPT.filter((e) => e.t / SPEED <= elapsed && !fired.current.has(e.t));
    if (!due.length) return;
    due.forEach((e) => fired.current.add(e.t));
    const st = useDemo.getState();
    const a = st.attempts[attemptId];
    if (!a) return;
    st.saveAttempt(attemptId, { events: [...a.events, ...due.map((e) => ({ ...e, t: elapsed }))] });
    setToast(due[due.length - 1]);
  }, [elapsed, active, attemptId]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, [toast]);
  const blockCopy = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!attemptId) return;
    const st = useDemo.getState();
    const a = st.attempts[attemptId];
    if (!a) return;
    const ev: ProctorEvent = { t: elapsed, kind: 'copy', detail: 'Copy or right-click on exam content blocked' };
    st.saveAttempt(attemptId, { events: [...a.events, ev] });
    setToast(ev);
  };
  return { elapsed, toast, blockCopy };
}

/** Identity and system check before a secure exam. */
export function PreCheck({ title, meta, onBegin, back }: { title: string; meta: ReactNode; onBegin: () => void; back?: ReactNode }) {
  const s = useDemo();
  const me = personaFor('employee', s.employeeId);
  const [rules, setRules] = useState(false);
  return (
    <div className="mx-auto max-w-[1100px]">
      {back}
      <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">{meta} <SourceTag kind="simulated">Proctoring is simulated in this demo</SourceTag></p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-[20px] font-semibold">Identity check</h2>
          <p className="text-[15px] text-ink-2">Your live camera frame is compared with your Employee ID photo before the exam starts.</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div><Frame kind="id" dark={false} className="aspect-[4/3]" label="Employee ID photo" /><div className="mt-1 text-[14px] text-ink-3">{me.name} · {me.eid}</div></div>
            <div><Frame kind="live" className="aspect-[4/3]" label="Live frame · simulated" /><div className="mt-1 flex items-center gap-1.5 text-[14px] text-ok"><span className="h-2 w-2 animate-pulse rounded-full bg-ok" />Camera active</div></div>
          </div>
          <div className="mt-4 rounded-xl bg-ok-soft px-4 py-3"><div className="flex justify-between text-[15px] font-medium text-ok"><span>Face match</span><span>96%</span></div><div className="mt-1.5 h-2 rounded-full bg-white"><div className="h-2 w-[96%] rounded-full bg-ok" /></div></div>
        </section>
        <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <h2 className="text-[20px] font-semibold">System check</h2>
          <ul className="mt-3 space-y-3 text-[16px]">
            {([[Camera, 'Webcam available and recording'], [ShieldCheck, 'Single person detected'], [Lock, 'Browser locked: tab switches and copy-paste are recorded'], [Wifi, 'Connection stable (answers autosave)']] as const).map(([Icon, l]) => <li key={l} className="flex items-center gap-3"><CheckCircle2 size={19} className="text-ok" /><Icon size={17} className="text-ink-3" />{l}</li>)}
          </ul>
          <label className="mt-5 flex items-start gap-3 rounded-xl bg-canvas p-4 text-[15px]"><input data-testid="proctor-rules" type="checkbox" checked={rules} onChange={(e) => setRules(e.target.checked)} className="mt-1 h-4 w-4 accent-brand" />I will stay in this window, keep my face visible, and not use other material. I understand that events are recorded for a human reviewer and never fail me automatically.</label>
          <button data-testid="proctor-begin" disabled={!rules} onClick={onBegin} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[16px] font-medium text-white hover:bg-brand-dark disabled:opacity-40">Begin secure exam <ArrowRight size={18} /></button>
        </section>
      </div>
    </div>
  );
}

/** Live proctor panel beside the questions. */
export function ProctorAside({ events, toast }: { events: ProctorEvent[]; toast: ProctorEvent | null }) {
  const counts = Object.fromEntries(Object.keys(KIND).map((k) => [k, events.filter((e) => e.kind === k).length]));
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <Frame kind={toast?.kind === 'head' || toast?.kind === 'gaze' || toast?.kind === 'face' ? toast.kind : 'live'} className="aspect-[4/3]" label="Live webcam feed · simulated" />
        <div className="mt-3 flex items-center gap-2 text-[14px] font-medium text-ok"><span className="h-2 w-2 rounded-full bg-ok" />Face verified · single person</div>
        <ul className="mt-3 divide-y divide-line border-t border-line text-[14px]">
          {(['tab', 'gaze', 'head', 'focus', 'face', 'copy'] as const).map((k) => <li key={k} className="flex justify-between py-1.5"><span className="text-ink-2">{KIND[k].label}</span><span className={cx('min-w-6 rounded-full px-2 text-center font-semibold', counts[k] ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{counts[k]}</span></li>)}
        </ul>
        <div className="mt-3 rounded-lg bg-brand-soft/60 px-3 py-2 text-center text-[14px] font-medium text-brand"><Lock size={14} className="mr-1 inline" />Copy-paste blocked</div>
      </div>
      <p className="text-[14px] text-ink-3">Events are recorded for a human reviewer. Proctoring never fails anyone automatically.</p>
    </aside>
  );
}

/** Bottom toast when an event is recorded. */
export function ProctorToast({ toast }: { toast: ProctorEvent | null }) {
  if (!toast) return null;
  return <div role="status" className="anim-slide fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-[15px] text-white shadow-2xl"><AlertTriangle size={16} className="mr-2 inline text-amber-300" />{KIND[toast.kind].label}: {toast.detail}. This is recorded for review.</div>;
}

/** Compact evidence summary: counters and a timeline, for reviewers. */
export function EvidenceStrip({ events, faceMatch }: { events: ProctorEvent[]; faceMatch: number }) {
  const max = Math.max(360, ...events.map((e) => e.t + 10));
  const counts = (['tab', 'focus', 'gaze', 'head', 'face', 'copy'] as const).map((k) => [k, events.filter((e) => e.kind === k).length] as const);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        <div className="rounded-xl bg-ok-soft px-3 py-2"><div className="text-[20px] font-bold text-ok">{faceMatch}%</div><div className="text-[14px] text-ink-2">Face match</div></div>
        {counts.map(([k, n]) => <div key={k} className={cx('rounded-xl px-3 py-2', n ? 'bg-brand-soft/50' : 'bg-canvas')}><div className={cx('text-[20px] font-bold', n ? 'text-brand' : 'text-ink-3')}>{n}</div><div className="text-[14px] text-ink-2">{KIND[k].label}</div></div>)}
      </div>
      <div className="relative mt-4 h-8 rounded-lg bg-canvas" aria-label="Event timeline">
        {events.map((e, i) => <span key={i} title={`${KIND[e.kind].label}: ${e.detail}`} className="absolute top-1.5 h-5 w-2 rounded-full" style={{ left: `${(e.t / max) * 100}%`, background: KIND[e.kind].color }} />)}
      </div>
      <ul className="mt-3 space-y-1.5 text-[15px]">
        {events.map((e, i) => <li key={i} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: KIND[e.kind].color }} /><span className="w-24 shrink-0 font-medium">{KIND[e.kind].label}</span><span className="text-ink-2">{e.detail}</span></li>)}
      </ul>
    </div>
  );
}
