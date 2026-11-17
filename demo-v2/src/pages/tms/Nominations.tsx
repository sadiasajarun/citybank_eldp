import { useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, Check, ClipboardCheck, Hourglass, Lock, ShieldAlert, Users } from 'lucide-react';
import { StatCard } from '../../components/Dash';

const STAT_ICONS = [Building2, Users, ClipboardCheck, ShieldAlert, Hourglass, Lock];
import { CONFLICT_IDS, NOMINEE_LIST, TRAINING } from '../../data';
import { DIVISIONS, findById, VENDORS, VENUES } from '../../org';
import { roster, useDemo, type NominationSetup as NomSetup } from '../../store';
import type { Employee } from '../../types';
import { Alert, Badge, Btn, cx, Drawer, inputCls, Modal } from '../../components/ui';
import { DataTable, type Column } from '../../components/DataTable';
import { FactGroup, NotYet, PageHead, ReasonModal } from '../../components/Templates';
import { FrRef, SourceTag } from '../../components/Source';
import { checksFor } from '../Hero';
import { FormField } from './TrainingRequest';
import { fmtDeadline } from './NominationSetup';

type Mode = 'lc' | 'hr';
type Decision = 'keep' | 'remove';

const flagged = (e: Employee) => e.eligibility !== 'Eligible';
const NEEDS = 'Needs a decision';
const ELIGIBLE = 'Eligible';
const SUGGESTED: Record<Decision, string> = {
  keep: 'Leave is one day only; supervisor to confirm attendance',
  remove: 'Conflict confirmed with the Learning Champion',
};

/* ================================================================== */
/* Shared nominee table (J5 and J6)                                    */
/* ================================================================== */
function NomineeTable({ mode, rows, onOpen, activeId, check, selectable, bulk, footer, toolbar }: {
  mode: Mode; rows: Employee[]; onOpen: (e: Employee) => void; activeId?: string | null;
  /** LC mode: controlled tick boxes (all ticked by default). */
  check?: { on: (id: string) => boolean; toggle: (id: string) => void };
  selectable?: boolean; bulk?: (sel: Employee[], clear: () => void) => ReactNode; footer?: ReactNode; toolbar?: ReactNode;
}) {
  const s = useDemo();
  const action = (e: Employee): { text: string; tone: string } => {
    if (!flagged(e)) return { text: 'None', tone: 'text-ink-3' };
    if (mode === 'lc') return { text: 'HR will review', tone: 'font-semibold text-warn' };
    const r = s.resolutions[e.id];
    if (r === 'keep') return { text: 'Kept · override logged', tone: 'font-semibold text-ok' };
    if (r === 'remove') return { text: 'Removed', tone: 'text-ink-3' };
    return { text: s.finalized ? 'Decided at finalisation' : 'HR to keep or remove', tone: 'font-semibold text-warn' };
  };
  const cols: Column<Employee>[] = [
    ...(check ? [{
      key: 'tick', header: 'Nominate', render: (e: Employee) => (
        <span onClick={(ev) => ev.stopPropagation()}><input type="checkbox" aria-label={`Nominate ${e.name}`} checked={check.on(e.id)} onChange={() => check.toggle(e.id)} /></span>
      ),
    }] : []),
    { key: 'name', header: 'Employee', sort: (e) => e.name, render: (e) => <div className={cx(s.resolutions[e.id] === 'remove' && 'opacity-50')}><b className="text-[16px]">{e.name}</b><div className="text-[14px] text-ink-3">{e.role}</div></div> },
    { key: 'eid', header: 'EID', sort: (e) => e.eid, render: (e) => e.eid },
    { key: 'div', header: 'Division', filter: (e) => e.division, sort: (e) => e.division, render: (e) => e.division },
    { key: 'elig', header: 'Eligibility', filter: (e) => e.eligibility, render: (e) => <Badge t={flagged(e) ? 'warn' : 'ok'}>{e.eligibility}</Badge> },
    { key: 'cal', header: 'Calendar', filter: (e) => (e.calendar === 'Clear' ? 'Clear' : 'Conflict'), render: (e) => (e.calendar === 'Clear' ? <span className="text-ink-2">Clear</span> : <span className="font-semibold text-warn">Conflict</span>) },
    { key: 'leave', header: 'Leave', filter: (e) => (e.leave === 'Clear' ? 'Clear' : 'On leave'), render: (e) => (e.leave === 'Clear' ? <span className="text-ink-2">Clear</span> : <span className="font-semibold text-warn">{e.leave}</span>) },
    { key: 'act', header: 'Action required', filter: (e) => action(e).text, render: (e) => <span className={cx('text-[15px]', action(e).tone)}>{action(e).text}</span> },
  ];
  return (
    <DataTable rows={rows} columns={cols} rowKey={(e) => e.id} searchText={(e) => `${e.name} ${e.eid}`} label="nominees"
      groupBy={(e) => (flagged(e) ? NEEDS : ELIGIBLE)} groupOrder={[NEEDS, ELIGIBLE]}
      onRowClick={onOpen} activeKey={activeId} selectable={selectable} canSelect={(e) => flagged(e) && !s.finalized}
      bulk={bulk} footer={footer} toolbar={toolbar} maxHeight={600} />
  );
}

