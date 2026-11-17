/**
 * Proctoring evidence review (FR 212): counters, a timeline of events, captured frames (simulated), a mark per event,
 * and a human decision with a reason: clear, flag, or withhold the result for the committee. Never automatic.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Flag, PauseCircle, Sparkles } from 'lucide-react';
import { useDemo, type Attempt } from '../../store';
import { Badge, cx } from '../../components/ui';
import { ReasonModal } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { findExam, Frame, KIND, mmss } from './common';

const DECISION: Record<Attempt['decision'], { label: string; tone: string }> = {
  pending: { label: 'Review required', tone: 'warn' }, cleared: { label: 'Cleared', tone: 'ok' }, flagged: { label: 'Flagged', tone: 'brand' }, withheld: { label: 'Withheld for committee', tone: 'brand' },
};

export function IntegrityReview() {
  const { id = 'pta-e1' } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const [decide, setDecide] = useState<'cleared' | 'flagged' | 'withheld' | null>(null);
  const list = Object.values(s.attempts).filter((a) => a.submitted);
  const a = s.attempts[id] ?? list[0];
  if (!a) return <div className="rounded-2xl bg-white p-8 ring-1 ring-line">No submitted attempts yet.</div>;
  const exam = findExam(s, a.examId);
  const span = Math.max(60, ...a.events.map((e) => e.t)) + 30;
  const counts = (Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => ({ k, n: a.events.filter((e) => e.kind === k).length }));
  const concerns = a.events.filter((e) => e.mark === 'concern').length;
  const summary = a.events.length === 0 ? 'No proctoring events. Nothing to review.'
    : a.events.length <= 2 ? `${a.events.length} short events, typical of normal behaviour. Suggest: clear.`
      : `${a.events.length} events including ${counts.filter((c) => c.n).map((c) => KIND[c.k].label.toLowerCase()).join(', ')}. Suggest: review the frames before deciding.`;

  return (
    <div className="mx-auto max-w-[1440px]">
      <button onClick={() => nav('/assessment?tab=integrity')} className="mb-3 flex items-center gap-1.5 text-[15px] text-ink-2 hover:text-ink"><ArrowLeft size={16} />Assessments</button>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[14px] text-ink-3">Proctoring evidence review · FR 212</div>
          <h1 className="text-[30px] font-semibold tracking-tight">{a.name} · {exam?.title ?? a.examId}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-ink-2">Started {a.started} · objective score {a.score ?? '—'}{a.total ? ` / ${a.total}` : ''} · face match {a.faceMatch}% <SourceTag kind="simulated">Frames and events are simulated</SourceTag></p>
        </div>
        <Badge t={DECISION[a.decision].tone}>{DECISION[a.decision].label}</Badge>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-2xl bg-white p-3 ring-1 ring-line">
          <div className="px-2 pb-2 text-[14px] font-semibold text-ink-3">Submitted attempts ({list.length})</div>
          <ul className="space-y-1">{list.map((x) => <li key={x.id}><button onClick={() => nav(`/assessment/integrity/${x.id}`)} className={cx('w-full rounded-lg px-3 py-2 text-left', x.id === a.id ? 'bg-brand-soft/50 ring-1 ring-brand/40' : 'hover:bg-canvas')}><span className="block text-[15px] font-medium">{x.name}</span><span className="flex items-center justify-between text-[13px] text-ink-3"><span>{x.examId} · {x.events.length} events</span><span>{DECISION[x.decision].label}</span></span></button></li>)}</ul>
        </aside>

        <div className="space-y-6">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {counts.map(({ k, n }) => <li key={k} className="rounded-xl bg-white px-4 py-3 ring-1 ring-line"><div className="text-[26px] font-semibold tabular-nums" style={{ color: n ? KIND[k].color : undefined }}>{n}</div><div className="text-[13px] text-ink-2">{KIND[k].label}</div></li>)}
          </ul>

          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <h2 className="text-[20px] font-semibold">Event timeline</h2>
            <div className="relative mt-5 h-10">
              <div className="absolute inset-x-0 top-4 h-2 rounded-full bg-canvas" />
              {a.events.map((e, i) => <span key={i} title={`${mmss(e.t)} · ${KIND[e.kind].label}`} className="absolute top-2 h-6 w-1.5 rounded-full" style={{ left: `${(e.t / span) * 100}%`, background: KIND[e.kind].color }} />)}
            </div>
            <div className="flex justify-between text-[13px] text-ink-3"><span>00:00 start</span><span>{mmss(span)}</span></div>
            <div className="mt-3 flex flex-wrap gap-3 text-[13px]">{counts.filter((c) => c.n).map((c) => <span key={c.k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: KIND[c.k].color }} />{KIND[c.k].label}</span>)}</div>
          </section>

          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <h2 className="text-[20px] font-semibold">Captured frames and events</h2>
            <p className="text-[14px] text-ink-3">Mark each event. Concerns are noted in the audit trail with your decision.</p>
            {a.events.length ? (
              <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {a.events.map((e, i) => (
                  <li key={i} className="rounded-xl border border-line p-3">
                    <Frame kind={e.kind} className="aspect-[4/3]" label={`${mmss(e.t)} · simulated`} />
                    <div className="mt-2 text-[15px] font-medium" style={{ color: KIND[e.kind].color }}>{KIND[e.kind].label}</div>
                    <div className="text-[14px] text-ink-2">{e.detail}</div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => s.markEvent(a.id, i, 'ok')} className={cx('flex-1 rounded-lg border px-2 py-1.5 text-[14px]', e.mark === 'ok' ? 'border-ok bg-ok-soft text-ok' : 'border-line')}>No concern</button>
                      <button onClick={() => s.markEvent(a.id, i, 'concern')} className={cx('flex-1 rounded-lg border px-2 py-1.5 text-[14px]', e.mark === 'concern' ? 'border-brand bg-brand-soft text-brand' : 'border-line')}>Concern</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-ink-2">No events recorded.</p>}
          </section>

          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <div className="flex items-start gap-3 rounded-xl bg-sky-50 px-4 py-3 text-[15px] text-sky-900"><Sparkles size={18} className="mt-0.5 shrink-0" /><div><b>AI-assisted observation · human decision required.</b> {summary}</div></div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={() => setDecide('cleared')} className="flex min-h-11 items-center gap-2 rounded-lg bg-ok px-4 font-medium text-white"><CheckCircle2 size={17} />Clear</button>
              <button onClick={() => setDecide('flagged')} className="flex min-h-11 items-center gap-2 rounded-lg border border-brand px-4 font-medium text-brand"><Flag size={17} />Flag</button>
              <button onClick={() => setDecide('withheld')} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-4"><PauseCircle size={17} />Withhold result for committee</button>
              <span className="text-[14px] text-ink-3">{concerns} event{concerns === 1 ? '' : 's'} marked as concern</span>
            </div>
            {a.reason && <p className="mt-3 text-[15px] text-ink-2">Decision note: {a.reason}</p>}
          </section>
        </div>
      </div>

      <ReasonModal open={decide !== null} title={decide === 'cleared' ? 'Clear this attempt' : decide === 'flagged' ? 'Flag this attempt' : 'Withhold the result'} intro="A reason is required. It is stored with the evidence in the audit trail." confirm={decide === 'cleared' ? 'Clear' : decide === 'flagged' ? 'Flag' : 'Withhold'}
        suggested={decide === 'cleared' ? 'Events are brief and consistent with normal behaviour.' : 'Repeated tab switches and head turns; candidate to explain.'}
        onClose={() => setDecide(null)} onConfirm={(reason) => { if (decide) s.decideAttempt(a.id, decide, reason); setDecide(null); }} />
    </div>
  );
}
