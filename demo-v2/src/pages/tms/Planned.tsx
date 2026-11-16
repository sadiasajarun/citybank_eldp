import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Upload, X } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendedIds, roster, trainingStatus, useDemo } from '../../store';
import { findById } from '../../org';
import { FactGroup, NotYet, PageHead, Section } from '../../components/Templates';
import { DataTable, type Column } from '../../components/DataTable';
import { AiLabel, Alert, Badge, Btn, cx, Drawer, Field, inputCls, Modal, Tabs } from '../../components/ui';
import { FrRef, SourceTag } from '../../components/Source';

type Kind = 'Reschedule' | 'Postpone' | 'Delete';
interface Row { id: string; title: string; venue: string; from: string; to: string; organizedBy: string; status: string; story: boolean; trainer: string; participants: number; attended: number | null; medium: string; mode: string }

const TONE: Record<string, string> = { Scheduled: 'info', 'Invitation Sent': 'info', Rescheduled: 'info', Today: 'warn', Completed: 'ok', Postponed: 'warn', Deleted: 'neutral' };
const num = (v: string) => Number(v.replace(/[,\s]/g, ''));
const AMOUNT = /^[\d,]+(\.\d{1,2})?$/;
const bdt = (n: number) => `BDT ${Math.round(n).toLocaleString('en-IN')}`;
const TABS = ['Training Details', 'Feedback review', 'Budget & Expense'];
const THEMES = [
  { id: 'strength', label: 'Strength', text: 'Practical case studies from real Corporate Banking credit files.' },
  { id: 'improve', label: 'Improve', text: 'Two days felt short for the portfolio exercise; consider a third half-day.' },
  { id: 'trainer', label: 'Trainers', text: 'Clear explanations; the regulatory webinar segment was rated highest.' },
  { id: 'logistics', label: 'Logistics', text: 'Hall A and the webinar link worked well; lunch break ran late on Day 1.' },
];

