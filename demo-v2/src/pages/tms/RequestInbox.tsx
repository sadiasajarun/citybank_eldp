import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { REQUEST_QUEUE, TRAINING } from '../../data';
import { requestStatus, useDemo } from '../../store';
import { Badge, Btn, inputCls, Modal } from '../../components/ui';
import { DataTable, type Column } from '../../components/DataTable';
import { PageHead } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { useSwitchRole } from '../../components/perspective';
import { FormField } from './TrainingRequest';

/** HR Admins a request can be assigned to (FR 66 Forward pop-up). Fictional. */
export const HR_ADMINS = ['Shahana Parvin — Senior HR Admin', 'Kamal Uddin — HR Admin', 'Rumana Akter — HR Admin, Training Operations'];

const VENUE_OF: Record<string, string> = {
  'TR-2026-00415': 'Head Office Auditorium',
  'TR-2026-00409': 'Chattogram Regional Training Room',
  'TR-2026-00402': 'Webinar (Teams)',
};

/** "18–19 Nov 2026" → ["18 Nov 2026", "19 Nov 2026"]; a single date is both From and To. */
export const splitDates = (dates: string): [string, string] => {
  const m = dates.match(/^(\d{1,2})\s*[–-]\s*(\d{1,2})\s+(.+)$/);
  return m ? [`${m[1]} ${m[3]}`, `${m[2]} ${m[3]}`] : [dates, dates];
};

interface Row { id: string; title: string; division: string; by: string; venue: string; from: string; to: string; pax: number; status: string; story: boolean; scheduledAs?: string }

