import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { REQUEST_QUEUE, TRAINING } from '../../data';
import { GAP_TEXT } from '../../org';
import { requestStatus, useDemo } from '../../store';
import { DecisionLayout, DecisionPanel, FactGroup, NotYet, PageHead, ReasonModal } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { Alert, Badge, Btn, Field, inputCls, Modal } from '../../components/ui';

const STORY_ID = TRAINING.requestId;
const HR_ADMINS = ['Shahana Parvin, Senior HR Admin', 'Rumana Akter, HR Admin (Training Operations)', 'Kazi Tareq, HR Admin (Budget & Vendors)'];

/** FR 66 Forward: choose an HR Admin and add a note. */
function ForwardModal({ open, onClose, onConfirm, id }: { open: boolean; onClose: () => void; onConfirm: (to: string, note: string) => void; id: string }) {
  const [to, setTo] = useState(HR_ADMINS[0]);
  const [note, setNote] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={`Forward ${id}`} footer={<><Btn v="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={() => { onConfirm(to, note.trim()); setNote(''); }}>Forward</Btn></>}>
      <p className="mb-4 text-[16px] text-ink-2">Assign this request to another HR Admin (FR 66). They get a task in their inbox and the hand-over is written to the audit trail.</p>
      <div className="grid gap-4">
        <Field label="Forward to">
          <select className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}>
            {HR_ADMINS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Note (optional)">
          <textarea rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please confirm the BIBM trainer fee before scheduling." />
        </Field>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/* Other requests in the queue: summary + Schedule Training / Forward   */
/* ================================================================== */
function QueuedRequest({ id }: { id: string }) {
  const s = useDemo();
  const nav = useNavigate();
  const [fwd, setFwd] = useState(false);
  const r = REQUEST_QUEUE.find((x) => x.id === id);
  if (!r) {
    return (
      <div>
        <PageHead title="Request not found" meta={`${id} is not in the request queue.`} fr="FR 65–66" />
        <div className="rounded-2xl border border-dashed border-line bg-white px-8 py-12 text-center">
          <p className="text-[17px] text-ink-2">Open a request from Training Request Received.</p>
          <div className="mt-5 flex justify-center gap-3"><Btn v="secondary" onClick={() => nav(`/r/${s.role}`)}>Back to My work</Btn><Btn onClick={() => nav('/hr/requests')}>Open Training Request Received</Btn></div>
        </div>
      </div>
    );
  }
  const prog = s.programmes.find((p) => p.fromRequest === id);
  const forward = s.audit.find((a) => a.action === 'Request forwarded' && a.detail.startsWith(id));
  const [from, to] = r.dates.includes('–') ? [r.dates.replace(/–\d{2}/, ''), r.dates.replace(/^\d{2}–/, '')] : [r.dates, r.dates];
  return (
    <div>
      <PageHead
        title={r.title}
        meta={`${r.id} · ${r.division} · Requested by ${r.by}`}
        fr="FR 65–66"
        tags={<><Badge>{prog ? 'Scheduled' : forward ? 'Forwarded' : 'Pending HR Review'}</Badge><Badge t={r.priority === 'High' ? 'brand' : r.priority === 'Medium' ? 'warn' : 'neutral'}>{`${r.priority} priority`}</Badge><SourceTag kind="fictional" /></>}
      />
      <DecisionLayout
        panel={
          <DecisionPanel
            title={prog ? 'Decision recorded' : 'Your decision'}
            what={prog ? `Scheduled directly as training ${prog.id}. Venue, trainers and participants are completed in Training Scheduling.` : 'Schedule it directly (Load Training Profile = No) or forward it to another HR Admin.'}
            note={<>The guided story follows {STORY_ID}. This request shows that every request in the queue gets the same FR 66 actions.</>}
          >
            {prog ? (
              <>
                <Btn onClick={() => nav('/hr/calendar')}>Open Training Calendar <ArrowRight size={16} /></Btn>
                <Btn v="secondary" onClick={() => nav('/hr/requests')}>Back to Training Request Received</Btn>
              </>
            ) : (
              <>
                {forward && <Alert kind="info" title="Forwarded">{forward.detail.replace(`${id} → `, 'To ')} · {forward.at.slice(12)}</Alert>}
                <Btn size="lg" onClick={() => s.scheduleDirect(r.id, r.title)}>Schedule Training</Btn>
                <Btn v="secondary" onClick={() => setFwd(true)}>Forward</Btn>
              </>
            )}
          </DecisionPanel>
        }
      >
        <FactGroup title="Request summary" rows={[
          ['Training Name', r.title],
          ['Division', r.division],
          ['Requested by', r.by],
          ['From Date', from],
          ['To Date', to],
          ['Proposed Pax', `${r.participants}`],
          ['Venue', 'Suggested by the requester · to be confirmed'],
        ]} />
      </DecisionLayout>
      <ForwardModal open={fwd} id={r.id} onClose={() => setFwd(false)} onConfirm={(who, note) => {
        s.logEvent('hr', 'Request forwarded', `${r.id} → ${who}${note ? ` · ${note}` : ''}`);
        useDemo.setState({ toast: `Forwarded to ${who}. A task was created in their inbox.` });
        setFwd(false);
      }} />
    </div>
  );
}

/* ================================================================== */
/* The story request TR-2026-00418 (J3, FR 65–66)                      */
/* ================================================================== */
export function RequestReview() {
  const { id = STORY_ID } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const [fwd, setFwd] = useState(false);
  const [ret, setRet] = useState(false);
  const [direct, setDirect] = useState(false);

  if (id !== STORY_ID) return <QueuedRequest id={id} />;
  if (!s.requestSubmitted) {
    return (
      <div>
        <PageHead title={TRAINING.title} meta={`${STORY_ID} · Corporate Banking · not submitted yet`} fr="FR 65–66" tags={<SourceTag kind="fictional" />} />
        <NotYet title={`${STORY_ID} has not been submitted yet`} after="the Division Head submits the training request" />
      </div>
    );
  }

  const d = s.draft;
  const title = d.title || TRAINING.title;
  const status = requestStatus(s);
  const reviewEvent = s.audit.find((a) => a.action === 'Request accepted for nomination');
  const proposed = d.participantIds.length || d.participants;


  const decided = s.reviewed;
  return (
    <div>
      <PageHead
        title={title}
        meta={`${STORY_ID} · Corporate Banking · Farzana Haque`}
        fr="FR 65–66"
        tags={<Badge t={decided ? 'info' : 'warn'}>{status}</Badge>}
      />

      <DecisionLayout
        panel={
          decided ? (
            <DecisionPanel
              title="Decision recorded"
              what={<>Accepted for nomination{reviewEvent ? ` at ${reviewEvent.at.slice(12)}` : ''}. Nomination request NR-2026-00057 {s.nominationRequested ? 'has been sent to the Learning Champions.' : 'is the next step.'}</>}
            >
              {s.nominationRequested
                ? <Btn v="secondary" onClick={() => nav('/hr/nomination-request')}>Open nomination request <ArrowRight size={16} /></Btn>
                : <Btn onClick={() => nav('/hr/nomination-request')}>Continue to Nomination Request <ArrowRight size={16} /></Btn>}
              <Btn v="ghost" onClick={() => nav('/hr/requests')}>Back to Training Request Received</Btn>
            </DecisionPanel>
          ) : (
            <DecisionPanel
              what="Choose the next step."
            >
              {s.requestForward && <Alert kind="info" title={`Forwarded to ${s.requestForward.to}`}>{s.requestForward.at}{s.requestForward.note ? ` · ${s.requestForward.note}` : ''}. They have the task; you can still decide here.</Alert>}
              {s.requestReturn && (
                <Alert kind="warn" title="Returned for information">
                  {s.requestReturn.at} · {s.requestReturn.note}. Waiting for Farzana Haque.
                  <button className="mt-2 block font-semibold text-brand hover:underline" onClick={() => {
                    s.logEvent('division_head', 'Information provided', `${STORY_ID} · Division Head answered: ${s.requestReturn?.note ?? ''} (simulated reply)`);
                    s.resolveReturn('Clarified the target audience and dates (simulated)'); useDemo.setState({ toast: 'Farzana Haque replied. The request is back with you (simulated).' });
                  }}>Record the Division Head’s reply (simulated)</button>
                </Alert>
              )}
              <Btn size="lg" onClick={() => { s.reviewRequest(); nav('/hr/nomination-request'); }}>Create Nomination Request <ArrowRight size={16} /></Btn>
              <Btn v="secondary" onClick={() => setDirect(true)}>Schedule Training</Btn>
              <Btn v="secondary" onClick={() => setFwd(true)}>Forward</Btn>
              <Btn v="link" onClick={() => setRet(true)}>Return for Information</Btn>
            </DecisionPanel>
          )
        }
      >
        <FactGroup title="Request" rows={[
          ['Training', title],
          ['Need', `Credit Analysis · level 2 → 4 · ${GAP_TEXT} officers below target`],
          ['Based on', d.sources.join(' · ') || 'Competency and role gap'],
          ['Participants', `${proposed} proposed`],
          ['Dates', d.dates],
          ['Venue', d.venue],
          ['Mode · Medium', `${TRAINING.mode} · ${TRAINING.medium}`],
          ['Trainers', d.trainers.map((t) => t.name).join(', ')],
        ]} />
      </DecisionLayout>

      <ForwardModal open={fwd} id={STORY_ID} onClose={() => setFwd(false)} onConfirm={(to, note) => { s.forwardRequest(to, note); setFwd(false); }} />
      <ReasonModal
        open={ret}
        title="Return for Information"
        intro={<>The request goes back to Farzana Haque with your question. <SourceTag kind="proposed" /></>}
        confirm="Return to Division Head"
        suggested="Please confirm the participant list and whether Day 2 can be a webinar."
        onClose={() => setRet(false)}
        onConfirm={(note) => { s.returnRequest(note); setRet(false); }}
      />
      <Modal
        open={direct}
        onClose={() => setDirect(false)}
        title="Schedule Training directly"
        footer={<><Btn v="secondary" onClick={() => setDirect(false)}>Cancel</Btn><Btn onClick={() => {
          s.setSchedulePath('direct');
          s.logEvent('hr', 'Direct scheduling opened', `${STORY_ID} · Load Training Profile = No · title tagged to the request (FR 66, 96)`);
          setDirect(false);
          nav('/hr/schedule');
        }}>Open Training Scheduling</Btn></>}
      >
        <div className="space-y-3 text-[16px] text-ink-2">
          <p>Training Scheduling opens with <b className="text-ink">Load Training Profile = No</b> (FR 93, 96). You enter the title, dates, venue and trainers yourself, and the training is tagged to {STORY_ID}. No nomination round is run.</p>
          <p className="rounded-xl bg-canvas p-4 text-[15px]"><b className="text-ink">Presenter note:</b> the guided story continues with <b className="text-ink">Create Nomination Request</b>. Use this path to show the alternative, then come back to this request.</p>
        </div>
      </Modal>
    </div>
  );
}
