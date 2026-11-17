/** Assessments & online exams (FR 210–220): KPIs, exams and results, question bank, descriptive grading, proctoring reviews. */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, Plus, Search, TrendingUp, Upload } from 'lucide-react';
import { useDemo } from '../../store';
import { GRADING, QTYPES, type Question } from '../../seed/bank';
import { StatCard, Panel } from '../../components/Dash';
import { Badge, cx, Modal } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { allExams, allQuestions } from './common';

type Tab = 'exams' | 'bank' | 'grading' | 'integrity';
const input = 'min-h-11 rounded-lg border border-line bg-white px-3 text-[15px] outline-none focus:border-brand';
const LEVEL_TONE: Record<string, string> = { Easy: 'bg-ok-soft text-ok', Medium: 'bg-amber-50 text-amber-800', Hard: 'bg-brand-soft text-brand' };

export function ExamsHub() {
  const s = useDemo();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const staff = s.role !== 'employee';
  const tab = (params.get('tab') as Tab) || 'exams';
  const setTab = (t: Tab) => { params.set('tab', t); setParams(params, { replace: true }); };
  const exams = allExams(s);
  const done = exams.filter((e) => e.status === 'Completed');
  const avg = Math.round(done.reduce((n, e) => n + (e.avg ?? 0), 0) / Math.max(1, done.length));
  const pass = Math.round(done.reduce((n, e) => n + (e.pass ?? 0), 0) / Math.max(1, done.length));
  const attempts = Object.values(s.attempts).filter((a) => a.submitted);
  const TABS: [Tab, string, number][] = [['exams', 'Exams & results', exams.length], ...(staff ? [['bank', 'Question bank', allQuestions(s).length], ['grading', 'Descriptive grading', GRADING.length], ['integrity', 'Proctoring reviews', attempts.length]] as [Tab, string, number][] : [])];

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[14px] text-ink-3">Assessments · FR 210–220</div>
          <h1 className="text-[34px] font-semibold tracking-tight">Assessments &amp; online exams</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">Take proctored assessments, review scores synced to the training record, and manage question banks. <SourceTag kind="fictional" /></p>
        </div>
        {staff && <button onClick={() => nav('/assessment/new')} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 text-[16px] font-medium text-white hover:bg-brand-dark"><Plus size={18} />Create exam</button>}
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="Upcoming / live exams" value={exams.filter((e) => e.status === 'Upcoming' || e.status === 'Live').length} icon={CalendarClock} tone="ink" sub="Scheduled assessments" /></li>
        <li><StatCard label="Completed exams" value={done.length} icon={CheckCircle2} tone="ok" sub="Results synced to the training database" /></li>
        <li><StatCard label="Average score" value={`${avg}%`} icon={ClipboardCheck} tone="amber" sub="Across completed exams" /></li>
        <li><StatCard label="Overall pass rate" value={`${pass}%`} icon={TrendingUp} bar={pass} sub="Bank compliance benchmark: 85%" /></li>
      </ul>

      <div role="tablist" className="mt-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
        {TABS.map(([k, l, n]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-[15px]', tab === k ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-2 hover:text-ink')}>{l} <span className="text-ink-3">({n})</span></button>)}
      </div>

      <div className="mt-6">
        {tab === 'exams' && (
          <Panel title="Exams & results" sub={staff ? 'Every exam, its candidates and results' : 'Your upcoming exams; your results are on the Learning hub'}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-[15px]">
                <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Exam', 'Date', 'Candidates', 'Avg score', 'Pass rate', 'Proctored', 'Status', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-line">
                  {exams.filter((e) => staff || e.status === 'Upcoming' || e.status === 'Live').map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4"><span className="block font-medium">{e.title}</span><span className="text-[13px] text-ink-3">{e.id} · {e.linked} · {e.duration} min · pass {e.passMark}%</span></td>
                      <td className="py-3 pr-4 whitespace-nowrap text-ink-2">{e.date}</td>
                      <td className="py-3 pr-4 tabular-nums">{e.candidates}</td>
                      <td className="py-3 pr-4 tabular-nums">{e.avg === null ? '—' : `${e.avg}/100`}</td>
                      <td className="py-3 pr-4 tabular-nums">{e.pass === null ? '—' : `${e.pass}%`}</td>
                      <td className="py-3 pr-4">{e.proctored ? 'Yes' : 'No'}</td>
                      <td className="py-3 pr-4"><Badge>{e.status}</Badge></td>
                      <td className="py-3 text-right whitespace-nowrap">
                        {(e.status === 'Upcoming' || e.status === 'Live') && <button onClick={() => nav(`/assessment/take/${e.id}`)} className="rounded-lg bg-brand px-3 py-1.5 text-[14px] font-medium text-white">{staff ? 'Candidate view' : 'Take exam'}</button>}
                        {staff && e.status === 'Completed' && <button onClick={() => nav(`/assessment/grading/${e.id}`)} className="rounded-lg border border-line px-3 py-1.5 text-[14px]">Grading sheet</button>}
                        {e.id === 'EX007' && staff && <button onClick={() => nav('/assessment/aml')} className="ml-2 rounded-lg border border-line px-3 py-1.5 text-[14px]">AML evaluation</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        {tab === 'bank' && staff && <Bank />}
        {tab === 'grading' && staff && (
          <Panel title="Descriptive & assisted grading queue" sub="AI suggests a rubric score; the grader decides (FR 213)">
            <table className="w-full text-left text-[15px]">
              <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Exam title', 'Participants', 'Scheduled date', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{GRADING.map((g) => <tr key={g.examId}><td className="py-3 pr-4">{g.exam}</td><td className="py-3 pr-4">{g.scripts} scripts</td><td className="py-3 pr-4 text-ink-2">{g.date}</td><td className="py-3 text-right"><button onClick={() => nav(`/assessment/grading/${g.examId}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px]">Open grading sheet<ArrowRight size={14} /></button></td></tr>)}</tbody>
            </table>
          </Panel>
        )}
        {tab === 'integrity' && staff && (
          <Panel title="Proctoring evidence reviews" sub="Every attempt with events waits for a person to clear, flag or withhold it (FR 212)">
            <table className="w-full text-left text-[15px]">
              <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['Candidate', 'Exam', 'Events', 'Face match', 'Decision', ''].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{attempts.map((a) => <tr key={a.id}><td className="py-3 pr-4 font-medium">{a.name}</td><td className="py-3 pr-4 text-ink-2">{a.examId === 'PTA' ? 'Post-training assessment' : a.examId}</td><td className="py-3 pr-4 tabular-nums">{a.events.length}</td><td className="py-3 pr-4 tabular-nums">{a.faceMatch}%</td><td className="py-3 pr-4"><Badge t={a.decision === 'cleared' ? 'ok' : a.decision === 'pending' ? 'warn' : 'brand'}>{a.decision === 'pending' ? 'Review required' : a.decision}</Badge></td><td className="py-3 text-right"><button onClick={() => nav(`/assessment/integrity/${a.id}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[14px]">Review evidence<ArrowRight size={14} /></button></td></tr>)}</tbody>
            </table>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Bank() {
  const s = useDemo();
  const [q, setQ] = useState('');
  const [type, setType] = useState('All 9 types');
  const [topic, setTopic] = useState('All topics');
  const [level, setLevel] = useState('All levels');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<{ text: string; type: Question['type']; topic: string; level: Question['level']; marks: number }>({ text: '', type: 'MCQ', topic: 'AML & CFT', level: 'Easy', marks: 2 });
  const all = allQuestions(s);
  const topics = ['All topics', ...new Set(all.map((x) => x.topic))];
  const rows = all.filter((x) => x.text.toLowerCase().includes(q.toLowerCase()) && (type === 'All 9 types' || x.type === type) && (topic === 'All topics' || x.topic === topic) && (level === 'All levels' || x.level === level));
  return (
    <Panel title={`Assessment question bank · ${all.length} questions`} sub="Nine question formats across AML, credit, trade finance, Islamic banking and cyber security (FR 211, 215–216)"
      action={<div className="flex gap-2"><button onClick={() => useDemo.setState({ toast: 'Bulk upload from Excel validated 25 questions (simulated)' })} className="flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[15px]"><Upload size={16} />Bulk upload Excel</button><button onClick={() => setOpen(true)} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white"><Plus size={16} />Add question</button></div>}>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions by keyword" className={cx(input, 'w-full pl-9')} /></label>
        <select value={type} onChange={(e) => setType(e.target.value)} className={input} aria-label="Type">{['All 9 types', ...QTYPES].map((t) => <option key={t}>{t}</option>)}</select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className={input} aria-label="Topic">{topics.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={input} aria-label="Level">{['All levels', 'Easy', 'Medium', 'Hard'].map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[15px]">
          <thead className="text-[13px] uppercase tracking-wide text-ink-3"><tr>{['ID', 'Question text', 'Type', 'Topic', 'Difficulty', 'Marks', 'Used in'].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{rows.map((x) => <tr key={x.id}><td className="py-3 pr-4 font-mono text-[13px] text-ink-2">{x.id}</td><td className="max-w-[460px] py-3 pr-4">{x.text}</td><td className="py-3 pr-4"><span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[13px] text-sky-800">{x.type}</span></td><td className="py-3 pr-4 text-ink-2">{x.topic}</td><td className="py-3 pr-4"><span className={cx('rounded-full px-2.5 py-0.5 text-[13px]', LEVEL_TONE[x.level])}>{x.level}</span></td><td className="py-3 pr-4 tabular-nums">{x.marks}</td><td className="py-3 tabular-nums text-ink-2">{x.usedIn} exams</td></tr>)}</tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a question" footer={<><button onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-line px-4">Cancel</button><button disabled={f.text.trim().length < 10} onClick={() => { s.addQuestion({ id: `QB${String(all.length + 1).padStart(3, '0')}`, text: f.text.trim(), type: f.type, topic: f.topic, level: f.level, marks: f.marks, usedIn: 0, minutes: 2 }); setOpen(false); setF({ ...f, text: '' }); }} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white disabled:opacity-40">Add to bank</button></>}>
        <div className="space-y-3 text-[15px]">
          <label className="block">Question text<textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-line p-3" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label>Type<select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Question['type'] })} className={cx(input, 'mt-1 w-full')}>{QTYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label>Topic<input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} className={cx(input, 'mt-1 w-full')} /></label>
            <label>Difficulty<select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Question['level'] })} className={cx(input, 'mt-1 w-full')}>{['Easy', 'Medium', 'Hard'].map((t) => <option key={t}>{t}</option>)}</select></label>
            <label>Marks<input type="number" value={f.marks} onChange={(e) => setF({ ...f, marks: +e.target.value })} className={cx(input, 'mt-1 w-full')} /></label>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
