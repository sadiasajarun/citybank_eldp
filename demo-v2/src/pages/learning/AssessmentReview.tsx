import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { gradeOf, nowLabel, ptResults, useDemo } from '../../store';
import { findById } from '../../org';
import { TRAINING } from '../../data';
import { JOURNEY } from '../../lifecycle';
import { DecisionLayout, DecisionPanel, NotYet, PageHead } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { AiLabel, Avatar, Badge, Btn, cx, inputCls } from '../../components/ui';
import { EvidenceStrip } from '../assessment/proctor';

/* Evidence captured during the post-training assessment (simulated proctoring, FR 212). */
const RUBRIC: [string, boolean][] = [
  ['Identifies early-warning signals of credit deterioration', true],
  ['Links cash-flow weakness to repayment capacity', true],
  ['Proposes a covenant or collateral response', true],
  ['Refers to the bank’s risk-grading framework', true],
  ['Quantifies the expected loss impact', false],
];
const ANSWER = '“The borrower’s inventory days rose from 60 to 95 while receivables slowed, so operating cash flow will not cover the next two instalments. I would downgrade the risk grade, ask for a stock audit, tighten the drawing-power covenant and take additional collateral before renewing the limit…”';
const MCQ = { got: 36, of: 40 };
const STEPS = ['Integrity', 'Score', 'Result'];


export function AssessmentReview() {
  const s = useDemo();
  const nav = useNavigate();
  const attStep = JOURNEY.findIndex((j) => j.impactKey === 'Attendance submitted') + 1;
  const head = (
    <PageHead
      title="Evaluate the assessment"
      meta={<>{TRAINING.title} · training {TRAINING.trainingId} · exam tagged to this training</>}
      fr="FR 210–217"
      tags={<SourceTag kind="fictional" />}
      actions={<Btn v="link" onClick={() => nav('/assessment/integrity/pta-e1')}>Proctoring evidence review <ArrowRight size={15} /></Btn>}
    />
  );
  if (!s.attendanceSubmitted) return <div>{head}<NotYet title="The assessment opens after the training" after={`attendance is submitted (Step ${attStep})`} /></div>;
  if (!s.ptaSubmitted) return <div>{head}<NotYet title="Waiting for the participant’s answers" after="Ayesha Rahman submits the assessment" /></div>;
  return <div>{head}<Review /></div>;
}