/** Side panel: why attention is needed and what HRIS / Leave / Outlook say (simulated). */
function NomineePanel({ e, mode, onClose, onDecide }: { e: Employee | null; mode: Mode; onClose: () => void; onDecide: (d: Decision) => void }) {
  const s = useDemo();
  if (!e) return null;
  const res = s.resolutions[e.id];
  const p = findById(e.id);
  return (
    <Drawer open={!!e} onClose={onClose} title={e.name}>
      <p className="text-[16px] text-ink-2">{e.role} · {e.division} · {e.eid}{p ? ` · ${p.grade} · reports to ${p.supervisor}` : ''}</p>
      {flagged(e) ? (
        <section className="mt-5 rounded-xl border border-warn/30 bg-warn-soft p-4">
          <div className="text-[16px] font-bold">Why attention is needed</div>
          <p className="mt-1 text-[16px]">{e.issue}</p>
          <p className="mt-1 text-[15px] text-ink-2">Suggested: {e.id === 'e2' ? 'keep, then let the supervisor decide a replacement if needed' : e.id === 'c2' ? 'remove; separation is before any bond period' : 'remove, or reschedule the other commitment'}</p>
        </section>
      ) : <p className="mt-5 rounded-xl bg-ok-soft p-4 text-[16px] font-semibold text-ok">Eligible · all sources clear</p>}

      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2"><h3 className="text-[18px] font-bold">What the connected systems say</h3><SourceTag kind="simulated" /></div>
        <ul className="divide-y divide-line border-y border-line">
          {checksFor(e).map((c) => (
            <li key={c.src} className="flex items-start gap-3 py-3">
              <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white', c.ok ? 'bg-ok' : 'bg-amber-500')}>{c.ok ? <Check size={14} /> : <AlertTriangle size={13} />}</span>
              <div><div className="text-[16px] font-semibold">{c.src}</div><div className="text-[15px] text-ink-2">{c.note}</div></div>
            </li>
          ))}
        </ul>
      </section>

      {mode === 'hr' && flagged(e) && (
        <section className="mt-6">
          <h3 className="text-[18px] font-bold">What HR can do</h3>
          <ul className="mt-1.5 space-y-1 text-[16px] text-ink-2">
            <li><b className="text-ink">Keep</b>: your override and reason go to the audit trail.</li>
            <li><b className="text-ink">Remove</b>: the Learning Champion is told and can nominate someone else.</li>
          </ul>
          {res && <p className="mt-3 text-[16px]">Current decision: <b>{res === 'keep' ? 'Kept (override)' : 'Removed'}</b>{s.resolutionReasons[e.id] ? ` · ${s.resolutionReasons[e.id]}` : ''}</p>}
          {!s.finalized ? (
            <div className="mt-4 flex gap-3">
              <Btn v="danger" onClick={() => onDecide('remove')}>Remove</Btn>
              <span className="flex-1" />
              <Btn v="secondary" onClick={() => onDecide('keep')}>Keep</Btn>
            </div>
          ) : <p className="mt-3 text-[15px] text-ink-3">The participant list is locked.</p>}
        </section>
      )}
      {mode === 'lc' && flagged(e) && <p className="mt-6 text-[16px] text-ink-2">You can still nominate this employee. HR reviews flagged nominees before the list is final.</p>}
    </Drawer>
  );
}

