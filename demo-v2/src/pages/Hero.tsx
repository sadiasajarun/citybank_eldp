import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CheckCircle2, Clock, Flag, ShieldCheck } from 'lucide-react';
import { TRAINING } from '../data';
import { useDemo } from '../store';
import { CB_GAP_COUNT } from '../org';
import type { Employee } from '../types';
import { AiLabel, Avatar, Badge, Btn, cx } from '../components/ui';

const T = TRAINING.trainingId;

function Eyebrow({ children }: { children: React.ReactNode; tone?: 'brand' | 'muted' }) {
  return <div className="text-[14px] font-medium text-ink-3">{children}</div>;
}

type Check = { src: string; ok: boolean; note: string };
export function checksFor(e: Employee): Check[] {
  return [
    { src: 'HRIS', ok: e.id !== 'c2', note: e.id === 'c2' ? 'Retirement effective 30 Nov 2026' : 'Active · grade verified' },
    { src: 'Leave Management', ok: e.id !== 'e2', note: e.id === 'e2' ? 'Approved leave 19 Nov' : 'Clear' },
    { src: 'Outlook Calendar', ok: !['e2', 'c3'].includes(e.id), note: e.id === 'e2' ? 'Client Strategy Meeting 18 Nov 14:00' : e.id === 'c3' ? 'Credit Committee 19 Nov 10:00' : 'Clear' },
    { src: 'Training Database', ok: e.id !== 'c1', note: e.id === 'c1' ? 'Overlap: Retail Lending Workshop 18 Nov' : 'No overlap' },
    { src: 'Competency Eligibility', ok: true, note: 'Credit Analysis target role' },
  ];
}
const PROFILE: [string, number, number][] = [['Communication', 4, 4], ['Customer Relationship', 3, 4], ['Credit Analysis', 2, 4], ['AML', 4, 4], ['Leadership', 2, 3]];
const PATH = ['Credit Fundamentals', 'Financial Analysis', 'Credit Risk Workshop', 'Assessment', 'Competency Review'];
export function CapabilityProfile() {
  const s = useDemo();
  const nav = useNavigate();
  return (
    <div>
      <div className="mb-8"><Eyebrow>Role Capability Profile</Eyebrow><h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight">Relationship Manager</h1><p className="mt-1.5 text-[14.5px] text-ink-2">Current → Target · 32 officers in Corporate Banking · framework FY2026</p></div>
      <div className="grid items-center gap-10 xl:grid-cols-[1.1fr_auto_1fr]">
        <div className="space-y-2">
          {PROFILE.map(([n, c, t]) => {
            const gap = t - c;
            const pri = n === 'Credit Analysis';
            return (
              <div key={n} className={cx('flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors', pri ? 'bg-ink text-white' : 'bg-white')}>
                <span className="w-44 text-[15.5px] font-bold">{n}</span>
                <div className="flex flex-1 items-center gap-1.5">{[1, 2, 3, 4].map((l) => <span key={l} className={cx('h-3 flex-1 rounded-full', l <= c ? (pri ? 'bg-white' : 'bg-ink') : l <= t ? 'bg-brand' : pri ? 'bg-white/10' : 'bg-line')} />)}</div>
                <span className="w-16 text-right text-[15.5px] font-extrabold tabular-nums">{c} → {t}</span>
                <span className={cx('w-20 text-right text-[14px] font-bold', gap === 0 ? (pri ? 'text-white/50' : 'text-ok') : pri ? 'text-red-300' : 'text-warn')}>{gap === 0 ? 'Met' : `Gap ${gap}`}</span>
              </div>
            );
          })}
          <div className="flex gap-4 pt-2 text-[14px] text-ink-3"><span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-ink" />Current</span><span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-brand" />Gap to target</span></div>
        </div>
        <div className="hidden flex-col items-center xl:flex">
          <div className="rounded-2xl bg-brand px-5 py-4 text-center text-white"><div className="eyebrow text-[14px] text-white/70">Priority gap</div><div className="mt-1 text-[18px] font-extrabold">Credit Analysis</div><div className="text-[14px] text-white/80">2 levels · {CB_GAP_COUNT} officers</div></div>
          <svg width="120" height="40" className="my-2"><path d="M0,20 L110,20" stroke="#d71920" strokeWidth="2" className="anim-dash" /><path d="M104,14 L112,20 L104,26" stroke="#d71920" strokeWidth="2" fill="none" /></svg>
        </div>
        <div>
          {s.journeyDone < PATH.length && (
            <div className="mb-6 rounded-2xl border border-brand/25 bg-brand-soft/50 p-5">
              <div className="text-[15px] font-semibold text-brand">Recommended next step</div>
              <div className="mt-1 text-[19px] font-bold">{PATH[s.journeyDone]}</div>
              <p className="mt-1 text-[15.5px] text-ink-2">{['Start with the 45-minute e-learning to refresh credit basics.', 'Complete the financial analysis e-learning before the classroom days.', `Attend the classroom workshop ${T} on 18–19 Nov.`, 'Take the case study assessment to prove the new level.', 'Your supervisor reviews and confirms the new competency level.'][s.journeyDone]}</p>
            </div>
          )}
          <div className="mb-3 flex items-baseline justify-between"><div className="th">Recommended learning journey</div><AiLabel>AI-suggested · approved by L&amp;D</AiLabel></div>
          <ol className="relative border-l-2 border-line">
            {PATH.map((p, i) => {
              const done = i < s.journeyDone;
              return (
                <li key={p} className="relative pb-5 pl-7">
                  <span className={cx('absolute -left-[11px] top-0 grid h-5 w-5 place-items-center rounded-full text-[14px] font-bold', done ? 'bg-ink text-white' : i === s.journeyDone ? 'anim-pulse bg-brand text-white' : 'border-2 border-line bg-white text-ink-3')}>{done ? <Check size={11} /> : i + 1}</span>
                  <div className="text-[15.5px] font-bold">{p}</div>
                  <div className="text-[14px] text-ink-3">{done ? 'Complete' : i === s.journeyDone ? 'Current milestone' : ['e-Learning', 'e-Learning', `Classroom · ${T}`, 'Case study assessment', 'Supervisor review'][i]}</div>
                </li>
              );
            })}
          </ol>
          <div className="flex gap-2"><Btn onClick={() => nav('/journey')}>Create Learning Journey</Btn><Btn v="secondary" onClick={() => nav('/tna')}>Open TNA</Btn></div>
        </div>
      </div>
    </div>
  );
}

