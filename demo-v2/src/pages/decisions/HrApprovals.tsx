import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Inbox, Mail } from 'lucide-react';
import { NOMINEE_LIST, PERSONAS, TRAINING } from '../../data';
import { DIRECTORY, findByEid, findById, type Person } from '../../org';
import { roster, useDemo, type DemoState, type Withdrawal } from '../../store';
import { CheckList, DecisionLayout, DecisionPanel, FactGroup, PageHead, ReasonModal } from '../../components/Templates';
import { DataTable, type Column } from '../../components/DataTable';
import { SourceTag } from '../../components/Source';
import { Alert, Badge, Btn, cx } from '../../components/ui';

type Group = 'Waiting for you' | 'With System Admin' | 'Done';
type Kind = 'Withdrawal' | 'Replacement' | 'Trainer material' | 'Training record' | 'Extra attendee';
interface Item { key: string; kind: Kind; title: string; detail: string; from: string; at: string; group: Group; fr: string; status: string }

const PROTECTION = ['Preview only + watermark', 'View only · no download', 'Download allowed'];
const hrLabel = PERSONAS.hr.label;

interface RecReq { name: string; title: string; institute: string; date: string; at: string; state: 'pending' | 'approved' | 'rejected'; empId: string }
/** Record requests from employees other than Ayesha (Ayesha's lives in the store's recordRequest). */
function otherRecordRequests(s: DemoState): RecReq[] {
  return s.audit
    .filter((a) => a.action === 'Training record submitted' && !a.detail.startsWith('Ayesha Rahman'))
    .map((a) => {
      const [name, rest = '', date = ''] = a.detail.split(' · ');
      const m = rest.match(/^(.*) \((.*)\)$/);
      const title = m ? m[1] : rest;
      const institute = m ? m[2] : '';
      const decided = s.audit.find((x) => (x.action === 'Training record approved' || x.action === 'Training record rejected') && x.detail.startsWith(`${name} · ${title}`));
      const p = DIRECTORY.find((x) => x.name === name);
      return { name, title, institute, date, at: a.at, state: decided ? (decided.action === 'Training record approved' ? 'approved' : 'rejected') : 'pending', empId: p?.id ?? '' } as RecReq;
    });
}

const withdrawalsOf = (s: DemoState): Withdrawal[] => [...(s.withdrawal.status !== 'none' ? [s.withdrawal] : []), ...Object.values(s.otherWithdrawals)];
const hrRejected = (s: DemoState, name: string) => s.audit.some((a) => a.action === 'Withdrawal rejected' && a.actorRole === hrLabel && a.detail.startsWith(name));

function itemsOf(s: DemoState): Item[] {
  const out: Item[] = [];
  withdrawalsOf(s).forEach((w) => {
    const p = findById(w.empId);
    if (!p) return;
    const decidedByHr = w.status === 'approved' || (w.status === 'rejected' && hrRejected(s, p.name));
    if (w.status !== 'proposed' && !decidedByHr) return;
    const rep = w.replacementId ? findById(w.replacementId) : undefined;
    const ev = s.audit.find((a) => (a.action === 'Replacement proposed' || a.action === 'Withdrawal approved') && a.detail.includes(p.name));
    out.push({
      key: `wd:${w.empId}`, kind: rep ? 'Replacement' : 'Withdrawal', title: rep ? `${p.name} → ${rep.name}` : `${p.name} withdraws`,
      detail: `${p.eid} · ${TRAINING.title}`, from: `${p.supervisor}, Supervisor`, at: ev?.at ?? '', group: w.status === 'proposed' ? 'Waiting for you' : 'Done', fr: 'FR 119',
      status: w.status === 'proposed' ? 'Decide' : w.status === 'approved' ? 'Approved' : 'Rejected',
    });
  });
  if (s.materialLinkRequested) {
    const ev = s.audit.find((a) => a.action === 'Material uploaded');
    out.push({ key: 'mat', kind: 'Trainer material', title: 'Link trainer material to the training', detail: 'Credit_Risk_Case_Pack_v3.pdf', from: 'Nafis Ahmed, Trainer', at: ev?.at ?? '', group: s.materialLinked ? 'Done' : 'Waiting for you', fr: 'FR 19', status: s.materialLinked ? 'Linked' : 'Decide' });
  }
  if (s.recordRequest !== 'none') {
    const ev = s.audit.find((a) => a.action === 'Training record submitted' && a.detail.startsWith('Ayesha Rahman'));
    out.push({ key: 'rec:e1', kind: 'Training record', title: `Ayesha Rahman · ${s.recordDetails.title}`, detail: `${s.recordDetails.institute} · ${s.recordDetails.date}`, from: 'Ayesha Rahman, Employee', at: ev?.at ?? '', group: s.recordRequest === 'pending' ? 'Waiting for you' : 'Done', fr: 'FR 6, 172', status: s.recordRequest === 'pending' ? 'Decide' : 'Approved' });
  }
  otherRecordRequests(s).forEach((r, i) => out.push({ key: `rec:${i}`, kind: 'Training record', title: `${r.name} · ${r.title}`, detail: `${r.institute} · ${r.date}`, from: `${r.name}, Employee`, at: r.at, group: r.state === 'pending' ? 'Waiting for you' : 'Done', fr: 'FR 6, 172', status: r.state === 'pending' ? 'Decide' : r.state === 'approved' ? 'Approved' : 'Rejected' }));
  s.extraAttendees.forEach((x) => out.push({ key: `xa:${x.eid}`, kind: 'Extra attendee', title: `${x.name} joined online but is not on the list`, detail: `${x.eid} · ${TRAINING.title}`, from: 'Teams attendance', at: '', group: x.status === 'requested' ? 'With System Admin' : 'Done', fr: 'FR 143', status: x.status === 'requested' ? 'With Admin' : 'Approved by Admin' }));
  return out;
}

