/** The training's course for a participant: overview, modules, AI assistant (FR 190–198) and the post-training assessment (FR 210–212). */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Play, Send, Sparkles } from 'lucide-react';
import { TRAINING } from '../../data';
import { ptResults, useDemo } from '../../store';
import { PageHead, NotYet } from '../../components/Templates';
import { Badge, cx, inputCls, Progress } from '../../components/ui';
import { DEFAULT_MODULES } from '../decisions/CourseSetup';

const NOTES: Record<number, string> = {
  0: 'Credit risk is the chance a borrower cannot repay. You will look at probability of default, exposure at default and loss given default, and how City Bank grades borrowers.',
  1: 'Read the balance sheet, income statement and cash-flow statement together. Focus on leverage, liquidity and interest cover before you look at growth.',
  2: 'Cash flow repays loans, not profit. Early-warning signals include delayed payments, falling stock turnover and rising short-term borrowing.',
  3: 'Two real portfolio cases: one restructured borrower and one default. Decide what you would have flagged, and when.',
};
const ANSWERS: [RegExp, string][] = [
  [/default|pd|lgd/i, 'Probability of default (PD) is how likely a borrower fails; loss given default (LGD) is how much is lost if they do. Module 1 covers both.'],
  [/cash|flow/i, 'Look at operating cash flow against debt service. If it falls below 1.2× the repayments, flag it. That is Module 3.'],
  [/ratio|leverage|liquid/i, 'Start with debt-to-equity, current ratio and interest cover. Module 2 has a worked example.'],
  [/assess|exam|test/i, 'The assessment opens after the training days: 20 objective questions and 1 descriptive answer, pass mark 70%.'],
];

export function TrainingCourse() {
  const s = useDemo();
  const nav = useNavigate();
  const mods = s.courseModules.length ? s.courseModules : DEFAULT_MODULES;
  const done = s.tcourse.done;
  const [cur, setCur] = useState(Math.min(done, mods.length - 1));
  const [playing, setPlaying] = useState(false);
  const [q, setQ] = useState('');
  const [chat, setChat] = useState<{ me: boolean; t: string }[]>([{ me: false, t: `Hi! Ask me anything about ${TRAINING.title}.` }]);
  const pct = Math.round((done / mods.length) * 100);
  const ask = () => {
    const t = q.trim();
    if (!t) return;
    const a = ANSWERS.find(([r]) => r.test(t))?.[1] ?? 'Good question. Your trainer, Nafis Ahmed, can add more on this in the session. Try asking about default, cash flow or ratios.';
    setChat([...chat, { me: true, t }, { me: false, t: a }]);
    setQ('');
  };
  const head = <PageHead title={TRAINING.title} meta={`${mods.length} modules · trainer Nafis Ahmed · ${TRAINING.dates}`} fr="FR 190–198" tags={<Badge t={pct === 100 ? 'ok' : s.tcourse.started ? 'info' : 'neutral'}>{pct === 100 ? 'Completed' : s.tcourse.started ? `${pct}% complete` : 'Not started'}</Badge>} />;
  if (s.participation.e1 !== 'Accepted' && s.participation.e1 !== 'Attended') return <div>{head}<NotYet title="The course opens after you accept the invitation" after="Ayesha accepts the training invitation" /></div>;

  if (!s.tcourse.started) {
    return (
      <div className="mx-auto max-w-[1180px]">
        {head}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
            <h2 className="text-[22px] font-semibold">Course overview</h2>
            <p className="mt-2 text-[16px] text-ink-2">Prepare before the classroom days and come back after them for the assessment.</p>
            <ol className="mt-4 divide-y divide-line">
              {mods.map((m, i) => <li key={i} className="flex items-center gap-3 py-3 text-[16px]"><span className="grid h-7 w-7 place-items-center rounded-full bg-canvas text-[14px]">{i + 1}</span>{m}<span className="ml-auto text-[14px] text-ink-3">~20 min</span></li>)}
            </ol>
            <button onClick={() => s.startTrainingCourse()} className="mt-5 flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark">Start course <ArrowRight size={17} /></button>
          </section>
          <section className="rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
            <h2 className="text-[20px] font-semibold">What you get</h2>
            <ul className="mt-3 space-y-2 text-[16px]">
              <li>Short lessons with video and notes</li>
              <li>An AI assistant for questions on the modules</li>
              <li>Material from your trainer{s.materialLinked ? '' : ' (when HR links it)'}</li>
              <li>A post-training assessment after the classroom days</li>
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1380px]">
      {head}
      <div className="mb-6 max-w-md"><Progress value={pct} tone={pct === 100 ? 'ok' : 'brand'} /></div>
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <nav aria-label="Modules" className="rounded-2xl bg-white p-3 ring-1 ring-line">
          {mods.map((m, i) => (
            <button key={i} onClick={() => { setCur(i); setPlaying(false); }} aria-current={cur === i ? 'step' : undefined} className={cx('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-[15px]', cur === i ? 'bg-canvas font-medium' : 'hover:bg-canvas/60')}>
              <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px]', i < done ? 'bg-ok text-white' : 'bg-canvas text-ink-3 ring-1 ring-line')}>{i < done ? <Check size={13} /> : i + 1}</span>{m}
            </button>
          ))}
          <button onClick={() => nav('/learning/training/assessment')} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-canvas/60">
            <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[13px]', s.ptaSubmitted ? 'bg-ok text-white' : 'bg-canvas text-ink-3 ring-1 ring-line')}>{s.ptaSubmitted ? <Check size={13} /> : 'A'}</span>Assessment
          </button>
        </nav>

        <section className="min-w-0 rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
          <div className="text-[14px] text-ink-3">Module {cur + 1} of {mods.length}</div>
          <h2 className="text-[24px] font-semibold">{mods[cur]}</h2>
          <button onClick={() => setPlaying((v) => !v)} className="mt-4 grid aspect-video w-full place-items-center rounded-xl bg-ink text-white">
            <span className="flex items-center gap-2 text-[16px]"><Play size={20} />{playing ? 'Playing · 03:12 / 08:40' : 'Play lesson video'}</span>
          </button>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{NOTES[cur] ?? 'Lesson notes from your trainer.'}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px] text-ink-3">{cur < done ? 'Completed' : 'In progress'}</span>
            {cur < done
              ? (cur + 1 < mods.length && <button onClick={() => setCur(cur + 1)} className="min-h-11 rounded-lg border border-line bg-white px-4 text-[15px]">Next module</button>)
              : <button onClick={() => { s.completeModule(); if (cur + 1 < mods.length) setCur(cur + 1); }} className="min-h-11 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Mark module complete</button>}
          </div>
        </section>

        <aside className="flex min-h-[420px] flex-col rounded-2xl bg-[#f1f6fb] p-4">
          <div className="flex items-center gap-2 text-[16px] font-medium text-sky-900"><Sparkles size={17} />AI course assistant</div>
          <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {chat.map((m, i) => <li key={i} className={cx('max-w-[90%] rounded-xl px-3 py-2 text-[15px]', m.me ? 'ml-auto bg-ink text-white' : 'bg-white')}>{m.t}</li>)}
          </ul>
          <div className="mt-3 flex gap-2">
            <input aria-label="Ask the assistant" className={inputCls} value={q} placeholder="Ask about this module" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }} />
            <button aria-label="Send" onClick={ask} className="grid min-h-11 w-11 shrink-0 place-items-center rounded-lg bg-sky-800 text-white"><Send size={16} /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}

