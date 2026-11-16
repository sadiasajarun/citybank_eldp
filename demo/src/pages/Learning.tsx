import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Bookmark, Check, Download, Lock, PlayCircle, QrCode, Video } from 'lucide-react';
import { useDemo } from '../store';
import { AiLabel, Alert, Badge, Btn, Card, cx, Kpi, PageHeader, Progress, Table, Td } from '../components/ui';

const MODULES = ['Module 1 · Phishing & Social Engineering', 'Module 2 · Data Handling & Classification', 'Scenario Exercise', 'Assessment', 'Feedback', 'Certificate'];

export function CertificateCard({ name = 'Ayesha Rahman', course = 'Annual Information Security Awareness 2026' }: { name?: string; course?: string }) {
  return (
    <div className="anim-slide relative mx-auto max-w-2xl rounded-xl border-4 border-double border-brand/40 bg-white p-8 text-center shadow-lg">
      <img src="/brand/citybank-logo.png" alt="City Bank" className="mx-auto mb-2 h-16 w-auto" />
      <div className="text-[11px] font-bold uppercase tracking-[.25em] text-ink-3">City Bank PLC · Learning &amp; Development</div>
      <h2 className="mt-3 text-2xl font-extrabold">Certificate of Completion</h2>
      <p className="mt-4 text-[13px] text-ink-2">This is to certify that</p>
      <div className="mt-1 text-3xl font-extrabold text-brand">{name}</div>
      <p className="mt-3 text-[13px] text-ink-2">has successfully completed</p>
      <div className="text-lg font-bold">{course}</div>
      <div className="mt-1 text-xs text-ink-3">Issued 12 November 2026 · Valid until 12 November 2027</div>
      <div className="mt-6 flex items-end justify-between">
        <div className="text-left"><div className="mb-1 h-px w-40 bg-ink-3" /><div className="text-[11px] text-ink-3">Digital signature (placeholder)<br />Head of Learning &amp; Development</div></div>
        <div className="text-center"><QrCode size={56} className="mx-auto" /><div className="text-[10px] text-ink-3">Scan to verify · CERT-2026-088412</div></div>
      </div>
    </div>
  );
}

