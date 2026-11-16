import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Download, FileText, Info, Mail, MessageCircle, Smartphone, X } from 'lucide-react';
import { CONFLICT_IDS, MASTERS, NOMINEE_LIST, TRAINING } from '../../data';
import { VENDORS, VENUES } from '../../org';
import { roster, trainingStatus, useDemo } from '../../store';
import type { Employee } from '../../types';
import { Alert, Badge, Btn, cx, inputCls, Modal } from '../../components/ui';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { FactGroup, NotYet, PageHead, ReasonModal, StepForm } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { BondSetupModal } from './Bonds';
import { CsvUpload, FormField, PersonSearch, TagPicker, TrainerRowsEditor } from './TrainingRequest';
import { FREE_VENUE, venueClash } from './NominationSetup';

const TABS = ['Program', 'Trainer', 'Participants', 'Feedback', 'Undertaking', 'Review & save', 'Notification'];
const TAB_PARAM: Record<string, number> = { program: 0, trainer: 1, participants: 2, feedback: 3, undertaking: 4, review: 5, notification: 6, notifications: 6 };
const T_ID = TRAINING.trainingId;
const TEMPLATES = ['Post-training · content, trainer, logistics (v3)', 'Webinar quick pulse (v1)', 'Trainer effectiveness (v2)'];