const QUESTIONS = [
  { q: 'Which ratio best shows a borrower’s ability to pay interest?', o: ['Current ratio', 'Interest cover', 'Gross margin'], a: 1 },
  { q: 'What repays a loan?', o: ['Profit', 'Cash flow', 'Revenue growth'], a: 1 },
  { q: 'Which is an early-warning signal?', o: ['Stable stock turnover', 'Delayed payments to suppliers', 'Higher equity'], a: 1 },
  { q: 'LGD measures…', o: ['How likely default is', 'How much is lost if default happens', 'The loan term'], a: 1 },
];

export function TrainingAssessment() {
  const s = useDemo();
  const nav = useNavigate();
  const [ans, setAns] = useState<number[]>([-1, -1, -1, -1]);
  const [text, setText] = useState('');
  const mine = ptResults(s).find((r) => r.id === 'e1');
  const head = <PageHead title="Post-training assessment" meta={`${TRAINING.title} · 20 objective + 1 descriptive · pass mark 70%`} fr="FR 210–212" />;
  if (!s.attendanceSubmitted) return <div>{head}<NotYet title="The assessment opens after the training days" after="attendance is submitted" /></div>;
  if (s.ptaSubmitted) {
    return (
      <div className="mx-auto max-w-[900px]">
        {head}
        <section className="rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
          <p className="flex items-center gap-2 text-[18px] font-medium text-ok"><Check size={20} />Submitted</p>
          <p className="mt-2 text-[16px] text-ink-2">{s.pta.released && mine?.score != null ? `Result: ${mine.status} · ${mine.score}%` : 'Your trainer is evaluating your answers. You will see the result here.'}</p>
          <button onClick={() => nav('/employee')} className="mt-4 text-[15px] text-brand hover:underline">Back to my learning →</button>
        </section>
      </div>
    );
  }
  const ready = ans.every((x) => x >= 0) && text.trim().length >= 20;
  return (
    <div className="mx-auto max-w-[900px]">
      {head}
      <section className="space-y-5 rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
        <p className="text-[15px] text-ink-3">Showing 4 of the 20 objective questions in this demo.</p>
        {QUESTIONS.map((x, i) => (
          <fieldset key={i}>
            <legend className="mb-2 text-[16px] font-medium">{i + 1}. {x.q}</legend>
            <div className="flex flex-wrap gap-2">
              {x.o.map((o, k) => (
                <label key={k} className={cx('flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[15px] ring-1', ans[i] === k ? 'bg-sky-50 ring-sky-300' : 'ring-line')}>
                  <input type="radio" name={`q${i}`} checked={ans[i] === k} onChange={() => setAns(ans.map((v, j) => (j === i ? k : v)))} className="accent-brand" />{o}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="block">
          <span className="mb-2 block text-[16px] font-medium">5. A borrower’s operating cash flow fell 30% this year. What would you check, and what would you recommend?</span>
          <textarea rows={5} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="At least 20 characters" />
        </label>
        <div className="flex justify-end">
          <button disabled={!ready} onClick={() => s.submitAssessment()} className="min-h-12 rounded-xl bg-brand px-6 text-[16px] font-medium text-white hover:bg-brand-dark disabled:opacity-50">Submit assessment</button>
        </div>
      </section>
    </div>
  );
}
