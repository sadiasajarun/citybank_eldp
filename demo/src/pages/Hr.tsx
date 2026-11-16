import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Mail, MessageCircle, Smartphone, Bell, Calendar as Cal, Video } from 'lucide-react';
import { CONFLICT_IDS, INTEGRATIONS, NOMINEE_LIST, REQUEST_QUEUE, SADIA, TRAINING } from '../data';
import { requestStatus, roster, stageIndex, trainingStatus, useDemo } from '../store';
import type { Attendance } from '../types';
import { IntelligencePanel, NominationBoard } from './Hero';
import { AiLabel, Alert, Avatar, Badge, Btn, Card, Empty, Field, inputCls, Kpi, Modal, PageHeader, Table, Tabs, Td } from '../components/ui';

export function WithdrawalApproval() {
  const s = useDemo();
  if (s.withdrawal.status !== 'proposed') return null;
  const rep = s.withdrawal.replacementId === 'e4';
  return (
    <Alert
      kind="warn"
      title={rep ? 'Replacement approval required: Tanvir Hasan → Sadia Islam' : 'Withdrawal approval required: Tanvir Hasan'}
      action={<Btn size="sm" onClick={s.hrApproveWithdrawal}>{rep ? 'Approve replacement' : 'Approve withdrawal'}</Btn>}
    >
      Reason: {s.withdrawal.reason} · Supervisor Mahmud Karim has {rep ? 'approved with replacement' : 'approved'}. Maker-checker: final approval by Senior HR Admin is recorded in audit.
    </Alert>
  );
}

export function HrDashboard() {
  const s = useDemo();
  const nav = useNavigate();
  const pendingReq = s.requestSubmitted && !s.scheduleStarted;
  return (
    <div>
      <PageHeader title="Training Operations" sub="Nusrat Jahan · HR Admin, Learning & Development" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Incoming Requests" value={4 + (s.requestSubmitted ? 0 : -1)} />
        <Kpi label="Pending Approvals" value={5 + (pendingReq ? 1 : 0) + (s.withdrawal.status === 'proposed' ? 1 : 0)} tone="warn" />
        <Kpi label="Planned Training" value={s.scheduled ? 13 : 12} />
        <Kpi label="Attendance to Submit" value={s.invitesSent && !s.attendanceSubmitted ? 1 : 0} />
        <Kpi label="Learning Records Updated" value={s.attendanceSubmitted ? '+32' : '0'} tone={s.attendanceSubmitted ? 'ok' : undefined} />
      </div>
      <div className="mb-4 space-y-3">
        <WithdrawalApproval />
        {pendingReq && <Alert kind="info" title="New training request: TR-2026-00418" action={<Btn size="sm" onClick={() => nav('/hr/requests/TR-2026-00418')}>Open</Btn>}>Advanced Credit Risk Management · Corporate Banking · 32 participants</Alert>}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Pending approvals" className="lg:col-span-2" pad={false}>
          <Table head={['Item', 'Type', 'From', 'Status']}>
            {pendingReq && <tr><Td><b>TR-2026-00418</b></Td><Td>Training Request</Td><Td>Farzana Haque</Td><Td><Badge>Pending HR Review</Badge></Td></tr>}
            {s.withdrawal.status === 'proposed' && <tr><Td><b>Replacement</b></Td><Td>Withdrawal / Replacement</Td><Td>Mahmud Karim</Td><Td><Badge t="warn">Awaiting HR</Badge></Td></tr>}
            {[['Bond waiver · CBL-08123', 'Bond', 'Credit Admin'], ['Employee record: AML Cert', 'Employee-submitted record', 'Retail'], ['Foreign programme budget', 'Budget approval', 'Treasury'], ['Book request · Basel III Guide', 'Library', 'Risk'], ['Training postponement', 'Reschedule', 'SME']].map(([a, b, c]) => <tr key={a}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td><Td><Badge t="info">In queue</Badge></Td></tr>)}
          </Table>
        </Card>
        <Card title="Integration health" action={<button className="text-xs font-semibold text-brand" onClick={() => nav('/admin/integrations')}>Details</button>}>
          {['HRIS', 'Microsoft Teams', 'Outlook / Microsoft 365', 'SMS Gateway', 'SIEM / SOC', 'Power BI'].map((n) => (
            <div key={n} className="flex items-center justify-between py-1.5 text-[13px]"><span>{n}</span><span className="flex items-center gap-1.5 text-xs font-semibold text-ok"><span className="h-2 w-2 rounded-full bg-ok" />Connected</span></div>
          ))}
          <p className="mt-2 text-[10px] uppercase tracking-wide text-ink-3">Demo integration · simulated connected state</p>
        </Card>
      </div>
    </div>
  );
}