function Review() {
  const s = useDemo();
  const p = s.pta;
  const derived = p.integrity === 'pending' ? 0 : p.decision === 'pending' ? 1 : 2;
  const [view, setView] = useState<number | null>(null);
  const step = view !== null && view <= derived ? view : derived;
  const results = ptResults(s);
  const taken = results.filter((r) => r.status !== 'Absent' && r.status !== 'Not taken').length;
  const me = findById('e1');

  return (
    <div>
      {/* stepper: completed steps can be reopened (read-only) */}
      <ol className="mb-6 flex flex-wrap items-center gap-3" aria-label="Review steps">
        {STEPS.map((x, i) => {
          const done = i < derived || (i === 2 && p.released);
          const on = i === step;
          return (
            <li key={x} className="flex items-center gap-3">
              <button disabled={i > derived} onClick={() => setView(i === derived ? null : i)} aria-current={on ? 'step' : undefined} className={cx('flex items-center gap-2.5 rounded-full px-1 py-1 pr-3 text-[16px] font-semibold disabled:cursor-not-allowed', on ? 'text-ink' : 'text-ink-3 hover:text-ink')}>
                <span className={cx('grid h-8 w-8 place-items-center rounded-full text-[14px] font-bold', done ? 'bg-ok text-white' : on ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{done ? <Check size={15} /> : i + 1}</span>{x}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-10 bg-line" />}
            </li>
          );
        })}
      </ol>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4">
        <Avatar name="Ayesha Rahman" size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold">Ayesha Rahman <span className="font-normal text-ink-3">· {me?.eid ?? 'CBL-10482'} · {me?.designation ?? 'Relationship Manager'} · submitted 19 Nov, 16:42</span></div>
          <div className="text-[15px] text-ink-2">1 of {taken} candidates needing review; the others were auto-marked.</div>
        </div>
        {view !== null && view < derived && <Btn v="secondary" size="sm" onClick={() => setView(null)}>Back to current step</Btn>}
      </div>

      {step === 0 && <IntegrityStep readOnly={derived > 0} />}
      {step === 1 && <ScoreStep readOnly={derived > 1} />}
      {step === 2 && <ResultStep />}
    </div>
  );
}

function ChoiceCard({ on, disabled, onClick, icon, title, text }: { on: boolean; disabled?: boolean; onClick: () => void; icon: ReactNode; title: string; text: string }) {
  return (
    <button role="radio" aria-checked={on} disabled={disabled} onClick={onClick} className={cx('flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-default', on ? 'border-ink bg-[#faf8f5] ring-1 ring-ink' : 'border-line hover:border-ink/30')}>
      <span className={cx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full', on ? 'bg-ink text-white' : 'bg-canvas text-ink-2')}>{icon}</span>
      <span className="min-w-0"><span className="block text-[16px] font-bold">{title}</span><span className="block text-[15px] text-ink-2">{text}</span></span>
    </button>
  );
}

/* ---------------- ① Integrity: the proctoring evidence from the secure exam ---------------- */
function IntegrityStep({ readOnly }: { readOnly: boolean }) {
  const s = useDemo();
  const nav = useNavigate();
  const a = s.attempts['pta-e1'];
  const [mode, setMode] = useState<'cleared' | 'flagged' | null>(readOnly ? (s.pta.integrity === 'pending' ? null : s.pta.integrity) : null);
  const [reason, setReason] = useState(readOnly ? s.pta.note : '');
  const ok = mode === 'cleared' || (mode === 'flagged' && reason.trim().length > 2);
  const events = a?.events ?? [];
  return (
    <DecisionLayout
      panel={
        <DecisionPanel title="Integrity decision" what="Events are signals, not verdicts. Clear the attempt, or flag it for the assessment committee with a reason." note="Proctoring never fails anyone automatically.">
          <ChoiceCard on={mode === 'cleared'} disabled={readOnly} onClick={() => setMode('cleared')} icon={<Check size={18} />} title="Clear" text="No integrity concern. Continue to scoring." />
          <ChoiceCard on={mode === 'flagged'} disabled={readOnly} onClick={() => setMode('flagged')} icon={<span className="text-[15px] font-bold">!</span>} title="Flag for committee" text="The result is withheld until the committee decides." />
          {(mode === 'flagged' || (readOnly && reason)) && (
            <label className="block"><span className="text-[15px] font-semibold text-ink-2">Reason{mode === 'flagged' ? ' (required)' : ''}</span>
              <textarea rows={3} disabled={readOnly} value={reason} onChange={(e) => setReason(e.target.value)} className={cx(inputCls, 'mt-1.5')} placeholder="e.g. Repeated gaze away during the descriptive answer" />
            </label>
          )}
          {!readOnly && <Btn disabled={!ok} onClick={() => s.decideAttempt('pta-e1', mode!, mode === 'cleared' ? reason.trim() || 'Events explained; no integrity concern.' : reason.trim())}>Record integrity decision</Btn>}
        </DecisionPanel>
      }
    >
      <section className="rounded-2xl border border-line bg-white px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[20px] font-bold">Proctoring evidence · secure exam</h3>
          <span className="flex items-center gap-3"><SourceTag kind="simulated">Frames and events simulated</SourceTag><Btn v="link" onClick={() => nav('/assessment/integrity/pta-e1')}>Open full evidence review <ArrowRight size={15} /></Btn></span>
        </div>
        {a ? <EvidenceStrip events={events} faceMatch={a.faceMatch} /> : <p className="text-[16px] text-ink-2">No proctoring record for this attempt.</p>}
        <p className="mt-4 text-[15px] text-ink-3">Started {a?.started ?? '—'} · identity verified against the Employee ID photo before the exam.</p>
      </section>
    </DecisionLayout>
  );
}

/* ---------------- ② Score ---------------- */
function ScoreStep({ readOnly }: { readOnly: boolean }) {
  const s = useDemo();
  const p = s.pta;
  const [mode, setMode] = useState<'accepted' | 'adjusted' | null>(readOnly ? (p.decision === 'pending' ? null : p.decision) : null);
  const [val, setVal] = useState(readOnly ? String(p.descriptive) : '7');
  const [reason, setReason] = useState(readOnly ? p.reason : '');
  const n = Number(val);
  const validScore = val.trim() !== '' && Number.isInteger(n) && n >= 0 && n <= 10;
  const ok = mode === 'accepted' || (mode === 'adjusted' && validScore && reason.trim().length > 2);
  const finalD = mode === 'adjusted' && validScore ? n : 7;
  const pct = Math.round(((MCQ.got + finalD) / 50) * 100);
  return (
    <DecisionLayout
      panel={
        <DecisionPanel title="Score decision" what="Accept the AI-suggested score or set your own. Adjusting needs a reason." note={`Preview: ${MCQ.got} + ${finalD} = ${MCQ.got + finalD} / 50 · ${pct}% · ${gradeOf(pct)}`}>
          <ChoiceCard on={mode === 'accepted'} disabled={readOnly} onClick={() => setMode('accepted')} icon={<Check size={18} />} title="Accept 7 / 10" text="Use the AI-suggested score for the descriptive answer." />
          <ChoiceCard on={mode === 'adjusted'} disabled={readOnly} onClick={() => setMode('adjusted')} icon={<span className="text-[15px] font-bold">±</span>} title="Adjust" text="Set a different score from 0 to 10." />
          {mode === 'adjusted' && (
            <div className="space-y-3">
              <label className="block"><span className="text-[15px] font-semibold text-ink-2">Descriptive score (0–10)</span>
                <input type="number" min={0} max={10} disabled={readOnly} value={val} onChange={(e) => setVal(e.target.value)} className={cx(inputCls, 'mt-1.5 w-32')} />
              </label>
              {!validScore && <p className="text-[14px] text-warn">Enter a whole number from 0 to 10.</p>}
              <label className="block"><span className="text-[15px] font-semibold text-ink-2">Reason (required)</span>
                <textarea rows={3} disabled={readOnly} value={reason} onChange={(e) => setReason(e.target.value)} className={cx(inputCls, 'mt-1.5')} placeholder="e.g. The collateral response is specific to the case; worth one more mark" />
              </label>
            </div>
          )}
          {readOnly
            ? <p className="text-[15px] font-semibold text-ok">Decided: {p.decision === 'accepted' ? 'AI-suggested score accepted' : `Adjusted to ${p.descriptive} / 10`}</p>
            : <Btn disabled={!ok} onClick={() => mode && s.decideScore(mode, mode === 'accepted' ? 7 : n, mode === 'accepted' ? '' : reason.trim())}>Confirm score <ArrowRight size={16} /></Btn>}
        </DecisionPanel>
      }
    >
      <section>
        <h2 className="text-[22px] font-bold tracking-tight">Auto-marked part</h2>
        <div className="mt-3 flex flex-wrap items-baseline gap-4">
          <span className="num text-[48px] leading-none">MCQ {MCQ.got}<span className="text-[24px] text-ink-3"> / {MCQ.of}</span></span>
          <span className="text-[16px] text-ink-2">20 questions · scored instantly · no review needed</span>
        </div>
      </section>
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold tracking-tight">Descriptive answer · Q21 · 10 marks</h2>
          <AiLabel>AI-suggested · a person decides</AiLabel>
        </div>
        <p className="mt-2 text-[16px] text-ink-2">Case: a mid-size garment exporter asks to renew a BDT 25 crore working-capital limit. What risks do you see and what would you do?</p>
        <blockquote className="mt-3 rounded-xl border-l-4 border-line bg-white px-5 py-4 text-[16px] italic leading-relaxed">{ANSWER}</blockquote>
        <h3 className="mt-6 text-[18px] font-bold">Rubric</h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {RUBRIC.map(([r, hit]) => (
            <li key={r} className="flex items-center gap-3 py-2.5 text-[16px]">
              <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', hit ? 'bg-ok' : 'bg-amber-500')}>{hit ? <Check size={14} /> : '!'}</span>
              <span className="flex-1">{r}</span>
              <span className="text-[15px] text-ink-3">{hit ? 'Covered' : 'Missing'}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-2xl border border-info/25 bg-info-soft/50 px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-3"><span className="num text-[30px]">7 / 10</span><span className="text-[16px] font-semibold">AI-suggested score</span></div>
          <p className="mt-1 text-[16px] text-ink-2">Rationale: the answer covers 4 of 5 rubric concepts with a clear, case-specific response, but does not quantify the expected loss. Similar answers in the calibration set were marked 7.</p>
        </div>
      </section>
    </DecisionLayout>
  );
}

/* ---------------- ③ Result ---------------- */
function ResultStep() {
  const s = useDemo();
  const nav = useNavigate();
  const p = s.pta;
  const [mode, setMode] = useState<'Instant' | 'Scheduled'>(p.releaseMode);
  const results = ptResults(s);
  const mine = results.find((r) => r.id === 'e1');
  const pct = mine?.score ?? Math.round(((MCQ.got + p.descriptive) / 50) * 100);
  const passed = pct >= 70;
  const withheld = p.integrity === 'flagged' && !p.committeeCleared;
  const scoreEv = s.audit.find((a) => a.action.startsWith('AI-suggested score') && a.detail.startsWith('Post-training'));
  const released = p.released && !withheld;
  const counts = (st: string) => results.filter((r) => r.status === st).length;
  const pass = counts('Passed'), fail = counts('Failed');

  const breakdown: [string, string][] = [
    ['Auto-marked (MCQ)', `${MCQ.got} / ${MCQ.of}`],
    ['Descriptive answer', `${p.descriptive} / 10 · ${p.decision === 'accepted' ? 'AI suggestion accepted' : 'adjusted by trainer'}`],
    ['Integrity', p.integrity === 'cleared' ? 'Cleared by trainer' : p.committeeCleared ? 'Flagged · cleared by committee' : 'Flagged · with the committee'],
    ['Total', `${MCQ.got + p.descriptive} / 50 · ${pct}%`],
    ['Decided by', `Nafis Ahmed, Trainer${scoreEv ? ` · ${scoreEv.at.slice(12)}` : ` · ${nowLabel(s)}`}`],
    ['AI involvement', `AI suggested 7 · trainer ${p.decision === 'accepted' ? 'accepted' : `adjusted to ${p.descriptive}`}${p.reason ? ` (“${p.reason}”)` : ''}`],
  ];

  const panel = withheld ? (
    <DecisionPanel title="Result withheld" what="This result is under integrity review by the assessment committee. Nothing is released until the committee decides." note="Committee decisions are recorded in the audit trail.">
      <Btn onClick={() => s.committeeClear()}>Record committee decision (simulated) <ArrowRight size={16} /></Btn>
    </DecisionPanel>
  ) : released ? (
    <DecisionPanel title="Result released" what={`${p.releaseMode === 'Instant' ? 'Released now' : 'Scheduled for 20 Nov 2026, 09:00'} to Ayesha Rahman and every other candidate.`}>
      <dl className="grid grid-cols-3 gap-3 text-center">
        {([['Passed', pass, 'text-ok'], ['Failed', fail, 'text-brand'], ['Absent', counts('Absent'), 'text-ink-2']] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-xl bg-canvas py-3"><dd className={cx('num text-[28px] leading-none', c)}>{v}</dd><dt className="mt-1 text-[14px] text-ink-3">{l}</dt></div>
        ))}
      </dl>
      <Btn onClick={() => nav('/assessment/results')}>View all results <ArrowRight size={16} /></Btn>
    </DecisionPanel>
  ) : (
    <DecisionPanel title="Release the result" what="Choose when candidates see their results (FR 214)." note="Release notifies each candidate and updates learning records and the supervisor dashboard.">
      <div role="radiogroup" aria-label="Release mode" className="grid grid-cols-2 gap-2">
        {(['Instant', 'Scheduled'] as const).map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cx('rounded-xl border px-3 py-3 text-left', mode === m ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink/30')}>
            <span className="block text-[16px] font-bold">{m}</span>
            <span className="block text-[14px] text-ink-3">{m === 'Instant' ? 'Now' : '20 Nov 2026, 09:00'}</span>
          </button>
        ))}
      </div>
      <Btn onClick={() => s.releaseResult(mode)}>Release result to candidate <ArrowRight size={16} /></Btn>
    </DecisionPanel>
  );

  return (
    <DecisionLayout panel={panel}>
      <section className={cx('rounded-2xl border px-6 py-5', withheld ? 'border-amber-300 bg-amber-50' : passed ? 'border-[#cfe7d7] bg-[#f3faf5]' : 'border-brand/30 bg-brand-soft/40')}>
        <div className="text-[15px] font-semibold text-ink-2">Ayesha Rahman · {TRAINING.title}</div>
        <div className={cx('mt-1 text-[40px] font-extrabold leading-tight tracking-tight', withheld ? 'text-warn' : passed ? 'text-ok' : 'text-brand')}>
          {withheld ? 'Withheld · under integrity review' : `${passed ? 'Passed' : 'Failed'} · ${pct}% · ${gradeOf(pct)}`}
        </div>
        <div className="mt-1 text-[15px] text-ink-3">Grade settings: Excellent ≥ 90 · Very Good ≥ 85 · Good ≥ 70 · pass mark 70% <FrRef>FR 214</FrRef></div>
      </section>
      <section className="mt-8">
        <h2 className="text-[22px] font-bold tracking-tight">Breakdown</h2>
        <dl className="mt-3 divide-y divide-line border-y border-line">
          {breakdown.map(([k, v]) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-6"><dt className="text-[15px] text-ink-3">{k}</dt><dd className="text-[16px] font-medium">{v}</dd></div>)}
        </dl>
      </section>
      <section className="mt-8">
        <h2 className="text-[22px] font-bold tracking-tight">What happens next</h2>
        <ul className="mt-3 space-y-2 text-[16px]">
          {[
            passed ? 'A certificate is issued to Ayesha with QR verification.' : 'A re-attempt or refresher course is assigned by HR.',
            'Mahmud Karim sees the result on the supervisor dashboard.',
            'Ayesha’s Credit Analysis competency journey moves to the next milestone.',
            `Every candidate gets their own result: ${pass + fail ? `${pass} passed and ${fail} failed` : 'pass or fail with the score'}${counts('Absent') ? `; ${counts('Absent')} absent` : ''}.`,
          ].map((t) => <li key={t} className="flex gap-2.5"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>)}
        </ul>
        {released && <div className="mt-4"><Badge t="ok">{p.releaseMode === 'Instant' ? 'Released now' : 'Release scheduled · 20 Nov, 09:00'}</Badge></div>}
      </section>
    </DecisionLayout>
  );
}
