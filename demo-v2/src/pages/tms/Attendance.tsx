import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, UserPlus, Video } from 'lucide-react';
import { TRAINING } from '../../data';
import { attendanceOf, attendedIds, roster, trainingStatus, useDemo, type AttSource, type Day } from '../../store';
import { findByEid, findById } from '../../org';
import type { Attendance as Att, Employee } from '../../types';
import { NotYet, PageHead, Section } from '../../components/Templates';
import { DataTable, type Column } from '../../components/DataTable';
import { Alert, Badge, Btn, cx, Field, inputCls, Modal } from '../../components/ui';
import { FrRef, SourceTag } from '../../components/Source';

const MARKS: Att[] = ['Present', 'Absent', 'Late', 'Excused'];
const DAYS: { id: Day; label: string; short: string }[] = [{ id: 'd1', label: 'Day 1 · 18 Nov', short: 'Day 1' }, { id: 'd2', label: 'Day 2 · 19 Nov', short: 'Day 2' }];
const NOT_ON_LIST = [{ eid: 'CBL-11904', name: 'Tanjila Ahmed' }, { eid: 'CBL-11937', name: 'Rakib Hasan' }];
const SOURCE_LABEL: Record<AttSource, string> = { Self: 'Self-marked', Teams: 'Teams', HR: 'HR' };
const MARK_TONE: Record<Att, string> = { Present: 'ok', Late: 'info', Absent: 'warn', Excused: 'neutral' };
const SELECT_TONE: Record<Att, string> = { Present: 'border-ok/50 bg-ok-soft text-ok', Late: 'border-info/40 bg-info-soft text-info', Absent: 'border-warn/50 bg-warn-soft text-warn', Excused: 'border-ink/20 bg-slate-100 text-ink-2' };

interface Row {
  id: string; eid: string; name: string; designation: string; division: string; department: string; mode: 'Online' | 'Physical';
  status: Att | 'Unmarked'; source: AttSource | null; d1: Att | undefined; d2: Att | undefined; replacement: boolean;
}