export function RequestInbox() {
  const s = useDemo();
  const nav = useNavigate();
  const rows = REQUEST_QUEUE.filter((r) => r.id !== 'TR-2026-00418' || s.requestSubmitted);
  return (
    <div>
      <PageHeader crumbs="Training · Requests" title="Incoming Training Requests" sub="Training Request Received window" />
      {!s.requestSubmitted && <div className="mb-4"><Alert kind="info" title="TR-2026-00418 has not been submitted yet" action={<Btn size="sm" onClick={() => { s.setRole('division_head'); nav('/division-head/training-request/new'); }}>Switch to Division Head</Btn>}>The Division Head's request will appear here instantly once submitted.</Alert></div>}
      <Card pad={false}>
        <Table head={['Request ID', 'Training', 'Division', 'Requested by', 'Proposed dates', 'Participants', 'Priority', 'Status']}>
          {rows.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-slate-50" onClick={() => nav(`/hr/requests/${r.id}`)}>
              <Td><b className="text-brand">{r.id}</b></Td><Td className="font-semibold">{r.title}</Td><Td>{r.division}</Td><Td>{r.by}</Td><Td>{r.dates}</Td><Td>{r.participants}</Td><Td><Badge>{r.priority}</Badge></Td>
              <Td><Badge>{r.id === 'TR-2026-00418' ? requestStatus(s) : 'Under Review'}</Badge></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

export function RequestDetail() {
  const { id } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const [modal, setModal] = useState<'forward' | 'return' | null>(null);
  const isHero = id === 'TR-2026-00418';
  const req = REQUEST_QUEUE.find((r) => r.id === id);
  if (!req || (isHero && !s.requestSubmitted)) return <Empty title="Request not available" sub="Submit the request as Division Head first." />;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader crumbs="Requests" title={<>{req.id} · {req.title}</>} sub={`Requested by ${req.by}, ${req.division}`} actions={isHero ? <Badge>{requestStatus(s)}</Badge> : <Badge>Under Review</Badge>} />
      <Card>
        <dl className="grid gap-x-8 gap-y-4 text-[13px] md:grid-cols-3">
          {([['Target audience', TRAINING.audience], ['Mode', TRAINING.mode], ['Proposed participants', String(req.participants)], ['Venue', TRAINING.venue], ['Trainer', TRAINING.trainer], ['Duration', TRAINING.duration], ['Category', TRAINING.category], ['Competency', TRAINING.competency], ['Tags', TRAINING.tags.join(', ')], ['Proposed dates', req.dates]] as [string, string][]).map(([k, v]) => (
            <div key={k}><dt className="th">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4 rounded-lg bg-canvas p-3 text-[13px]"><div className="th mb-1">Business justification</div>{s.draft.justification || 'Credit Analysis gap of 2 levels across Relationship Managers and Credit Analysts; portfolio quality targets for FY2027 require uplift before Q1 lending cycle.'}</div>
      </Card>
      <div className="mt-4 flex justify-end gap-2">
        <Btn v="secondary" onClick={() => setModal('return')}>Return for Information</Btn>
        <Btn v="secondary" onClick={() => setModal('forward')}>Forward</Btn>
        <Btn onClick={() => { if (isHero) s.startScheduling(); nav('/hr/training/TRN-2026-00182/schedule'); }} icon={<ArrowRight size={14} />}>Schedule Training</Btn>
      </div>
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'forward' ? 'Forward request' : 'Return for information'} footer={<><Btn v="secondary" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={() => setModal(null)}>{modal === 'forward' ? 'Forward' : 'Return'}</Btn></>}>
        <Field label={modal === 'forward' ? 'Forward to' : 'Information needed'}>
          {modal === 'forward' ? <select className={inputCls}><option>Senior HR Admin — Shahana Parvin</option><option>Budget Committee Secretariat</option></select> : <textarea rows={3} className={inputCls} placeholder="What should the Division Head clarify?" />}
        </Field>
      </Modal>
    </div>
  );
}

const SCHED_TABS = ['Program', 'Trainer', 'Participants', 'Notifications', 'Feedback', 'Undertaking / Bond', 'Review & Publish'];

export function Scheduling() {
  const s = useDemo();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(sp.get('tab') ?? 'Program');
  useEffect(() => { const t = sp.get('tab'); if (t) setTab(t); }, [sp]);
  const [nomModal, setNomModal] = useState(false);
  const [divs, setDivs] = useState<Record<string, boolean>>({ 'Corporate Banking': true, SME: true, Risk: true, 'Credit Administration': true });
  const [room, setRoom] = useState('Executive Training Room');

  useEffect(() => {
    if (s.requestSubmitted && !s.scheduleStarted) s.startScheduling();
  }, []);

  if (!s.requestSubmitted) {
    return <div><PageHeader title="Training Scheduling" /><Empty title="Nothing to schedule yet" sub="Schedule from an incoming request, or create a direct schedule." /><div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => { s.setRole('division_head'); nav('/division-head/training-request/new'); }}>Switch to Division Head to create the request</Btn></div></div>;
  }
  const conflict = room === 'Executive Training Room';
  const r = roster(s);
  const eligible = NOMINEE_LIST.filter((e) => e.eligibility === 'Eligible').length;
  const unresolved = CONFLICT_IDS.filter((id) => !s.resolutions[id]);

  return (
    <div>
      <PageHeader
        crumbs="Training · Scheduling"
        title={<>{TRAINING.title} <span className="ml-2 align-middle"><Badge>{s.scheduled ? trainingStatus(s) : 'Draft schedule'}</Badge></span></>}
        sub={<>Training ID <b>{TRAINING.trainingId}</b> generated · loaded from request {TRAINING.requestId}</>}
      />
      <Card pad={false}>
        <Tabs tabs={SCHED_TABS} value={tab} onChange={setTab} />
        <div className="p-5">
          {tab === 'Program' && (
            <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr_300px]">
              <div>
                <div className="th mb-3">Program configuration</div>
                <dl className="space-y-3 text-[13px]">
                  {([['Training ID', TRAINING.trainingId], ['Mode', TRAINING.mode], ['Category', TRAINING.category], ['Budget', TRAINING.budget], ['Approval No.', TRAINING.approvalNo], ['Organizer', TRAINING.organizer], ['Competency', TRAINING.competency]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-ink-3">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
                  ))}
                </dl>
                <div className="mt-4">
                  <Field label="Venue">
                    <select data-testid="venue-select" className={inputCls} value={room} onChange={(e) => { setRoom(e.target.value); if (e.target.value === 'Executive Training Room') s.showVenueConflict(); }}>
                      <option>Executive Training Room</option>
                      <option>City Bank Learning Center — Hall A</option>
                      <option>Head Office Auditorium</option>
                    </select>
                  </Field>
                </div>
              </div>
              <div>
                <div className="th mb-3">Schedule · 18–19 November 2026</div>
                <div className="grid grid-cols-[56px_1fr_1fr] overflow-hidden rounded-xl border border-line text-[12px]">
                  <span className="border-b border-line bg-canvas" /><span className="border-b border-l border-line bg-canvas px-3 py-2 font-bold">Wed 18 Nov</span><span className="border-b border-l border-line bg-canvas px-3 py-2 font-bold">Thu 19 Nov</span>
                  {['09:30', '10:00', '12:00', '14:00', '16:00'].map((t, i) => (
                    <div key={t} className="contents">
                      <span className="border-b border-line px-2 py-3 text-ink-3">{t}</span>
                      <span className="relative border-b border-l border-line p-1">{i === 1 && conflict && <span className="anim-slide block rounded-md bg-brand px-2 py-1.5 font-bold text-white">Booked · Executive Training Room 10:00–12:00</span>}{(i !== 1 || !conflict) && <span className="block rounded-md bg-ink/85 px-2 py-1.5 font-semibold text-white">{i === 0 ? TRAINING.title : 'Session ' + (i + 1)}</span>}</span>
                      <span className="border-b border-l border-line p-1"><span className="block rounded-md bg-ink/85 px-2 py-1.5 font-semibold text-white">{i === 3 ? 'Webinar · Dr. Farhan Chowdhury' : 'Session ' + (i + 6)}</span></span>
                    </div>
                  ))}
                </div>
                {conflict && (
                  <div className="mt-3"><Alert kind="brand" title="Venue conflict detected" action={<Btn size="sm" onClick={() => setRoom('City Bank Learning Center — Hall A')}>Use suggested room</Btn>}>Executive Training Room is already booked 10:00–12:00. Suggested: <b>City Bank Learning Center — Hall A</b>.</Alert></div>
                )}
                {!conflict && <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-ok"><CheckCircle2 size={15} /> {room} is available for both days.</p>}
              </div>
              <IntelligencePanel venueOk={!conflict} />
            </div>
          )}
          {tab === 'Trainer' && (
            <Table head={['Trainer', 'Type', 'Organisation', 'Sessions']}>
              <tr><Td><b>Nafis Ahmed</b></Td><Td><Badge t="info">Internal</Badge></Td><Td>City Bank · Head of Credit Risk</Td><Td>Day 1, Day 2 (morning)</Td></tr>
              <tr><Td><b>Dr. Farhan Chowdhury</b></Td><Td><Badge t="neutral">External</Badge></Td><Td>Bangladesh Institute of Bank Management</Td><Td>Day 2 (afternoon, webinar)</Td></tr>
            </Table>
          )}
          {tab === 'Participants' && (
            <div className="space-y-4">
              {!s.scheduled && <Alert kind="info" title="Publish the schedule first">Nominations are requested after the schedule is saved. Use the Review &amp; Publish tab.</Alert>}
              {s.scheduled && !s.nominationRequested && (
                <div className="grid place-items-center rounded-lg border border-dashed border-line py-10 text-center">
                  <p className="mb-3 text-[13px] text-ink-2">Ask divisions to nominate employees. Deadlines, email and nomination link are configurable.</p>
                  <Btn onClick={() => setNomModal(true)}>Request Nomination</Btn>
                </div>
              )}
              {s.nominationRequested && !s.nominationSubmitted && (
                <Alert kind="info" title="Waiting for nominations" action={<Btn size="sm" onClick={() => { s.setRole('division_head'); nav('/learning-champion/nominations'); }}>Switch to Division Head</Btn>}>Request sent to Corporate Banking, SME, Risk, Credit Administration. Deadline 14 Nov 2026.</Alert>
              )}
              {s.nominationSubmitted && !s.finalized && <NominationBoard mode="hr" />}
              {s.finalized && <WithdrawalApproval />}
              {s.finalized && (
                <Card title={`Participant roster · ${r.length}`} pad={false}>
                  <div className="max-h-96 overflow-y-auto">
                    <Table head={['Employee', 'Role', 'Division', 'Participation']}>
                      {r.map((e) => (
                        <tr key={e.id} className={e.id === 'e4' ? 'bg-ok-soft/40' : ''}><Td><b>{e.name}</b><div className="text-[11px] text-ink-3">{e.eid}</div></Td><Td>{e.role}</Td><Td>{e.division}</Td><Td>{s.participation[e.id] ? <Badge>{s.participation[e.id]}</Badge> : <Badge t="neutral">Not invited</Badge>}</Td></tr>
                      ))}
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          )}
          {tab === 'Notifications' && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                {[['Email', Mail], ['Outlook Calendar', Cal], ['SMS', Smartphone], ['WhatsApp', MessageCircle], ['Push Notification', Bell]].map(([l, I]) => {
                  const Icon = I as typeof Mail;
                  return <div key={l as string} className="flex items-center gap-2 rounded-lg border border-line p-3 text-[13px] font-semibold"><Icon size={16} className="text-brand" />{l as string}<span className="ml-auto h-2 w-2 rounded-full bg-ok" /></div>;
                })}
              </div>
              <div className="rounded-lg border border-line p-4 text-[13px]">
                <div className="th mb-2">Preview · Training invitation (supervisor in CC, PDF participant list attached)</div>
                <div className="font-semibold">Subject: Invitation — {TRAINING.title} · 18–19 November 2026</div>
                <p className="mt-2 text-ink-2">Dear Ayesha Rahman, you are nominated to attend {TRAINING.title} at {TRAINING.venue}, {TRAINING.dates}, {TRAINING.time}. Please accept or request withdrawal from your ELDP home page.</p>
                <p className="mt-2 text-xs text-ink-3">CC: Mahmud Karim (Supervisor) · Organizer: {TRAINING.organizer}</p>
              </div>
              {!s.finalized && <p className="text-[13px] text-ink-3">Finalize participants to send invitations.</p>}
              {s.finalized && !s.invitesSent && <div className="flex justify-end"><Btn onClick={s.sendInvites}>Send Invitations</Btn></div>}
              {s.invitesSent && (
                <div className="anim-slide rounded-lg border border-ok/30 bg-ok-soft p-4 text-[13px] font-semibold text-ok">
                  <div>✓ {r.length} participant invitations queued</div><div>✓ 2 trainer invitations queued</div><div>✓ Calendar events created</div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">Demo integration · no real messages are sent</div>
                </div>
              )}
            </div>
          )}
          {tab === 'Feedback' && (
            <div className="text-[13px]"><div className="th mb-2">Feedback template attached</div><ul className="space-y-1.5">{['Content Quality', 'Trainer Effectiveness', 'Relevance', 'Logistics', 'Open Comment'].map((q) => <li key={q} className="rounded border border-line px-3 py-2 font-semibold">{q}</li>)}</ul><p className="mt-3 text-xs text-ink-3">Feedback request is released to participants automatically after attendance is submitted.</p></div>
          )}
          {tab === 'Undertaking / Bond' && (
            <div className="max-w-xl text-[13px]"><Alert kind="info" title="Undertaking to Training: not required for this programme">Bond setup applies to foreign and high-cost programmes. Bond templates print on Legal paper and feed the Training Bond Database with remaining-liability calculation.</Alert></div>
          )}
          {tab === 'Review & Publish' && (
            <div>
              <dl className="mb-5 grid gap-x-8 gap-y-3 text-[13px] md:grid-cols-3">
                {([['Training ID', TRAINING.trainingId], ['Date', TRAINING.dates], ['Venue', conflict ? 'Executive Training Room (conflict!)' : room], ['Trainers', '2'], ['Budget', TRAINING.budget], ['Approval No.', TRAINING.approvalNo]] as [string, string][]).map(([k, v]) => <div key={k}><dt className="th">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>)}
              </dl>
              {conflict && <div className="mb-3"><Alert kind="brand" title="Resolve the venue conflict before publishing" /></div>}
              {s.scheduled ? <div className="rounded-lg border border-ok/30 bg-ok-soft p-3 text-[13px] font-semibold text-ok">✓ Scheduled · Request {TRAINING.requestId} status: Scheduled</div> : <Btn disabled={conflict} onClick={() => { s.publishSchedule(); setTab('Participants'); }}>Save &amp; Schedule Training</Btn>}
            </div>
          )}
        </div>
      </Card>

      <Modal open={nomModal} onClose={() => setNomModal(false)} title="Request Nomination" footer={<><Btn v="secondary" onClick={() => setNomModal(false)}>Cancel</Btn><Btn onClick={() => { s.sendNomination(); setNomModal(false); }}>Send Nomination Request</Btn></>}>
        <div className="space-y-4 text-[13px]">
          <div><div className="th mb-1.5">Participating divisions</div><div className="grid grid-cols-2 gap-2">{Object.keys(divs).map((d) => <label key={d} className="flex items-center gap-2 rounded border border-line px-3 py-2 font-semibold"><input type="checkbox" checked={divs[d]} onChange={(e) => setDivs({ ...divs, [d]: e.target.checked })} />{d}</label>)}</div></div>
          <Field label="Nomination deadline"><input className={inputCls} defaultValue="14 Nov 2026, 17:00" /></Field>
          <div className="rounded-lg bg-canvas p-3 text-xs"><div className="th mb-1">Email preview</div>Nomination required: {TRAINING.title}. Please nominate eligible employees using the link below by 14 Nov 2026.<div className="mt-1 text-brand">https://eldp.citybank.local/nominate/TRN-2026-00182</div></div>
        </div>
      </Modal>
    </div>
  );
}

const ATT: Attendance[] = ['Present', 'Absent', 'Late', 'Excused'];

export function AttendancePage() {
  const s = useDemo();
  const nav = useNavigate();
  const [added, setAdded] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const r = roster(s);
  if (!s.invitesSent) {
    return <div><PageHeader title="Planned Training · Attendance" /><Empty title="Attendance opens after invitations are sent" sub="Complete nomination, finalisation and invitation first." /><div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => nav('/hr/training/TRN-2026-00182/schedule')}>Open Scheduling Workspace</Btn></div></div>;
  }
  const marked = r.filter((e) => s.attendance[e.id]).length;
  const attended = r.filter((e) => s.attendance[e.id] === 'Present' || s.attendance[e.id] === 'Late').length;
  const pct = r.length ? ((attended / r.length) * 100).toFixed(1) : '0';
  const cost = 1440000;
  return (
    <div>
      <PageHeader
        crumbs="Planned Training · Attendance"
        title={<>{TRAINING.title} <Badge>{trainingStatus(s)}</Badge></>}
        sub={`${TRAINING.trainingId} · ${TRAINING.dates} · ${TRAINING.venue}`}
        actions={!s.attendanceSubmitted && <><Btn v="secondary" onClick={s.markAll}>Mark All Present</Btn><Btn v="secondary" onClick={() => setAdded(true)} disabled={added}>{added ? 'Participant added' : 'Add Participant'}</Btn><Btn v="secondary" onClick={() => setDrafted(true)}>{drafted ? 'Draft saved' : 'Save Draft'}</Btn><Btn disabled={marked === 0} onClick={s.submitAttendance}>Submit Attendance</Btn></>}
      />
      {s.attendanceSubmitted && (
        <div className="anim-slide mb-4 rounded-xl border border-ok/30 bg-ok-soft p-4">
          <div className="mb-3 text-[14px] font-bold text-ok">Employee learning records updated.</div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            {['Attendance', 'Learning History', 'Cost & Dashboard'].map((x, i) => <span key={x} className="flex items-center gap-2"><span className="rounded-lg bg-white px-3 py-1.5 shadow-sm">{x}</span>{i < 2 && <ArrowRight size={14} className="text-ok" />}</span>)}
            <Btn size="sm" className="ml-auto" onClick={() => { s.setRole('employee'); nav('/employee/learning-history'); }}>Open Employee Learning History</Btn>
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Roster · ${r.length} participants`} className="lg:col-span-2" pad={false}>
          <div className="max-h-[520px] overflow-y-auto">
            <Table head={['Participant', 'Role', 'Mode', 'Attendance']}>
              {r.map((e, i) => (
                <tr key={e.id} className={e.id === 'e4' ? 'bg-ok-soft/40' : ''}>
                  <Td><b>{e.name}</b><div className="text-[11px] text-ink-3">{e.eid}{e.id === 'e4' && ' · replacement'}</div></Td>
                  <Td>{e.role}</Td>
                  <Td><span className="text-xs text-ink-3">{i < 12 ? 'Online (Teams)' : 'In person'}</span></Td>
                  <Td>
                    {s.attendanceSubmitted ? <Badge>{s.attendance[e.id] ?? 'Absent'}</Badge> : (
                      <select aria-label={`Attendance ${e.name}`} className="rounded border border-line bg-white px-2 py-1 text-xs font-semibold" value={s.attendance[e.id] ?? ''} onChange={(ev) => s.mark(e.id, ev.target.value as Attendance)}>
                        <option value="">Select…</option>{ATT.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Online attendance source">
            <div className="flex items-center gap-2 text-[13px]"><Video size={16} className="text-brand" /><b>Teams / Zoom sync</b></div>
            <p className="mt-1 text-xs text-ink-3">Attendance report retrieved via Microsoft Graph (simulated).</p>
            <Btn size="sm" v="secondary" className="mt-3" disabled={s.attendanceSubmitted} onClick={s.syncOnline}>Sync online attendees</Btn>
            {marked >= 12 && !s.attendanceSubmitted && <p className="anim-slide mt-3 text-[13px] font-semibold text-ok">✓ 12 online attendees matched automatically.</p>}
          </Card>
          <Card title="Live summary">
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between"><span>Marked</span><b>{marked} / {r.length}</b></div>
              <div className="flex justify-between"><span>Attended</span><b>{attended}</b></div>
              <div className="flex justify-between"><span>Attendance rate</span><b>{pct}%</b></div>
            </div>
          </Card>
        </div>
      </div>
      {s.attendanceSubmitted && <CompletionPanel attended={attended} total={r.length} pct={pct} cost={cost} />}
    </div>
  );
}

function CompletionPanel({ attended, total, pct, cost }: { attended: number; total: number; pct: string; cost: number }) {
  const s = useDemo();
  const nav = useNavigate();
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-[17px] font-extrabold">Feedback &amp; Completion</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Feedback collection" action={<Badge t={s.feedbackSubmitted ? 'ok' : 'warn'}>{s.feedbackSubmitted ? 'Responses in' : 'Awaiting responses'}</Badge>}>
          {!s.feedbackSubmitted ? (
            <div><p className="text-[13px] text-ink-2">Feedback requests were released to {attended} attendees. Switch to an Employee to respond.</p><Btn className="mt-3" size="sm" v="secondary" onClick={() => { s.setRole('employee'); nav('/employee/feedback'); }}>Switch to Employee</Btn></div>
          ) : (
            <div className="anim-slide">
              <AiLabel />
              <div className="mt-3 grid grid-cols-3 gap-3 text-center"><div><div className="text-2xl font-extrabold text-ok">89%</div><div className="text-[11px] text-ink-3">Positive sentiment</div></div><div><div className="text-2xl font-extrabold">4.6</div><div className="text-[11px] text-ink-3">Feedback score / 5</div></div><div><div className="text-2xl font-extrabold">24</div><div className="text-[11px] text-ink-3">Responses</div></div></div>
              <ul className="mt-3 space-y-1 text-[13px]"><li>Most mentioned strength: <b>practical case studies</b></li><li>Common improvement theme: <b>session duration</b></li></ul>
              <p className="mt-2 text-[11px] text-ink-3">Highlighted phrases explain each label. L&amp;D reviews before publication.</p>
            </div>
          )}
        </Card>
        <Card title="Training completion">
          {s.completed ? (
            <div className="anim-slide grid grid-cols-2 gap-3 text-[13px]">
              {[['Participants', total], ['Attended', attended], ['Completion', `${pct}%`], ['Total cost', 'BDT 14,40,000'], ['Cost per participant', `BDT ${Math.round(cost / total).toLocaleString('en-IN')}`], ['Feedback score', '4.6 / 5'], ['Learning hours', `${attended * 16} h`], ['Training investment', 'BDT 14.4 lakh']].map(([k, v]) => <div key={k as string} className="rounded-lg bg-canvas p-3"><div className="th">{k}</div><div className="mt-0.5 text-[15px] font-extrabold">{v}</div></div>)}
              <Btn className="col-span-2" onClick={() => { s.setRole('hr'); nav('/hr/analytics'); }}>View Executive Dashboard</Btn>
            </div>
          ) : (
            <div><p className="text-[13px] text-ink-2">Complete the training to close request {TRAINING.requestId} and publish cost and learning-hour figures.</p><Btn className="mt-3" disabled={!s.feedbackSubmitted} onClick={s.complete}>Complete Training</Btn>{!s.feedbackSubmitted && <p className="mt-2 text-xs text-ink-3">Waiting for employee feedback.</p>}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function TrainingDatabase() {
  const s = useDemo();
  const nav = useNavigate();
  const done = s.attendanceSubmitted;
  return (
    <div>
      <PageHeader title="Training Database" sub="One learning record per employee — classroom, e-learning, exams and migrated history." actions={<Btn v="secondary" onClick={() => nav('/hr/analytics')}>Open dashboards</Btn>} />
      <Card pad={false}>
        <Table head={['Training ID', 'Programme', 'Dates', 'Participants', 'Cost', 'Status']}>
          {done && <tr className="anim-slide bg-ok-soft/40"><Td><b>TRN-2026-00182</b></Td><Td className="font-semibold">Advanced Credit Risk Management</Td><Td>18–19 Nov 2026</Td><Td>{roster(s).length}</Td><Td>BDT 14,40,000</Td><Td><Badge>Completed</Badge></Td></tr>}
          {[['TRN-2026-00171', 'AML & CFT Refresher', '03 Nov 2026', 118, 'BDT 8,20,000'], ['TRN-2026-00164', 'Customer Experience Excellence', '21 Oct 2026', 60, 'BDT 6,00,000'], ['TRN-2026-00155', 'Leadership Essentials for Managers', '08–09 Oct 2026', 36, 'BDT 11,50,000'], ['TRN-2026-00149', 'Sustainable Finance Fundamentals', '29 Sep 2026', 28, 'BDT 3,90,000']].map(([a, b, c, d, e]) => <tr key={a as string}><Td><b>{a}</b></Td><Td>{b}</Td><Td>{c}</Td><Td>{d}</Td><Td>{e}</Td><Td><Badge>Completed</Badge></Td></tr>)}
        </Table>
      </Card>
      <p className="mt-3 text-xs text-ink-3">Records migrated from the legacy training database are reconciled through the admin uploader (simulated).</p>
    </div>
  );
}