/* ================= COURSE PLAYER ================= */
export function ExamV2() {
  const s = useDemo();
  const [tab, setTab] = useState<'setup' | 'take' | 'integrity' | 'eval'>(s.role === 'trainer' ? 'integrity' : 'take');
  const [secure, setSecure] = useState(false);
  const [q, setQ] = useState(1);
  const [flag, setFlag] = useState<Record<number, boolean>>({});
  const tabs = [['setup', 'Exam Setup'], ['take', 'Candidate'], ['integrity', 'Integrity Review'], ['eval', 'Evaluation']] as const;
  const EVID = [['00:04:12', 'Tab switch', 'Browser focus lost 6s'], ['00:11:40', 'Look-away', '3 events in 40s'], ['00:19:05', 'Face not visible', '4s · lighting change'], ['00:27:31', 'Tab switch', 'Browser focus lost 3s'], ['00:41:18', 'Look-away', '3 events']];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow>Assessment</Eyebrow><h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight">AML Annual Certification Assessment</h1><p className="mt-1.5 text-[14.5px] text-ink-2">420-question bank · 20 drawn · 60 minutes · pass 70% · proctored</p></div>
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1 text-[14px] font-bold">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('rounded-lg px-3 py-1.5', tab === k ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas')}>{l}</button>)}</div>
      </div>
      {tab === 'setup' && (
        <div className="grid gap-x-12 gap-y-6 border-t border-line pt-6 md:grid-cols-3 xl:grid-cols-5">
          {[['Question bank', 'AML & CFT · 420'], ['Difficulty', '30 / 50 / 20'], ['Randomization', 'Questions + options'], ['Passing score', '70%'], ['Negative marking', '0.25 per MCQ'], ['Attempts', '2'], ['Time limit', '60 min'], ['Result release', 'After evaluation'], ['Proctoring', 'Face · tab · gaze'], ['Question types', 'MCQ · T/F · Essay · Case Study · Image · Matching · Drag & Drop']].map(([k, v]) => <div key={k}><div className="th">{k}</div><div className="mt-1 text-[15.5px] font-semibold">{v}</div></div>)}
        </div>
      )}
      {tab === 'take' && (
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8">
          <Eyebrow tone="muted">Pre-check</Eyebrow>
          <div className="mt-4 space-y-2">{['Camera', 'Identity (face matched to Employee ID photo)', 'Browser lock', 'Connection', 'Exam rules accepted'].map((c) => <div key={c} className="flex items-center gap-3 rounded-xl bg-ok-soft px-4 py-3 text-[15px] font-semibold"><CheckCircle2 size={17} className="text-ok" />{c}</div>)}</div>
          <Btn size="lg" className="mt-6 w-full" icon={<ShieldCheck size={16} />} onClick={() => { setSecure(true); s.setExam('in_progress'); }}>Begin Secure Assessment</Btn>
        </div>
      )}
      {tab === 'integrity' && (
        <div className="grid gap-8 xl:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="flex items-center gap-4"><Avatar name="Ayesha Rahman" size={48} /><div><div className="text-[18px] font-extrabold">Assessment Integrity Review</div><div className="text-[14px] text-ink-3">Candidate: Ayesha Rahman · CBL-10482 · submitted 11:38</div></div><span className="ml-auto"><Badge t={s.proctorFlag === 'Cleared' ? 'ok' : s.proctorFlag === 'Flagged' ? 'brand' : 'warn'}>{s.proctorFlag === 'Review Required' ? 'Review Recommended' : s.proctorFlag}</Badge></span></div>
            <div className="mt-6 flex divide-x divide-line border-y border-line">{[['2', 'Tab switches'], ['1', 'Face not visible'], ['6', 'Look-away events'], ['0', 'Copy attempts']].map(([n, l]) => <div key={l} className="flex-1 px-5 py-4 first:pl-0"><div className="num text-[32px] leading-none">{n}</div><div className="mt-1 text-[14px] text-ink-3">{l}</div></div>)}</div>
            <div className="mt-6"><div className="mb-3 flex items-center justify-between"><div className="th">Evidence timeline</div><AiLabel>AI-assisted observations</AiLabel></div>
              <div className="relative h-2 rounded-full bg-line">{EVID.map(([t], i) => { const [h, m, sec] = t.split(':').map(Number); const pct = ((h * 3600 + m * 60 + sec) / 3600) * 100; return <span key={i} className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-warn" style={{ left: `${pct}%` }} />; })}</div>
              <ul className="mt-4 divide-y divide-line">{EVID.map(([t, k, d]) => <li key={t} className="flex items-center gap-4 py-2.5 text-[14.5px]"><span className="w-20 font-mono text-[14px] text-ink-3">{t}</span><b className="w-36">{k}</b><span className="text-ink-2">{d}</span><span className="ml-auto text-[14px] font-semibold text-ink-3">frame captured</span></li>)}</ul>
            </div>
          </div>
          <div className="self-start rounded-2xl bg-graphite p-6 text-white">
            <div className="eyebrow text-[14px] text-red-300">Human decision</div>
            <p className="mt-2 text-[16.5px] font-semibold leading-snug">AI provides evidence. Authorized evaluators make the final decision.</p>
            <div className="mt-5 grid grid-cols-3 gap-2"><button onClick={() => s.setProctor('Cleared')} className="rounded-xl bg-white py-2.5 text-[14.5px] font-bold text-ink">Clear</button><button onClick={() => s.setProctor('Flagged')} className="rounded-xl bg-brand py-2.5 text-[14.5px] font-bold"><Flag size={13} className="mr-1 inline" />Flag</button><button onClick={() => { s.logEvent('trainer', 'Integrity note added', 'AML Annual Certification · reviewer note on look-away events'); useDemo.setState({ toast: 'Note added to the audit trail' }); }} className="rounded-xl border border-white/15 py-2.5 text-[14.5px] font-bold">Add Note</button></div>
            <p className="mt-4 text-[14px] text-white/45">No participant is failed automatically. Decision, reviewer and justification are written to the audit log and forwarded to SIEM.</p>
          </div>
        </div>
      )}
      {tab === 'eval' && (
        <div className="grid gap-8 xl:grid-cols-2">
          <div><div className="th">Objective questions · auto-scored</div><div className="num mt-2 text-[56px] leading-none">34<span className="text-[24px] text-ink-3"> / 40</span></div><p className="mt-2 text-[14.5px] text-ink-2">MCQ, True/False, matching and drag &amp; drop scored instantly with negative marking applied.</p></div>
          <div className="rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between"><div className="th">Descriptive answer · Q9 · 10 marks</div><AiLabel>AI-assisted — trainer decides</AiLabel></div>
            <p className="mt-3 rounded-xl bg-canvas p-4 text-[14.5px] italic">“Structuring splits deposits to avoid reporting thresholds; the bank must file an STR with BFIU, preserve records and avoid tipping off…”</p>
            <div className="mt-4 flex items-baseline gap-3"><span className="num text-[30px]">7/10</span><span className="text-[14.5px] text-ink-2">Suggested · candidate covered 4 of 5 rubric concepts</span></div>
            <div className="mt-2 text-[14.5px]">Final: <b>{s.aiScore.score}/10</b> {s.aiScore.state !== 'suggested' && <Badge t="ok">{s.aiScore.state} · logged</Badge>}</div>
            <div className="mt-4 flex gap-2"><Btn onClick={() => s.setAi('accepted', 7)}>Accept</Btn><Btn v="secondary" onClick={() => s.setAi('adjusted', 8)}>Adjust to 8</Btn></div>
          </div>
        </div>
      )}

      {secure && (
        <div className="anim-fade fixed inset-0 z-[80] flex flex-col bg-white">
          <header className="flex h-14 items-center gap-4 border-b border-line px-6">
            <span className="flex items-center gap-2 text-[14px] font-extrabold text-ink"><ShieldCheck size={16} className="text-brand" />Secure Assessment Mode</span>
            <span className="text-[14px] text-ink-3">AML Annual Certification · Ayesha Rahman</span>
            <span className="ml-auto flex items-center gap-1.5 text-[14px] text-ok"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Autosaved</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 font-mono text-[15.5px] font-bold text-white"><Clock size={14} />42:18</span>
          </header>
          <div className="h-1 bg-line"><div className="h-full bg-brand transition-all" style={{ width: `${(q / 20) * 100}%` }} /></div>
          <div className="grid flex-1 overflow-hidden lg:grid-cols-[1fr_300px]">
            <div className="overflow-y-auto px-8 py-12">
              <div className="mx-auto max-w-2xl">
                <div className="text-[14px] font-bold text-ink-3">Question {q} of 20 · Multiple choice · 2 marks</div>
                <p className="mt-3 text-[22px] font-semibold leading-snug">A customer deposits BDT 9,50,000 in cash in three same-day transactions just below the reporting threshold. This is best described as:</p>
                <div className="mt-8 space-y-3">{['Normal customer behaviour', 'Structuring — file a Suspicious Transaction Report', 'A currency conversion issue', 'Only reportable if the customer is a PEP'].map((o, i) => <label key={o} className="flex items-center gap-4 rounded-2xl border border-line p-5 text-[16.5px] hover:border-ink/30"><input type="radio" name="sq" defaultChecked={i === 1} /><span className="font-bold text-ink-3">{'ABCD'[i]}</span>{o}</label>)}</div>
                <div className="mt-8 flex items-center gap-2"><Btn v="secondary" onClick={() => setFlag({ ...flag, [q]: !flag[q] })} icon={<Flag size={14} />}>{flag[q] ? 'Flagged' : 'Flag question'}</Btn><span className="flex-1" /><Btn v="secondary" disabled={q === 1} onClick={() => setQ(q - 1)}>Previous</Btn><Btn onClick={() => setQ(Math.min(20, q + 1))}>Next</Btn></div>
              </div>
            </div>
            <aside className="border-l border-line bg-canvas p-6">
              <div className="th mb-3">Question navigator</div>
              <div className="grid grid-cols-5 gap-1.5">{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => setQ(n)} className={cx('h-9 rounded-lg text-[14px] font-bold', n === q ? 'bg-ink text-white' : flag[n] ? 'bg-warn-soft text-warn' : n < q ? 'bg-white text-ink' : 'bg-white/50 text-ink-3')}>{n}</button>)}</div>
              <div className="mt-6 space-y-1.5 text-[14px] text-ink-3"><div>Answered {q - 1} · Flagged {Object.values(flag).filter(Boolean).length}</div><div>Copy-paste disabled · tab detection on</div></div>
              <Btn className="mt-6 w-full" onClick={() => { setSecure(false); s.setExam('submitted'); setTab('integrity'); }}>Submit assessment</Btn>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= EXECUTIVE COMMAND CENTER ================= */