export function Attendance() {
  const s = useDemo();
  const nav = useNavigate();
  const [day, setDay] = useState<Day>('d1');
  const [view, setView] = useState<{ key: number; filters: Record<string, string> }>({ key: 0, filters: {} });
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const r = roster(s);
  const online = useMemo(() => new Set(r.slice(0, 12).map((e) => e.id)), [r]);
  const map = attendanceOf(s, day);

  const rows: Row[] = useMemo(() => r.map((e: Employee) => {
    const p = findById(e.id);
    const a = map[e.id];
    return {
      id: e.id, eid: e.eid, name: e.name, designation: p?.designation ?? e.role, division: p?.division ?? e.division, department: p?.department ?? '',
      mode: online.has(e.id) ? 'Online' : 'Physical', status: a ?? 'Unmarked', source: a ? s.attSource[`${day}:${e.id}`] ?? 'HR' : null,
      d1: s.attendance[e.id], d2: s.attendance2[e.id], replacement: s.withdrawal.replacementId === e.id && s.withdrawal.status === 'approved',
    };
  }), [r, map, day, s.attSource, s.attendance, s.attendance2, online, s.withdrawal]);

  const stats = (d: Day) => {
    const m = attendanceOf(s, d);
    const c = (a: Att) => r.filter((e) => m[e.id] === a).length;
    const marked = r.filter((e) => m[e.id]).length;
    return { marked, present: c('Present'), late: c('Late'), absent: c('Absent'), excused: c('Excused'), unmarked: r.length - marked };
  };
  const st = { d1: stats('d1'), d2: stats('d2') };
  const pending = DAYS.filter((d) => st[d.id].unmarked > 0);
  const submitReason = pending.length ? `Mark ${pending.map((d) => `${st[d.id].unmarked} ${st[d.id].unmarked === 1 ? 'person' : 'people'} on ${d.short}`).join(' and ')} to submit` : '';
  const synced = (d: Day) => r.some((e) => s.attSource[`${d}:${e.id}`] === 'Teams');
  const submitted = s.attendanceSubmitted;
  const isAdmin = s.role === 'admin';

  if (!s.invitesSent) {
    return (
      <div>
        <PageHead title="Attendance" meta={`${TRAINING.title} · ${TRAINING.trainingId} · 18–19 Nov 2026`} fr="FR 3, 137–143" />
        <NotYet title="The attendance register is not open yet" after="invitations are sent and withdrawal requests are decided" />
      </div>
    );
  }

  const showUnmarked = (d: Day) => { setDay(d); setView({ key: view.key + 1, filters: { status: 'Unmarked' } }); };
  const switchDay = (d: Day) => { setDay(d); setView({ key: view.key + 1, filters: {} }); };
  const bulkMark = (ids: string[], a: Att) => {
    const label = `${ids.length} marked ${a} · ${day === 'd1' ? 'Day 1' : 'Day 2'}`;
    s.withUndo(label, () => s.markMany(ids, a, day));
    useDemo.setState({ toast: label });
  };
  const markAll = () => {
    const n = st[day].unmarked;
    const label = `Mark All · ${n} unmarked marked Present · ${day === 'd1' ? 'Day 1' : 'Day 2'}`;
    s.withUndo(label, () => s.markAll(day));
    useDemo.setState({ toast: label });
  };

  const columns: Column<Row>[] = [
    { key: 'eid', header: 'Employee ID', sort: (x) => x.eid, render: (x) => <span className="whitespace-nowrap tabular-nums">{x.eid}</span> },
    { key: 'name', header: 'Name', sort: (x) => x.name, render: (x) => <div className="min-w-[150px]"><div className="font-semibold">{x.name}</div>{x.replacement && <div className="text-[14px] text-ink-3">Replacement for Tanvir Hasan</div>}</div> },
    { key: 'designation', header: 'Designation', render: (x) => x.designation },
    { key: 'division', header: 'Division / Department', filter: (x) => x.division, sort: (x) => x.division, render: (x) => <div><div>{x.division}</div><div className="text-[14px] text-ink-3">{x.department}</div></div> },
    { key: 'mode', header: 'Mode', filter: (x) => x.mode, render: (x) => <span className="inline-flex items-center gap-1.5">{x.mode === 'Online' && <Video size={14} className="text-ink-3" />}{x.mode}</span> },
    { key: 'status', header: 'Attendance Status', filter: (x) => x.status, sort: (x) => x.status, render: (x) => <Badge t={x.status === 'Unmarked' ? 'neutral' : MARK_TONE[x.status]}>{x.status}</Badge> },
    { key: 'source', header: 'Source', filter: (x) => (x.source ? SOURCE_LABEL[x.source] : 'Not marked'), render: (x) => (x.source ? <span className={cx('whitespace-nowrap', x.source === 'Self' && 'font-semibold text-ok')}>{SOURCE_LABEL[x.source]}{x.source === 'Self' && ' · 09:24'}</span> : <span className="text-ink-3">—</span>) },
    { key: 'mark', header: 'Mark Attendance', render: (x) => (submitted ? <span className="text-[15px] text-ink-3">Submitted</span> : (
      <select
        aria-label={`Mark attendance for ${x.name}, ${day === 'd1' ? 'Day 1' : 'Day 2'}`}
        value={x.status === 'Unmarked' ? '' : x.status}
        onChange={(e) => { if (e.target.value) s.mark(x.id, e.target.value as Att, day); else s.unmark(x.id, day); }}
        className={cx('w-[132px] rounded-lg border px-2.5 py-1.5 text-[15px] font-semibold outline-none focus:ring-2 focus:ring-brand/20', x.status === 'Unmarked' ? 'border-dashed border-ink/30 bg-white text-ink-3' : SELECT_TONE[x.status])}
      >
        <option value="">{x.status === 'Unmarked' ? 'Mark…' : 'Clear mark'}</option>
        {MARKS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    )) },
  ];

  const attended = attendedIds(s);
  const extraStatus = (eid: string) => s.extraAttendees.find((x) => x.eid === eid)?.status;

  return (
    <div>
      <PageHead
        title="Attendance"
        meta={`${TRAINING.title} · ${TRAINING.trainingId} · 18–19 Nov 2026 · ${TRAINING.venue}`}
        sub="12 participants join online through Teams; the rest attend in Hall A."
        fr="FR 3, 137–143"
        tags={<><Badge t={submitted ? 'ok' : 'info'}>{submitted ? 'Attendance submitted' : trainingStatus(s)}</Badge><SourceTag kind="fictional" /></>}
      />

      {submitted && (
        <Section title="Outcome per participant" fr="FR 142">
          <OutcomeSummary />
        </Section>
      )}

      <Section title={submitted ? 'Attendance register (submitted)' : 'Attendance register'} className={submitted ? 'mt-12' : ''}>
        {/* day tabs + progress */}
        <div role="tablist" aria-label="Training day" className="mb-3 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button key={d.id} role="tab" aria-selected={day === d.id} onClick={() => switchDay(d.id)} className={cx('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[16px] font-semibold', day === d.id ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink-2 hover:border-ink/30')}>
              {d.label}
              {st[d.id].unmarked === 0 ? <Check size={16} className={day === d.id ? 'text-white' : 'text-ok'} /> : <span className={cx('rounded-full px-2 text-[14px]', day === d.id ? 'bg-white/20' : 'bg-warn-soft text-warn')}>{st[d.id].unmarked} unmarked</span>}
            </button>
          ))}
        </div>
        <ul className="mb-5 space-y-1 text-[16px]">
          {DAYS.map((d) => {
            const x = st[d.id];
            return (
              <li key={d.id} className={cx(day === d.id ? 'text-ink' : 'text-ink-3')}>
                <b>{d.short}:</b> {x.marked} of {r.length} marked · {x.present} present{x.late ? ` · ${x.late} late` : ''} · {x.absent} absent · {x.excused} excused · {x.unmarked > 0 ? <button className="font-semibold text-warn underline underline-offset-2 hover:text-ink" onClick={() => showUnmarked(d.id)}>{x.unmarked} unmarked</button> : <span className="font-semibold text-ok">all marked</span>}
              </li>
            );
          })}
        </ul>

        {/* Teams (simulated) */}
        {!submitted && (
          <div className="mb-5 rounded-2xl border border-line bg-[#faf8f5] px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Video size={18} className="text-ink-2" />
              <span className="text-[17px] font-bold">Microsoft Teams · {day === 'd1' ? 'Day 1' : 'Day 2'}</span>
              <SourceTag kind="simulated" />
              <FrRef>FR 143</FrRef>
              <span className="flex-1" />
              {synced(day) ? <span className="text-[16px] font-semibold text-ok"><Check size={16} className="mr-1 inline" />12 matched by Employee ID</span> : <Btn v="secondary" size="sm" onClick={() => { s.syncOnline(day); useDemo.setState({ toast: `Teams attendance synced · 12 matched by Employee ID · ${day === 'd1' ? 'Day 1' : 'Day 2'}` }); }}>Sync Teams attendance</Btn>}
            </div>
            <p className="mt-1 text-[15px] text-ink-2">Online participants are marked Present from their Teams login. Anyone who joins but is not on the list needs Admin approval.</p>
            {(synced(day) || s.extraAttendees.length > 0) && (
              <div className="mt-3">
                <div className="text-[15px] font-semibold text-ink-2">Joined online but not on the list · 2</div>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
                  {NOT_ON_LIST.map((x) => {
                    const stx = extraStatus(x.eid);
                    const p = findByEid(x.eid);
                    return (
                      <li key={x.eid} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-[16px]">
                        <span className="min-w-0 flex-1"><b>{x.name}</b> · {x.eid}{p && <span className="text-ink-3"> · {p.designation}, {p.division}</span>}</span>
                        {stx === 'approved' && <Badge t="ok">Approved by Admin · marked Present Day 1</Badge>}
                        {stx === 'requested' && (isAdmin
                          ? <Btn v="secondary" size="sm" onClick={() => s.approveExtraAttendee(x.eid)}>Approve</Btn>
                          : <Badge t="warn">Waiting for Admin approval</Badge>)}
                        {!stx && <Btn v="secondary" size="sm" onClick={() => s.requestExtraAttendee(x.eid, x.name)}>Request Admin approval</Btn>}
                      </li>
                    );
                  })}
                </ul>
                {!isAdmin && s.extraAttendees.some((x) => x.status === 'requested') && <p className="mt-2 text-[15px] text-ink-3">The request is in the System Admin's task list. When approved, the person is added and marked Present.</p>}
              </div>
            )}
          </div>
        )}

        <DataTable<Row>
          key={`${day}-${view.key}`}
          rows={rows}
          columns={columns}
          rowKey={(x) => x.id}
          searchText={(x) => `${x.name} ${x.eid}`}
          initialFilters={view.filters}
          selectable={!submitted}
          label="participants"
          emptyText="No participants match these filters."
          rowClassName={(x) => cx(x.status === 'Unmarked' && !submitted && 'bg-warn-soft/30')}
          toolbar={!submitted ? <Btn v="secondary" size="sm" disabled={st[day].unmarked === 0} onClick={markAll}>Mark All</Btn> : undefined}
          bulk={(sel, clear) => (
            <>
              <span className="text-[15px] text-ink-2">Mark</span>
              {MARKS.map((a) => <Btn key={a} v="secondary" size="sm" onClick={() => { bulkMark(sel.map((x) => x.id), a); clear(); }}>{a}</Btn>)}
            </>
          )}
          footer={!submitted ? (
            <div className="flex flex-wrap items-center gap-3">
              <Btn v="secondary" icon={<UserPlus size={16} />} onClick={() => setAddOpen(true)}>Add Participant</Btn>
              <Btn v="secondary" onClick={() => { s.saveAttendanceDraft(); useDemo.setState({ toast: 'Attendance draft saved' }); }}>Save Draft</Btn>
              {s.attendanceDraftAt && <span className="text-[15px] text-ink-3">Draft saved {s.attendanceDraftAt}</span>}
              {submitReason && <span className="text-[15px] font-semibold text-warn">{submitReason}</span>}
              <Btn disabled={!!submitReason} onClick={() => setConfirmOpen(true)}>Submit &amp; Update Training Database</Btn>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Btn v="secondary" onClick={() => nav('/hr/training-db')}>Open Training Database</Btn>
              <Btn onClick={() => nav('/hr/planned')}>Continue to Planned Training</Btn>
            </div>
          )}
        />
        {!submitted && <p className="mt-3 text-[15px] text-ink-3">Mark All fills only the unmarked rows as Present; change any single row afterwards. Select rows (Shift-click for a range) to mark several at once. Self-marked rows came from the employee on the training day (FR 3, 138).</p>}
      </Section>

      <AddParticipantModal open={addOpen} onClose={() => setAddOpen(false)} rosterIds={r.map((e) => e.id)} />

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Submit & Update Training Database" footer={<><Btn v="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Btn><Btn onClick={() => { setConfirmOpen(false); s.submitAttendance(); }}>Submit &amp; Update Training Database</Btn></>}>
        <p className="mb-4 text-[16px] text-ink-2">Check the totals for each day. After submitting, the register is locked.</p>
        <table className="w-full text-left text-[15px]">
          <thead><tr className="border-b border-line text-ink-3">{['Day', 'Present', 'Late', 'Absent', 'Excused', 'Total'].map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {DAYS.map((d) => <tr key={d.id} className="border-b border-line"><td className="py-2 pr-3 font-semibold">{d.label}</td><td className="py-2 pr-3 tabular-nums">{st[d.id].present}</td><td className="py-2 pr-3 tabular-nums">{st[d.id].late}</td><td className="py-2 pr-3 tabular-nums">{st[d.id].absent}</td><td className="py-2 pr-3 tabular-nums">{st[d.id].excused}</td><td className="py-2 pr-3 tabular-nums">{st[d.id].marked}</td></tr>)}
          </tbody>
        </table>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px] text-ink-2">
          <li>{attended.length} attendees are written to the Training Database with 16 learning hours each.</li>
          <li>Training investment and cost per employee are recalculated for the dashboards and employee profiles.</li>
          <li>Feedback requests go to the attendees.</li>
        </ul>
      </Modal>
    </div>
  );
}

