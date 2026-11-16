import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { NOMINEE_LIST, TRAINING } from '../data';
import { requestStatus, stageIndex, useDemo } from '../store';
import { Alert, Badge, Btn, Card, Empty, Field, inputCls, Kpi, PageHeader, Progress, Stepper, Table, Td } from '../components/ui';

export function DivisionDashboard() {
  const s = useDemo();
  const nav = useNavigate();
  return (
    <div>
      <PageHeader
        title="Division Learning Overview"
        sub="Corporate Banking Division · Farzana Haque"
        actions={<Btn onClick={() => nav('/division-head/training-request/new')}>Request Training</Btn>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Upcoming Trainings" value={s.scheduled ? 3 : 2} />
        <Kpi label="Mandatory Completion" value="92.4%" tone="ok" />
        <Kpi label="Competency Gaps" value="5" tone="warn" sub="Credit Analysis leads" />
        <Kpi label="Pending Requests" value={s.requestSubmitted && !s.scheduled ? 2 : 1} />
        <Kpi label="Team Learning Hours" value="1,284" sub="YTD" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Training requests">
          <Table head={['Request', 'Training', 'Status']}>
            {s.requestSubmitted ? (
              <tr><Td><b>TR-2026-00418</b></Td><Td>Advanced Credit Risk Management</Td><Td><Badge>{requestStatus(s)}</Badge></Td></tr>
            ) : null}
            <tr><Td><b>TR-2026-00377</b></Td><Td>Trade Finance Operations Update</Td><Td><Badge>Closed</Badge></Td></tr>
          </Table>
          {!s.requestSubmitted && <p className="mt-3 text-xs text-ink-3">No open request yet. Identified need: Credit Analysis gap of 2 levels across 32 officers.</p>}
        </Card>
        <Card title="Nomination requests">
          {s.nominationRequested ? (
            <div>
              <Alert kind="info" title="Nomination required: Advanced Credit Risk Management" action={<Btn size="sm" onClick={() => nav('/learning-champion/nominations')}>{s.nominationSubmitted ? 'View' : 'Nominate'}</Btn>}>Deadline 14 Nov 2026 · from HR Admin</Alert>
            </div>
          ) : <Empty title="No nomination requests" sub="HR will request nominations after a training is scheduled." />}
        </Card>
        <Card title="Top competency gaps in division" className="lg:col-span-2">
          {[['Credit Analysis', 62], ['Risk Awareness', 71], ['Digital Banking', 78]].map(([l, v]) => (
            <div key={l as string} className="mb-3 last:mb-0"><div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">{l}</span><span>{v}% at target level</span></div><Progress value={v as number} /></div>
          ))}
        </Card>
      </div>
    </div>
  );
}

const STEPS = ['Program', 'Trainer', 'Participants', 'Review'];

export function TrainingRequest() {
  const s = useDemo();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const d = s.draft;
  const dup = d.title.trim().toLowerCase() === 'advanced credit risk management';
  useEffect(() => {
    if (!d.title) return;
    setSaved(false);
    const t = setTimeout(() => setSaved(true), 700);
    return () => clearTimeout(t);
  }, [d]);

  if (s.requestSubmitted) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <div className="card anim-slide p-8 text-center">
          <CheckCircle2 size={44} className="mx-auto text-ok" />
          <h1 className="mt-3 text-xl font-extrabold">Request {TRAINING.requestId} submitted successfully.</h1>
          <p className="mt-1 text-[13px] text-ink-2">Status: <Badge>Pending HR Review</Badge> · routed to HR Admin, Learning &amp; Development</p>
          <div className="my-6 rounded-lg bg-canvas p-4 text-left text-[13px]">
            <div className="th mb-2">Next in the workflow</div>
            <div>HR Admin <b>reviews</b> the request and chooses Schedule Training, Forward, or Return for Information.</div>
          </div>
          <div className="flex justify-center gap-2">
            <Btn onClick={() => { s.setRole('hr'); nav('/hr/requests'); }}>Switch to HR Admin</Btn>
            <Btn v="secondary" onClick={() => nav('/division-head/dashboard')}>Back to dashboard</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader crumbs="Training · Requests" title="Create Training Request" sub="A sequential Request ID is generated when you save." actions={<span className="flex items-center gap-1.5 text-xs text-ink-3"><Save size={13} />{saved ? 'Draft autosaved' : d.title ? 'Saving…' : 'Autosave on'}</span>} />
      <div className="card mb-4 p-4"><Stepper steps={STEPS} current={step} /></div>
      <Card>
        {step === 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Training Title" hint={dup ? <span className="flex items-center gap-1 font-semibold text-warn"><AlertTriangle size={12} /> Similar title exists in Training Setup — you can link this request to the existing program.</span> : <span className="text-ink-3">Duplicate check runs against the Training Title master.</span>}>
                <input data-testid="tr-title" className={inputCls} value={d.title} onChange={(e) => s.setDraft({ title: e.target.value })} placeholder="e.g. Advanced Credit Risk Management" />
              </Field>
              <div className="mt-2"><button className="text-xs font-semibold text-brand hover:underline" onClick={() => s.setDraft({ title: TRAINING.title, justification: 'Credit Analysis gap of 2 levels across Relationship Managers and Credit Analysts; portfolio quality targets for FY2027 require uplift before Q1 lending cycle.' })}>Use suggested: Advanced Credit Risk Management (from competency gap)</button></div>
            </div>
            <Field label="Category"><select className={inputCls} value={d.category} onChange={(e) => s.setDraft({ category: e.target.value })}><option>Functional</option><option>Behavioural</option><option>Compliance</option><option>Leadership</option></select></Field>
            <Field label="Competency"><select className={inputCls} value={d.competency} onChange={(e) => s.setDraft({ competency: e.target.value })}><option>Credit Analysis</option><option>Risk Awareness</option><option>AML & Compliance</option><option>Leadership</option></select></Field>
            <Field label="Training Mode"><select className={inputCls} value={d.mode} onChange={(e) => s.setDraft({ mode: e.target.value })}><option>Classroom + Webinar</option><option>Classroom</option><option>Webinar</option><option>Foreign Programme</option></select></Field>
            <Field label="Training Medium"><select className={inputCls} value={d.medium} onChange={(e) => s.setDraft({ medium: e.target.value })}><option>Instructor-led</option><option>Blended</option><option>Self-paced</option></select></Field>
            <Field label="Date / Time"><input className={inputCls} value={d.dates} onChange={(e) => s.setDraft({ dates: e.target.value })} /></Field>
            <Field label="Duration / Man-hour"><input className={inputCls} value={d.duration} onChange={(e) => s.setDraft({ duration: e.target.value })} /></Field>
            <Field label="Suggested Venue" hint={<span className="font-semibold text-ok">● Available on 18–19 Nov 2026 (meeting-room system, simulated)</span>}>
              <select className={inputCls} value={d.venue} onChange={(e) => s.setDraft({ venue: e.target.value })}><option>City Bank Learning Center</option><option>Executive Training Room</option><option>Head Office Auditorium</option></select>
            </Field>
            <Field label="Tags"><div className="flex flex-wrap gap-1.5 rounded-lg border border-line px-2 py-1.5">{d.tags.map((t) => <Badge key={t} t="neutral">{t}</Badge>)}</div></Field>
            <Field label="Resource Material"><div className="rounded-lg border border-dashed border-line px-3 py-2 text-[13px] text-ink-3">Credit_Risk_Case_Pack_v3.pdf · 2.4 MB</div></Field>
            <div className="md:col-span-2"><Field label="Business Justification"><textarea rows={3} className={inputCls} value={d.justification} onChange={(e) => s.setDraft({ justification: e.target.value })} placeholder="Why does the division need this training?" /></Field></div>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Internal trainer (from HRIS)"><select className={inputCls}><option>Nafis Ahmed — Head of Credit Risk (CBL-05903)</option></select></Field>
            <Field label="External trainer"><select className={inputCls}><option>Dr. Farhan Chowdhury — Bangladesh Institute of Bank Management</option></select></Field>
            <div className="md:col-span-2 rounded-lg bg-canvas p-3 text-[13px] text-ink-2">Trainer availability checked against training calendar: <b className="text-ok">no clash</b> on 18–19 Nov 2026.</div>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Target audience"><input className={inputCls} defaultValue={TRAINING.audience} /></Field>
            <Field label="Proposed participants"><input type="number" className={inputCls} value={d.participants} onChange={(e) => s.setDraft({ participants: Number(e.target.value) })} /></Field>
            <div className="md:col-span-2 rounded-lg bg-canvas p-3 text-[13px] text-ink-2">Named nominations are collected later through HR&apos;s Nomination Request. Here you only propose headcount.</div>
          </div>
        )}
        {step === 3 && (
          <dl className="grid gap-x-8 gap-y-3 text-[13px] md:grid-cols-2">
            {[['Training', d.title || TRAINING.title], ['Category', d.category], ['Competency', d.competency], ['Mode', d.mode], ['Date / Time', d.dates], ['Duration', d.duration], ['Venue', d.venue], ['Trainer', d.trainer], ['Proposed participants', String(d.participants)], ['Tags', d.tags.join(', ')]].map(([k, v]) => (
              <div key={k}><dt className="th">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
            ))}
            <div className="md:col-span-2"><dt className="th">Business justification</dt><dd className="mt-0.5">{d.justification || '—'}</dd></div>
          </dl>
        )}
      </Card>
      <div className="mt-4 flex justify-between">
        <Btn v="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Btn>
        {step < 3 ? <Btn onClick={() => setStep(step + 1)}>Continue</Btn> : <Btn onClick={() => { s.submitRequest(); }}>Submit Request</Btn>}
      </div>
    </div>
  );
}