/* ================================================================== */
/* J5 · Learning Champion nominates (FR 88)                            */
/* ================================================================== */
export function LcNomination() {
  const s = useDemo();
  const nav = useNavigate();
  const [sel, setSel] = useState<Set<string>>(() => new Set(NOMINEE_LIST.map((e) => e.id)));
  const [open, setOpen] = useState<Employee | null>(null);
  const n = s.nomSetup;

  const head = (
    <PageHead title="Nomination" fr="FR 88"
      meta={<>{n.title} · {TRAINING.nominationId} · deadline <b>{fmtDeadline(n.deadline)}</b></>}
      sub={`${n.dates} · ${n.venue}`}
      tags={<SourceTag kind="fictional" />} />
  );
  if (!s.nominationRequested) return <div>{head}<NotYet title="No nomination window open yet" after="HR sends the nomination request with the nominate link" /></div>;

  const done = s.nominationSubmitted;
  const total = NOMINEE_LIST.length;
  const count = sel.size;
  const allOn = count === total;
  const toggle = (id: string) => setSel((x) => { const y = new Set(x); if (y.has(id)) y.delete(id); else y.add(id); return y; });
  const flaggedCount = NOMINEE_LIST.filter(flagged).length;

  return (
    <div>
      {head}
      <p className="mb-6 max-w-3xl text-[17px] text-ink-2">
        {done
          ? `You nominated ${s.nominatedCount} employees. HR is now reviewing the ${flaggedCount} flagged nominees.`
          : `The list is pre-filled with officers below the Credit Analysis target in the invited divisions. Untick anyone who should not attend. ${flaggedCount} nominees have a flag from HRIS, Leave or Outlook; HR will review them.`}
      </p>
      <NomineeTable mode="lc" rows={NOMINEE_LIST} onOpen={setOpen} activeId={open?.id}
        check={done ? undefined : { on: (id) => sel.has(id), toggle }}
        toolbar={done ? undefined : <label className="flex items-center gap-2 text-[15px] font-semibold"><input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = !allOn && count > 0; }} onChange={(e) => setSel(e.target.checked ? new Set(NOMINEE_LIST.map((x) => x.id)) : new Set())} />Select all</label>}
        footer={done ? (
          <>
            <span className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />{s.nominatedCount} nominations submitted</span>
            <Btn v="secondary" onClick={() => nav('/r/division_head')}>Back to My work</Btn>
          </>
        ) : (
          <>
            <span className="text-[16px] font-semibold">{count} of {total} selected</span>
            <Btn v="link" disabled={!count} onClick={() => setSel(new Set())}>Clear selection</Btn>
            <Btn disabled={!count} onClick={() => s.submitNominations(count, NOMINEE_LIST.filter((e) => sel.has(e.id)).map((e) => e.id))}>Submit {count} nominations</Btn>
          </>
        )} />
      <NomineePanel e={open} mode="lc" onClose={() => setOpen(null)} onDecide={() => undefined} />
    </div>
  );
}

/* ================================================================== */
/* J6 · Training Nomination Status (FR 89–91, 114)                     */
/* ================================================================== */
interface ReqRow { id: string; title: string; date: string; organizedBy: string; deadline: string; received: number | null; story: boolean }