function MailPreview({ kind, to, cc, subject, body }: { kind: string; to: string; cc: string; subject: string; body: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white">
      <header className="border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-ink-2"><Mail size={16} />{kind}</div>
        <dl className="mt-2 grid grid-cols-[64px_1fr] gap-y-1 text-[15px]">
          <dt className="text-ink-3">To</dt><dd>{to}</dd>
          <dt className="text-ink-3">CC</dt><dd>{cc}</dd>
          <dt className="text-ink-3">Subject</dt><dd className="font-semibold">{subject}</dd>
        </dl>
      </header>
      <p className="whitespace-pre-line px-5 py-4 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </article>
  );
}

function checksOf(p: Person) {
  const n = NOMINEE_LIST.find((e) => e.id === p.id);
  const issue = n?.issue ?? '';
  return [
    { label: 'HRIS', text: `Active employee · ${p.grade} · ${p.division}`, ok: true, source: 'HRIS' },
    { label: 'Leave', text: (n?.leave ?? 'Clear') === 'Clear' ? 'No leave on 18–19 Nov' : n!.leave, ok: (n?.leave ?? 'Clear') === 'Clear', source: 'Leave Management' },
    { label: 'Calendar', text: (n?.calendar ?? 'Clear') === 'Clear' ? 'Free on 18–19 Nov' : issue, ok: (n?.calendar ?? 'Clear') === 'Clear', source: 'Outlook calendar' },
    { label: 'Training overlap', text: /overlapping/i.test(issue) ? issue : 'No other training on these dates', ok: !/overlapping/i.test(issue), source: 'Training database' },
    { label: 'Resignation / Retirement', text: /retire|resign/i.test(issue) ? issue : 'None on record', ok: !/retire|resign/i.test(issue), source: 'HRIS' },
  ];
}