export function Nominations() {
  const s = useDemo();
  const nav = useNavigate();
  const [sel, setSel] = useState<Record<string, boolean>>(() => Object.fromEntries(NOMINEE_LIST.map((e) => [e.id, true])));
  const count = Object.values(sel).filter(Boolean).length;
  const attn = NOMINEE_LIST.filter((e) => e.eligibility !== 'Eligible' && sel[e.id]).length;
  if (!s.nominationRequested) {
    return (
      <div><PageHeader title="Nominations" sub="Nomination requests from HR appear here." />
        <Empty title="No nomination request open" sub={stageIndex(s) < 3 ? 'HR must first schedule the training and send a nomination request.' : 'Waiting for HR to request nominations.'} />
        {s.requestSubmitted && <div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => { s.setRole('hr'); nav('/hr/requests'); }}>Switch to HR Admin</Btn></div>}
      </div>
    );
  }
  return (
    <div>
      <PageHeader crumbs="Learning Champion" title="Nomination required: Advanced Credit Risk Management" sub="Deadline 14 Nov 2026 · Divisions: Corporate Banking, SME, Risk, Credit Administration · 18–19 Nov 2026" actions={s.nominationSubmitted ? <Badge t="ok">Nominations submitted</Badge> : <Btn disabled={count === 0} onClick={() => { s.submitNominations(); }}>Submit {count} Nominations</Btn>} />
      <div className="mb-4"><Alert kind="warn" title={`${attn} selected employee(s) need attention`}>Leave, calendar, training-overlap and separation data come from HRIS, Leave and Calendar systems (simulated). Conflicts are flagged, not blocked — HR Admin resolves them at finalisation.</Alert></div>
      <Card pad={false}>
        <Table head={['', 'Employee', 'Role', 'Division', 'Leave', 'Calendar', 'Eligibility']}>
          {NOMINEE_LIST.map((e) => (
            <tr key={e.id} className={e.eligibility !== 'Eligible' ? 'bg-warn-soft/40' : ''}>
              <Td><input aria-label={`Select ${e.name}`} type="checkbox" disabled={s.nominationSubmitted} checked={sel[e.id]} onChange={(ev) => setSel({ ...sel, [e.id]: ev.target.checked })} /></Td>
              <Td><div className="font-semibold">{e.name}</div><div className="text-[11px] text-ink-3">{e.eid}</div></Td>
              <Td>{e.role}</Td><Td>{e.division}</Td>
              <Td><Badge t={e.leave === 'Clear' ? 'ok' : 'warn'}>{e.leave}</Badge></Td>
              <Td><Badge t={e.calendar === 'Clear' ? 'ok' : 'brand'}>{e.calendar}</Badge></Td>
              <Td><div><Badge>{e.eligibility}</Badge></div>{e.issue && <div className="mt-1 text-[11px] text-ink-3">{e.issue}</div>}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      {s.nominationSubmitted && <div className="mt-4 flex justify-end"><Btn onClick={() => { s.setRole('hr'); nav('/hr/training/TRN-2026-00182/schedule'); }}>Switch to HR Admin to finalise participants</Btn></div>}
    </div>
  );
}
