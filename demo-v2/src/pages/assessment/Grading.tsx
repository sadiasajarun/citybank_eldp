/**
 * AI-assisted descriptive grading (FR 213): submissions list, the candidate's answer, an AI rubric suggestion with
 * confidence, a similarity / plagiarism check, and the grader's marks. The AI suggests; the grader decides.
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useDemo } from '../../store';
import { GRADING, SUBMISSIONS } from '../../seed/bank';
import { cx } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { findExam } from './common';

export function GradingSheet() {
  const { examId = 'EX001' } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const exam = findExam(s, examId);
  const title = exam?.title ?? GRADING.find((g) => g.examId === examId)?.exam ?? examId;
  const [sel, setSel] = useState(SUBMISSIONS[0].id);
  const [marks, setMarks] = useState<Record<string, number>>(() => Object.fromEntries(SUBMISSIONS.map((x) => [x.id, x.status === 'Graded' ? x.ai : x.ai])));
  const [graded, setGraded] = useState<string[]>(SUBMISSIONS.filter((x) => x.status === 'Graded').map((x) => x.id));
  const [q, setQ] = useState('');
  const sub = SUBMISSIONS.find((x) => x.id === sel)!;
  const m = marks[sel];
  const save = () => {
    setGraded((g) => [...new Set([...g, sel])]);
    s.logEvent('trainer', m === sub.ai ? 'AI-suggested score accepted' : 'AI-suggested score adjusted', `${title} · ${sub.name} · essay ${m}/${sub.max}`);
    useDemo.setState({ toast: `Grade saved for ${sub.name}` });
  };
  return (
    <div className="mx-auto max-w-[1440px]">
      <button onClick={() => nav('/assessment?tab=grading')} className="mb-3 flex items-center gap-1.5 text-[15px] text-ink-2 hover:text-ink"><ArrowLeft size={16} />Assessments</button>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-[30px] font-semibold tracking-tight">AI-assisted grading — {title}</h1>
        <span className="rounded-full bg-sky-50 px-3 py-0.5 text-[14px] text-sky-900 ring-1 ring-sky-200">Human-in-the-loop AI</span>
        <SourceTag kind="fictional" />
      </header>
      <p className="mt-1 text-[16px] text-ink-2">Review descriptive and essay answers with explainable AI rubric suggestions and a similarity check.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="text-[18px] font-semibold">Submissions ({SUBMISSIONS.length})</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candidate or ID" className="mt-3 min-h-11 w-full rounded-lg border border-line px-3 text-[15px]" />
          <ul className="mt-3 space-y-2">
            {SUBMISSIONS.filter((x) => `${x.name} ${x.eid}`.toLowerCase().includes(q.toLowerCase())).map((x) => (
              <li key={x.id}><button onClick={() => setSel(x.id)} className={cx('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left', sel === x.id ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-ink/30')}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[14px] font-bold text-white">{x.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{x.name}</span><span className="block truncate text-[13px] text-ink-3">{x.eid} · {x.role}</span></span>
                <span className={cx('rounded-full px-2.5 py-0.5 text-[13px]', graded.includes(x.id) ? 'bg-ok-soft text-ok' : 'bg-amber-50 text-amber-800')}>{graded.includes(x.id) ? 'Graded' : 'Pending'}</span>
              </button></li>
            ))}
          </ul>
        </aside>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-4 ring-1 ring-line">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-[16px] font-bold text-white">{sub.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><div><div className="text-[18px] font-semibold">{sub.name}</div><div className="text-[14px] text-ink-3">{sub.eid} · {sub.role}</div></div></div>
            <div className="text-right"><div className="text-[13px] text-ink-3">Auto-graded objective score</div><div className="text-[24px] font-semibold text-brand">{sub.objective}</div></div>
          </div>

          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[17px] font-semibold">Essay Q1 · max {sub.max} marks</div>
              <span className={cx('flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[14px]', sub.similarity < 15 ? 'bg-ok-soft text-ok' : 'bg-amber-50 text-amber-800')}><ShieldCheck size={14} />{sub.similarity < 15 ? 'Original' : 'Review'} ({sub.similarity}% similarity)</span>
            </div>
            <p className="mt-2 text-[16px]">{sub.question}</p>
            <div className="mt-4 rounded-xl bg-sky-50/60 px-4 py-3 ring-1 ring-sky-100"><div className="text-[13px] font-semibold uppercase tracking-wide text-sky-800">Candidate response</div><p className="mt-1 text-[16px]">{sub.answer}</p></div>
            <div className="mt-4 rounded-xl bg-amber-50/70 px-4 py-3 ring-1 ring-amber-200">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2 text-[15px] font-semibold text-amber-900"><Sparkles size={16} />AI rubric suggestion (on-prem model)</span><span className="flex items-center gap-2 text-[14px] text-amber-900">Confidence <span className="h-1.5 w-24 rounded-full bg-white"><span className="block h-1.5 rounded-full bg-amber-500" style={{ width: `${sub.confidence}%` }} /></span>{sub.confidence}%</span></div>
              <div className="mt-2 text-[16px] font-semibold">Suggested score: {sub.ai} / {sub.max}</div>
              <p className="mt-1 text-[15px] italic text-ink-2">“{sub.rationale}”</p>
              <button onClick={() => setMarks({ ...marks, [sel]: sub.ai })} className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[14px] font-medium text-amber-900">Accept AI suggestion</button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-[16px] font-semibold">Assigned marks:</span>
              <button onClick={() => setMarks({ ...marks, [sel]: Math.max(0, m - 0.5) })} className="grid h-10 w-10 place-items-center rounded-lg border border-line"><Minus size={16} /></button>
              <span className="min-w-16 rounded-lg border border-line px-4 py-2 text-center text-[17px] font-semibold tabular-nums">{m}</span>
              <button onClick={() => setMarks({ ...marks, [sel]: Math.min(sub.max, m + 0.5) })} className="grid h-10 w-10 place-items-center rounded-lg border border-line"><Plus size={16} /></button>
              <span className="text-[15px] text-ink-3">/ {sub.max} marks</span>
              <button onClick={save} className="ml-auto min-h-11 rounded-lg bg-brand px-5 font-medium text-white">Save grade</button>
            </div>
            <p className="mt-3 text-[13px] text-ink-3">AI-assisted · human decision. The final mark and any change from the AI suggestion are recorded in the audit trail.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
