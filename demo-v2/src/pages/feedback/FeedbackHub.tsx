/**
 * Feedback & training needs (FR 4, 45–46, 221–226): pending and completed feedback (training, e-learning, exam, TNA),
 * a structured Likert form, TNA surveys, and for HR the analytics (trends, trainer comparison, sentiment, AI themes).
 * The story training's feedback stays on its own page (/employee/feedback) and still uses the story action.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, Clock, MessageSquare, Search, Smile, Star } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendedIds, useDemo } from '../../store';
import { FEEDBACK_PROGRAMS, FEEDBACK_TEMPLATES } from '../../seed/bank';
import { Panel, StatCard } from '../../components/Dash';
import { cx, Modal } from '../../components/ui';
import { SourceTag } from '../../components/Source';
import { SentimentReport } from '../oversight/ReportsAnalytics';

type Tab = 'pending' | 'tna' | 'analytics';
type Scope = 'All' | 'Training' | 'e-Learning' | 'Exam' | 'TNA';
interface Item { id: string; scope: Exclude<Scope, 'All'>; title: string; detail: string; story?: boolean }
const SEED: Item[] = [
  { id: 'fb1', scope: 'Training', title: 'Foreign Trade Finance & LC Operations', detail: 'Trainer: Ahsan Habib · City Bank Learning Center · 11 Nov 2026' },
  { id: 'fb2', scope: 'e-Learning', title: 'Cybersecurity Awareness for Bank Employees', detail: 'e-Learning · 3 hrs · module feedback · 09 Nov 2026' },
  { id: 'fb3', scope: 'Exam', title: 'Cybersecurity Awareness — assessment experience', detail: 'Proctored exam · 45 mins · 05 Nov 2026' },
  { id: 'fb4', scope: 'TNA', title: 'Annual TNA & competency survey 2027', detail: 'Tell us what you need to learn next year · 5 minutes' },
];
const CRITERIA = ['Relevance to my current role and regulatory duties', 'Quality, clarity and structure of slides and case studies', 'Practical use in my daily branch or division work'];
const LIKERT = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

export function FeedbackHub() {
  const s = useDemo();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const staff = s.role !== 'employee';
  const tab = (params.get('tab') as Tab) || (staff ? 'analytics' : 'pending');
  const setTab = (t: Tab) => { params.set('tab', t); setParams(params, { replace: true }); };
  const [scope, setScope] = useState<Scope>('All');
  const [q, setQ] = useState('');
  const [done, setDone] = useState<string[]>([]);
  const [form, setForm] = useState<Item | null>(null);
  const attended = attendedIds(s).includes(s.employeeId);
  const story: Item[] = attended && !s.feedbackSubmitted ? [{ id: 'story', scope: 'Training', title: TRAINING.title, detail: `Trainer: Nafis Ahmed · ${TRAINING.venue} · 18–19 Nov 2026`, story: true }] : [];
  const all = [...story, ...SEED];
  const pending = all.filter((x) => !done.includes(x.id) && (scope === 'All' || x.scope === scope) && x.title.toLowerCase().includes(q.toLowerCase()));
  const completed = [...(s.feedbackSubmitted ? [{ id: 'story', scope: 'Training', title: TRAINING.title, detail: 'Submitted · thank you' } as Item] : []), ...SEED.filter((x) => done.includes(x.id)), { id: 'old1', scope: 'Training', title: 'Customer Experience Excellence in Banking', detail: 'Submitted 10 Oct 2026' } as Item];
  const responses = FEEDBACK_PROGRAMS.reduce((n, f) => n + f.responses, 0) * 3 + done.length + (s.feedbackSubmitted ? 1 : 0);
  const overall = (FEEDBACK_PROGRAMS.reduce((n, f) => n + f.overall, 0) / FEEDBACK_PROGRAMS.length).toFixed(1);
  const pos = Math.round(FEEDBACK_PROGRAMS.reduce((n, f) => n + f.positive, 0) / FEEDBACK_PROGRAMS.length);

  const tabs: [Tab, string][] = [['pending', `Pending & completed feedback (${pending.length})`], ['tna', 'TNA & surveys'], ...(staff ? [['analytics', 'Analytics & sentiment']] as [Tab, string][] : [])];
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-5">
        <div className="text-[14px] text-ink-3">Feedback · FR 4, 221–226</div>
        <h1 className="text-[34px] font-semibold tracking-tight">Feedback &amp; training needs (TNA)</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-[16px] text-ink-2">Submit post-training evaluations, take TNA surveys and review satisfaction insights. <SourceTag kind="fictional" /></p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li><StatCard label="Pending feedback" value={pending.length} icon={Clock} tone="amber" sub="Evaluations awaiting your response" onClick={() => setTab('pending')} /></li>
        <li><StatCard label="Total responses" value={responses} icon={CheckCircle2} tone="ok" sub={`${FEEDBACK_PROGRAMS.length} evaluated programmes`} /></li>
        <li><StatCard label="Average overall rating" value={`${overall} / 5`} icon={Star} sub="Content, trainer and logistics" /></li>
        <li><StatCard label="Positive sentiment" value={`${pos}%`} icon={Smile} tone="info" sub="Participant comment summary · AI-assisted" /></li>
      </ul>
      <div role="tablist" className="mt-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-line">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-lg px-4 py-2 text-[15px]', tab === k ? 'bg-brand-soft font-semibold text-brand' : 'text-ink-2 hover:text-ink')}>{l}</button>)}</div>

      <div className="mt-6">
        {tab === 'pending' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <label className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pending feedback" className="min-h-11 w-full rounded-lg border border-line pl-9 pr-3 text-[15px]" /></label>
              {(['All', 'Training', 'e-Learning', 'Exam', 'TNA'] as Scope[]).map((x) => <button key={x} onClick={() => setScope(x)} className={cx('rounded-lg border px-3 py-2 text-[15px]', scope === x ? 'border-brand bg-brand text-white' : 'border-line')}>{x === 'All' ? 'All scope' : x}</button>)}
            </div>
            <Panel title={<span className="flex items-center gap-2"><MessageSquare size={18} className="text-brand" />Awaiting your feedback</span>} sub="Training, e-learning, exams and TNA" action={<span className="rounded-full bg-canvas px-3 py-0.5 text-[14px]">{pending.length} pending</span>}>
              <ul className="space-y-3">{pending.map((x) => (
                <li key={x.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line px-4 py-3">
                  <span className="min-w-0 flex-1"><span className="flex gap-2"><span className="rounded-full border border-line px-2.5 py-0.5 text-[13px]">{x.scope}</span><span className="rounded-full bg-canvas px-2.5 py-0.5 text-[13px]">{x.scope === 'TNA' ? 'Survey' : 'Post-training'}</span>{x.story && <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[13px] font-semibold text-brand">This story</span>}</span><span className="mt-1 block text-[17px] font-semibold">{x.title}</span><span className="text-[14px] text-ink-3">{x.detail}</span></span>
                  <button onClick={() => (x.story ? nav('/employee/feedback') : setForm(x))} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white">Fill form<ArrowRight size={15} /></button>
                </li>
              ))}{!pending.length && <li className="text-ink-2">Nothing pending. Thank you.</li>}</ul>
            </Panel>
            <Panel title="Completed" sub="Your submitted feedback"><ul className="divide-y divide-line">{completed.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 py-2.5"><span className="text-[15px]">{x.title}</span><span className="flex items-center gap-1.5 text-[14px] text-ok"><CheckCircle2 size={15} />Submitted</span></li>)}</ul></Panel>
          </div>
        )}
        {tab === 'tna' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Open surveys" sub="Programme-wise TNA, competency survey and manager feedback (FR 186–188, 222)">
              <ul className="space-y-3">{FEEDBACK_TEMPLATES.map((t, i) => <li key={t.name} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"><span><span className="block text-[16px] font-medium">{i === 2 ? 'Annual TNA & competency survey 2027' : t.name}</span><span className="text-[14px] text-ink-3">{t.questions} questions · {t.scope}</span></span><button onClick={() => setForm({ id: `tna${i}`, scope: 'TNA', title: i === 2 ? 'Annual TNA & competency survey 2027' : t.name, detail: '' })} className="rounded-lg border border-line px-3 py-1.5 text-[14px]">Take survey</button></li>)}</ul>
            </Panel>
            <Panel title="What happens with your answers" sub="Survey results feed the division's training needs">
              <ol className="space-y-3 text-[15px]">{['Answers are grouped by division and topic.', 'The Division Head sees them as survey signals on Training needs.', 'Popular topics become training requests for the next cycle.'].map((t, i) => <li key={t} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-semibold text-brand">{i + 1}</span>{t}</li>)}</ol>
              <button onClick={() => nav('/division')} className="mt-4 flex items-center gap-1 text-[15px] text-brand hover:underline"><ClipboardList size={15} />See survey signals on Training needs</button>
            </Panel>
          </div>
        )}
        {tab === 'analytics' && staff && <SentimentReport />}
      </div>

      <FeedbackForm item={form} onClose={() => setForm(null)} onSubmit={(it) => { setDone((d) => [...d, it.id]); s.logEvent('employee', it.scope === 'TNA' ? 'Survey submitted' : 'Feedback submitted', it.title); useDemo.setState({ toast: 'Thank you. Your feedback is recorded.' }); setForm(null); }} />
    </div>
  );
}

function FeedbackForm({ item, onClose, onSubmit }: { item: Item | null; onClose: () => void; onSubmit: (i: Item) => void }) {
  const [stars, setStars] = useState(4);
  const [l, setL] = useState<number[]>([4, 3, 3]);
  const [comment, setComment] = useState('');
  if (!item) return null;
  return (
    <Modal open onClose={onClose} title={`${item.scope === 'TNA' ? 'Survey' : 'Feedback & evaluation'} · ${item.title}`} footer={<><button onClick={onClose} className="min-h-11 rounded-lg border border-line px-4">Cancel</button><button onClick={() => onSubmit(item)} className="min-h-11 rounded-lg bg-brand px-4 font-medium text-white">Submit</button></>}>
      <div className="space-y-4 text-[15px]">
        <div className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3"><span><b>Overall rating *</b><span className="block text-[13px] text-ink-3">1 (poor) to 5 (excellent)</span></span><span className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}><Star size={26} className={n <= stars ? 'fill-amber-400 text-amber-400' : 'text-line'} /></button>)}</span></div>
        <div>
          <div className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-ink-3">Criteria (Likert 1–5)</div>
          {CRITERIA.map((c, i) => <div key={c} className="mb-2 rounded-xl border border-line px-3 py-2"><div>{c}</div><div className="mt-1.5 flex flex-wrap gap-1">{LIKERT.map((lab, j) => <button key={lab} onClick={() => setL(l.map((v, k) => (k === i ? j : v)))} className={cx('rounded-md px-2 py-1 text-[13px]', l[i] === j ? 'bg-brand text-white' : 'bg-canvas text-ink-2')}>{lab}</button>)}</div></div>)}
        </div>
        <label className="block">Comments (optional)<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-line p-3" placeholder="What worked well, and what should change?" /></label>
      </div>
    </Modal>
  );
}