/** Section heading inside a tab. */
function H({ children, fr, tag }: { children: ReactNode; fr?: string; tag?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2"><h2 className="text-[22px] font-bold">{children}</h2>{fr && <FrRef>{fr}</FrRef>}{tag}</div>;
}

/* ================================================================== */
/* Training Scheduling · HR (FR 92–131) + Invitations (FR 116–121)     */
/* ================================================================== */
export function Scheduling() {
  const s = useDemo();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const initial = TAB_PARAM[(sp.get('tab') ?? '').toLowerCase()] ?? (s.budgetApproved && !s.invitesSent ? 6 : 0);
  const [tab, setTab] = useState(initial);
  const [saved, setSaved] = useState<boolean[]>(TABS.map(() => false));
  const [bondOpen, setBondOpen] = useState(false);
  const [removing, setRemoving] = useState<string[] | null>(null);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [extra, setExtra] = useState('');
  const [channels, setChannels] = useState({ sms: true, whatsapp: false });
  const [clearSel, setClearSel] = useState<(() => void) | null>(null);
  const n = s.nomSetup;
  const direct = s.schedulePath === 'direct';
  const [manual, setManual] = useState({
    title: s.draft.title || TRAINING.title, dates: n.dates, manHours: n.manHours, category: n.category, mode: n.mode, medium: n.medium,
    tags: [...n.tags], pdus: n.pdus, organizedBy: n.organizedBy,
  });

  useEffect(() => { const t = TAB_PARAM[(sp.get('tab') ?? '').toLowerCase()]; if (t !== undefined) setTab(t); }, [sp]);

  const head = (
    <PageHead title="Training Scheduling" fr="FR 92–131"
      meta={<>{direct ? manual.title : n.title} · Training ID <b>{T_ID}</b> {s.scheduled ? '(fixed)' : '(fixed on save)'}</>}
      tags={<><SourceTag kind="fictional" /><Badge>{trainingStatus(s)}</Badge></>} />
  );
  if (!s.finalized && !direct) return <div>{head}<NotYet title="Nothing to schedule yet" after="HR finalises the nominated participants (or chooses Schedule Training on a request)" /></div>;

  const dates = direct ? manual.dates : n.dates;
  const clash = s.scheduled ? null : venueClash(s.sched.venue, dates);
  const r = roster(s);
  const locked = s.invitesSent;
  const supervisors = [...new Set(r.map((e) => e.supervisor))];
  const markSaved = (i: number) => setSaved((x) => x.map((v, k) => (k === i ? true : v)));
  const next = (i: number) => { markSaved(i); setTab(i + 1); };

  const done = [
    saved[0] || s.scheduled, saved[1] || s.scheduled, s.sched.listSaved, s.invitesSent, s.sched.feedbackSaved, s.sched.savedExit || s.bondSaved, s.scheduled,
  ];

  /* ---------- participants table ---------- */
  const sourceOf = (e: Employee) => (NOMINEE_LIST.some((x) => x.id === e.id) ? 'Nomination' : s.addedParticipants.includes(e.id) ? 'Added by HR' : 'Replacement');
  const flagOf = (e: Employee) => (CONFLICT_IDS.includes(e.id) || e.issue ? (s.resolutions[e.id] === 'keep' ? 'Kept · override' : 'Flagged') : 'Clear');
  const pCols: Column<Employee>[] = [
    {
      key: 'name', header: 'Participant', sort: (e) => e.name, render: (e) => (
        <div>
          <span className="flex items-center gap-2">
            <b className="text-[16px]">{e.name}</b>
            {flagOf(e) !== 'Clear' && <span title={e.issue} aria-label={`Information: ${e.issue ?? 'conflict'}`} className="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white"><Info size={14} /></span>}
          </span>
          <div className="text-[14px] text-ink-3">{e.role}{e.issue ? <span className="text-warn"> · {e.issue}</span> : null}</div>
        </div>
      ),
    },
    { key: 'eid', header: 'EID', sort: (e) => e.eid, render: (e) => e.eid },
    { key: 'div', header: 'Division', filter: (e) => e.division, render: (e) => e.division },
    { key: 'src', header: 'Source', filter: sourceOf, render: (e) => sourceOf(e) },
    { key: 'flag', header: 'Conflict', filter: flagOf, render: (e) => (flagOf(e) === 'Clear' ? <span className="text-ink-2">Clear</span> : <span className="font-semibold text-warn">{flagOf(e)}</span>) },
    { key: 'inv', header: 'Invitation', filter: (e) => s.participation[e.id] ?? 'Not invited yet', render: (e) => (s.participation[e.id] ? <Badge>{s.participation[e.id]}</Badge> : <span className="text-ink-3">Not invited yet</span>) },
    { key: 'rm', header: '', render: (e) => (locked ? null : <span onClick={(ev) => ev.stopPropagation()}><Btn v="link" onClick={() => setRemoving([e.id])}>Remove</Btn></span>) },
  ];

  /* ---------- footer per tab ---------- */
  const prev = tab > 0 ? <Btn v="secondary" onClick={() => setTab(tab - 1)}>Previous</Btn> : null;
  const footers: ReactNode[] = [
    <><span className="flex-1" />{clash && <span className="text-[15px] text-warn">Venue clash on {clash}</span>}<Btn onClick={() => next(0)}>Save & Next</Btn></>,
    <>{prev}<span className="flex-1" /><Btn onClick={() => next(1)}>Save & Next</Btn></>,
    <>{prev}<span className="flex-1" /><Btn onClick={() => {
      s.setSched({ listSaved: true });
      s.logEvent('hr', 'Participant list saved', `${r.length} participants · training ${T_ID} (FR 115)`);
      setTab(3);
    }}>Save List & Next</Btn></>,
    <>{prev}<span className="flex-1" /><Btn onClick={() => {
      s.setSched({ feedbackSaved: true });
      s.logEvent('hr', 'Feedback settings saved', s.sched.feedback === 'Yes' ? `Feedback on · template: ${s.sched.template} (FR 122–125)` : 'No feedback for this training (FR 122–125)');
      setTab(4);
    }}>Save & Next</Btn></>,
    <>{prev}<span className="flex-1" /><Btn v="secondary" onClick={() => {
      s.setSched({ savedExit: true });
      s.logEvent('hr', 'Training scheduling saved', `Training ${T_ID} · Save & Exit (FR 131)`);
      useDemo.setState({ toast: `Training ${T_ID} saved. Continue any time from My work.` });
      nav('/r/hr');
    }}>Save & Exit</Btn><Btn onClick={() => setTab(5)}>Next: Review & save</Btn></>,
    <>{prev}<span className="flex-1" />{s.scheduled
      ? <Btn onClick={() => setTab(6)}>Next: Send invitations <ArrowRight size={16} /></Btn>
      : <>{clash && <span className="text-[15px] text-warn">Resolve the venue clash on the Program tab first.</span>}<Btn disabled={!!clash} onClick={() => { s.publishSchedule(); setTab(6); }}>Save training & go to invitations</Btn></>}</>,
    <>{prev}<span className="flex-1" />{s.invitesSent ? <span className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />Invitations sent</span> : null}</>,
  ];

  const checklist: { k: string; v: string; ok: boolean; tab: number }[] = [
    { k: 'Program', v: direct ? `Load Training Profile = No · entered manually, tagged to ${TRAINING.requestId}` : `Load Training Profile = Yes · ${TRAINING.nominationId} loaded`, ok: true, tab: 0 },
    { k: 'Venue and date', v: clash ? `${s.sched.venue} is booked on ${clash}` : `${s.sched.venue} · ${dates} · no clash`, ok: !clash, tab: 0 },
    { k: 'Trainers', v: s.sched.trainers.length ? s.sched.trainers.map((t) => t.name || 'unnamed').join(' · ') : 'No trainer added', ok: s.sched.trainers.length > 0 && s.sched.trainers.every((t) => t.name && t.topic), tab: 1 },
    { k: 'Participants', v: s.sched.listSaved ? `${r.length} participants · list saved` : `${r.length} participants · list not saved yet`, ok: s.sched.listSaved, tab: 2 },
        { k: 'Feedback', v: s.sched.feedbackSaved ? (s.sched.feedback === 'Yes' ? s.sched.template : 'No feedback') : 'Not saved yet', ok: s.sched.feedbackSaved, tab: 3 },
    { k: 'Undertaking', v: s.bondSaved ? 'Training bond saved' : 'No bond for this training', ok: true, tab: 4 },
  ];

  return (
    <div>
      {head}
      {s.budgetReturned && !s.budgetApproved && (
        <div className="mb-6">
          <Alert kind="warn" title="Finance returned the budget" action={<Btn size="sm" onClick={() => s.resubmitBudget()}>Attach quotation & resubmit</Btn>}>
            {s.budgetReturnReason || "Please attach BIBM's quotation for the external trainer fee."} <SourceTag kind="proposed" />
          </Alert>
        </div>
      )}

      <StepForm steps={TABS} current={tab} onStep={setTab} done={done} footer={footers[tab]}>
        {/* ---------------- Program ---------------- */}
        {tab === 0 && (
          <div className="space-y-8">
            <div>
              <H fr="FR 93">Load Training Profile</H>
              <div role="radiogroup" aria-label="Load Training Profile" className="inline-flex overflow-hidden rounded-lg border border-line">
                {(['Yes', 'No'] as const).map((v) => {
                  const on = s.sched.loadProfile === v;
                  return (
                    <button key={v} role="radio" aria-checked={on} disabled={s.scheduled} onClick={() => s.setSchedulePath(v === 'Yes' ? 'profile' : 'direct')}
                      className={cx('px-6 py-2.5 text-[16px] font-semibold disabled:cursor-not-allowed', on ? 'bg-ink text-white' : 'bg-white text-ink-2 hover:bg-canvas')}>{v}</button>
                  );
                })}
              </div>
            </div>

            {!direct ? (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">Nomination Request profiles (unscheduled, future-dated) <FrRef>FR 94</FrRef></div>
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    <li className="flex items-center gap-3 px-4 py-3 text-[16px]"><input type="checkbox" checked readOnly aria-label={`${TRAINING.nominationId} loaded`} /><b>{TRAINING.nominationId}</b> · {n.title} · {n.dates}<span className="ml-auto text-[15px] text-ok">Loaded</span></li>
                    <li className="flex items-center gap-3 px-4 py-3 text-[16px] text-ink-3"><input type="checkbox" disabled aria-label="NR-2026-00051 not available" />NR-2026-00051 · AML & CFT Refresher · already scheduled as 20260179</li>
                  </ul>
                </div>
                <FactGroup title="Loaded from the profile (FR 95)" rows={[
                  ['Training Title', n.title],
                  ['Date & time', n.dates],
                  ['Man-hours · Repeat', `${n.manHours} per participant · ${n.repeat}`],
                  ['Category · Mode · Medium', `${n.category} · ${n.mode} · ${n.medium}`],
                  ['Tags', n.tags.join(', ')],
                  ['PDUs', n.pdus],
                  ['Organized By', n.organizedBy],
                  ['Nominations', `${r.length} finalised participants load into Participants`],
                ]} />
              </div>
            ) : (
              <div className="space-y-6">
                <Alert kind="info" title="Direct path (FR 66, 96)">Details entered manually and tagged to {TRAINING.requestId}. The guided story uses the nomination profile.</Alert>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField className="md:col-span-2" label="Training Title" fr="FR 96" hint={`Tagged to request ${TRAINING.requestId}`}><input className={inputCls} disabled={s.scheduled} value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} /></FormField>
                  <FormField label="Date & time" fr="FR 97"><input className={inputCls} disabled={s.scheduled} value={manual.dates} onChange={(e) => setManual({ ...manual, dates: e.target.value })} /></FormField>
                  <FormField label="Man-hours per participant" fr="FR 97"><input className={inputCls} disabled={s.scheduled} value={manual.manHours} onChange={(e) => setManual({ ...manual, manHours: e.target.value })} /></FormField>
                  <FormField label="Category" fr="FR 100"><select className={inputCls} disabled={s.scheduled} value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })}>{MASTERS.categories.map((c) => <option key={c}>{c}</option>)}</select></FormField>
                  <FormField label="Mode" fr="FR 101"><select className={inputCls} disabled={s.scheduled} value={manual.mode} onChange={(e) => setManual({ ...manual, mode: e.target.value })}>{MASTERS.modes.map((c) => <option key={c}>{c}</option>)}</select></FormField>
                  <FormField label="Medium" fr="FR 102"><select className={inputCls} disabled={s.scheduled} value={manual.medium} onChange={(e) => setManual({ ...manual, medium: e.target.value })}>{MASTERS.mediums.map((c) => <option key={c}>{c}</option>)}</select></FormField>
                  <FormField label="PDUs" fr="FR 104"><input className={inputCls} disabled={s.scheduled} value={manual.pdus} onChange={(e) => setManual({ ...manual, pdus: e.target.value })} /></FormField>
                  <FormField className="md:col-span-2" label="Organized By" fr="FR 105"><select className={inputCls} disabled={s.scheduled} value={manual.organizedBy} onChange={(e) => setManual({ ...manual, organizedBy: e.target.value })}>{[...new Set([manual.organizedBy, ...VENDORS])].map((v) => <option key={v}>{v}</option>)}</select></FormField>
                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ink-2">Tags <FrRef>FR 103</FrRef></div>
                    <TagPicker value={manual.tags} disabled={s.scheduled} onChange={(tags) => setManual({ ...manual, tags })} />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Training ID" fr="FR 92" hint="Automatic and sequential">
                <input className={inputCls} readOnly value={`${T_ID} · ${s.scheduled ? 'fixed' : 'fixed on save'}`} />
              </FormField>
              <FormField label="Venue" fr="FR 98–99" hint="From the Venue setup, checked against the training calendar.">
                <select className={inputCls} disabled={s.scheduled} value={s.sched.venue} onChange={(e) => s.setSched({ venue: e.target.value })}>{VENUES.map((v) => <option key={v.name} value={v.name}>{v.name} · {v.address}</option>)}</select>
              </FormField>
            </div>
            {clash
              ? <Alert kind="brand" title={`Venue clash: ${s.sched.venue} is booked on ${clash}`} action={<Btn size="sm" onClick={() => s.setSched({ venue: FREE_VENUE })}>Use Hall A</Btn>}>The training calendar already has a booking at this venue on a training day. {FREE_VENUE} is free on both days. Saving is blocked until this is resolved.</Alert>
              : <p className="flex items-center gap-2 text-[16px] font-semibold text-ok"><CheckCircle2 size={18} />{s.sched.venue} is free on the training days · meeting-room booking (simulated)</p>}
          </div>
        )}

        {/* ---------------- Trainer ---------------- */}
        {tab === 1 && (
          <div>
            <H fr="FR 107–112">Trainer</H>
            {!direct && <p className="mb-5 text-[16px] text-ink-2">Pre-filled from {TRAINING.nominationId} (FR 107). Change, remove or add trainers.</p>}
            <TrainerRowsEditor rows={s.sched.trainers} disabled={s.invitesSent} onChange={(trainers) => s.setSched({ trainers })} />
            {s.invitesSent && <p className="mt-3 text-[15px] text-ink-3">Trainer invitations are sent; changes now go through the trainer’s response.</p>}
          </div>
        )}

        {/* ---------------- Participants ---------------- */}
        {tab === 2 && (
          <div className="space-y-6">
            <H fr="FR 113–115">Participants</H>
            {direct && <p className="-mt-2 text-[16px] text-ink-2">In the direct path HR adds participants by EID or bulk upload. This demo shows the story’s list so the later steps stay connected.</p>}
            {!locked ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <PersonSearch label="Add Participant" fr="FR 113" exclude={r.map((e) => e.id)} onPick={(p) => { s.addParticipants([p.id]); useDemo.setState({ toast: `${p.name} added to the participant list` }); }} />
                <div>
                  <div className="mb-1.5 text-[15px] font-semibold text-ink-2">Or bulk upload</div>
                  <CsvUpload onIds={(ids) => { const add = ids.filter((id) => !r.some((e) => e.id === id)); if (add.length) s.addParticipants(add); }} />
                </div>
              </div>
            ) : <p className="text-[16px] text-ink-2">Invitations are sent. Changes to the list now go through the withdrawal and replacement process (FR 119).</p>}
            <div>
              <h3 className="mb-3 text-[20px] font-bold">Participants Summary · {r.length}</h3>
              <DataTable rows={r} columns={pCols} rowKey={(e) => e.id} searchText={(e) => `${e.name} ${e.eid}`} label="participants"
                selectable={!locked} bulk={(sel, clear) => <Btn size="sm" v="danger" onClick={() => { setClearSel(() => clear); setRemoving(sel.map((e) => e.id)); }}>Remove {sel.length}</Btn>}
                rowClassName={(e) => (sourceOf(e) !== 'Nomination' ? 'bg-ok-soft/40' : '')} />
              <p className="mt-2 flex items-center gap-2 text-[15px] text-ink-3"><span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-white"><Info size={12} /></span>marks a calendar conflict, leave, resignation or retirement (FR 114).</p>
            </div>
          </div>
        )}

        {/* ---------------- Notification ---------------- */}
        {tab === 6 && (
          <div className="space-y-8">

            <section>
              <H fr="FR 116">Organizer communication</H>
              <p className="text-[16px] text-ink-2">Sends the participant list to <b>{direct ? manual.organizedBy : n.organizedBy}</b>.</p>
              <EmailTemplate subject={`Nomination: ${TRAINING.title} (${T_ID})`} body={`Dear Organizer,\n\nPlease find the final participant list for ${TRAINING.title}, 18–19 Nov 2026.\n\nRegards,\nNusrat Jahan, HR Admin (L&D)`} />
              <div className="mt-3">{s.sched.organizerSent
                ? <span className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />Sent to the organizer</span>
                : <Btn v="secondary" icon={<Mail size={16} />} onClick={() => s.sendOrganizer()}>Send Nomination to Organizer Now</Btn>}</div>
            </section>

            <section className="border-t border-line pt-6">
              <H fr="FR 117">Trainer communication</H>
              <div className="flex flex-wrap items-end gap-4">
                <FormField label="Set Reminder Mail"><input type="date" className={cx(inputCls, 'w-56')} value={s.sched.reminderTrainer} onChange={(e) => s.setSched({ reminderTrainer: e.target.value })} /></FormField>
                {s.sched.trainerInviteSent
                  ? <span className="flex items-center gap-2 pb-2.5 text-[16px] font-semibold text-ok"><Check size={18} />Invitations sent to {s.sched.trainers.length} trainer{s.sched.trainers.length === 1 ? '' : 's'}</span>
                  : <Btn v="secondary" disabled={!s.sched.trainers.length} onClick={() => s.sendTrainerInvite()}>Save & Send Invitation to Trainer(s) Now</Btn>}
              </div>
              <p className="mt-2 text-[15px] text-ink-3">To: {s.sched.trainers.map((t) => t.name).filter(Boolean).join(', ') || 'no trainer added'} · each invitation has an accept / decline link (FR 17).</p>
              <EmailTemplate subject={`Invitation to facilitate: ${TRAINING.title}`} body={`Dear Trainer,\n\nYou are invited to facilitate ${TRAINING.title} on 18–19 Nov 2026 at City Bank Learning Center, Hall A.\n\nAccept or decline: https://eldp.thecitybank.com/t/${T_ID}\n\nRegards,\nNusrat Jahan, HR Admin (L&D)`} />
            </section>

            <section className="border-t border-line pt-6">
              <H fr="FR 118">Participant communication</H>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <FormField label="Set Reminder Mail"><input type="date" className={cx(inputCls, 'w-56')} value={s.sched.reminderParticipant} onChange={(e) => s.setSched({ reminderParticipant: e.target.value })} /></FormField>
                  <div>
                    <div className="mb-1.5 text-[15px] font-semibold text-ink-2">CC (automatic)</div>
                    <p className="text-[16px]">Supervisors: {supervisors.join(', ')}</p>
                  </div>
                  <div>
                    <FormField label="Add recipients">
                      <div className="flex gap-2">
                        <input className={inputCls} type="email" value={extra} placeholder="name@thecitybank.com" onChange={(e) => setExtra(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtra(); } }} />
                        <Btn v="secondary" disabled={!/^\S+@\S+\.\S+$/.test(extra.trim())} onClick={addExtra}>Add</Btn>
                      </div>
                    </FormField>
                    {s.sched.extraRecipients.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.sched.extraRecipients.map((x) => (
                          <span key={x} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-[15px]">{x}
                            <button type="button" aria-label={`Remove ${x}`} onClick={() => s.setSched({ extraRecipients: s.sched.extraRecipients.filter((y) => y !== x) })} className="text-ink-3 hover:text-ink"><X size={15} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-[15px] font-semibold text-ink-2">Attachments and links</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[15px]"><FileText size={16} className="text-ink-3" />Participant_List_{T_ID}.pdf · {r.length} names</span>
                    <Btn v="link" icon={<Download size={16} />} onClick={() => downloadCsv(`participants_${T_ID}.csv`, ['EID', 'Name', 'Designation', 'Division', 'Supervisor'], r.map((e) => [e.eid, e.name, e.role, e.division, e.supervisor]))}>Download the list</Btn>
                  </div>
                  <p className="text-[16px] text-ink-2">Each invitation includes a link to <b>Accept</b> or choose <b>Withdrawn Request</b> with a reason, which starts the withdrawal process (FR 119).</p>
                  <EmailTemplate subject={`Training invitation: ${TRAINING.title}, 18–19 Nov 2026`} body={`Dear {Participant name},\n\nYou are invited to ${TRAINING.title} on 18–19 Nov 2026, 09:30–17:30, City Bank Learning Center, Hall A.\nThe participant list is attached (PDF). Your supervisor is copied.\n\nAccept or request withdrawal: https://eldp.thecitybank.com/i/{invitation link}\n\nRegards,\nNusrat Jahan, HR Admin (L&D)`} />
                </div>
              </div>
            </section>

            <section className="border-t border-line pt-6">
              <H fr="FR 120" tag={<SourceTag kind="simulated" />}>SMS and WhatsApp Notification</H>
              <div className="flex flex-wrap gap-6 text-[16px]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} /><Smartphone size={18} className="text-ink-3" />SMS reminder</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })} /><MessageCircle size={18} className="text-ink-3" />WhatsApp reminder</label>
              </div>
              <p className="mt-2 text-[15px] text-ink-3">No real messages are sent in the demo.</p>
            </section>

            <section className="border-t border-line pt-6">
              {s.invitesSent ? (
                <Alert kind="ok" title={`Invitations sent: ${r.length} participants · ${s.sched.trainers.length} trainers · organizer`}>Calendar events are created. Responses arrive in the trainer’s and employees’ task inboxes.</Alert>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-4">
                  {!s.budgetApproved && <span className="text-[15px] text-ink-3">Available after the training is saved</span>}
                  <Btn disabled={!s.budgetApproved} onClick={() => setSendConfirm(true)}>Send Training Invitation Now</Btn>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ---------------- Feedback ---------------- */}
        {tab === 3 && (
          <div className="max-w-xl space-y-6">
            <H fr="FR 122–125">Feedback</H>
            <div>
              <div className="mb-2 text-[15px] font-semibold text-ink-2">Want to take feedback of this training?</div>
              <div role="radiogroup" className="flex gap-6 text-[16px]">
                {(['Yes', 'No'] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2"><input type="radio" name="fb" checked={s.sched.feedback === v} onChange={() => s.setSched({ feedback: v, feedbackSaved: false })} />{v}</label>
                ))}
              </div>
            </div>
            {s.sched.feedback === 'Yes' && (
              <FormField label="Load Feedback Templates" fr="FR 124" hint="From the Feedback setup (FR 45–46). Released to attendees after attendance is submitted.">
                <select className={inputCls} value={s.sched.template} onChange={(e) => s.setSched({ template: e.target.value, feedbackSaved: false })}>{[...new Set([s.sched.template, ...TEMPLATES])].map((t) => <option key={t}>{t}</option>)}</select>
              </FormField>
            )}
            {s.sched.feedbackSaved && <p className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />Saved</p>}
          </div>
        )}

        {/* ---------------- Undertaking ---------------- */}
        {tab === 4 && (
          <div className="max-w-2xl space-y-5">
            <H fr="FR 126–131">Undertaking to Training</H>
            <p className="text-[16px] text-ink-2">A training bond applies to selected participants of high-cost or foreign programmes. HR enters the signing date, period and amount; the rest is pulled from the Program tab and the Employee Database (FR 128).</p>
            <div className="flex flex-wrap items-center gap-4">
              <Btn v="secondary" onClick={() => setBondOpen(true)}>Training Bond</Btn>
              {s.bondSaved ? <span className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />A bond is saved in the Training Bond Database</span> : <span className="text-[16px] text-ink-3">No bond saved for this training yet</span>}
            </div>
          </div>
        )}

        {/* ---------------- Review & submit ---------------- */}
        {tab === 5 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <H tag={<SourceTag kind="proposed" />}>Review & submit</H>
              <p className="-mt-2 text-[16px] text-ink-2">Check each section. Saving fixes Training ID {T_ID}.</p>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {checklist.map((c) => (
                  <li key={c.k} className="flex items-center gap-4 py-3">
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-white', c.ok ? 'bg-ok' : 'bg-amber-500')}>{c.ok ? <Check size={15} /> : '!'}</span>
                    <span className="w-36 shrink-0 text-[16px] font-semibold">{c.k}</span>
                    <span className="min-w-0 flex-1 text-[16px] text-ink-2">{c.v}</span>
                    {!c.ok && <Btn size="sm" v="secondary" onClick={() => setTab(c.tab)}>Fix</Btn>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="self-start rounded-2xl bg-[#faf8f5] p-6">
              <div className="text-[17px] font-semibold">What happens after saving</div>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[16px] text-ink-2">
                <li>Training ID {T_ID} is fixed and added to the Training Calendar.</li>
                <li>The venue is booked (meeting-room system, simulated).</li>
                <li>Then you send the invitations from the Notification tab.</li>
              </ul>
            </div>
          </div>
        )}
      </StepForm>

      <BondSetupModal open={bondOpen} onClose={() => setBondOpen(false)} />

      <ReasonModal open={!!removing} title={`Remove ${removing?.length ?? 0} participant${(removing?.length ?? 0) > 1 ? 's' : ''}`}
        intro="They leave the participant list. The reason is written to the audit trail for each person; Undo is available for a few seconds."
        names={(removing ?? []).map((id) => { const e = r.find((x) => x.id === id); return e ? `${e.name} · ${e.eid}` : id; })}
        confirm="Remove" suggested="Not available on the training dates"
        onClose={() => setRemoving(null)}
        onConfirm={(reason) => {
          const ids = removing ?? [];
          s.withUndo(`Remove ${ids.length} participant${ids.length > 1 ? 's' : ''}`, () => s.removeParticipants(ids, reason));
          setRemoving(null);
          clearSel?.();
          setClearSel(null);
        }} />

      <Modal open={sendConfirm} onClose={() => setSendConfirm(false)} title="Send Training Invitation Now"
        footer={<><Btn v="secondary" onClick={() => setSendConfirm(false)}>Cancel</Btn><Btn onClick={() => { setSendConfirm(false); s.sendInvites(); }}>Send to {r.length} participants</Btn></>}>
        <p className="text-[16px]">These recipients get the invitation with the calendar event:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-[16px] text-ink-2">
          <li><b>{r.length} participants</b>, each with an Accept / Withdrawn Request link</li>
          <li><b>{supervisors.length} supervisors</b> in CC ({supervisors.join(', ')})</li>
          {s.sched.extraRecipients.length > 0 && <li>{s.sched.extraRecipients.length} extra recipient{s.sched.extraRecipients.length > 1 ? 's' : ''}: {s.sched.extraRecipients.join(', ')}</li>}
          <li>{s.sched.trainers.length} trainer{s.sched.trainers.length === 1 ? '' : 's'} and the organizer, if not already sent</li>
          <li>Reminder mail on {s.sched.reminderParticipant}{channels.sms || channels.whatsapp ? ` · ${[channels.sms && 'SMS', channels.whatsapp && 'WhatsApp'].filter(Boolean).join(' and ')} (simulated)` : ''}</li>
        </ul>
        <p className="mt-3 text-[15px] text-ink-3">Attached: Participant_List_{T_ID}.pdf</p>
      </Modal>
    </div>
  );

  function addExtra() {
    const v = extra.trim();
    if (!/^\S+@\S+\.\S+$/.test(v) || s.sched.extraRecipients.includes(v)) return;
    s.setSched({ extraRecipients: [...s.sched.extraRecipients, v] });
    setExtra('');
  }
}

/** Customizable email template (FR 116–118): subject and body can be edited before sending. */
function EmailTemplate({ subject, body }: { subject: string; body: string }) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(subject);
  const [txt, setTxt] = useState(body);
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="text-[15px] font-medium text-brand hover:underline">{open ? 'Hide email template' : 'Edit email template'}</button>
      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-line p-4">
          <label className="block"><span className="mb-1 block text-[14px] text-ink-3">Subject</span><input className={inputCls} value={sub} onChange={(e) => setSub(e.target.value)} /></label>
          <label className="block"><span className="mb-1 block text-[14px] text-ink-3">Message</span><textarea rows={7} className={inputCls} value={txt} onChange={(e) => setTxt(e.target.value)} /></label>
          <button type="button" onClick={() => { setSub(subject); setTxt(body); }} className="text-[14px] text-ink-3 hover:text-ink">Reset to the default template</button>
        </div>
      )}
    </div>
  );
}