/* ---------------- After submit: who missed which day (FR 142) ---------------- */
type Outcome = 'Attended both days' | 'Missed Day 1' | 'Missed Day 2' | 'Absent both days';
interface OutRow { id: string; eid: string; name: string; division: string; d1: Att | undefined; d2: Att | undefined; outcome: Outcome }

function OutcomeSummary() {
  const s = useDemo();
  const ok = (a: Att | undefined) => a === 'Present' || a === 'Late';
  const rows: OutRow[] = roster(s).map((e) => {
    const d1 = s.attendance[e.id], d2 = s.attendance2[e.id];
    const outcome: Outcome = ok(d1) && ok(d2) ? 'Attended both days' : ok(d1) ? 'Missed Day 2' : ok(d2) ? 'Missed Day 1' : 'Absent both days';
    return { id: e.id, eid: e.eid, name: e.name, division: findById(e.id)?.division ?? e.division, d1, d2, outcome };
  });
  const c = (o: Outcome) => rows.filter((x) => x.outcome === o).length;
  const attended = rows.length - c('Absent both days');
  const cell = (a: Att | undefined) => <Badge t={a ? MARK_TONE[a] : 'neutral'}>{a ?? 'Unmarked'}</Badge>;
  const columns: Column<OutRow>[] = [
    { key: 'name', header: 'Participant', sort: (x) => x.name, render: (x) => <div><div className="font-semibold">{x.name}</div><div className="text-[14px] text-ink-3">{x.eid}</div></div> },
    { key: 'division', header: 'Division', filter: (x) => x.division, render: (x) => x.division },
    { key: 'd1', header: 'Day 1 · 18 Nov', render: (x) => cell(x.d1) },
    { key: 'd2', header: 'Day 2 · 19 Nov', render: (x) => cell(x.d2) },
    { key: 'outcome', header: 'Outcome', filter: (x) => x.outcome, render: (x) => <Badge t={x.outcome === 'Attended both days' ? 'ok' : 'warn'}>{x.outcome}</Badge> },
  ];
  return (
    <div>
      <div className="mb-5 flex flex-wrap divide-x divide-line border-y border-line">
        {([[c('Attended both days'), 'Attended both days', 'text-ok'], [c('Missed Day 1') + c('Missed Day 2'), 'Missed one day', 'text-warn'], [c('Absent both days'), 'Absent both days', ''], [attended * 16, 'Learning hours written', '']] as const).map(([n, l, cl]) => (
          <div key={l} className="flex-1 px-6 py-4 first:pl-0"><div className={cx('text-[32px] font-extrabold leading-none tabular-nums', cl)}>{n}</div><div className="mt-1 text-[15px] text-ink-2">{l}</div></div>
        ))}
      </div>
      <Alert kind="ok" title="Data written automatically">
        {attended} records added to the Training Database · employee learning records updated · training investment and cost per employee recalculated for the dashboards · feedback requests sent to attendees.
      </Alert>
      <div className="mt-5">
        <DataTable<OutRow>
          rows={rows}
          columns={columns}
          rowKey={(x) => x.id}
          searchText={(x) => `${x.name} ${x.eid}`}
          label="participants"
          maxHeight={360}
        />
      </div>
    </div>
  );
}

