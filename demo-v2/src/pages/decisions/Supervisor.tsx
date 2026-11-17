import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Quote, Search } from 'lucide-react';
import { NOMINEE_LIST, TRAINING } from '../../data';
import { DIRECTORY, directReports, findById, searchPeople, type Person } from '../../org';
import { roster, useDemo, type DemoState, type Withdrawal } from '../../store';
import { DecisionLayout, DecisionPanel, FactGroup, NotYet, PageHead, ReasonModal } from '../../components/Templates';
import { DataTable, type Column } from '../../components/DataTable';
import { SourceTag } from '../../components/Source';
import { Alert, Avatar, Badge, Btn, cx, inputCls, Modal } from '../../components/ui';

const ME = 'Mahmud Karim';

interface Req { id: string; w: Withdrawal; p: Person; at: string; mine: boolean }

const statusOf = (w: Withdrawal): { text: string; tone: string } => {
  switch (w.status) {
    case 'requested': return { text: 'Waiting for you', tone: 'warn' };
    case 'proposed': return { text: w.replacementId ? 'Replacement · with HR Admin' : 'Approved · with HR Admin', tone: 'info' };
    case 'approved': return { text: w.replacementId ? 'Replaced · HR approved' : 'Withdrawn · HR approved', tone: 'ok' };
    case 'rejected': return { text: 'Rejected · stays on training', tone: 'neutral' };
    default: return { text: 'None', tone: 'neutral' };
  }
};

function requestsOf(s: DemoState): Req[] {
  const team = new Set(directReports(ME).map((p) => p.id));
  const all = [...(s.withdrawal.status !== 'none' ? [s.withdrawal] : []), ...Object.values(s.otherWithdrawals)];
  return all.flatMap((w) => {
    const p = findById(w.empId);
    if (!p) return [];
    const ev = s.audit.find((a) => a.action === 'Withdrawal requested' && a.detail.startsWith(p.name));
    return [{ id: w.empId, w, p, at: ev?.at ?? '12 Nov 2026', mine: team.has(p.id) }];
  });
}

/* ---------------- Replacement candidate checks (simulated HRIS, leave, Outlook, training DB) ---------------- */
interface Chk { label: string; ok: boolean; text: string }
function checksFor(p: Person): Chk[] {
  const n = NOMINEE_LIST.find((e) => e.id === p.id);
  const issue = n?.issue ?? '';
  const leave = n?.leave ?? 'Clear';
  const cal = n?.calendar ?? 'Clear';
  return [
    { label: 'HRIS', ok: true, text: `Active employee · ${p.grade} · ${p.division}` },
    { label: 'Leave', ok: leave === 'Clear', text: leave === 'Clear' ? 'No leave on 18–19 Nov' : leave },
    { label: 'Calendar', ok: cal === 'Clear', text: cal === 'Clear' ? 'Free on 18–19 Nov (Outlook)' : issue || 'Meeting on a training day' },
    { label: 'Training overlap', ok: !/overlapping/i.test(issue), text: /overlapping/i.test(issue) ? issue : 'No other training on these dates' },
    { label: 'Resignation / Retirement', ok: !/retire|resign/i.test(issue), text: /retire|resign/i.test(issue) ? issue : 'None on record' },
  ];
}
const alertOf = (p: Person) => checksFor(p).find((c) => !c.ok)?.text ?? '';

