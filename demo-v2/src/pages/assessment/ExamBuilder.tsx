/** Create assessment / exam (FR 210–216, 220): details, proctoring and security controls, question picker. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Send, Shuffle, X } from 'lucide-react';
import { useDemo } from '../../store';
import { BATCHES } from '../../seed/bank';
import { cx } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { allQuestions } from './common';

const input = 'min-h-11 w-full rounded-lg border border-line bg-white px-3 text-[15px] outline-none focus:border-brand';
const CONTROLS: { key: string; title: string; sub: string; on: boolean }[] = [
  { key: 'webcam', title: 'Webcam proctoring', sub: 'Records face presence during the exam', on: true },
  { key: 'face', title: 'Face verification against the Employee ID photo', sub: 'Checked before start and during the exam', on: true },
  { key: 'tab', title: 'Tab-switch and focus detection', sub: 'Window and browser restriction; every switch is logged', on: true },
  { key: 'copy', title: 'Copy-paste restriction', sub: 'Blocks copy, cut and right-click on exam content', on: true },
  { key: 'gaze', title: 'Gaze and head-pose observation', sub: 'Counts look-aways and head turns for review', on: true },
  { key: 'shuffleQ', title: 'Shuffle question sequence', sub: 'Randomises question order per candidate', on: true },
  { key: 'shuffleO', title: 'Shuffle MCQ options', sub: 'Randomises A/B/C/D order across attempts', on: true },
  { key: 'neg', title: 'Negative marking (−0.25 per wrong answer)', sub: 'Discourages random guessing on high-stakes tests', on: false },
  { key: 'instant', title: 'Show immediate result summary', sub: 'Score shown after submission, final after review', on: true },
];

export function ExamBuilder() {
  const s = useDemo();
  const nav = useNavigate();
  const bank = allQuestions(s);
  const [f, setF] = useState({ title: '', linked: BATCHES[0].title, duration: 60, pass: 70, attempts: 2, date: '2026-12-10', rule: 'Highest score' });
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(CONTROLS.map((c) => [c.key, c.on])));
  const [sel, setSel] = useState<string[]>(['QB001', 'QB002', 'QB003', 'QB004']);
  const [q, setQ] = useState('');
  const available = bank.filter((x) => !sel.includes(x.id) && `${x.text} ${x.topic} ${x.type}`.toLowerCase().includes(q.toLowerCase()));
  const total = sel.reduce((n, id) => n + (bank.find((x) => x.id === id)?.marks ?? 0), 0);
  const save = (draft: boolean) => {
    const title = f.title.trim() || 'Untitled exam';
    s.publishExam({ id: `EX${String(100 + s.customExams.length + 1)}`, title, linked: f.linked, date: new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), status: draft ? 'Draft' : 'Upcoming', candidates: 0, avg: null, pass: null, duration: f.duration, passMark: f.pass, proctored: on.webcam, scripts: 0 }, draft);
    nav('/assessment');
  };
  return (
    <div className="mx-auto max-w-[1440px]">
      <button onClick={() => nav('/assessment')} className="mb-3 flex items-center gap-1.5 text-[15px] text-ink-2 hover:text-ink"><ArrowLeft size={16} />Back to assessments</button>
      <header className="flex flex-wrap items-center gap-3"><h1 className="text-[32px] font-semibold tracking-tight">Create assessment / exam</h1><span className="rounded-full bg-canvas px-3 py-0.5 text-[14px] ring-1 ring-line">Exam authoring</span><SourceTag kind="simulated">Saved in the demo only</SourceTag></header>
      <p className="mt-1 text-[16px] text-ink-2">Configure proctoring rules and pass thresholds, then assemble questions from the City Bank question bank.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <h2 className="text-[20px] font-semibold">Exam details</h2>
            <label className="mt-4 block text-[15px]">Exam title *<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. BFIU 2027 AML Compliance Certification" className={cx(input, 'mt-1')} /></label>
            <label className="mt-3 block text-[15px]">Linked training programme<select value={f.linked} onChange={(e) => setF({ ...f, linked: e.target.value })} className={cx(input, 'mt-1')}>{['Standalone (no training)', ...BATCHES.map((b) => b.title)].map((t) => <option key={t}>{t}</option>)}</select></label>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="text-[15px]">Duration (min)<input type="number" value={f.duration} onChange={(e) => setF({ ...f, duration: +e.target.value })} className={cx(input, 'mt-1')} /></label>
              <label className="text-[15px]">Pass %<input type="number" value={f.pass} onChange={(e) => setF({ ...f, pass: +e.target.value })} className={cx(input, 'mt-1')} /></label>
              <label className="text-[15px]">Attempts<input type="number" value={f.attempts} onChange={(e) => setF({ ...f, attempts: +e.target.value })} className={cx(input, 'mt-1')} /></label>
              <label className="text-[15px]">Date<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={cx(input, 'mt-1')} /></label>
            </div>
          </section>
          <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
            <h2 className="text-[20px] font-semibold">Security and proctoring controls</h2>
            <ul className="mt-3 space-y-2">
              {CONTROLS.map((c) => (
                <li key={c.key} className="flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3">
                  <span><span className="block text-[16px] font-medium">{c.title}</span><span className="text-[14px] text-ink-3">{c.sub}</span></span>
                  <button role="switch" aria-checked={on[c.key]} aria-label={c.title} onClick={() => setOn({ ...on, [c.key]: !on[c.key] })} className={cx('h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors', on[c.key] ? 'bg-brand' : 'bg-line')}><span className={cx('block h-6 w-6 rounded-full bg-white shadow transition-transform', on[c.key] && 'translate-x-5')} /></button>
                </li>
              ))}
              <li className="flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3">
                <span><span className="block text-[16px] font-medium">Several exams in the same month</span><span className="text-[14px] text-ink-3">Which score counts (FR 220)</span></span>
                <select value={f.rule} onChange={(e) => setF({ ...f, rule: e.target.value })} className="min-h-10 rounded-lg border border-line bg-white px-3 text-[15px]">{['Highest score', 'Average score', 'Latest score'].map((r) => <option key={r}>{r}</option>)}</select>
              </li>
            </ul>
          </section>
        </div>

        <section className="rounded-2xl bg-white px-6 py-5 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-[20px] font-semibold">Question picker</h2><p className="text-[14px] text-ink-3">Selected: {sel.length} questions · total marks {total}</p></div>
            <button onClick={() => setSel([...new Set([...sel, ...available.sort(() => 0.5 - Math.random()).slice(0, 3).map((x) => x.id)])])} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Shuffle size={16} />Random from bank</button>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search available questions by keyword or topic" className={cx(input, 'mt-3')} />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl ring-1 ring-line">
              <div className="border-b border-line px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Available ({available.length})</div>
              <ul className="max-h-[520px] space-y-2 overflow-y-auto p-2">{available.map((x) => <li key={x.id} className="rounded-lg border border-line p-2.5"><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-canvas px-2 py-0.5 text-[12px]">{x.type} · {x.minutes}m</span><button onClick={() => setSel([...sel, x.id])} aria-label="Add question" className="text-brand"><Plus size={18} /></button></div><p className="mt-1 line-clamp-2 text-[14px]">{x.text}</p></li>)}</ul>
            </div>
            <div className="rounded-xl ring-1 ring-brand/40">
              <div className="border-b border-line px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-brand">Selected ({sel.length})</div>
              <ul className="max-h-[520px] space-y-2 overflow-y-auto p-2">{sel.map((id, i) => { const x = bank.find((b) => b.id === id); return x ? <li key={id} className="rounded-lg border border-line p-2.5"><div className="flex items-start justify-between gap-2"><span className="text-[12px] text-ink-3">Q{i + 1} · {x.type} · {x.marks} mark{x.marks > 1 ? 's' : ''}</span><button onClick={() => setSel(sel.filter((y) => y !== id))} aria-label="Remove question" className="text-ink-3 hover:text-brand"><X size={17} /></button></div><p className="mt-1 line-clamp-2 text-[14px]">{x.text}</p></li> : null; })}</ul>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => save(true)} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-4"><Save size={16} />Save as draft</button>
            <button disabled={!sel.length} onClick={() => save(false)} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 font-medium text-white disabled:opacity-40"><Send size={16} />Publish exam</button>
          </div>
        </section>
      </div>
    </div>
  );
}