export function NominationStatus() {
  const s = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState<Employee | null>(null);
  const [reason, setReason] = useState<{ ids: string[]; d: Decision } | null>(null);
  const [onlyUndecided, setOnlyUndecided] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [details, setDetails] = useState<ReqRow | null>(null);
  const [edit, setEdit] = useState<Partial<NomSetup>>({});
  const clearSel = useRef<() => void>(() => undefined);
  const n = s.nomSetup;

  const head = (
    <PageHead title="Training Nomination Status" fr="FR 89–91, 114"
      meta={<>{n.title} · {TRAINING.nominationId} · linked to {TRAINING.requestId}</>}
      tags={<SourceTag kind="fictional" />} />
  );
  if (!s.nominationRequested) return <div>{head}<NotYet title="No nominations yet" after="HR sends the nomination request and Learning Champions submit nominations" /></div>;

  const requests: ReqRow[] = [
    { id: TRAINING.nominationId, title: n.title, date: n.dates, organizedBy: n.organizedBy, deadline: fmtDeadline(n.deadline), received: s.nominationSubmitted ? s.nominatedCount : null, story: true },
    { id: 'NR-2026-00051', title: 'AML & CFT Refresher', date: '24 Nov 2026', organizedBy: 'City Bank L&D', deadline: '15 Nov 2026, 17:00', received: 118, story: false },
  ];
  const openDetails = (r: ReqRow) => { setDetails(r); setEdit(r.story ? { title: n.title, dates: n.dates, venue: n.venue, organizedBy: n.organizedBy, deadline: n.deadline } : {}); };
  const saveDetails = () => {
    const changed = (Object.keys(edit) as (keyof NomSetup)[]).filter((k) => edit[k] !== n[k]);
    if (changed.length) {
      s.setNomSetup(edit);
      s.logEvent('hr', 'Nomination summary edited', `${TRAINING.nominationId} · ${changed.join(', ')} (FR 91)`);
      useDemo.setState({ toast: 'Training summary updated' });
    }
    setDetails(null);
  };
  const reqCols: Column<ReqRow>[] = [
    { key: 'id', header: 'Nomination ID', render: (r) => <b className="text-[16px]">{r.id}</b> },
    { key: 'title', header: 'Training Name', render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: 'date', header: 'Training Date', render: (r) => r.date },
    { key: 'org', header: 'Organized By', render: (r) => r.organizedBy },
    { key: 'dl', header: 'Nomination Deadline', render: (r) => <span className="whitespace-nowrap">{r.deadline}</span> },
    { key: 'rec', header: 'Nominations Received', render: (r) => (r.received === null ? <span className="font-semibold text-warn">Open · none yet</span> : <b className="tabular-nums">{r.received}</b>) },
    { key: 'det', header: '', render: (r) => <Btn v="link" onClick={() => openDetails(r)}>Details</Btn> },
  ];

  const requestTable = <DataTable rows={requests} columns={reqCols} rowKey={(r) => r.id} label="nomination requests" maxHeight={260} onRowClick={openDetails} />;

  const detailsDrawer = (
    <Drawer open={!!details} onClose={() => setDetails(null)} title={`Details · ${details?.id ?? ''}`}>
      {details?.story ? (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2"><h3 className="text-[18px] font-bold">Training summary</h3><FrRef>FR 91</FrRef></div>
            <FormField label="Training Title"><input className={inputCls} disabled={s.scheduled} value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></FormField>
            <FormField label="Training Date"><input className={inputCls} disabled={s.scheduled} value={edit.dates ?? ''} onChange={(e) => setEdit({ ...edit, dates: e.target.value })} /></FormField>
            <FormField label="Venue"><select className={inputCls} disabled={s.scheduled} value={edit.venue ?? ''} onChange={(e) => setEdit({ ...edit, venue: e.target.value })}>{VENUES.map((v) => <option key={v.name}>{v.name}</option>)}</select></FormField>
            <FormField label="Organized By"><select className={inputCls} disabled={s.scheduled} value={edit.organizedBy ?? ''} onChange={(e) => setEdit({ ...edit, organizedBy: e.target.value })}>{[...new Set([n.organizedBy, ...VENDORS])].map((v) => <option key={v}>{v}</option>)}</select></FormField>
            <FormField label="Nomination Deadline"><input type="datetime-local" className={inputCls} disabled={s.scheduled} value={edit.deadline ?? ''} onChange={(e) => setEdit({ ...edit, deadline: e.target.value })} /></FormField>
            <div className="flex justify-end gap-3">
              <Btn v="secondary" onClick={() => setDetails(null)}>Cancel</Btn>
              <Btn disabled={s.scheduled} onClick={saveDetails}>Save changes</Btn>
            </div>
            {s.scheduled && <p className="text-[15px] text-ink-3">The training is scheduled; change details in Training Scheduling.</p>}
          </section>
          <section>
            <h3 className="mb-3 text-[18px] font-bold">Nominations · {s.nominationSubmitted ? s.nominatedCount : 0}</h3>
            {s.nominationSubmitted ? (
              <DataTable rows={NOMINEE_LIST} rowKey={(e) => e.id} searchText={(e) => `${e.name} ${e.eid}`} maxHeight={320} label="nominees"
                columns={[
                  { key: 'n', header: 'Employee', render: (e) => <b>{e.name}</b>, sort: (e) => e.name },
                  { key: 'eid', header: 'EID', render: (e) => e.eid },
                  { key: 'd', header: 'Decision', filter: (e) => (s.resolutions[e.id] === 'remove' ? 'Removed' : flagged(e) && !s.resolutions[e.id] ? 'To decide' : 'In list'), render: (e) => (s.resolutions[e.id] === 'remove' ? <span className="text-ink-3">Removed</span> : flagged(e) && !s.resolutions[e.id] ? <span className="font-semibold text-warn">To decide</span> : 'In list') },
                ]} />
            ) : <p className="text-[16px] text-ink-2">Waiting for Learning Champions. The deadline is {fmtDeadline(n.deadline)}.</p>}
          </section>
        </div>
      ) : details ? (
        <div className="space-y-5">
          <FactGroup title="Training summary" rows={[['Training Name', details.title], ['Training Date', details.date], ['Organized By', details.organizedBy], ['Nomination Deadline', details.deadline], ['Nominations Received', String(details.received ?? 0)]]} />
          <p className="text-[16px] text-ink-2">All 118 nominees are eligible. This training is already scheduled as 20260179 at Head Office Auditorium. The demo walks through {TRAINING.nominationId} in detail.</p>
          <div className="flex justify-end"><Btn v="secondary" onClick={() => setDetails(null)}>Close</Btn></div>
        </div>
      ) : null}
    </Drawer>
  );

  if (!s.nominationSubmitted) {
    return (
      <div>
        {head}
        {requestTable}
        <div className="mt-8"><NotYet title="Waiting for nominations" after={`Learning Champions submit nominations (deadline ${fmtDeadline(n.deadline)})`} /></div>
        {detailsDrawer}
      </div>
    );
  }

  if (!s.conflictsChecked) {
    const SYS: [string, string][] = [['HRIS', 'Grade, status, retirement date'], ['Leave management', 'Approved leave on 18–19 Nov'], ['Outlook calendar', 'Meetings that clash with the sessions'], ['Training database', 'Overlapping or repeated trainings']];
    return (
      <div>
        {head}
        {requestTable}
        <section className="mt-8 rounded-2xl bg-white p-7 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[24px] font-bold">{s.nominatedCount} nominations received</h2>
              <p className="mt-1 text-[16px] text-ink-2">Before HR decides, every nominee is checked against four systems. Nothing is removed automatically.</p>
            </div>
            <SourceTag kind="simulated">Integrations simulated</SourceTag>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SYS.map(([n2, d]) => (
              <li key={n2} className="flex items-start gap-3 rounded-xl bg-canvas px-4 py-3"><Check size={18} className="mt-0.5 text-ink-3" /><span><b className="text-[16px]">{n2}</b><span className="block text-[15px] text-ink-2">{d}</span></span></li>
            ))}
          </ul>
          <div className="mt-6 flex justify-end"><Btn onClick={() => s.checkConflicts()}>Run conflict checks <ArrowRight size={16} /></Btn></div>
        </section>
        {detailsDrawer}
      </div>
    );
  }

  /* ---------- stats, computed from the records ---------- */
  const invited = DIVISIONS.filter((d) => n.divisions[d.name]);
  const pendingDivs = invited.filter((d) => !NOMINEE_LIST.some((e) => e.division === d.name));
  const eligible = NOMINEE_LIST.filter((e) => !flagged(e)).length;
  const undecided = CONFLICT_IDS.filter((id) => !s.resolutions[id]);
  const finalCount = roster(s).length;
  const stats: [string, string, string][] = [
    [String(invited.length), 'Divisions invited', ''],
    [String(s.nominatedCount), 'Nominations received', ''],
    [String(eligible), 'Eligible', 'text-ok'],
    [String(s.finalized ? 0 : undecided.length), 'Conflict cases remaining', s.finalized || !undecided.length ? 'text-ok' : 'text-warn'],
    [String(pendingDivs.length), pendingDivs.length ? `Pending division (${pendingDivs.map((d) => d.name).join(', ')})` : 'Pending divisions', pendingDivs.length ? 'text-warn' : ''],
    [s.finalized ? `${finalCount} final` : 'Open', 'Finalisation status', s.finalized ? 'text-ok' : ''],
  ];

  const rows = onlyUndecided && !s.finalized ? NOMINEE_LIST.filter((e) => flagged(e) && !s.resolutions[e.id]) : NOMINEE_LIST;
  const names = (ids: string[]) => ids.map((id) => { const e = NOMINEE_LIST.find((x) => x.id === id); return e ? `${e.name} · ${e.eid} · ${e.issue ?? ''}` : id; });
  const decide = (r: string) => {
    if (!reason) return;
    const { ids, d } = reason;
    s.withUndo(`${d === 'keep' ? 'Keep' : 'Remove'} ${ids.length} nominee${ids.length > 1 ? 's' : ''}`, () => s.resolveMany(ids, d, r));
    setReason(null);
    setOpen(null);
    clearSel.current();
    if (onlyUndecided && CONFLICT_IDS.every((id) => useDemo.getState().resolutions[id])) setOnlyUndecided(false);
  };

  const footer = s.finalized ? (
    <span className="flex items-center gap-2 text-[16px] font-semibold text-ok"><Check size={18} />{finalCount} participants finalised</span>
  ) : (
    <>
      {undecided.length > 0 && <span className="text-[15px] text-warn">{undecided.length} flagged nominee{undecided.length > 1 ? 's' : ''} still need{undecided.length > 1 ? '' : 's'} a decision</span>}
      {undecided.length > 0 && !onlyUndecided && <Btn v="link" onClick={() => setOnlyUndecided(true)}>Show only undecided</Btn>}
      <Btn disabled={undecided.length > 0} onClick={() => setConfirm(true)}>Finalize participants</Btn>
    </>
  );

  return (
    <div>
      {head}
      {requestTable}

      <div className="my-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(([v, l, c], i) => (
          <StatCard key={l} label={l} value={v} icon={STAT_ICONS[i]} tone={c === 'text-warn' ? 'amber' : c === 'text-ok' ? 'ok' : 'brand'} />
        ))}
      </div>

      {s.finalized && (
        <div className="mb-6">
          <Alert kind="ok" title={`${finalCount} participants finalised`} action={<Btn size="sm" v="secondary" onClick={() => nav('/hr/schedule')}>Open Training Scheduling <ArrowRight size={16} /></Btn>}>
            Training Scheduling loads this list with Load Training Profile = Yes (FR 95, 113).
          </Alert>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[24px] font-bold">Nominees</h2>
        {onlyUndecided && !s.finalized && <span className="flex items-center gap-3 text-[15px]"><Badge t="warn">Showing only undecided</Badge><Btn v="link" onClick={() => setOnlyUndecided(false)}>Show all</Btn></span>}
      </div>
      <NomineeTable mode="hr" rows={rows} onOpen={setOpen} activeId={open?.id} selectable={!s.finalized}
        bulk={(sel, clear) => {
          clearSel.current = clear;
          const ids = sel.map((e) => e.id);
          return (
            <>
              <Btn size="sm" v="secondary" onClick={() => setReason({ ids, d: 'keep' })}>Keep</Btn>
              <Btn size="sm" v="danger" onClick={() => setReason({ ids, d: 'remove' })}>Remove</Btn>
            </>
          );
        }}
        footer={footer} />

      <NomineePanel e={open} mode="hr" onClose={() => setOpen(null)} onDecide={(d) => open && setReason({ ids: [open.id], d })} />

      <ReasonModal open={!!reason} title={reason?.d === 'keep' ? `Keep ${reason.ids.length} nominee${reason.ids.length > 1 ? 's' : ''} (override)` : `Remove ${reason?.ids.length ?? 0} nominee${(reason?.ids.length ?? 0) > 1 ? 's' : ''}`}
        intro={reason?.d === 'keep' ? 'They stay on the list despite the flag. Your override and reason are written to the audit trail for each person.' : 'They leave the list. Their Learning Champion is told and can nominate someone else. One audit entry per person.'}
        names={reason ? names(reason.ids) : []} confirm={reason?.d === 'keep' ? 'Keep (override)' : 'Remove'}
        suggested={reason ? SUGGESTED[reason.d] : undefined} onConfirm={decide} onClose={() => setReason(null)} />

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Finalize participants"
        footer={<><Btn v="secondary" onClick={() => setConfirm(false)}>Cancel</Btn><Btn onClick={() => { s.finalize(); setConfirm(false); }}>Lock {finalCount} participants</Btn></>}>
        <p className="text-[17px]">Lock {finalCount} participants? Scheduling will load this list (FR 95, 113).</p>
        <ul className="mt-3 space-y-1 text-[16px] text-ink-2">
          <li>{s.nominatedCount} nominations received</li>
          <li>{CONFLICT_IDS.filter((id) => s.resolutions[id] === 'keep').length} kept with an override</li>
          <li>{Object.values(s.resolutions).filter((r) => r === 'remove').length} removed</li>
        </ul>
      </Modal>
      {detailsDrawer}
    </div>
  );
}