/* ---------------- Withdrawal / replacement decision (J13) ---------------- */
function WithdrawalDecision({ w, back }: { w: Withdrawal; back: ReactNode }) {
  const s = useDemo();
  const [reject, setReject] = useState(false);
  const p = findById(w.empId)!;
  const rep = w.replacementId ? findById(w.replacementId) : undefined;
  const now = roster(s).length;
  const after = w.status === 'proposed' ? (rep ? now : now - 1) : now;
  const supAction = w.replacementId ? 'Approve Withdrawal with Replacement' : 'Approve Withdrawal';
  const panel = w.status === 'proposed' ? (
    <DecisionPanel what={<>Approving sends {rep ? 'the inclusion and exclusion emails' : 'the exclusion email'} with supervisors in CC. The participant list {rep ? `stays at ${after}` : `goes to ${after}`}.</>}>
      <Btn size="lg" onClick={() => s.hrDecideWithdrawalFor(w.empId, true)}>Approve</Btn>
      <Btn v="secondary" onClick={() => setReject(true)}>Reject</Btn>
    </DecisionPanel>
  ) : (
    <DecisionPanel title="Decision recorded" what={w.status === 'approved' ? (rep ? `${rep.name} replaces ${p.name}. Both emails went out with supervisors in CC.` : `${p.name} is withdrawn. The exclusion email went out with the supervisor in CC.`) : `${p.name} stays on the training. The supervisor was informed.`}>
      <Alert kind={w.status === 'approved' ? 'ok' : 'info'} title={`Participant list: ${now}`}>{w.status === 'approved' && rep ? 'Unchanged after the replacement.' : 'Updated.'}</Alert>
      {back}
    </DecisionPanel>
  );
  return (
    <DecisionLayout panel={panel}>
      <div className="space-y-10">
        <FactGroup title="Request" rows={[
          ['Employee', `${p.name} · ${p.eid} · ${p.designation}, ${p.division}`],
          ['Training', `${TRAINING.title} · ${TRAINING.dates}`],
          ['Employee’s reason', `“${w.reason}”`],
          [`Supervisor · ${p.supervisor}`, <span key="sup"><b>{supAction}</b>{w.supReason ? ` · “${w.supReason}”` : ''}</span>],
          ['Participant list', `${now} now · ${after} after your approval`],
        ]} />
        {rep && (
          <>
            <FactGroup title="Replacement" rows={[
              ['Name · EID', `${rep.name} · ${rep.eid}`],
              ['Designation · grade', `${rep.designation} · ${rep.grade}`],
              ['Division · department', `${rep.division} · ${rep.department}`],
              ['Supervisor', rep.supervisor],
            ]} />
            <CheckList title="Replacement checks" items={checksOf(rep)} />
          </>
        )}
        <section>
          <h2 className="mb-3 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">Emails sent on approval <SourceTag kind="simulated" /></h2>
          <div className="grid gap-4 2xl:grid-cols-2">
            {rep && <MailPreview kind="Inclusion email" to={`${rep.name} (${rep.eid})`} cc={`${rep.supervisor}, Supervisor`} subject={`Invitation: ${TRAINING.title} · ${TRAINING.dates}`} body={`Dear ${rep.name.split(' ')[0]},\n\nYou have been added to ${TRAINING.title} (training ${TRAINING.trainingId}) as a replacement participant.\nDates: ${TRAINING.dates}, ${TRAINING.time}\nVenue: ${s.sched.venue}\n\nPlease open ELDP to Accept, or use Withdraw Request if you cannot attend.\n\nNusrat Jahan\nHR Admin, Learning & Development`} />}
            <MailPreview kind="Exclusion email" to={`${p.name} (${p.eid})`} cc={`${p.supervisor}, Supervisor`} subject={`Withdrawal approved: ${TRAINING.title}`} body={`Dear ${p.name.split(' ')[0]},\n\nYour request to withdraw from ${TRAINING.title} (${TRAINING.dates}) has been approved by your supervisor and HR. You are no longer a participant.${rep ? `\n${rep.name} attends in your place.` : ''}\n\nNusrat Jahan\nHR Admin, Learning & Development`} />
          </div>
        </section>
      </div>
      <ReasonModal
        open={reject}
        optional
        title="Reject the withdrawal"
        intro={<>{p.name} stays on the training. The supervisor and employee are told.</>}
        confirm="Reject"
        onClose={() => setReject(false)}
        onConfirm={(reason) => { s.hrDecideWithdrawalFor(w.empId, false); if (reason) s.logEvent('hr', 'Withdrawal rejection reason', `${p.name} · ${reason}`); setReject(false); }}
      />
    </DecisionLayout>
  );
}