export function CoursePlayer() {
  const s = useDemo();
  const [mod, setMod] = useState(s.courseCompleted ? 5 : 2);
  const [tab, setTab] = useState(false);
  const nav = useNavigate();
  const [mark, setMark] = useState(false);
  const done = s.courseCompleted;
  return (
    <div>
      <PageHeader title="Annual Information Security Awareness 2026" sub="Mandatory · All employees · Deadline 20 Nov 2026 · Refresher every 12 months · Assessment + certificate required" actions={<Badge t={done ? 'ok' : 'warn'}>{done ? 'Completed' : 'In Progress'}</Badge>} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_260px]">
        <Card title="Course modules" pad={false}>
          <ul>
            {MODULES.map((m, i) => {
              const locked = !done && i > Math.max(2, mod) && i > 2;
              return (
                <li key={m}><button disabled={locked} onClick={() => setMod(i)} className={cx('flex w-full items-center gap-2.5 border-b border-line px-4 py-3 text-left text-[13px] font-medium last:border-0', mod === i && 'bg-brand-soft')}>
                  <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold', i < mod || done ? 'bg-ok text-white' : mod === i ? 'bg-brand text-white' : 'bg-slate-100 text-ink-3')}>{i < mod || done ? <Check size={11} /> : locked ? <Lock size={10} /> : i + 1}</span>{m}</button></li>
              );
            })}
          </ul>
          <div className="p-3 text-[11px] text-ink-3">Mandatory sequence enforced</div>
        </Card>
        <div>
          {done && mod === 5 ? <CertificateCard /> : mod === 3 ? (
            <Card title="Assessment · pass mark 80%"><p className="mb-3 text-[13px]">10 questions · 2 attempts · Time limit 15 min</p><div className="rounded-lg bg-canvas p-4 text-[13px]"><b>Q1.</b> You receive an email from “IT Helpdesk” asking you to confirm your password via link. What do you do?<div className="mt-2 space-y-1.5">{['Click and comply', 'Report to the Information Security desk', 'Forward to colleagues'].map((o, i) => <label key={o} className="flex items-center gap-2"><input type="radio" name="q1" defaultChecked={i === 1} />{o}</label>)}</div></div><Btn className="mt-4" onClick={() => setMod(4)}>Submit Assessment · Score 90%</Btn></Card>
          ) : mod === 4 ? (
            <Card title="Course feedback"><p className="mb-3 text-[13px]">How relevant was this course to your role?</p><div className="flex gap-1 text-2xl text-amber-400">★★★★★</div><Btn className="mt-4" onClick={() => { s.completeCourse(); setMod(5); }}>Submit Feedback &amp; Get Certificate</Btn></Card>
          ) : (
            <div className="card overflow-hidden">
              <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-ink to-slate-700 text-white">
                <div className="text-center"><PlayCircle size={64} className="mx-auto opacity-90" /><div className="mt-2 text-sm font-semibold">{MODULES[mod]}</div><div className="text-xs text-white/60">Video · HLS adaptive · protected content (watermark: CBL-10482)</div></div>
                <div className="absolute bottom-3 left-3 right-3"><Progress value={s.courseProgress} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-line p-3 text-xs">
                {['Resume 12:40', 'Auto quality 720p', 'Subtitles: English / বাংলা', 'Speed 1.0x', 'Seek restriction on'].map((c) => <span key={c} className="rounded border border-line px-2 py-1 font-semibold text-ink-2">{c}</span>)}
                <button onClick={() => setMark(!mark)} className="ml-auto flex items-center gap-1 font-semibold text-ink-2 hover:text-brand"><Bookmark size={14} className={mark ? 'fill-brand text-brand' : ''} />Bookmark</button>
              </div>
              <div className="border-t border-line p-3"><Btn onClick={() => { s.setCourseProgress(Math.min(90, s.courseProgress + 10)); if (mod < 3) setMod(mod + 1); }}>Mark module complete &amp; continue</Btn></div>
            </div>
          )}
          {done && <div className="mt-3 flex gap-2"><Btn icon={<Download size={14} />}>Download</Btn><Btn v="secondary" onClick={() => nav('/employee/certificates')}>View all certificates</Btn></div>}
          {done && <div className="mt-3"><Alert kind="ok" title="Completion updated across ELDP">Employee dashboard, manager dashboard and compliance reporting now show this course as completed.</Alert></div>}
        </div>
        <div className="space-y-4">
          <Card title="Progress"><div className="mb-1 text-2xl font-extrabold">{s.courseProgress}%</div><Progress value={s.courseProgress} tone={done ? 'ok' : 'brand'} /><div className="mt-3 space-y-1.5 text-[13px]"><div className="flex justify-between"><span>Time spent</span><b>1h 42m</b></div><div className="flex justify-between"><span>Offline available</span><b className="text-ok">Downloaded</b></div></div></Card>
          <Card title="Resources"><ul className="space-y-1.5 text-[13px]"><li className="flex items-center gap-2"><Video size={14} />Module summary (PDF)</li><li className="flex items-center gap-2"><Award size={14} />Information Security Policy v4.2</li></ul></Card>
        </div>
      </div>
    </div>
  );
}

const QTYPES = ['MCQ', 'True / False', 'Essay', 'Case Study', 'Image Question', 'Matching', 'Drag & Drop'];