export function PlannedTraining() {
  const s = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState<string | null>(s.scheduled ? TRAINING.trainingId : null);
  const [tab, setTab] = useState(TABS[0]);
  const [action, setAction] = useState<Kind | null>(null);
  const [tried, setTried] = useState(false);
  const [themes, setThemes] = useState<Record<string, boolean>>({ strength: true, improve: true, trainer: true, logistics: false });
  const [themesApproved, setThemesApproved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const r = roster(s);
  const attended = s.attendanceSubmitted ? attendedIds(s).length : 0;
  const storyStatus = s.completed ? 'Completed' : s.planned.status !== 'Scheduled' ? s.planned.status : trainingStatus(s);

  const rows: Row[] = useMemo(() => {
    const prog: Row[] = s.programmes.map((p) => ({
      id: p.id, title: p.title, venue: p.venue, from: p.date, to: p.date, organizedBy: p.mode === 'In-house' ? 'City Bank L&D' : 'City Bank L&D with partner institute',
      status: p.status, story: false, trainer: p.trainer, participants: p.participants, attended: p.attended, medium: p.medium, mode: p.mode,
    }));
    const story: Row[] = s.scheduled ? [{
      id: TRAINING.trainingId, title: TRAINING.title, venue: TRAINING.venue, from: '18 Nov 2026', to: '19 Nov 2026', organizedBy: TRAINING.organizedBy, status: storyStatus, story: true,
      trainer: s.sched.trainers.map((t) => t.name).join(', '), participants: r.length, attended: s.attendanceSubmitted ? attended : null, medium: TRAINING.medium, mode: TRAINING.mode,
    }] : [];
    return [...story, ...prog];
  }, [s.programmes, s.scheduled, storyStatus, r.length, attended, s.attendanceSubmitted, s.sched.trainers]);

  const prog = rows.find((x) => x.id === open && !x.story) ?? null;
  const storyOpen = open === TRAINING.trainingId;
  const viewEdit = (row: Row) => {
    setOpen(row.id);
    if (row.story) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const columns: Column<Row>[] = [
    { key: 'id', header: 'Training ID', sort: (x) => x.id, render: (x) => <span className="font-semibold tabular-nums">{x.id}</span> },
    { key: 'title', header: 'Training Name', sort: (x) => x.title, render: (x) => <div><div className="font-semibold">{x.title}</div>{x.story && <div className="text-[14px] text-ink-3">The guided example training</div>}</div> },
    { key: 'venue', header: 'Venue', render: (x) => x.venue },
    { key: 'from', header: 'From Date', render: (x) => <span className="whitespace-nowrap">{x.from}</span> },
    { key: 'to', header: 'To Date', render: (x) => <span className="whitespace-nowrap">{x.to}</span> },
    { key: 'org', header: 'Organized By', render: (x) => x.organizedBy },
    { key: 'status', header: 'Status', filter: (x) => x.status, render: (x) => <Badge t={TONE[x.status] ?? 'neutral'}>{x.status}</Badge> },
    { key: 'act', header: '', render: (x) => <Btn v="link" onClick={() => viewEdit(x)}>View and Edit</Btn> },
  ];

  /* ---------------- Budget & Expense (FR 135) ---------------- */
  const p = s.planned;
  const approvalNo = p.approvalNo || (s.budgetApproved ? TRAINING.approvalNo : '');
  const fieldErr = {
    approvalNo: !approvalNo.trim() ? 'Approval no. is mandatory. Enter 000 if the training has no budget approval.' : '',
    budgetApproved: !p.budgetApproved.trim() ? 'Budget approved is mandatory. Enter 000 if there is no budget.' : !AMOUNT.test(p.budgetApproved.trim()) ? 'Enter an amount in BDT, digits and commas only.' : '',
    paymentNo: !p.paymentNo.trim() ? 'Payment no. is mandatory. Enter 000 if no payment was made.' : '',
    actualExpense: !p.actualExpense.trim() ? 'Actual expense is mandatory. Enter 000 if there was no expense.' : !AMOUNT.test(p.actualExpense.trim()) ? 'Enter an amount in BDT, digits and commas only.' : '',
  };
  const budgetValid = Object.values(fieldErr).every((x) => !x);
  const missingCount = Object.values(fieldErr).filter(Boolean).length;
  const err = (k: keyof typeof fieldErr) => (tried && fieldErr[k] ? <span className="text-brand">{fieldErr[k]}</span> : undefined);
  const budget = num(p.budgetApproved) || 0;
  const actual = num(p.actualExpense) || 0;
  const perHead = attended ? actual / attended : 0;
  const variance = budget - actual;

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const names = [...files].map((f) => f.name).filter((n) => !p.docs.includes(n));
    if (!names.length) return;
    s.setPlanned({ docs: [...p.docs, ...names] });
    s.logEvent('hr', 'Training document uploaded', `${names.join(', ')} · training ${TRAINING.trainingId} (simulated storage, FR 135)`);
  };
  const removeDoc = (n: string) => {
    s.setPlanned({ docs: p.docs.filter((d) => d !== n) });
    s.logEvent('hr', 'Training document removed', `${n} · training ${TRAINING.trainingId}`);
  };
  const save = () => {
    setTried(true);
    if (!budgetValid) { setTab('Budget & Expense'); return; }
    if (!p.approvalNo && approvalNo) s.setPlanned({ approvalNo });
    s.savePlanned();
    useDemo.setState({ toast: 'Planned training saved' });
  };
  const fillFromRecords = () => {
    s.setPlanned({ approvalNo, paymentNo: p.paymentNo || 'PAY-2026-3381', actualExpense: p.actualExpense || '13,86,500', docs: p.docs.length ? p.docs : ['Finance_Approval_FIN-APP-2026-0771.pdf', 'BIBM_Invoice_2211.pdf'] });
    s.logEvent('hr', 'Expense details pulled', 'Payment PAY-2026-3381 and BIBM invoice from the Finance system (simulated)');
  };

  const inactive = p.status === 'Postponed' || p.status === 'Deleted';
  const completeReason = s.completed ? '' : inactive ? `The training is ${p.status.toLowerCase()}. Reschedule it first.` : !s.feedbackSubmitted ? (s.attendanceSubmitted ? 'Available after participants give feedback.' : 'Available after attendance is submitted and participants give feedback.') : !budgetValid ? `Complete ${missingCount} mandatory Budget & Expense field${missingCount > 1 ? 's' : ''} first.` : '';
  const complete = () => {
    setTried(true);
    if (completeReason) { if (!budgetValid) setTab('Budget & Expense'); return; }
    if (!p.approvalNo && approvalNo) s.setPlanned({ approvalNo });
    s.complete();
  };

  return (
    <div>
      <PageHead
        title="Planned Training"
        meta="Summary of scheduled training · open one to review details, feedback, budget and expense"
        fr="FR 132–136"
        tags={<SourceTag kind="fictional" />}
      />

      <DataTable<Row>
        rows={rows}
        columns={columns}
        rowKey={(x) => x.id}
        searchText={(x) => `${x.id} ${x.title} ${x.venue}`}
        searchPlaceholder="Search by training, ID or venue"
        label="trainings"
        activeKey={open}
        maxHeight={360}
      />

      <div ref={detailRef} className="scroll-mt-6">
        {!s.scheduled && (
          <Section title={TRAINING.title} className="mt-10">
            <NotYet title="This training is not scheduled yet" after="HR schedules it in Training Scheduling" />
          </Section>
        )}

        {s.scheduled && storyOpen && (
          <Section title={TRAINING.title} className="mt-10" action={<div className="flex flex-wrap items-center gap-2"><Badge t={TONE[storyStatus] ?? 'neutral'}>{storyStatus}</Badge>{p.savedAt && <span className="text-[15px] text-ink-3">Saved {p.savedAt}</span>}</div>}>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-line pr-4">
                <div className="min-w-0 flex-1"><Tabs tabs={TABS} value={tab} onChange={setTab} /></div>
                <Btn v="link" onClick={() => nav('/hr/attendance')}>Attendance register <ArrowRight size={15} /></Btn>
              </div>
              <div className="p-7">
                {tab === 'Training Details' && (
                  <div className="grid gap-8 lg:grid-cols-2">
                    <FactGroup title="From Training Scheduling" rows={[
                      ['Training ID', TRAINING.trainingId],
                      ['Training Name', TRAINING.title],
                      ['Dates', `${TRAINING.dates} · ${TRAINING.time}`],
                      ['Venue', TRAINING.venue],
                      ['Organized By', TRAINING.organizedBy],
                      ['Category', TRAINING.competency],
                      ['Mode · Medium', `${TRAINING.mode} · ${TRAINING.medium}`],
                      ['Trainers', s.sched.trainers.map((t) => t.name).join(', ')],
                    ]} />
                    <FactGroup title="Status and participants" rows={[
                      ['Status', <Badge key="st" t={TONE[storyStatus] ?? 'neutral'}>{storyStatus}</Badge>],
                      ['Load Training Profile', s.sched.loadProfile === 'Yes' ? 'Yes · nomination-led' : 'No · scheduled directly from the request'],
                      ['Participants', `${r.length}`],
                      ['Attended', s.attendanceSubmitted ? `${attended} of ${r.length}` : 'Attendance not submitted yet'],
                      ['Feedback', s.feedbackSubmitted ? 'Received · see Feedback review' : 'Not received yet'],
                      ['Budget', `BDT ${p.budgetApproved || '—'}${s.budgetApproved ? ` · approved ${TRAINING.approvalNo}` : ' · awaiting Finance'}`],
                      ...(p.note ? [['Last change', `${p.status} · ${p.note}`] as [string, string]] : []),
                    ]} />
                  </div>
                )}

                {tab === 'Feedback review' && (
                  !s.feedbackSubmitted ? (
                    <div className="py-6 text-center">
                      <p className="text-[17px] text-ink-2">{s.attendanceSubmitted ? 'Feedback requests went to attendees when attendance was submitted. Responses appear here as they arrive.' : 'Feedback opens for attendees after attendance is submitted.'}</p>
                      <div className="mt-4 flex justify-center"><Btn v="secondary" onClick={() => nav('/hr/attendance')}>Open attendance register</Btn></div>
                    </div>
                  ) : (
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                      <div>
                        <div className="grid grid-cols-2 gap-6">
                          {([['4.6 / 5', 'Overall score'], [`${Math.round(attended * 0.8)} of ${attended}`, 'Responses'], ['4.8 / 5', 'Trainer score'], ['89%', 'Positive comments']] as const).map(([n, l]) => (
                            <div key={l}><div className="text-[32px] font-extrabold leading-none tabular-nums">{n}</div><div className="mt-1 text-[15px] text-ink-2">{l}</div></div>
                          ))}
                        </div>
                        <p className="mt-4 text-[15px] text-ink-3">Scores are fictional demonstration data. Ratings cover content, trainer, relevance and logistics (FR 222–223).</p>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-[20px] font-bold">Themes in the comments</h3><AiLabel>AI-suggested · a person decides</AiLabel><FrRef>FR 226</FrRef></div>
                        <p className="mt-1 text-[15px] text-ink-2">Tick the themes L&amp;D agrees with. Only approved themes are published to the trainer and the dashboards.</p>
                        <ul className="mt-4 divide-y divide-line border-y border-line">
                          {THEMES.map((t) => (
                            <li key={t.id} className="py-3">
                              <label className="flex cursor-pointer items-start gap-3">
                                <input type="checkbox" className="mt-1.5 h-4 w-4" disabled={themesApproved} checked={themes[t.id] ?? false} onChange={(e) => setThemes({ ...themes, [t.id]: e.target.checked })} />
                                <span className="text-[16px]"><b>{t.label}:</b> {t.text}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {themesApproved ? <Badge t="ok">Approved by Nusrat Jahan (L&amp;D) · {THEMES.filter((t) => themes[t.id]).length} themes published</Badge> : (
                            <Btn v="secondary" disabled={!THEMES.some((t) => themes[t.id])} onClick={() => {
                              setThemesApproved(true);
                              s.logEvent('hr', 'Feedback themes approved', `${THEMES.filter((t) => themes[t.id]).map((t) => t.label).join(', ')} · AI-suggested, approved by L&D`);
                            }}>Approve selected themes</Btn>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}

                {tab === 'Budget & Expense' && (
                  <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                    <div>
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-[15px] text-ink-2">All four fields are mandatory. Enter 000 when there is no budget or expense. <FrRef>FR 135</FrRef></div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Approval no." hint={err('approvalNo') ?? (s.budgetApproved ? <span className="text-ink-3">Prefilled from Finance approval (proposed workflow)</span> : <span className="text-ink-3">Fills in when Finance approves the budget</span>)}>
                          <input className={inputCls} value={approvalNo} onChange={(e) => s.setPlanned({ approvalNo: e.target.value })} aria-invalid={tried && !!fieldErr.approvalNo} />
                        </Field>
                        <Field label="Budget approved (BDT)" hint={err('budgetApproved')}>
                          <input className={inputCls} inputMode="decimal" value={p.budgetApproved} onChange={(e) => s.setPlanned({ budgetApproved: e.target.value })} aria-invalid={tried && !!fieldErr.budgetApproved} />
                        </Field>
                        <Field label="Payment no." hint={err('paymentNo')}>
                          <input className={inputCls} value={p.paymentNo} onChange={(e) => s.setPlanned({ paymentNo: e.target.value })} placeholder="PAY-2026-0000 or 000" aria-invalid={tried && !!fieldErr.paymentNo} />
                        </Field>
                        <Field label="Actual expense (BDT)" hint={err('actualExpense')}>
                          <input className={inputCls} inputMode="decimal" value={p.actualExpense} onChange={(e) => s.setPlanned({ actualExpense: e.target.value })} placeholder="000" aria-invalid={tried && !!fieldErr.actualExpense} />
                        </Field>
                      </div>
                      {(!p.paymentNo || !p.actualExpense) && <button className="mt-3 text-[15px] font-semibold text-brand hover:underline" onClick={fillFromRecords}>Pull payment no., invoice and actual expense from Finance (simulated)</button>}

                      <div className="mt-7">
                        <div className="mb-2 text-[17px] font-bold">Approvals and documents</div>
                        <ul className="mb-3 space-y-2">
                          {p.docs.length === 0 && <li className="text-[15px] text-ink-3">No documents uploaded yet.</li>}
                          {p.docs.map((d) => (
                            <li key={d} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 text-[15px]">
                              <FileText size={16} className="text-ink-3" /><span className="min-w-0 flex-1 truncate">{d}</span>
                              <button className="text-ink-3 hover:text-brand" aria-label={`Remove ${d}`} onClick={() => removeDoc(d)}><X size={16} /></button>
                            </li>
                          ))}
                        </ul>
                        <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
                        <div className="flex flex-wrap items-center gap-3">
                          <Btn v="secondary" size="sm" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>Upload documents</Btn>
                          <SourceTag kind="simulated">Simulated storage</SourceTag>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-line bg-[#faf8f5] p-6 lg:self-start">
                      <div className="text-[18px] font-bold">Calculated automatically</div>
                      <p className="mt-1 text-[15px] text-ink-3">Reaches the dashboards and employee profiles (FR 142).</p>
                      <dl className="mt-4 divide-y divide-line text-[16px]">
                        <div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-2">Training investment</dt><dd className="font-semibold tabular-nums">{p.actualExpense ? bdt(actual) : '—'}</dd></div>
                        <div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-2">Attended</dt><dd className="font-semibold tabular-nums">{s.attendanceSubmitted ? `${attended} of ${r.length}` : '—'}</dd></div>
                        <div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-2">Cost per employee</dt><dd className="font-semibold tabular-nums">{s.attendanceSubmitted && attended && p.actualExpense ? bdt(perHead) : '—'}</dd></div>
                        <div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-2">Variance against budget</dt><dd className={cx('font-semibold tabular-nums', p.actualExpense && (variance >= 0 ? 'text-ok' : 'text-warn'))}>{p.actualExpense ? `${variance >= 0 ? '' : '− '}${bdt(Math.abs(variance))} ${variance >= 0 ? 'under' : 'over'}` : '—'}</dd></div>
                        <div className="flex justify-between gap-4 py-2.5"><dt className="text-ink-2">Learning hours</dt><dd className="font-semibold tabular-nums">{s.attendanceSubmitted ? `${attended * 16} h` : '—'}</dd></div>
                      </dl>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-line px-7 py-4">
                {!s.completed && (
                  <>
                    <Btn v="danger" disabled={p.status === 'Deleted'} onClick={() => setAction('Delete')}>Delete</Btn>
                    <span className="mx-1 h-6 w-px bg-line" aria-hidden />
                    <Btn v="secondary" onClick={() => setAction('Reschedule')}>Reschedule</Btn>
                    <Btn v="secondary" disabled={inactive} onClick={() => setAction('Postpone')}>Postpone</Btn>
                    <Btn v="secondary" onClick={save}>Save</Btn>
                  </>
                )}
                <span className="flex-1" />
                {s.completed ? (
                  <>
                    <Badge t="ok">Completed · request {TRAINING.requestId} closed</Badge>
                    <Btn v="secondary" onClick={() => nav('/hr/training-db')}>Open Training Database</Btn>
                    <Btn onClick={() => nav('/r/hr')}>Back to My work</Btn>
                  </>
                ) : (
                  <>
                    {completeReason && <span className="text-[15px] text-ink-3">{completeReason}</span>}
                    <Btn disabled={!!completeReason && (!s.feedbackSubmitted || inactive)} onClick={complete}>Complete training &amp; update dashboards</Btn>
                  </>
                )}
              </div>
            </div>
            {tried && !budgetValid && !s.completed && <div className="mt-4"><Alert kind="warn" title={`${missingCount} mandatory field${missingCount > 1 ? 's' : ''} missing in Budget & Expense`}>Enter 000 where there is no budget, payment or expense.</Alert></div>}
          </Section>
        )}
      </div>

      <Drawer open={!!prog} onClose={() => setOpen(s.scheduled ? TRAINING.trainingId : null)} title={prog?.title ?? ''}>
        {prog && (
          <div>
            <div className="mb-5 flex flex-wrap gap-2"><Badge t={TONE[prog.status] ?? 'neutral'}>{prog.status}</Badge><SourceTag kind="fictional" /></div>
            <FactGroup title="Training Details" rows={[
              ['Training ID', prog.id], ['Venue', prog.venue], ['From Date', prog.from], ['To Date', prog.to], ['Organized By', prog.organizedBy],
              ['Medium · Mode', `${prog.medium} · ${prog.mode}`], ['Trainer', prog.trainer], ['Participants', String(prog.participants)],
              ['Attendance', prog.attended === null ? 'Not taken yet' : `${prog.attended} of ${prog.participants}`],
            ]} />
            <p className="mt-4 text-[15px] text-ink-3">Budget, expense and attendance for this programme are handled the same way as the guided example. In this demonstration, attendance is taken from the Training Calendar.</p>
            <div className="mt-5 flex gap-3"><Btn onClick={() => nav('/hr/calendar')}>Open in Training Calendar</Btn></div>
          </div>
        )}
      </Drawer>

      {action && <ActionModal kind={action} onClose={() => setAction(null)} />}
    </div>
  );
}

/* ---------------- Reschedule / Postpone / Delete (FR 136) ---------------- */
function ActionModal({ kind, onClose }: { kind: Kind; onClose: () => void }) {
  const s = useDemo();
  const r = roster(s);
  const managers = [...new Set(r.map((e) => findById(e.id)?.supervisor ?? e.supervisor).filter(Boolean))];
  const [from, setFrom] = useState('2026-11-25');
  const [to, setTo] = useState('2026-11-26');
  const [reason, setReason] = useState('');
  const verb = kind === 'Reschedule' ? 'rescheduled' : kind === 'Postpone' ? 'postponed' : 'cancelled';
  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const datesOk = kind !== 'Reschedule' || (from && to && to >= from);
  const newDates = kind === 'Reschedule' && datesOk ? `${fmt(from)} – ${fmt(to)}` : '';
  const [subject, setSubject] = useState(`${kind === 'Delete' ? 'Cancelled' : kind === 'Reschedule' ? 'Rescheduled' : 'Postponed'}: ${TRAINING.title}`);
  const [body, setBody] = useState('');
  const defaultBody = `Dear {Participant},\n\n${TRAINING.title} (training ${TRAINING.trainingId}), planned for ${TRAINING.dates}, has been ${verb}${newDates ? `. New dates: ${newDates}, ${TRAINING.time}, ${TRAINING.venue}` : ''}.\nReason: ${reason || '{Reason}'}\n\n${kind === 'Delete' ? 'No action is needed from you.' : kind === 'Postpone' ? 'We will send the new dates as soon as they are confirmed.' : 'Your calendar invitation has been updated.'}\n\nCity Bank L&D`;
  const text = body || defaultBody;
  const ok = reason.trim().length > 2 && datesOk;
  const confirm = () => {
    s.plannedAction(kind, `${newDates ? `New dates ${newDates} · ` : ''}${reason.trim()}`);
    useDemo.setState({ toast: `Training ${verb} · ${r.length} participants emailed, line managers CC` });
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`${kind} training`} footer={<><Btn v="secondary" onClick={onClose}>Cancel</Btn><Btn v={kind === 'Delete' ? 'danger' : 'primary'} disabled={!ok} onClick={confirm}>{kind} &amp; email participants</Btn></>}>
      <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1">
        <p className="text-[16px] text-ink-2">A customizable email goes to all {r.length} participants with their line managers in CC. <FrRef>FR 136</FrRef></p>
        {kind === 'Reschedule' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="New from date"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="New to date" hint={!datesOk ? <span className="text-brand">The to date must be on or after the from date.</span> : undefined}><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
        )}
        <Field label="Reason (required)" hint={!ok && reason.length > 0 && reason.trim().length <= 2 ? <span className="text-brand">Add a reason; it goes into the email and the audit trail.</span> : undefined}>
          <textarea rows={2} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={kind === 'Delete' ? 'e.g. Programme merged into the Q1 credit curriculum' : 'e.g. Trainer unavailable on 18 Nov'} />
        </Field>
        <div className="rounded-lg border border-line p-3 text-[15px]">
          <div><span className="text-ink-3">To:</span> {r.length} participants</div>
          <div><span className="text-ink-3">CC:</span> {managers.join(', ')} (line managers)</div>
        </div>
        <Field label="Subject"><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field label="Email (edit as needed)"><textarea rows={8} className={cx(inputCls, 'font-mono text-[14px]')} value={text} onChange={(e) => setBody(e.target.value)} /></Field>
        {body && <button className="text-[15px] font-semibold text-brand hover:underline" onClick={() => setBody('')}>Reset to template</button>}
      </div>
    </Modal>
  );
}