/* ---------------- Trainer material (FR 19) ---------------- */
function MaterialDecision({ back }: { back: ReactNode }) {
  const s = useDemo();
  const [prot, setProt] = useState(s.materialProtection || PROTECTION[0]);
  const ev = s.audit.find((a) => a.action === 'Material uploaded');
  const panel = s.materialLinked ? (
    <DecisionPanel title="Linked to the training" what={`Participants see it on their invitation · ${s.materialProtection}.`}>{back}</DecisionPanel>
  ) : (
    <DecisionPanel what="Choose how participants can use the file, then link it to the training.">
      <fieldset className="space-y-2" aria-label="Protection">
        {PROTECTION.map((x) => (
          <label key={x} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[16px]', prot === x ? 'border-brand bg-brand-soft/40' : 'border-line')}>
            <input type="radio" name="protection" checked={prot === x} onChange={() => setProt(x)} />{x}
          </label>
        ))}
      </fieldset>
      <Btn size="lg" onClick={() => s.linkMaterial(prot)}>Link to training</Btn>
    </DecisionPanel>
  );
  return (
    <DecisionLayout panel={panel}>
      <FactGroup title="Trainer material" rows={[
        ['File', <span key="f" className="flex items-center gap-2"><FileText size={16} className="text-ink-3" />Credit_Risk_Case_Pack_v3.pdf</span>],
        ['Uploaded by', `Nafis Ahmed, Trainer${ev ? ` · ${ev.at}` : ''}`],
        ['Training', `${TRAINING.title} · training ${TRAINING.trainingId}`],
        ['Visible to', `${roster(s).length} participants once linked`],
      ]} />
    </DecisionLayout>
  );
}

/* ---------------- Employee record request (FR 6, 172) ---------------- */
function RecordDecision({ item, back }: { item: Item; back: ReactNode }) {
  const s = useDemo();
  const [reject, setReject] = useState(false);
  const isE1 = item.key === 'rec:e1';
  const other = isE1 ? undefined : otherRecordRequests(s)[Number(item.key.split(':')[1])];
  const name = isE1 ? 'Ayesha Rahman' : other?.name ?? '';
  const p = isE1 ? findById('e1') : other ? findById(other.empId) : undefined;
  const d = isE1 ? s.recordDetails : { title: other?.title ?? '', institute: other?.institute ?? '', date: other?.date ?? '', file: 'certificate.pdf' };
  const state = isE1 ? s.recordRequest : other?.state ?? 'pending';
  const approve = () => {
    if (isE1) { s.approveRecord(); return; }
    if (!p) return;
    s.addDbRows([{ eid: p.eid, name: p.name, grade: p.grade, designation: p.designation, division: p.division, location: p.location, training: d.title, meta: 'Functional · External-local · Classroom', institute: d.institute, duration: d.date, manHour: '—', source: 'Employee request' }], 'Employee request');
    s.logEvent('hr', 'Training record approved', `${p.name} · ${d.title} added to training database`);
  };
  const panel = state === 'pending' ? (
    <DecisionPanel what="Approving adds it to the employee’s learning record and the training database (FR 172).">
      <Btn size="lg" onClick={approve}>Approve &amp; add to Training Database</Btn>
      <Btn v="secondary" onClick={() => setReject(true)}>Reject</Btn>
    </DecisionPanel>
  ) : (
    <DecisionPanel title="Decision recorded" what={state === 'approved' ? `${d.title} is on ${name}’s record and in the training database.` : `${d.title} was not added. ${name} was told why.`}>{back}</DecisionPanel>
  );
  return (
    <DecisionLayout panel={panel}>
      <FactGroup title="Employee-submitted training record" rows={[
        ['Employee', p ? `${p.name} · ${p.eid} · ${p.designation}` : name],
        ['Training / course', d.title],
        ['Institute', d.institute],
        ['Completed', d.date],
        ['Certificate', <span key="c" className="flex items-center gap-2"><FileText size={16} className="text-ink-3" />{d.file}</span>],
      ]} />
      <ReasonModal
        open={reject}
        title="Reject the training record"
        confirm="Reject"
        suggested="The certificate could not be verified with the institute."
        onClose={() => setReject(false)}
        onConfirm={(reason) => {
          if (isE1) s.rejectRecord();
          s.logEvent('hr', 'Training record rejected', `${name} · ${d.title} · ${reason}`);
          setReject(false);
        }}
      />
    </DecisionLayout>
  );
}