/* ---------------- Add Participant (FR 141) ---------------- */
function AddParticipantModal({ open, onClose, rosterIds }: { open: boolean; onClose: () => void; rosterIds: string[] }) {
  const s = useDemo();
  const [eid, setEid] = useState('');
  const p = findByEid(eid);
  const already = p ? rosterIds.includes(p.id) : false;
  const close = () => { setEid(''); onClose(); };
  const add = () => {
    if (!p || already) return;
    s.addParticipants([p.id]);
    useDemo.setState({ toast: `${p.name} added to the register` });
    close();
  };
  return (
    <Modal open={open} onClose={close} title="Add Participant" footer={<><Btn v="secondary" onClick={close}>Cancel</Btn><Btn disabled={!p || already} onClick={add}>Add Participant</Btn></>}>
      <Field label="Employee ID" hint={eid && !p ? <span className="text-brand">No employee found with this Employee ID.</span> : already ? <span className="text-warn">{p?.name} is already on the register.</span> : <span className="text-ink-3">Try CBL-11958 (Fariha Islam) or CBL-11970</span>}>
        <input className={inputCls} value={eid} onChange={(e) => setEid(e.target.value)} placeholder="CBL-00000" autoFocus />
      </Field>
      {p && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-canvas p-3 text-[15px]">
          {([['Name', p.name], ['Designation', p.designation], ['Grade', p.grade], ['Division / Department', `${p.division} / ${p.department}`], ['Location', p.location], ['Supervisor', p.supervisor]] as const).map(([k, v]) => <div key={k}><dt className="text-[14px] text-ink-3">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          <div className="col-span-2 text-[14px] text-ink-3">From Employee Database (HRIS) · simulated</div>
        </dl>
      )}
    </Modal>
  );
}
