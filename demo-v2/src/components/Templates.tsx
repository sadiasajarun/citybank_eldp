import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Inbox } from 'lucide-react';
import { useDemo } from '../store';
import { navGroupOf, pageName } from '../nav';
import { JOURNEY, journeyAction, journeyIndex, ROLE_LABEL } from '../lifecycle';
import { personaFor } from './perspective';
import { Btn, cx, inputCls, Modal } from './ui';
import { FrRef } from './Source';

/* ================================================================== */
/* Page header with a clickable breadcrumb (F3, F5.2)                  */
/* ================================================================== */
export function PageHead({ title, sub, meta, actions, fr, tags, crumb }: {
  title: ReactNode; sub?: ReactNode; meta?: ReactNode; actions?: ReactNode; fr?: string; tags?: ReactNode;
  /** Override the last crumb (defaults to the canonical page name). */
  crumb?: string;
}) {
  const nav = useNavigate();
  const loc = useLocation();
  const role = useDemo((s) => s.role);
  const hit = navGroupOf(role, loc.pathname);
  const name = crumb ?? pageName(loc.pathname);
  return (
    <header className="mb-8 border-b border-line pb-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[15px] text-ink-3">
        <button onClick={() => nav('/overview')} className="font-medium hover:text-brand hover:underline">Home</button>
        {hit && <><ChevronRight size={15} /><span>{hit.group.label}</span></>}
        {name && <><ChevronRight size={15} /><span aria-current="page" className="font-semibold text-ink-2">{name}</span></>}
        {fr && <FrRef className="ml-2">{fr}</FrRef>}
      </nav>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[36px] font-extrabold leading-tight tracking-tight">{title}</h1>
          {meta && <div className="mt-1.5 text-[16px] text-ink-2">{meta}</div>}
          {sub && <div className="mt-1 text-[16px] text-ink-3">{sub}</div>}
          {tags && <div className="mt-3 flex flex-wrap gap-2">{tags}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ================================================================== */
/* Facts: grouped label → value lists                                  */
/* ================================================================== */
export function FactGroup({ title, rows, className }: { title: string; rows: [string, ReactNode][]; className?: string }) {
  return (
    <section className={cx('', className)}>
      <h2 className="mb-3 text-[20px] font-bold tracking-tight">{title}</h2>
      <dl className="divide-y divide-line border-y border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-6">
            <dt className="text-[15px] text-ink-3">{k}</dt>
            <dd className="text-[17px] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Section({ title, children, action, className, fr }: { title: ReactNode; children: ReactNode; action?: ReactNode; className?: string; fr?: string }) {
  return (
    <section className={cx('mt-10 first:mt-0', className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[24px] font-bold tracking-tight">{title}{fr && <FrRef>{fr}</FrRef>}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ================================================================== */
/* Decision page template (U3): facts left, sticky decision panel right */
/* ================================================================== */
export function DecisionLayout({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0">{children}</div>
      <aside className="lg:sticky lg:top-6 lg:self-start">{panel}</aside>
    </div>
  );
}

export function DecisionPanel({ title = 'Your decision', what, children, note }: { title?: string; what?: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="text-[20px] font-bold tracking-tight">{title}</div>
      {what && <p className="mt-1.5 text-[16px] leading-relaxed text-ink-2">{what}</p>}
      <div className="mt-5 flex flex-col gap-2.5">{children}</div>
      {note && <div className="mt-5 border-t border-line pt-4 text-[15px] text-ink-3">{note}</div>}
    </div>
  );
}

/** A light context panel: check rows with icon, one line and a source. */
export function CheckList({ title, items }: { title: string; items: { label: string; text: string; ok: boolean; source?: string }[] }) {
  return (
    <section className="rounded-2xl border border-line bg-[#faf8f5] p-6">
      <h2 className="text-[20px] font-bold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-4">
        {items.map((x) => (
          <li key={x.label} className="flex gap-3">
            <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', x.ok ? 'bg-ok' : 'bg-amber-500')}>{x.ok ? <Check size={14} /> : '!'}</span>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold">{x.label}</div>
              <div className="text-[16px] text-ink-2">{x.text}</div>
              {x.source && <div className="mt-0.5 text-[14px] text-ink-3">Source: {x.source} · simulated</div>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ================================================================== */
/* Step form template (U4): workbook tabs, footer, primary on last step */
/* ================================================================== */
export function StepForm({ steps, current, onStep, done, children, footer, rail }: {
  steps: string[]; current: number; onStep: (i: number) => void; done?: boolean[];
  children: ReactNode; footer: ReactNode; rail?: ReactNode;
}) {
  return (
    <div className={cx('grid gap-8', Boolean(rail) && 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
      <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
        <ol className="flex flex-wrap border-b border-line" role="tablist">
          {steps.map((x, i) => (
            <li key={x} className="flex-1">
              <button role="tab" aria-selected={i === current} onClick={() => onStep(i)} className={cx('flex w-full items-center gap-2.5 border-b-2 px-5 py-4 text-left text-[16px] font-semibold transition-colors', i === current ? 'border-brand text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
                <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[14px] font-bold', done?.[i] ? 'bg-ok text-white' : i === current ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{done?.[i] ? <Check size={14} /> : i + 1}</span>
                {x}
              </button>
            </li>
          ))}
        </ol>
        <div className="p-7">{children}</div>
        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-white px-7 py-4">{footer}</div>
      </div>
      {rail && <aside className="xl:sticky xl:top-6 xl:self-start">{rail}</aside>}
    </div>
  );
}

/* ================================================================== */
/* Reason modal: required reasons (FR 17, 119, bulk decisions)         */
/* ================================================================== */
export function ReasonModal({ open, title, intro, names, confirm, onConfirm, onClose, suggested, optional }: {
  open: boolean; title: string; intro?: ReactNode; names?: string[]; confirm: string;
  onConfirm: (reason: string) => void; onClose: () => void; suggested?: string; optional?: boolean;
}) {
  const [reason, setReason] = useState('');
  const ok = optional || reason.trim().length > 2;
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Btn v="secondary" onClick={onClose}>Cancel</Btn><Btn disabled={!ok} onClick={() => { onConfirm(reason.trim()); setReason(''); }}>{confirm}</Btn></>}>
      {intro && <div className="mb-3 text-[16px] text-ink-2">{intro}</div>}
      {names && names.length > 0 && <ul className="mb-4 max-h-40 overflow-y-auto rounded-lg bg-canvas p-3 text-[15px]">{names.map((n) => <li key={n}>{n}</li>)}</ul>}
      <label className="block">
        <span className="text-[15px] font-semibold text-ink-2">Reason{optional ? ' (optional)' : ' (required)'}</span>
        <textarea rows={3} className={cx(inputCls, 'mt-1.5')} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {suggested && <button className="mt-2 text-[15px] font-semibold text-brand hover:underline" onClick={() => setReason(suggested)}>Use: {suggested}</button>}
      {!ok && <p className="mt-2 text-[14px] text-ink-3">Add a reason to continue. It is written to the audit trail.</p>}
    </Modal>
  );
}

/* ================================================================== */
/* Guided empty state (F5.6): never a dead end                         */
/* ================================================================== */
export function NotYet({ title, after }: { title: string; after: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const ji = journeyIndex(s);
  const cur = JOURNEY[Math.min(ji, JOURNEY.length - 1)];
  const act = journeyAction(cur, s);
  const go = () => { s.setRole(act.role); if (act.emp) s.setEmployee(act.emp); nav(act.to); };
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-8 py-12 text-center">
      <Inbox size={32} className="mx-auto text-ink-3" />
      <h2 className="mt-3 text-[22px] font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-[16px] text-ink-2">This opens after <b>{after}</b>. The training is now at <b>Step {Math.min(ji + 1, JOURNEY.length)}: {cur.title}</b> ({cur.who === 'system' ? 'System' : ROLE_LABEL[act.role]}).</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Btn v="secondary" onClick={() => nav(`/r/${s.role}`)}>Back to My work</Btn>
        {ji < JOURNEY.length && <Btn onClick={go}>Open current step <ArrowRight size={16} /></Btn>}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Person banner (U15): who you are in an employee step                */
/* ================================================================== */
export function PersonBanner({ empId, reason }: { empId: string; reason?: string }) {
  const p = personaFor('employee', empId);
  const sup = empId === 'e4' ? 'Rafiq Uddin' : 'Mahmud Karim';
  const title = { e1: 'Relationship Manager · Corporate Banking', e2: 'Credit Analyst · Corporate Banking', e4: 'Senior Credit Analyst · Risk Management' }[empId] ?? 'Employee';
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line bg-white px-5 py-4">
      <span className="text-[16px]">You are <b>{p.name}</b> · {title} · reports to <b>{sup}</b></span>
      {reason && <span className="text-[15px] text-ink-2">· {reason}</span>}
    </div>
  );
}