/* ---------------- Page ---------------- */
export function HrApprovals() {
  const s = useDemo();
  const nav = useNavigate();
  const [sel, setSel] = useState<string | null>(null);
  const items = itemsOf(s);
  const waiting = items.filter((i) => i.group === 'Waiting for you').length;
  const open = items.find((i) => i.key === sel);
  const backToList = <><Btn v="secondary" onClick={() => setSel(null)}>Back to approvals</Btn><Btn v="ghost" onClick={() => nav('/r/hr')}>Back to My work</Btn></>;

  const head = (
    <PageHead
      title="Approvals"
      meta={`${waiting} waiting for you · Nusrat Jahan, HR Admin`}
      fr="FR 6, 19, 119, 143, 172"
      tags={<SourceTag kind="fictional" />}
    />
  );

  if (open) {
    const w = open.key.startsWith('wd:') ? withdrawalsOf(s).find((x) => `wd:${x.empId}` === open.key) : undefined;
    const xa = open.key.startsWith('xa:') ? s.extraAttendees.find((x) => `xa:${x.eid}` === open.key) : undefined;
    return (
      <div>
        {head}
        <Btn v="link" onClick={() => setSel(null)}><ArrowLeft size={16} />All approvals</Btn>
        <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-[24px] font-bold tracking-tight">{open.kind}: {open.title}</h2>
          <Badge t={open.group === 'Waiting for you' ? 'warn' : open.group === 'Done' ? 'ok' : 'info'}>{open.group}</Badge>
          <span className="text-[14px] font-semibold text-ink-3">{open.fr}</span>
        </div>
        {w && <WithdrawalDecision w={w} back={backToList} />}
        {open.key === 'mat' && <MaterialDecision back={backToList} />}
        {open.key.startsWith('rec:') && <RecordDecision item={open} back={backToList} />}
        {xa && (
          <DecisionLayout panel={<DecisionPanel title="For System Admin" what="Extra attendees are approved by the System Admin (FR 143). You can see the request here; you cannot decide it.">{backToList}</DecisionPanel>}>
            <FactGroup title="Extra attendee" rows={[
              ['Name · EID', `${xa.name} · ${xa.eid}`],
              ['Found in directory', findByEid(xa.eid) ? `${findByEid(xa.eid)!.designation}, ${findByEid(xa.eid)!.division}` : 'Not found in HRIS'],
              ['Joined', 'Online session via Teams login (simulated)'],
              ['Status', xa.status === 'requested' ? 'Waiting for System Admin' : 'Approved by System Admin · marked present'],
            ]} />
          </DecisionLayout>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        {head}
        <div className="rounded-2xl border border-dashed border-line bg-white px-8 py-12 text-center">
          <Inbox size={32} className="mx-auto text-ink-3" />
          <h2 className="mt-3 text-[22px] font-bold">No approvals waiting</h2>
          <p className="mx-auto mt-2 max-w-xl text-[16px] text-ink-2">Withdrawal and replacement decisions from supervisors, trainer material and employee record requests appear here.</p>
          <div className="mt-6"><Btn v="secondary" onClick={() => nav('/r/hr')}>Back to My work</Btn></div>
        </div>
      </div>
    );
  }

  const cols: Column<Item>[] = [
    { key: 'title', header: 'Request', render: (i) => <div><div className="font-semibold">{i.title}</div><div className="text-[14px] text-ink-3">{i.detail}</div></div>, sort: (i) => i.title },
    { key: 'kind', header: 'Type', render: (i) => i.kind, filter: (i) => i.kind },
    { key: 'from', header: 'From', render: (i) => i.from },
    { key: 'at', header: 'Received', render: (i) => <span className="whitespace-nowrap">{i.at ? i.at.slice(12) || i.at : '—'}</span>, sort: (i) => i.at },
    { key: 'status', header: 'Status', render: (i) => <Badge t={i.status === 'Decide' ? 'warn' : i.group === 'With System Admin' ? 'info' : i.status === 'Rejected' ? 'neutral' : 'ok'}>{i.status === 'Decide' ? 'Waiting for you' : i.status}</Badge> },
    { key: 'open', header: '', render: (i) => <Btn size="sm" v={i.status === 'Decide' ? 'primary' : 'secondary'} onClick={() => setSel(i.key)}>{i.status === 'Decide' ? 'Decide' : 'View'}</Btn> },
  ];

  return (
    <div>
      {head}
      {waiting === 0 && <div className="mb-6"><Alert kind="ok" title="Nothing waiting for you" action={<Btn size="sm" v="secondary" onClick={() => nav('/r/hr')}>Back to My work</Btn>}>Everything below has a decision.</Alert></div>}
      <DataTable
        rows={items}
        columns={cols}
        rowKey={(i) => i.key}
        searchText={(i) => `${i.title} ${i.detail} ${i.from}`}
        searchPlaceholder="Search approvals"
        groupBy={(i) => i.group}
        groupOrder={['Waiting for you', 'With System Admin', 'Done']}
        onRowClick={(i) => setSel(i.key)}
        label="approvals"
      />
    </div>
  );
}
