import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, CheckCircle2, Clock, FileText, GraduationCap, MapPin, Star } from 'lucide-react';
import { NOMINEE_LIST, SADIA, TRAINING } from '../data';
import { roster, trainingStatus, useDemo } from '../store';
import { AiLabel, Alert, Avatar, Badge, Btn, Card, cx, Empty, Field, inputCls, Kpi, Modal, PageHeader, Progress, Table, Td } from '../components/ui';

const VIEWS = [
  { id: 'e1', name: 'Ayesha Rahman', title: 'Relationship Manager' },
  { id: 'e2', name: 'Tanvir Hasan', title: 'Credit Analyst' },
  { id: 'e4', name: 'Sadia Islam', title: 'Senior Credit Analyst' },
];

export function EmployeeDashboard() {
  const s = useDemo();
  const nav = useNavigate();
  const [wModal, setWModal] = useState(false);
  const [reason, setReason] = useState('Client meeting scheduled during training.');
  const [cal, setCal] = useState(false);
  const me = VIEWS.find((v) => v.id === s.employeeId)!;
  const part = s.participation[s.employeeId];
  const invited = s.invitesSent && part && part !== 'Withdrawn';
  const canWithdraw = s.employeeId === 'e2' && part === 'Invited';
  return (
    <div>
      <PageHeader title={`Good morning, ${me.name.split(' ')[0]}`} sub={`${me.title} · ${me.id === 'e4' ? 'Risk Management' : 'Corporate Banking'}`} actions={
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1 text-xs font-semibold" role="group" aria-label="Employee persona">
          {VIEWS.map((v) => <button key={v.id} onClick={() => s.setEmployee(v.id)} className={cx('rounded-md px-2.5 py-1', s.employeeId === v.id ? 'bg-brand text-white' : 'text-ink-2 hover:bg-slate-100')}>{v.name.split(' ')[0]}</button>)}
        </div>
      } />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Learning hours (YTD)" value={s.attendanceSubmitted && part === 'Attended' ? 76 : 60} />
        <Kpi label="Mandatory courses" value={s.courseCompleted ? '4 / 4' : '3 / 4'} tone={s.courseCompleted ? 'ok' : 'warn'} />
        <Kpi label="Certificates" value={s.courseCompleted ? 7 : 6} />
        <Kpi label="Upcoming exams" value={1} sub="AML Annual Certification" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Upcoming Learning">
            {!invited && part !== 'Withdrawn' && <Empty title="No upcoming instructor-led training" sub={s.scheduled ? 'You will see invitations here once HR sends them.' : 'Nothing scheduled for you yet.'} />}
            {part === 'Withdrawn' && <Alert kind="ok" title="Withdrawal approved — you are no longer a participant" >Sadia Islam has been confirmed as your replacement. Your supervisor and HR have been notified.</Alert>}
            {invited && (
              <div className="anim-slide rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[16px] font-extrabold">{TRAINING.title}</h3>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2"><span className="flex items-center gap-1.5"><Calendar size={14} />{TRAINING.dates}</span><span className="flex items-center gap-1.5"><MapPin size={14} />{TRAINING.venue}</span><span className="flex items-center gap-1.5"><Clock size={14} />{TRAINING.time}</span></div>
                  </div>
                  <Badge>{part}</Badge>
                </div>
                {s.employeeId === 'e4' && <p className="mt-2 text-xs font-semibold text-ok">You were added as a replacement participant.</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {part === 'Invited' && <Btn onClick={() => s.accept(s.employeeId)}>Accept</Btn>}
                  {canWithdraw && <Btn v="secondary" onClick={() => setWModal(true)}>Request Withdrawal</Btn>}
                  {s.employeeId !== 'e2' && part === 'Invited' && <Btn v="secondary" onClick={() => setWModal(true)}>Request Withdrawal</Btn>}
                  <Btn v="ghost" onClick={() => setCal(true)}>{cal ? '✓ Added to Outlook calendar' : 'Add to Calendar'}</Btn>
                  <Btn v="ghost" onClick={() => nav('/resources/knowledge')}>View Materials</Btn>
                </div>
                {(part === 'Withdrawal Requested' || part === 'Replacement Proposed') && <p className="mt-3 text-[13px] text-ink-2">Your withdrawal request is {part === 'Withdrawal Requested' ? 'with your supervisor' : 'awaiting HR approval'}.</p>}
                {s.attendanceSubmitted && part === 'Attended' && <p className="mt-3 text-[13px] font-semibold text-ok">✓ Attendance recorded · <button className="underline" onClick={() => nav('/employee/feedback')}>Give feedback</button></p>}
              </div>
            )}
          </Card>
          <Card title="Mandatory Learning" action={<Badge t={s.courseCompleted ? 'ok' : 'warn'}>{s.courseCompleted ? 'Completed' : 'Due in 8 days'}</Badge>}>
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><GraduationCap size={22} /></div>
              <div className="flex-1"><div className="text-[14px] font-bold">Information Security Awareness</div><div className="mb-1.5 text-xs text-ink-3">{s.courseCompleted ? 'Certificate issued' : 'Due in 8 days'} · {s.courseProgress}% Complete</div><Progress value={s.courseProgress} tone={s.courseCompleted ? 'ok' : 'brand'} /></div>
              <Btn onClick={() => nav('/learning/course/info-security-2026')}>{s.courseCompleted ? 'View Certificate' : 'Continue Learning'}</Btn>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Exams"><div className="text-[13px] font-bold">AML Annual Certification Assessment</div><div className="mb-3 text-xs text-ink-3">Proctored · 60 min · 30 Nov 2026</div><Btn size="sm" v="secondary" onClick={() => nav('/assessment/aml-certification')}>Open exam</Btn></Card>
          <Card title="Recommendations" action={<AiLabel>AI-assisted</AiLabel>}>
            <div className="text-[13px] font-bold">Advanced Credit Analysis</div>
            <div className="mt-1 text-xs text-ink-3">Why: role requirement · skill gap · previous learning history</div>
            <div className="mt-2 flex gap-2"><Btn size="sm" v="secondary">Dismiss</Btn><Btn size="sm" onClick={() => nav('/employee/journey')}>View journey</Btn></div>
          </Card>
          <Card title="Learning Journey"><div className="mb-1 text-[13px] font-bold">Credit Analysis · Level 4</div><div className="mb-2 text-xs text-ink-3">{s.journeyDone} of 5 complete</div><Progress value={(s.journeyDone / 5) * 100} /></Card>
        </div>
      </div>

      <Modal open={wModal} onClose={() => setWModal(false)} title="Request Withdrawal" footer={<><Btn v="secondary" onClick={() => setWModal(false)}>Cancel</Btn><Btn onClick={() => { if (s.employeeId === 'e2') s.requestWithdrawal(reason); setWModal(false); }}>Submit Request</Btn></>}>
        <Field label="Reason"><textarea data-testid="withdraw-reason" rows={3} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <p className="mt-2 text-xs text-ink-3">Your supervisor can approve, approve with a replacement, or reject. HR Admin gives final approval.</p>
      </Modal>
    </div>
  );
}

export function LearningHistory() {
  const s = useDemo();
  const nav = useNavigate();
  const part = s.participation[s.employeeId];
  const me = VIEWS.find((v) => v.id === s.employeeId)!;
  const att = s.attendanceSubmitted && part === 'Attended';
  return (
    <div>
      <PageHeader title="Learning History" sub={`${me.name} · one learning record across classroom, e-learning and exams`} actions={<div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1 text-xs font-semibold">{VIEWS.map((v) => <button key={v.id} onClick={() => s.setEmployee(v.id)} className={cx('rounded-md px-2.5 py-1', s.employeeId === v.id ? 'bg-brand text-white' : 'text-ink-2 hover:bg-slate-100')}>{v.name.split(' ')[0]}</button>)}</div>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total learning hours" value={att ? 76 : 60} tone={att ? 'ok' : undefined} sub={att ? '+16 h just recorded' : 'YTD'} />
        <Kpi label="Programmes attended" value={att ? 9 : 8} />
        <Kpi label="Courses completed" value={s.courseCompleted ? 12 : 11} />
        <Kpi label="Certificates" value={s.courseCompleted ? 7 : 6} />
      </div>
      <Card pad={false}>
        <Table head={['Date', 'Learning', 'Type', 'Hours', 'Result']}>
          {att && <tr className="anim-slide bg-ok-soft/50"><Td>18–19 Nov 2026</Td><Td><b>{TRAINING.title}</b><div className="text-[11px] text-ink-3">{TRAINING.trainingId} · just updated from attendance</div></Td><Td>Classroom + Webinar</Td><Td>16</Td><Td><Badge>Attended</Badge></Td></tr>}
          {s.courseCompleted && <tr className="anim-slide bg-ok-soft/50"><Td>12 Nov 2026</Td><Td><b>Annual Information Security Awareness 2026</b></Td><Td>e-Learning</Td><Td>3</Td><Td><Badge t="ok">Passed · Certified</Badge></Td></tr>}
          {[['03 Nov 2026', 'AML & CFT Refresher', 'Classroom', 8, 'Attended'], ['21 Oct 2026', 'Customer Experience Excellence', 'Classroom', 8, 'Attended'], ['09 Oct 2026', 'Leadership Essentials for Managers', 'Classroom', 16, 'Attended'], ['29 Sep 2026', 'Sustainable Finance Fundamentals', 'Webinar', 6, 'Attended'], ['14 Aug 2026', 'Credit Fundamentals', 'e-Learning', 4, 'Completed']].map(([a, b, c, d, e]) => <tr key={b as string}><Td>{a}</Td><Td className="font-semibold">{b}</Td><Td>{c}</Td><Td>{d}</Td><Td><Badge>{e as string}</Badge></Td></tr>)}
        </Table>
      </Card>
      {!att && <p className="mt-3 text-[13px] text-ink-3">Submit attendance as HR Admin to see {TRAINING.title} appear here instantly.</p>}
      <div className="mt-4"><Btn v="secondary" onClick={() => { s.setRole('hr'); nav('/hr/analytics'); }}>See impact on Executive Dashboard</Btn></div>
    </div>
  );
}

export function FeedbackPage() {
  const s = useDemo();
  const [r, setR] = useState<Record<string, number>>({});
  const qs = ['Content Quality', 'Trainer Effectiveness', 'Relevance', 'Logistics'];
  if (!s.attendanceSubmitted) return <div><PageHeader title="Feedback" /><Empty title="No feedback requests yet" sub="Feedback opens for participants after HR submits attendance." /></div>;
  if (s.feedbackSubmitted) return <div className="mx-auto max-w-lg pt-8"><div className="card anim-slide p-8 text-center"><CheckCircle2 size={44} className="mx-auto text-ok" /><h2 className="mt-3 text-lg font-extrabold">Thank you for your feedback</h2><p className="mt-1 text-[13px] text-ink-2">Your response for {TRAINING.title} has been recorded. HR sees aggregated, AI-assisted insight reviewed by L&amp;D.</p></div></div>;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Training Feedback" sub={`${TRAINING.title} · ${TRAINING.dates}`} />
      <Card>
        {qs.map((q) => (
          <div key={q} className="mb-4 flex items-center justify-between border-b border-line pb-4 last:border-0">
            <span className="text-[13px] font-semibold">{q}</span>
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${q} ${n} stars`} onClick={() => setR({ ...r, [q]: n })}><Star size={22} className={n <= (r[q] ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} /></button>)}</div>
          </div>
        ))}
        <Field label="Open Comment"><textarea rows={3} className={inputCls} defaultValue="The practical case studies were excellent. A third day would help." /></Field>
        <div className="mt-4 flex justify-end"><Btn disabled={Object.keys(r).length < qs.length} onClick={s.submitFeedback}>Submit Feedback</Btn></div>
        {Object.keys(r).length < qs.length && <p className="mt-2 text-right text-xs text-ink-3">Rate all four areas to submit.</p>}
      </Card>
    </div>
  );
}

export function SupervisorApprovals() {
  const s = useDemo();
  const nav = useNavigate();
  const [modal, setModal] = useState(false);
  const w = s.withdrawal;
  return (
    <div>
      <PageHeader title="Team Approvals" sub="Mahmud Karim · Head of Corporate Banking Unit" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Pending withdrawals" value={w.status === 'requested' ? 1 : 0} tone={w.status === 'requested' ? 'warn' : undefined} /><Kpi label="Mandatory completion" value="91.2%" /><Kpi label="Overdue learning" value="2" tone="brand" /><Kpi label="Team exams" value="3 upcoming" /></div>
      <Card title="Withdrawal & replacement requests" pad={false}>
        {w.status === 'none' ? (
          <div className="p-5"><Empty title="No pending withdrawal requests" sub="When a team member requests withdrawal from a training, it appears here." /><div className="mt-3 flex justify-center"><Btn v="secondary" size="sm" onClick={() => { s.setRole('employee'); s.setEmployee('e2'); nav('/employee/dashboard'); }}>Switch to Employee (Tanvir Hasan)</Btn></div></div>
        ) : (
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3"><Avatar name="Tanvir Hasan" size={40} /><div><div className="text-[14px] font-bold">Tanvir Hasan · Credit Analyst · CBL-09371</div><div className="text-xs text-ink-3">{TRAINING.title} · {TRAINING.dates}</div><div className="mt-2 rounded-lg bg-canvas p-2.5 text-[13px]"><span className="th">Reason</span><br />{w.reason}</div></div></div>
              <Badge>{w.status === 'requested' ? 'Withdrawal Requested' : w.status === 'proposed' ? (w.replacementId ? 'Replacement Proposed' : 'Approved') : w.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
            </div>
            {w.status === 'requested' && <div className="mt-4 flex gap-2"><Btn onClick={() => s.decideWithdrawal('approve')} v="secondary">Approve</Btn><Btn onClick={() => setModal(true)}>Approve with Replacement</Btn><Btn v="danger" onClick={() => s.decideWithdrawal('reject')}>Reject</Btn></div>}
            {w.status === 'proposed' && <Alert kind="ok" title={w.replacementId ? 'Replacement proposed: Sadia Islam' : 'Approved'}>Forwarded to HR Admin for final approval. <button className="font-semibold text-brand underline" onClick={() => { s.setRole('hr'); nav('/hr/dashboard'); }}>Switch to HR Admin</button></Alert>}
            {w.status === 'approved' && <Alert kind="ok" title="Roster updated">HR approved the replacement. Sadia Islam now has an invitation.</Alert>}
            {w.status === 'rejected' && <Alert kind="brand" title="Request rejected — Tanvir Hasan remains a participant" />}
          </div>
        )}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="Approve with Replacement" footer={<><Btn v="secondary" onClick={() => setModal(false)}>Cancel</Btn><Btn onClick={() => { s.decideWithdrawal('replace'); setModal(false); }}>Propose Sadia Islam</Btn></>}>
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-ok/30 bg-ok-soft p-3"><Avatar name={SADIA.name} /><div><div className="text-[13px] font-bold">{SADIA.name}</div><div className="text-xs text-ink-2">{SADIA.role} · {SADIA.division} · {SADIA.eid}</div></div></div>
        <div className="th mb-1.5">System checks</div>
        {['Leave: no leave on 18–19 Nov', 'Calendar: no meetings', 'Other training: no overlap', 'Eligibility: Credit Analysis requirement met'].map((c) => <div key={c} className="flex items-center gap-2 py-1 text-[13px]"><Check size={14} className="text-ok" />{c}</div>)}
        <p className="mt-2 text-[11px] text-ink-3">Checks use HRIS, leave and calendar integrations (simulated).</p>
      </Modal>
    </div>
  );
}

export function TeamLearning() {
  const rows = NOMINEE_LIST.slice(0, 3);
  return (
    <div><PageHeader title="Team Learning Status" sub="Mahmud Karim · direct reports" />
      <Card pad={false}><Table head={['Employee', 'Role', 'Mandatory', 'Overdue', 'Learning hours']}>
        {rows.map((e, i) => <tr key={e.id}><Td><b>{e.name}</b><div className="text-[11px] text-ink-3">{e.eid}</div></Td><Td>{e.role}</Td><Td><div className="w-32"><Progress value={[100, 75, 100][i]} tone={i === 1 ? 'brand' : 'ok'} /></div></Td><Td>{i === 1 ? <Badge t="brand">1 overdue</Badge> : <Badge t="ok">None</Badge>}</Td><Td>{[60, 44, 72][i]}</Td></tr>)}
      </Table></Card></div>
  );
}

export function TrainerDashboard() {
  const s = useDemo();
  const r = roster(s);
  return (
    <div>
      <PageHeader title="Trainer Dashboard" sub="Nafis Ahmed · Head of Credit Risk" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Kpi label="Upcoming sessions" value={s.scheduled ? 2 : 1} /><Kpi label="Participants (this programme)" value={s.invitesSent ? r.length : '—'} /><Kpi label="Evaluation tasks" value={3} tone="warn" /><Kpi label="Feedback score" value={s.feedbackSubmitted ? '4.6 / 5' : '4.5 / 5'} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Upcoming sessions">
          {s.scheduled ? <div className="anim-slide rounded-lg border border-line p-3"><div className="font-bold">{TRAINING.title}</div><div className="mt-1 text-[13px] text-ink-2">{TRAINING.dates} · {TRAINING.venue}</div><div className="mt-2 flex gap-2"><Badge>{trainingStatus(s)}</Badge><Badge t="info">Trainer invitation queued</Badge></div></div> : <Empty title="No assigned sessions yet" sub="Sessions appear when HR publishes the schedule." />}
        </Card>
        <Card title="Participant list" pad={false}>
          {s.invitesSent ? <div className="max-h-64 overflow-y-auto"><Table head={['Participant', 'Status']}>{r.slice(0, 12).map((e) => <tr key={e.id}><Td>{e.name}</Td><Td><Badge>{s.participation[e.id] ?? 'Invited'}</Badge></Td></tr>)}</Table></div> : <div className="p-4"><Empty title="Participant list not final" /></div>}
        </Card>
        <Card title="Evaluation tasks" className="lg:col-span-2"><div className="flex items-center gap-3 text-[13px]"><FileText size={16} className="text-brand" />AML Annual Certification — 1 essay response awaiting AI-assisted evaluation and 1 proctoring review.</div></Card>
      </div>
    </div>
  );
}