function ReplacementModal({ open, req, onClose, onConfirm }: { open: boolean; req: Req; onClose: () => void; onConfirm: (repId: string, reason: string) => void }) {
  const s = useDemo();
  const onList = new Set(roster(s).map((e) => e.id));
  const taken = new Set([s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => w.status === 'proposed' || w.status === 'approved').map((w) => w.replacementId));
  const canPick = (p: Person) => !onList.has(p.id) && !taken.has(p.id) && p.id !== req.id;
  const suggested = ['e4', 'n1', 'n2', 'n3', 'n4', 'c1', 'c2', 'c3'].map(findById).filter((p): p is Person => !!p);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<string>(() => suggested.find((p) => canPick(p) && !alertOf(p))?.id ?? '');
  const [done, setDone] = useState(0);
  const [reason, setReason] = useState('');
  const list = (q.trim() ? searchPeople(q, 10) : suggested).filter((p) => p.id !== req.id);
  const cand = pick ? findById(pick) : undefined;
  const checks = cand ? checksFor(cand) : [];
  const allOk = !!cand && canPick(cand) && checks.every((c) => c.ok);

  useEffect(() => {
    if (!open || !pick) return;
    setDone(0);
    let n = 0;
    const t = setInterval(() => { n += 1; setDone(n); if (n >= 5) clearInterval(t); }, 380);
    return () => clearInterval(t);
  }, [pick, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approve Withdrawal with Replacement"
      footer={<><Btn v="secondary" onClick={onClose}>Cancel</Btn><Btn disabled={!cand || !allOk || done < 5 || reason.trim().length < 3} onClick={() => cand && onConfirm(cand.id, reason.trim())}>Approve Withdrawal with Replacement</Btn></>}
    >
      <div className="space-y-5">
        <div>
          <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 focus-within:border-brand">
            <Search size={16} className="text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the employee directory by name or EID" aria-label="Search the employee directory" className="w-full bg-transparent text-[15px] outline-none" />
          </label>
          <ul className="mt-2 max-h-48 divide-y divide-line overflow-y-auto rounded-lg border border-line" role="listbox" aria-label="Replacement candidates">
            {list.length === 0 && <li className="px-3 py-3 text-[15px] text-ink-3">No one in the directory matches “{q}”.</li>}
            {list.map((p) => {
              const ok = canPick(p);
              const warn = alertOf(p);
              return (
                <li key={p.id}>
                  <button role="option" aria-selected={pick === p.id} disabled={!ok} onClick={() => setPick(p.id)} className={cx('flex w-full items-center gap-3 px-3 py-2.5 text-left', pick === p.id ? 'bg-brand-soft/50' : 'hover:bg-[#faf8f5]', !ok && 'cursor-not-allowed opacity-60')}>
                    <Avatar name={p.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{p.name} <span className="font-normal text-ink-3">· {p.eid}</span></span>
                      <span className="block text-[14px] text-ink-3">{p.designation} · {p.division}</span>
                    </span>
                    {!ok ? <Badge t="neutral">{onList.has(p.id) ? 'Already a participant' : 'Already proposed'}</Badge> : warn ? <Badge t="warn">Alert</Badge> : <Badge t="ok">No alerts</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {cand && (
          <div>
            <div className="mb-2 text-[15px] font-semibold text-ink-2">Live eligibility check · {cand.name} <SourceTag kind="simulated" /></div>
            <ul className="space-y-1.5" aria-live="polite">
              {checks.map((c, i) => {
                const shown = i < done;
                return (
                  <li key={c.label} className={cx('flex items-start gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors', !shown ? 'bg-canvas' : c.ok ? 'bg-ok-soft' : 'bg-warn-soft')}>
                    <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white', !shown ? 'bg-line' : c.ok ? 'bg-ok' : 'bg-amber-500')}>{shown ? (c.ok ? <Check size={12} /> : '!') : <span className={cx('h-1.5 w-1.5 rounded-full bg-white', i === done && 'anim-scan')} />}</span>
                    <span className="w-48 shrink-0 font-semibold">{c.label}</span>
                    <span className={cx(!shown && 'text-ink-3')}>{shown ? c.text : i === done ? 'Checking…' : 'Queued'}</span>
                  </li>
                );
              })}
            </ul>
            {done >= 5 && !allOk && <p className="mt-2 text-[15px] font-semibold text-warn">{cand.name} cannot replace {req.p.name}. Choose someone without alerts.</p>}
          </div>
        )}
        <label className="block">
          <span className="text-[15px] font-semibold text-ink-2">Reason (required)</span>
          <textarea rows={2} className={cx(inputCls, 'mt-1.5')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button className="-mt-3 text-[15px] font-semibold text-brand hover:underline" onClick={() => setReason(`Client commitment on 18 Nov; ${cand?.name ?? 'the replacement'} has the same competency target.`)}>Use suggested reason</button>
      </div>
    </Modal>
  );
}

/* ---------------- Decision for one request ---------------- */
function RequestDecision({ req, onBack }: { req: Req; onBack: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const [modal, setModal] = useState<'approve' | 'replace' | 'reject' | null>(null);
  const { w, p } = req;
  const n = NOMINEE_LIST.find((e) => e.id === p.id);
  const team = directReports(p.supervisor);
  const onTraining = new Set(roster(s).map((e) => e.id));
  const teamAway = team.filter((x) => onTraining.has(x.id) && s.participation[x.id] !== 'Withdrawn').length;
  const st = statusOf(w);
  const rep = w.replacementId ? findById(w.replacementId) : undefined;
  const story = req.id === 'e2';
  const decide = (d: 'approve' | 'replace' | 'reject', reason: string, repId = '') => { s.decideWithdrawalFor(req.id, d, reason, repId); setModal(null); };

  const panel = w.status === 'requested' ? (
    <DecisionPanel what={<>Choose one (FR 119). A reason is required. HR Admin gives the final approval{story ? '' : '; the employee is told by email'}.</>}>
      <Btn onClick={() => setModal('replace')}>Approve Withdrawal with Replacement</Btn>
      <p className="-mt-1 text-[15px] text-ink-2">The participant count stays the same. You pick a colleague; ELDP checks them live.</p>
      <Btn v="secondary" onClick={() => setModal('approve')}>Approve Withdrawal</Btn>
      <div className="mt-2 border-t border-line pt-4"><Btn v="danger" className="w-full" onClick={() => setModal('reject')}>Reject</Btn></div>
    </DecisionPanel>
  ) : (
    <DecisionPanel title="Decision recorded" what={<>{st.text}{w.supReason ? `. Your reason: ${w.supReason}` : ''}</>}>
      {rep && <Alert kind={w.status === 'approved' ? 'ok' : 'info'} title={`Replacement: ${rep.name}`}>{rep.designation} · {rep.division} · {rep.eid}</Alert>}
      {w.status === 'proposed' && <p className="text-[15px] text-ink-2">HR Admin approves it next; inclusion and exclusion emails then go out with supervisors in CC.</p>}
      <Btn v="secondary" onClick={onBack}>Back to all requests</Btn>
      {!story && <Btn v="ghost" onClick={() => nav('/r/supervisor')}>Back to My work</Btn>}
    </DecisionPanel>
  );

  return (
    <div>
      <Btn v="link" onClick={onBack}><ArrowLeft size={16} />All requests from your team</Btn>
      {!req.mine && <div className="mt-3"><Alert kind="warn" title={`Deciding as ${p.supervisor}, ${p.name}’s supervisor`}>{p.name} reports to {p.supervisor}, not to you. This shortcut lets the demo continue the request. <SourceTag kind="concept">Demo shortcut</SourceTag></Alert></div>}
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <Avatar name={p.name} size={44} />
        <h2 className="text-[24px] font-bold tracking-tight">{p.name} · withdrawal request</h2>
        <Badge t={st.tone}>{st.text}</Badge>
      </div>
      <DecisionLayout panel={panel}>
        <div className="space-y-10">
          <section>
            <h3 className="mb-3 text-[20px] font-bold tracking-tight">Employee’s reason</h3>
            <blockquote className="flex gap-3 rounded-2xl border-l-4 border-amber-400 bg-white px-6 py-5 text-[17px]">
              <Quote size={20} className="mt-1 shrink-0 text-ink-3" />
              <span>{w.reason}<span className="mt-1 block text-[15px] text-ink-3">{p.name} · {req.at}</span></span>
            </blockquote>
          </section>
          <FactGroup title="Employee" rows={[
            ['Name · EID', `${p.name} · ${p.eid}`],
            ['Designation · grade', `${p.designation} · ${p.grade}`],
            ['Department · location', `${p.department}, ${p.division} · ${p.location}`],
            ['Reports to', p.supervisor === ME ? `${ME} (you)` : p.supervisor],
          ]} />
          <FactGroup title="Training" rows={[
            ['Programme', `${TRAINING.title} · training ${TRAINING.trainingId}`],
            ['Dates', `${TRAINING.dates} · ${TRAINING.time}`],
            ['Current status', s.participation[p.id] ?? 'Invited'],
          ]} />
          <FactGroup title="Calendar and leave context" rows={[
            ['Leave', n?.leave ?? 'Clear'],
            ['Calendar', p.id === 'e2' ? 'Client meeting 18 Nov, 10:00 (Outlook)' : n?.calendar === 'Clear' || !n ? 'Free on 18–19 Nov' : n.issue ?? n.calendar],
            ['Flagged at nomination', n?.issue ?? 'No'],
            ['Team on this training', `${teamAway} of ${team.length} people reporting to ${p.supervisor === ME ? 'you' : p.supervisor}`],
          ]} />
        </div>
      </DecisionLayout>

      {modal === 'replace' && <ReplacementModal open req={req} onClose={() => setModal(null)} onConfirm={(repId, reason) => decide('replace', reason, repId)} />}
      <ReasonModal
        open={modal === 'approve'}
        title="Approve Withdrawal"
        intro={<>{p.name} leaves the training without a replacement. The participant count drops by one.</>}
        confirm="Approve Withdrawal"
        suggested="Client commitment cannot be moved; no suitable replacement this time."
        onClose={() => setModal(null)}
        onConfirm={(reason) => decide('approve', reason)}
      />
      <ReasonModal
        open={modal === 'reject'}
        title="Reject"
        intro={<>{p.name} stays on the training and is told why.</>}
        confirm="Reject"
        suggested="The training is critical for your Credit Analysis target; please move the meeting."
        onClose={() => setModal(null)}
        onConfirm={(reason) => decide('reject', reason)}
      />
    </div>
  );
}

/* ---------------- Page ---------------- */
export function SupervisorRequests() {
  const s = useDemo();
  const [sel, setSel] = useState<string | null>(null);
  const reqs = requestsOf(s);
  const mine = reqs.filter((r) => r.mine);
  const others = reqs.filter((r) => !r.mine && r.w.status === 'requested');
  const team = directReports(ME);
  const waiting = mine.filter((r) => r.w.status === 'requested').length;
  const open = reqs.find((r) => r.id === sel);

  const head = (
    <PageHead
      title="Withdrawal requests"
      meta={`${ME} · Unit Head, Corporate Banking · ${team.length} direct reports`}
      sub={`${waiting} waiting for your decision · ${TRAINING.title}`}
      fr="FR 9–10, 119"
      tags={<SourceTag kind="fictional" />}
    />
  );

  if (open) return <div>{head}<RequestDecision req={open} onBack={() => setSel(null)} /></div>;
  if (reqs.length === 0) return <div>{head}<NotYet title="No withdrawal requests from your team" after="an employee in your team chooses Withdraw Request on their invitation" /></div>;

  const cols: Column<Req>[] = [
    { key: 'emp', header: 'Employee', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.p.name} size={32} /><div><div className="font-semibold">{r.p.name}</div><div className="text-[14px] text-ink-3">{r.p.designation}</div></div></div>, sort: (r) => r.p.name },
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums">{r.p.eid}</span> },
    { key: 'training', header: 'Training', render: () => <span>{TRAINING.title}<span className="block text-[14px] text-ink-3">{TRAINING.dates}</span></span> },
    { key: 'reason', header: 'Reason', render: (r) => <span className="line-clamp-2 max-w-[260px]">{r.w.reason}</span> },
    { key: 'at', header: 'Requested', render: (r) => <span className="whitespace-nowrap">{r.at.length > 12 ? `${r.at.slice(0, 6)}, ${r.at.slice(12)}` : r.at.slice(0, 6)}</span>, sort: (r) => r.at },
    { key: 'status', header: 'Status', render: (r) => <Badge t={statusOf(r.w).tone}>{statusOf(r.w).text}</Badge>, filter: (r) => statusOf(r.w).text },
    { key: 'open', header: '', render: (r) => <Btn size="sm" v={r.w.status === 'requested' ? 'primary' : 'secondary'} onClick={() => setSel(r.id)}>{r.w.status === 'requested' ? 'Decide' : 'View'}</Btn> },
  ];

  return (
    <div>
      {head}
      {waiting === 0 && mine.length > 0 && <div className="mb-6"><Alert kind="ok" title="Nothing waiting for you">Every request from your team has a decision. Status updates appear below.</Alert></div>}
      <DataTable
        rows={mine}
        columns={cols}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.p.name} ${r.p.eid}`}
        groupBy={(r) => (r.w.status === 'requested' ? 'Waiting for you' : 'Decided')}
        groupOrder={['Waiting for you', 'Decided']}
        onRowClick={(r) => setSel(r.id)}
        emptyText="No requests from your direct reports."
        label="requests"
      />
      <p className="mt-3 text-[15px] text-ink-3">Scope: your {team.length} direct reports in {DIRECTORY.find((x) => x.supervisor === ME)?.division ?? 'Corporate Banking'}, from the HRIS reporting line (fictional).</p>
      {others.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-white px-6 py-5">
          <div className="text-[16px] font-semibold">Requests outside your team go to the employee’s own supervisor</div>
          <ul className="mt-2 space-y-2">
            {others.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 text-[16px]">
                <span>{r.p.name} → {r.p.supervisor}</span>
                <Btn v="link" onClick={() => setSel(r.id)}>Decide as {r.p.supervisor}</Btn>
                <SourceTag kind="concept">Demo shortcut</SourceTag>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
