/**
 * Secure exam with simulated proctoring (FR 212): pre-check (camera, face match to the Employee ID photo, rules),
 * then the exam with a question navigator, timer, flags, a 2-minute alert, an unanswered-question warning on submit,
 * and a proctoring panel. Proctoring events are scripted and recorded for human review; nothing fails automatically.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Bookmark, CheckCircle2, Flag, Timer } from 'lucide-react';
import { useDemo } from '../../store';
import { cx, Modal } from '../../components/ui';
import { findExam, mmss, questionsFor } from './common';
import { PreCheck, ProctorAside, ProctorToast, useProctoring } from './proctor';

export function TakeExam() {
  const { id = 'EX007' } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const exam = findExam(s, id);
  const [stage, setStage] = useState<'check' | 'exam' | 'done'>('check');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const qs = questionsFor(s, id);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<string[]>([]);
  const [alert2m, setAlert2m] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const duration = (exam?.duration ?? 60) * 60;
  const attempt = attemptId ? s.attempts[attemptId] : undefined;
  const events = attempt?.events ?? [];

  const { elapsed, toast, blockCopy } = useProctoring(attemptId, stage === 'exam');

  if (!exam) return <div className="rounded-2xl bg-white p-8 ring-1 ring-line">Exam not found. <button onClick={() => nav('/assessment')} className="text-brand underline">Back to assessments</button></div>;

  const begin = () => { const aid = s.startAttempt(exam.id); setAttemptId(aid); setStage('exam'); };
  const submit = () => {
    if (!attemptId) return;
    const score = qs.filter((q) => answers[q.id] === q.answer).reduce((n, q) => n + q.marks, 0);
    const total = qs.reduce((n, q) => n + q.marks, 0);
    s.saveAttempt(attemptId, { answers, flagged: flags });
    s.submitAttempt(attemptId, score, total);
    setResult({ score, total });
    setConfirm(false);
    setStage('done');
  };
  const unanswered = qs.filter((q) => answers[q.id] === undefined).length;
  const left = Math.max(0, duration - elapsed);

  /* ---------------- pre-check ---------------- */
  if (stage === 'check') {
    return <PreCheck title={exam.title} meta={`${exam.duration} minutes · pass ${exam.passMark}% · ${qs.length} questions · proctored`} onBegin={begin} back={<button onClick={() => nav('/assessment')} className="mb-3 flex items-center gap-1.5 text-[15px] text-ink-2 hover:text-ink"><ArrowLeft size={16} />Assessments</button>} />;
  }

  /* ---------------- done ---------------- */
  if (stage === 'done') {
    return (
      <div className="mx-auto max-w-[760px] rounded-2xl bg-white p-8 text-center ring-1 ring-line">
        <CheckCircle2 size={44} className="mx-auto text-ok" />
        <h1 className="mt-3 text-[28px] font-semibold">Exam submitted</h1>
        <p className="mt-2 text-[16px] text-ink-2">Your answers are saved. Objective score: <b>{result?.score} / {result?.total}</b>. The final result is released after the integrity review by a person.</p>
        <p className="mt-2 text-[15px] text-ink-3">{s.attempts[attemptId!]?.events.length ?? 0} proctoring events were recorded for review (simulated).</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => nav('/assessment')} className="min-h-11 rounded-lg border border-line px-5">Back to assessments</button>
          <button onClick={() => nav(`/assessment/integrity/${attemptId}`)} className="min-h-11 rounded-lg bg-brand px-5 font-medium text-white">See the evidence review (reviewer view)</button>
        </div>
      </div>
    );
  }

  /* ---------------- exam ---------------- */
  const q = qs[cur];
  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="sticky top-0 z-20 mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-line">
        <h1 className="text-[18px] font-semibold">{exam.title}</h1>
        <span className="rounded-full bg-canvas px-3 py-0.5 text-[14px]">Question {cur + 1} / {qs.length}</span>
        <span className="h-1.5 w-32 rounded-full bg-canvas"><span className="block h-1.5 rounded-full bg-brand" style={{ width: `${((Object.keys(answers).length) / qs.length) * 100}%` }} /></span>
        <span className={cx('mx-auto flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[16px] font-semibold', left < 120 ? 'bg-brand-soft text-brand' : 'bg-canvas')}><Timer size={17} />{mmss(left)}</span>
        <button onClick={() => setAlert2m((v) => !v)} className={cx('flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[14px]', alert2m ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-line')}><AlertTriangle size={15} />2m alert{alert2m ? ' on' : ''}</button>
        <button onClick={() => setFlags((f) => (f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id]))} className={cx('flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[14px]', flags.includes(q.id) ? 'border-amber-400 bg-amber-50' : 'border-line')}><Flag size={15} />Flag</button>
        <button onClick={() => (unanswered ? setConfirm(true) : submit())} className="min-h-10 rounded-lg bg-brand px-4 text-[15px] font-medium text-white hover:bg-brand-dark">Submit exam</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="grid grid-cols-4 gap-2">{qs.map((x, i) => <button key={x.id} onClick={() => setCur(i)} className={cx('h-11 rounded-lg text-[15px] font-semibold', i === cur ? 'bg-brand text-white' : answers[x.id] !== undefined ? 'bg-ok-soft text-ok ring-1 ring-ok/40' : flags.includes(x.id) ? 'bg-amber-50 ring-1 ring-amber-300' : 'bg-canvas')}>{i + 1}</button>)}</div>
          <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[14px] text-ink-2"><li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-brand" />Current</li><li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-ok-soft ring-1 ring-ok/40" />Answered ({Object.keys(answers).length})</li><li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-300" />Flagged ({flags.length})</li></ul>
        </aside>

        <section className="select-none rounded-2xl bg-white p-6 ring-1 ring-line" onCopy={blockCopy} onCut={blockCopy} onContextMenu={blockCopy}>
          <div className="text-[14px] text-ink-3">{q.type} · {q.topic} · {q.marks} mark{q.marks > 1 ? 's' : ''}</div>
          <h2 className="mt-2 text-[20px] font-semibold leading-snug">{cur + 1}. {q.text}</h2>
          <ul className="mt-5 space-y-3">
            {(q.options ?? []).map((o, i) => (
              <li key={o}><button onClick={() => setAnswers({ ...answers, [q.id]: i })} className={cx('flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-[16px]', answers[q.id] === i ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-ink/30')}><span className={cx('h-5 w-5 shrink-0 rounded-full border-2', answers[q.id] === i ? 'border-brand bg-brand shadow-[inset_0_0_0_3px_white]' : 'border-line')} />{o}</button></li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <button disabled={cur === 0} onClick={() => setCur(cur - 1)} className="flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-4 disabled:opacity-40"><ArrowLeft size={16} />Previous</button>
            <button onClick={() => setFlags((f) => (f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id]))} title="Bookmark for review" className="grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-canvas"><Bookmark size={18} /></button>
            <button disabled={cur === qs.length - 1} onClick={() => setCur(cur + 1)} className="flex min-h-11 items-center gap-1.5 rounded-lg bg-brand px-4 font-medium text-white disabled:opacity-40">Next<ArrowRight size={16} /></button>
          </div>
        </section>

        <ProctorAside events={events} toast={toast} />
      </div>

      <ProctorToast toast={toast} />

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit with unanswered questions?" footer={<><button onClick={() => setConfirm(false)} className="min-h-11 rounded-lg border border-line px-4">Keep answering</button><button onClick={submit} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white">Submit anyway</button></>}>
        <p className="text-[16px]">You have <b>{unanswered}</b> unanswered question{unanswered === 1 ? '' : 's'}{flags.length ? ` and ${flags.length} flagged` : ''}. Unanswered questions score zero (FR 212).</p>
      </Modal>
    </div>
  );
}