export function RequestInbox() {
  const s = useDemo();
  const nav = useNavigate();
  const switchRole = useSwitchRole();
  const [fwd, setFwd] = useState<Row | null>(null);
  const [to, setTo] = useState(HR_ADMINS[0]);
  const [note, setNote] = useState('');

  const forwardedTo = (id: string) => s.audit.find((e) => e.action === 'Request forwarded' && e.detail.startsWith(id))?.detail.split('→ ')[1]?.split(' · ')[0];

  const rows: Row[] = REQUEST_QUEUE.filter((r) => r.id !== TRAINING.requestId || s.requestSubmitted).map((r) => {
    const story = r.id === TRAINING.requestId;
    const [from, toDate] = splitDates(r.dates);
    const prog = s.programmes.find((p) => p.fromRequest === r.id);
    const fwdTo = story ? undefined : forwardedTo(r.id);
    return {
      id: r.id,
      title: story ? s.draft.title || r.title : r.title,
      division: r.division,
      by: r.by,
      venue: story ? s.draft.venue || TRAINING.venue : VENUE_OF[r.id] ?? 'To be confirmed',
      from,
      to: toDate,
      pax: story ? s.draft.participantIds.length || r.participants : r.participants,
      status: story ? requestStatus(s) : prog ? 'Scheduled' : fwdTo ? `Forwarded · ${fwdTo.split(' — ')[0]}` : 'Pending HR Review',
      story,
      scheduledAs: prog?.id,
    };
  });

  const canForward = (r: Row) => (r.story ? !s.reviewed && !s.scheduled : !r.scheduledAs);
  const schedule = (r: Row) => {
    if (r.story) { nav(s.reviewed || s.schedulePath === 'direct' ? '/hr/schedule' : `/hr/requests/${r.id}`); return; }
    s.scheduleDirect(r.id, r.title);
  };
  const confirmForward = () => {
    if (!fwd) return;
    if (fwd.story) s.forwardRequest(to, note.trim());
    else {
      s.logEvent('hr', 'Request forwarded', `${fwd.id} → ${to}${note.trim() ? ` · ${note.trim()}` : ''}`);
      useDemo.setState({ toast: `Forwarded ${fwd.id} to ${to.split(' — ')[0]}. A task was created in their inbox.` });
    }
    setFwd(null);
    setNote('');
  };

  const columns: Column<Row>[] = [
    { key: 'id', header: 'Request ID', sort: (r) => r.id, render: (r) => <div><b className="text-[16px]">{r.id}</b><div className="text-[14px] text-ink-3">{r.division} · {r.by}</div></div> },
    { key: 'title', header: 'Training Name', sort: (r) => r.title, render: (r) => <span className="text-[16px] font-semibold">{r.title}</span> },
    { key: 'venue', header: 'Venue', render: (r) => r.venue },
    { key: 'from', header: 'From Date', sort: (r) => Date.parse(r.from) || 0, render: (r) => <span className="whitespace-nowrap">{r.from}</span> },
    { key: 'to', header: 'To Date', sort: (r) => Date.parse(r.to) || 0, render: (r) => <span className="whitespace-nowrap">{r.to}</span> },
    { key: 'pax', header: 'Proposed Pax', sort: (r) => r.pax, render: (r) => r.pax, className: 'text-right tabular-nums' },
    { key: 'status', header: 'Status', filter: (r) => r.status.split(' · ')[0], render: (r) => <Badge t={r.status === 'Scheduled' ? 'info' : r.status.startsWith('Forwarded') ? 'neutral' : undefined}>{r.scheduledAs ? `Scheduled · ${r.scheduledAs}` : r.status}</Badge> },
    {
      key: 'act', header: 'Actions', render: (r) => (
        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {r.scheduledAs
            ? <Btn v="link" onClick={() => nav('/hr/calendar')}>Open Training Calendar</Btn>
            : r.story && s.scheduled ? <Btn v="link" onClick={() => nav('/hr/schedule')}>Open Training Scheduling</Btn>
            : <Btn size="sm" v="secondary" onClick={() => schedule(r)}>Schedule Training</Btn>}
          {canForward(r) && <Btn size="sm" v="ghost" onClick={() => { setFwd(r); setTo(HR_ADMINS[0]); }}>Forward</Btn>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHead title="Training Request Received" fr="FR 65–66"
        meta="Summary of all training requests from divisions. Open a row to review it."
        tags={<SourceTag kind="fictional" />} />

      <DataTable rows={rows} columns={columns} rowKey={(r) => r.id} searchText={(r) => `${r.id} ${r.title} ${r.division} ${r.by}`}
        searchPlaceholder="Search by request ID, training or division" label="requests"
        onRowClick={(r) => nav(`/hr/requests/${r.id}`)} rowClassName={(r) => (r.story && !s.reviewed ? 'bg-brand-soft/20' : '')} />

      {!s.requestSubmitted && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[16px] text-ink-2">
          <span>{TRAINING.requestId} ({TRAINING.title}) appears here as soon as the Division Head submits it.</span>
          <Btn v="link" onClick={() => switchRole('division_head', '/request/new')}>Open the request as Division Head <ArrowRight size={16} /></Btn>
        </div>
      )}

      <section className="mt-10 rounded-2xl bg-[#faf8f5] p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[22px] font-bold">Presenter note · two ways into scheduling</h2>
          <FrRef>FR 66, 93–96</FrRef>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-[17px] font-semibold">Nomination path (the guided story)</div>
            <p className="mt-1 text-[16px] text-ink-2">Review the request, create a Nomination Request, collect nominations from Learning Champions, then schedule with <b>Load Training Profile = Yes</b>. The profile and the nominations load into Training Scheduling.</p>
          </div>
          <div>
            <div className="text-[17px] font-semibold">Direct path</div>
            <p className="mt-1 text-[16px] text-ink-2"><b>Schedule Training</b> on a request goes straight to Training Scheduling with <b>Load Training Profile = No</b>. HR enters the details manually and the training is tagged to the request. Try it on any row other than {TRAINING.requestId}: it adds a programme to the Training Calendar.</p>
          </div>
        </div>
      </section>

      <Modal open={!!fwd} onClose={() => setFwd(null)} title={`Forward ${fwd?.id ?? ''}`}
        footer={<><Btn v="secondary" onClick={() => setFwd(null)}>Cancel</Btn><Btn onClick={confirmForward}>Forward</Btn></>}>
        <p className="mb-4 text-[16px] text-ink-2">Assign <b>{fwd?.title}</b> to a specific HR Admin. It appears in their task inbox and the audit trail records the hand-over (FR 66).</p>
        <div className="space-y-4">
          <FormField label="HR Admin">
            <select className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}>{HR_ADMINS.map((a) => <option key={a}>{a}</option>)}</select>
          </FormField>
          <FormField label="Note (optional)">
            <textarea rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please check the trainer budget with BIBM" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