export function ExamPage() {
  const s = useDemo();
  const [tab, setTab] = useState<'setup' | 'exam' | 'proctor' | 'eval'>('setup');
  const [q, setQ] = useState(1);
  const [flag, setFlag] = useState<Record<number, boolean>>({});
  const tabs = [['setup', 'Exam Setup'], ['exam', 'Employee Exam'], ['proctor', 'Proctoring Review'], ['eval', 'Evaluation']] as const;
  return (
    <div>
      <PageHeader title="AML Annual Certification Assessment" sub="Question bank · proctored · results feed the employee learning record" />
      <div className="mb-4 flex gap-1 rounded-lg border border-line bg-white p-1 text-[13px] font-semibold w-fit">{tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('rounded-md px-3 py-1.5', tab === k ? 'bg-brand text-white' : 'text-ink-2 hover:bg-slate-100')}>{l}</button>)}</div>
      {tab === 'setup' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Configuration" className="lg:col-span-2"><dl className="grid grid-cols-2 gap-4 text-[13px] md:grid-cols-3">{[['Question bank', 'AML & CFT · 420 questions'], ['Difficulty mix', '30% E · 50% M · 20% H'], ['Randomization', 'Questions + options'], ['Passing score', '70%'], ['Negative marking', '0.25 per wrong MCQ'], ['Attempts', '2'], ['Time limit', '60 minutes'], ['Result release', 'After evaluation'], ['Proctoring', 'Webcam · face verification · tab detection']].map(([k, v]) => <div key={k}><dt className="th">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>)}</dl></Card>
          <Card title="Question types"><div className="flex flex-wrap gap-1.5">{QTYPES.map((t) => <Badge key={t} t="neutral">{t}</Badge>)}</div></Card>
        </div>
      )}
      {tab === 'exam' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Card title={`Question ${q} of 20`} action={<span className="font-mono text-sm font-bold text-brand">42:18</span>}>
            <div className="mb-4 grid grid-cols-5 gap-2 rounded-lg bg-canvas p-3 md:grid-cols-5">{['Camera ✓', 'Identity ✓', 'Browser ✓', 'Connection ✓', 'Rules accepted ✓'].map((c) => <span key={c} className="text-[11px] font-semibold text-ok">{c}</span>)}</div>
            <p className="text-[14px] font-semibold">A customer deposits BDT 9,50,000 in cash in three same-day transactions just below the reporting threshold. This is best described as:</p>
            <div className="mt-3 space-y-2 text-[13px]">{['Normal customer behaviour', 'Structuring — file a Suspicious Transaction Report', 'A currency conversion issue', 'Only reportable if the customer is a PEP'].map((o, i) => <label key={o} className="flex items-center gap-2 rounded-lg border border-line p-3 hover:bg-slate-50"><input type="radio" name="o" defaultChecked={i === 1} />{o}</label>)}</div>
            <div className="mt-4 flex items-center justify-between"><span className="text-xs text-ink-3">Autosaved a few seconds ago</span><div className="flex gap-2"><Btn v="secondary" onClick={() => setFlag({ ...flag, [q]: !flag[q] })}>{flag[q] ? 'Unflag' : 'Flag question'}</Btn><Btn v="secondary" disabled={q === 1} onClick={() => setQ(q - 1)}>Previous</Btn><Btn onClick={() => q < 20 ? setQ(q + 1) : s.setExam('submitted')}>{q < 20 ? 'Next' : 'Submit'}</Btn></div></div>
          </Card>
          <Card title="Navigation"><div className="grid grid-cols-5 gap-1.5">{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => setQ(n)} className={cx('h-8 rounded text-xs font-bold', n === q ? 'bg-brand text-white' : flag[n] ? 'bg-warn-soft text-warn' : n < q ? 'bg-ok-soft text-ok' : 'bg-slate-100 text-ink-2')}>{n}</button>)}</div><div className="mt-3"><Progress value={(q / 20) * 100} /></div><Btn className="mt-3 w-full" onClick={() => { s.setExam('submitted'); setTab('proctor'); }}>Submit exam</Btn></Card>
        </div>
      )}
      {tab === 'proctor' && (
        <Card title="Proctoring panel · Candidate: Ayesha Rahman" action={<Badge t={s.proctorFlag === 'Review Required' ? 'warn' : s.proctorFlag === 'Cleared' ? 'ok' : 'brand'}>{s.proctorFlag}</Badge>}>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Kpi label="Tab switch" value={2} tone="warn" /><Kpi label="Face not visible" value={1} tone="warn" /><Kpi label="Look-away count" value={6} tone="warn" /><Kpi label="Copy attempt" value={0} tone="ok" /></div>
          <div className="mb-3"><Alert kind="info" title="No automatic failure by AI">Flags and evidence are for human review only. The evaluator decides.</Alert></div>
          <div className="flex gap-2"><Btn onClick={() => s.setProctor('Cleared')}>Clear</Btn><Btn v="danger" onClick={() => s.setProctor('Flagged')}>Flag</Btn><Btn v="secondary">Add Note</Btn></div>
        </Card>
      )}
      {tab === 'eval' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Objective questions"><div className="text-3xl font-extrabold text-ok">34 / 40</div><p className="text-[13px] text-ink-2">Auto-scored: MCQ, True/False, matching, drag &amp; drop.</p></Card>
          <Card title="Descriptive answer · Q9 (10 marks)" action={<AiLabel>AI-assisted — trainer decides</AiLabel>}>
            <p className="rounded-lg bg-canvas p-3 text-[13px] italic">“Structuring involves splitting transactions to avoid reporting thresholds; the bank must file an STR, preserve records and avoid tipping off…”</p>
            <div className="mt-3 text-[13px]"><b>Suggested score: 7 / 10</b><br />Rationale: Candidate covered 4 of 5 rubric concepts.</div>
            <div className="mt-3 text-[13px]">Final: <b>{s.aiScore.score} / 10</b> {s.aiScore.state !== 'suggested' && <Badge t="ok">{s.aiScore.state} · logged</Badge>}</div>
            <div className="mt-3 flex gap-2"><Btn onClick={() => s.setAi('accepted', 7)}>Accept</Btn><Btn v="secondary" onClick={() => s.setAi('adjusted', 8)}>Adjust to 8</Btn></div>
            <p className="mt-2 text-[11px] text-ink-3">Overrides are auditable with justification.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

const MATRIX = [['Communication', 4, 4], ['Relationship Management', 3, 4], ['Credit Analysis', 2, 4], ['AML', 4, 4], ['Leadership', 2, 3]] as const;

export function Competencies() {
  const nav = useNavigate();
  const s = useDemo();
  return (
    <div>
      <PageHeader title="Competency Matrix · Relationship Manager Development" sub="Target competency: Credit Analysis — Level 4 · Current level: Level 2" actions={<Btn onClick={() => { nav('/employee/journey'); }}>Create Learning Journey</Btn>} />
      <Card pad={false}><Table head={['Competency', 'Current', 'Target', 'Gap', '']}>
        {MATRIX.map(([n, c, t]) => <tr key={n} className={t - c >= 2 ? 'bg-brand-soft/50' : ''}><Td><b>{n}</b></Td><Td>{c}/{t === 3 ? 3 : 4}</Td><Td>{t}</Td><Td>{t - c === 0 ? <Badge t="ok">None</Badge> : <Badge t={t - c >= 2 ? 'brand' : 'warn'}>Gap = {t - c} level{t - c > 1 ? 's' : ''}</Badge>}</Td><Td><div className="w-40"><Progress value={(c / t) * 100} tone={t - c === 0 ? 'ok' : 'brand'} /></div></Td></tr>)}
      </Table></Card>
      <p className="mt-3 text-[13px] font-semibold text-brand">Credit Analysis: Gap = 2 levels · {s.journeyDone} of 5 journey steps complete</p>
    </div>
  );
}

const PATH = ['Credit Fundamentals', 'Advanced Financial Analysis', 'Credit Risk Workshop', 'Case Study Assessment', 'Final Competency Review'];

export function Journey() {
  const s = useDemo();
  const role = s.role;
  return (
    <div>
      <PageHeader title="Learning Journey · Credit Analysis Level 4" sub={`Relationship Manager Development · ${s.journeyDone} of 5 Complete`} actions={<AiLabel>AI-suggested path — approved by L&D</AiLabel>} />
      <Card>
        <div className="flex flex-col gap-0 md:flex-row md:items-start">
          {PATH.map((p, i) => {
            const done = i < s.journeyDone; const cur = i === s.journeyDone;
            return (
              <div key={p} className="flex flex-1 items-start md:flex-col md:items-center">
                <div className="flex items-center md:w-full"><span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold', done ? 'bg-ok text-white' : cur ? 'bg-brand text-white anim-pulse' : 'bg-slate-200 text-ink-3')}>{done ? <Check size={16} /> : i + 1}</span>{i < 4 && <span className={cx('hidden h-0.5 flex-1 md:block', done ? 'bg-ok' : 'bg-line')} />}</div>
                <div className="ml-3 pb-6 md:ml-0 md:mt-2 md:pb-0 md:pr-3"><div className="text-[13px] font-bold">{p}</div><div className="text-xs text-ink-3">{done ? 'Complete' : cur ? 'Current milestone' : 'Locked'}</div></div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2"><Btn disabled={s.journeyDone >= 5} onClick={() => s.setJourney(s.journeyDone + 1)}>Complete next step (demo)</Btn><Btn v="secondary" onClick={() => s.setJourney(2)}>Reset journey</Btn></div>
      </Card>
      {role !== 'employee' && (
        <div className="mt-4 grid gap-3 md:grid-cols-4"><Kpi label="Progress" value={`${s.journeyDone}/5`} /><Kpi label="Overdue items" value={0} tone="ok" /><Kpi label="Next milestone" value={PATH[Math.min(s.journeyDone, 4)]} /><Kpi label="Competency movement" value={s.journeyDone >= 5 ? 'L2 → L4' : s.journeyDone >= 3 ? 'L2 → L3' : 'L2'} tone="ok" /></div>
      )}
    </div>
  );
}

export function Certificates() {
  const s = useDemo();
  return (
    <div><PageHeader title="Certificates" sub="Verifiable with QR code" />
      {s.courseCompleted ? <CertificateCard /> : <Card><p className="text-[13px] text-ink-2">Complete Information Security Awareness to issue a new certificate.</p></Card>}
      <Card className="mt-4" title="Earlier certificates" pad={false}><Table head={['Certificate', 'Issued', 'Expiry']}>{[['AML & CFT Refresher 2025', 'Nov 2025', 'Nov 2026'], ['Code of Conduct 2026', 'Mar 2026', 'Mar 2027'], ['Credit Fundamentals', 'Aug 2026', '—']].map(([a, b, c]) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td></tr>)}</Table></Card>
    </div>
  );
}
