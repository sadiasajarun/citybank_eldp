/**
 * Role dashboards (O1) and the divisional requirement (J1).
 * RoleHome = "My work" for every role: persona, My tasks, then the role's dashboard on one shared template
 * (headline figures computed from records, each opening the people or records behind it).
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { INTEGRATIONS, MASTERS, PERSONAS, ROLE_ORDER, TRAINING } from '../../data';
import { CREDIT_TARGET, creditGap, DIRECTORY, DIVISIONS, directReports, inDivision, SUPERVISORS, TRAINERS, type Person } from '../../org';
import { ENTITLED, WORK_NAV } from '../../nav';
import { JOURNEY, journeyAction, journeyIndex, ROLE_LABEL, tasksFor, type Task } from '../../lifecycle';
import { attendedIds, roster, trainingStatus, useDemo, type DemoState } from '../../store';
import type { Role } from '../../types';
import { PageHead, Section } from '../../components/Templates';
import { TnaPage } from './Tna';
import { DivisionHome } from './DivisionHome';
import { TrainerSessions } from '../decisions/Trainer';
import { HrOperations as HrOpsHome } from './HrOps';
import { MyLearning } from '../employee/MyLearning';
import { FrRef, SourceTag } from '../../components/Source';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { personaFor, useSwitchRole } from '../../components/perspective';
import { Badge, Btn, cx } from '../../components/ui';
import {
  DIVISION_NAME, Figures, groupStats, inPeriod, isDone, MANDATORY_COURSE, PERIODS, peopleColumns, peopleCsv, personRows, pct, pctText, printTable,
  Select, SUPERVISOR_NAME, trainingRecords, useDrill, type GroupStat, type PersonRow, type TrainingRecord,
} from './dash';

const ROLE_FR: Record<Role, string> = {
  hr: 'FR 20–21, 168', division_head: 'FR 13–15, 186', supervisor: 'FR 8–12, 206', trainer: 'FR 16–19', employee: 'FR 1–7, 205',
  finance: 'Proposed · based on FR 135', admin: 'FR 21, 143, 244', management: 'FR 168, 208 · proposed role',
};

/* ================================================================== */
/* My work                                                             */
/* ================================================================== */
export function RoleHome() {
  const { role = 'hr' } = useParams();
  const r = (ROLE_ORDER.includes(role as Role) ? role : 'hr') as Role;
  const s = useDemo();
  const p = personaFor(r, s.employeeId);
  if (r === 'division_head') return <DivisionHome />;
  if (r === 'trainer') return <TrainerSessions />;
  if (r === 'hr') return <HrOpsHome />;
  if (r === 'supervisor') return <TeamBody />;
  if (r === 'employee') return <MyLearning />;
  return (
    <div>
      <PageHead title="My work" meta={<><b className="text-ink">{p.name}</b> · {PERSONAS[r].label} · {p.dept}</>} fr={ROLE_FR[r]}
        tags={<><SourceTag kind="fictional" />{(r === 'finance' || r === 'management') && <SourceTag kind="proposed">{r === 'finance' ? 'Proposed workflow, based on FR 135' : 'Proposed role, based on FR 168, 208'}</SourceTag>}</>} />
      <TaskList role={r} />
      {r === 'finance' && <FinanceHome />}
      {r === 'management' && <ManagementHome />}
      {r === 'admin' && <AdminHome />}
    </div>
  );
}

export function TaskList({ role }: { role: Role }) {
  const s = useDemo();
  const go = useSwitchRole();
  const tasks = tasksFor(role, s);
  const ji = journeyIndex(s);
  const cur = ji < JOURNEY.length ? JOURNEY[ji] : null;
  const act = cur ? journeyAction(cur, s) : null;
  const open = (t: Task) => go(role, t.to, t.emp);
  return (
    <Section title={<>My tasks{tasks.length > 0 && <span className="text-ink-3"> · {tasks.length}</span>}</>}>
      {tasks.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {tasks.map((t) => (
            <li key={t.id}>
              <button onClick={() => open(t)} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#faf8f5]">
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', t.urgent ? 'bg-brand' : 'bg-ink/20')} aria-label={t.urgent ? 'Urgent' : undefined} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="text-[17px] font-semibold">{t.title}</span><FrRef>{t.fr}</FrRef></span>
                  <span className="mt-0.5 block text-[15px] text-ink-3">{t.detail} · from {t.from}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-brand">Open <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white px-6 py-5">
          <CheckCircle2 size={26} className="shrink-0 text-ok" />
          <div>
            <div className="text-[17px] font-semibold">All caught up</div>
            <div className="text-[15px] text-ink-2">
              {cur && act ? <>The training is at Step {ji + 1}: <b>{cur.title}</b> ({cur.who === 'system' ? 'System' : ROLE_LABEL[act.role]}).</> : 'Every step of the training is complete.'}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ================================================================== */
/* Supervisor: Team Dashboard (FR 11–12, 206)                          */
/* ================================================================== */
export function TeamDashboard() {
  return <TeamBody />;
}

/** Supervisor · Team Learning Overview (FR 8–12): who needs action, approvals, upcoming training, records. */
function TeamBody() {
  const s = useDemo();
  const nav = useNavigate();
  const drill = useDrill();
  const [tab, setTab] = useState<'Direct reports' | 'Training records' | 'Departments'>('Direct reports');
  const sup = SUPERVISORS.find((x) => x.name === SUPERVISOR_NAME);
  const team = directReports(SUPERVISOR_NAME);
  const rows = personRows(s, team);
  const ids = new Set(team.map((p) => p.id));
  const below = rows.filter((r) => r.p.creditLevel < CREDIT_TARGET);
  const overdue = rows.filter((r) => r.course?.overdue);
  const failed = rows.filter((r) => r.failed && !r.remediation);
  const withdrawals = [s.withdrawal, ...Object.values(s.otherWithdrawals)].filter((w) => ids.has(w.empId));
  const waiting = withdrawals.filter((w) => w.status === 'requested');
  const approvals = waiting.length;
  const inTraining = rows.filter((r) => r.inTraining).length;
  const nameOf = (id: string) => team.find((p) => p.id === id)?.name ?? id;
  const needAction: { who: string; why: string; tone: 'brand' | 'warn'; go: () => void; cta: string }[] = [
    ...waiting.map((w) => ({ who: nameOf(w.empId), why: `Withdrawal request · ${w.reason || 'no reason given'}`, tone: 'brand' as const, go: () => nav('/supervisor'), cta: 'Decide' })),
    ...failed.map((r) => ({ who: r.p.name, why: 'Failed the assessment · no follow-up yet', tone: 'brand' as const, go: () => drill.open({ title: 'Failed the post-training assessment', rows: failed, needs: true }), cta: 'View' })),
    ...overdue.map((r) => ({ who: r.p.name, why: `${MANDATORY_COURSE} overdue`, tone: 'warn' as const, go: () => drill.open({ title: `Overdue: ${MANDATORY_COURSE}`, rows: overdue }), cta: 'View' })),
  ];
  const stillNeed = rows.filter((r) => r.needs && !r.failed);
  if (stillNeed.length) needAction.push({ who: `${stillNeed.length} team members`, why: 'Still need training · not nominated, absent or withdrawn', tone: 'warn', go: () => drill.open({ title: 'Still need training', rows: stillNeed, needs: true }), cta: 'View' });
  const upcoming: { date: string; what: string; who: string }[] = [];
  if (s.scheduled && !s.attendanceSubmitted) upcoming.push({ date: '18–19 Nov', what: TRAINING.title, who: `${inTraining} of your team` });
  if (s.attendanceSubmitted && !s.pta.released) upcoming.push({ date: 'This week', what: 'Assessment results due', who: `${rows.filter((r) => r.story === 'Attended').length} attended` });
  const notDone = rows.filter((r) => r.course && r.course.status !== 'Completed').length;
  if (notDone) upcoming.push({ date: '20 Nov', what: `${MANDATORY_COURSE} due`, who: `${notDone} not complete` });
  s.programmes.filter((p) => p.status === 'Scheduled').forEach((p) => upcoming.push({ date: p.date.replace(' 2026', ''), what: p.title, who: 'Open to nominated staff' }));

  const strip: { n: number; l: string; tone?: string; open: () => void }[] = [
    { n: team.length, l: 'Direct reports', open: () => drill.open({ title: 'Direct reports', rows }) },
    { n: below.length, l: 'Below competency target', tone: 'text-amber-700', open: () => drill.open({ title: `Below target in Credit Analysis (level ${CREDIT_TARGET})`, rows: below, needs: true }) },
    { n: overdue.length, l: 'Mandatory learning overdue', tone: overdue.length ? 'text-brand' : undefined, open: () => drill.open({ title: `Overdue: ${MANDATORY_COURSE}`, rows: overdue }) },
    { n: approvals, l: 'Actions requiring approval', tone: approvals ? 'text-brand' : undefined, open: () => nav('/supervisor') },
  ];
  const progress = [
    { l: 'Completed', n: rows.filter((r) => r.completed).length, c: 'bg-ok' },
    { l: 'In training', n: rows.filter((r) => r.inProgress).length, c: 'bg-sky-500' },
    { l: 'Failed', n: rows.filter((r) => r.failed).length, c: 'bg-brand' },
    { l: 'Still need training', n: rows.filter((r) => r.needs && !r.failed).length, c: 'bg-amber-300' },
  ];
  const card = 'rounded-2xl bg-white ring-1 ring-line';
  return (
    <div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-[18px] font-semibold text-white">MK</span>
          <div>
            <div className="text-[14px] text-ink-3">Team Learning Overview</div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-tight">{SUPERVISOR_NAME}</h1>
            <p className="text-[16px] text-ink-2">Supervisor · {DIVISION_NAME} · {team.length} direct reports{sup ? ` · ${sup.title}` : ''}</p>
            <p className="mt-1 flex flex-wrap gap-x-5 text-[14px] text-ink-3">
              <span>Needing action <b className="font-medium text-ink">{needAction.length}</b></span>
              <span>Next team training <b className="font-medium text-ink">{upcoming[0] ? `${upcoming[0].date} · ${upcoming[0].what}` : 'none'}</b></span>
              <span>Pending approvals <b className="font-medium text-ink">{approvals}</b></span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => peopleCsv('team-report.csv', rows)} className="min-h-11 rounded-lg border border-line bg-white px-4 text-[15px] hover:border-ink/30">Download team report</button>
          {approvals > 0
            ? <button onClick={() => nav('/supervisor')} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">Review {approvals} approval{approvals > 1 ? 's' : ''} <ArrowRight size={16} /></button>
            : <button onClick={() => setTab('Training records')} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-dark">View training records <ArrowRight size={16} /></button>}
        </div>
      </header>

      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {strip.map((x) => (
          <li key={x.l}>
            <button onClick={x.open} className={cx(card, 'group w-full px-5 py-4 text-left hover:shadow-md hover:ring-ink/20')}>
              <div className={cx('text-[34px] font-semibold leading-none tabular-nums', x.tone)}>{x.n}</div>
              <div className="mt-1.5 flex items-center justify-between text-[15px] text-ink-2">{x.l}<ArrowRight size={15} className="text-ink-3 group-hover:text-ink" /></div>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={cx(card, 'px-6 py-5')}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold">Needs your action <span className="text-[15px] font-normal text-ink-3">· {needAction.length}</span></h2>
          </div>
          {needAction.length ? (
            <ul className="mt-2 max-h-[320px] divide-y divide-line overflow-y-auto">
              {needAction.map((x, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', x.tone === 'brand' ? 'bg-brand' : 'bg-amber-400')} />
                  <span className="min-w-0 flex-1"><span className="block text-[16px]">{x.who}</span><span className="block truncate text-[14px] text-ink-3">{x.why}</span></span>
                  <button onClick={x.go} className="text-[15px] text-brand hover:underline">{x.cta}</button>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-[16px] text-ink-2">Nothing needs your action right now.</p>}
          <h3 className="mt-5 text-[15px] text-ink-3">Team progress on {TRAINING.title}</h3>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-canvas">
            {progress.map((x) => x.n > 0 && <span key={x.l} className={x.c} style={{ width: `${(x.n / Math.max(1, team.length)) * 100}%` }} title={`${x.l}: ${x.n}`} />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-2">
            {progress.map((x) => <button key={x.l} onClick={() => drill.open({ title: x.l, rows: rows.filter((r) => (x.l === 'Completed' ? r.completed : x.l === 'In training' ? r.inProgress : x.l === 'Failed' ? r.failed : r.needs && !r.failed)), needs: x.l !== 'Completed' && x.l !== 'In training' })} className="flex items-center gap-1.5 hover:text-ink"><span className={cx('h-2.5 w-2.5 rounded-full', x.c)} />{x.l} {x.n}</button>)}
          </div>
        </section>

        <div className="space-y-5">
          <section className={cx(card, 'px-6 py-5')}>
            <h2 className="text-[20px] font-semibold">Approvals</h2>
            {withdrawals.filter((w) => w.status !== 'none').length ? (
              <ul className="mt-2 divide-y divide-line">
                {withdrawals.filter((w) => w.status !== 'none').map((w) => (
                  <li key={w.empId} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0"><span className="block text-[16px]">{nameOf(w.empId)}</span><span className="text-[14px] text-ink-3">Withdrawal request</span></span>
                    <Badge t={w.status === 'requested' ? 'warn' : 'ok'}>{w.status === 'requested' ? 'Waiting for you' : w.status === 'proposed' ? 'With HR' : w.status === 'approved' ? 'Approved' : 'Rejected'}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-[15px] text-ink-2">No withdrawal requests.</p>}
            <button onClick={() => nav('/supervisor')} className="mt-3 text-[15px] text-brand hover:underline">Open withdrawal requests →</button>
          </section>
          <section className={cx(card, 'px-6 py-5')}>
            <h2 className="text-[20px] font-semibold">Upcoming team training</h2>
            {upcoming.length ? (
              <ul className="mt-2 divide-y divide-line">
                {upcoming.slice(0, 5).map((x) => (
                  <li key={x.date + x.what} className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-2.5">
                    <span className="text-[14px] tabular-nums text-ink-3">{x.date}</span>
                    <span className="min-w-0"><span className="block truncate text-[16px]">{x.what}</span><span className="text-[14px] text-ink-3">{x.who}</span></span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-[15px] text-ink-2">Nothing scheduled.</p>}
          </section>
        </div>
      </div>

      <section className={cx(card, 'mt-5 px-6 py-5')}>
        <div className="flex gap-1 rounded-lg bg-canvas p-1" role="tablist" aria-label="Team detail">
          {(['Direct reports', 'Training records', 'Departments'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx('rounded-md px-4 py-2 text-[15px]', tab === t ? 'bg-white shadow-sm' : 'text-ink-2')}>{t}</button>
          ))}
        </div>
        <div className="mt-4">
          {tab === 'Direct reports' && (
            <DataTable rows={rows} columns={peopleColumns()} rowKey={(r) => r.p.id} searchText={(r) => `${r.p.name} ${r.p.eid}`} label="direct reports" selectable maxHeight={460}
              bulk={(sel) => <Btn v="secondary" size="sm" onClick={() => peopleCsv('team-selected.csv', sel)}>Download selected (CSV)</Btn>}
              footer={<Btn v="secondary" onClick={() => peopleCsv('team-all.csv', rows)}>Download all (CSV)</Btn>} />
          )}
          {tab === 'Training records' && <TeamRecords team={team} />}
          {tab === 'Departments' && <DeptTable stats={groupStats(rows, (r) => r.p.department, s)} onOpen={(d) => drill.open({ title: `${d} · direct reports`, rows: rows.filter((r) => r.p.department === d) })} attendanceKnown={s.attendanceSubmitted} />}
        </div>
      </section>
      {drill.panel}
    </div>
  );
}

function DeptTable({ stats, onOpen, attendanceKnown, hours }: { stats: GroupStat[]; onOpen: (key: string) => void; attendanceKnown: boolean; hours?: Record<string, number> }) {
  const cols: Column<GroupStat>[] = [
    { key: 'key', header: 'Department', render: (g) => <span className="font-semibold">{g.key}</span>, sort: (g) => g.key },
    { key: 'people', header: 'People', render: (g) => g.people, sort: (g) => g.people },
    { key: 'below', header: `Below target`, render: (g) => g.belowTarget, sort: (g) => g.belowTarget },
    { key: 'in', header: 'In this training', render: (g) => g.inTraining, sort: (g) => g.inTraining },
    { key: 'completion', header: 'Completion', render: (g) => <Meter value={g.completion} />, sort: (g) => g.completion },
    { key: 'attendance', header: 'Attendance', render: (g) => (attendanceKnown ? pctText(g.attendance) : <span className="text-ink-3">after training</span>), sort: (g) => g.attendance ?? -1 },
    { key: 'pass', header: 'Pass rate', render: (g) => pctText(g.passRate), sort: (g) => g.passRate ?? -1 },
    { key: 'mand', header: 'Mandatory course', render: (g) => pctText(g.mandatory), sort: (g) => g.mandatory ?? -1 },
  ];
  if (hours) cols.push({ key: 'hours', header: 'Learning hours', render: (g) => (hours[g.key] ?? 0).toLocaleString('en-IN'), sort: (g) => hours[g.key] ?? 0 });
  return <DataTable rows={stats} columns={cols} rowKey={(g) => g.key} onRowClick={(g) => onOpen(g.key)} label="groups" maxHeight={420} />;
}

function Meter({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-20 rounded-full bg-slate-100"><span className="block h-full rounded-full bg-ok" style={{ width: `${value}%` }} /></span>
      <span className="tabular-nums">{value}%</span>
    </span>
  );
}

/** FR 11–12: the team's training records for a time frame and label, with CSV and print. */
function TeamRecords({ team }: { team: Person[] }) {
  const s = useDemo();
  const [period, setPeriod] = useState('quarter');
  const [label, setLabel] = useState('All labels');
  const [category, setCategory] = useState('All categories');
  const eids = new Set(team.map((p) => p.eid));
  const all = trainingRecords(s).filter((r) => eids.has(r.eid));
  const labels = ['All labels', ...MASTERS.tags.filter((t) => all.some((r) => r.tags.includes(t)))];
  const recs = all.filter((r) => inPeriod(period, r.ym) && (label === 'All labels' || r.tags.includes(label)) && (category === 'All categories' || r.category === category));
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';
  const header = ['EID', 'Name', 'Training', 'Category', 'Labels', 'Date', 'Hours', 'Status', 'Assessment'];
  const flat = recs.map((r) => [r.eid, r.name, r.training, r.category, r.tags.join(', '), r.date, r.hours, r.status, r.result]);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Select label="Period" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} />
        <Select label="Label" value={label} onChange={setLabel} options={labels} />
        <Select label="Category" value={category} onChange={setCategory} options={['All categories', ...MASTERS.categories]} />
      </div>
      <DataTable rows={recs} columns={recordColumns()} rowKey={(r) => r.key} searchText={(r) => `${r.name} ${r.eid} ${r.training}`} label="records" maxHeight={420}
        emptyText="No training records for this period and label."
        toolbar={<>
          <Btn v="secondary" size="sm" onClick={() => downloadCsv(`team-records-${period}.csv`, header, flat)}>Download CSV</Btn>
          <Btn v="secondary" size="sm" onClick={() => printTable(`Team training records · ${SUPERVISOR_NAME}`, `${periodLabel} · ${label} · ${category}`, header, flat)}>Print / PDF</Btn>
        </>} />
    </div>
  );
}

export function recordColumns(): Column<TrainingRecord>[] {
  return [
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums text-ink-2">{r.eid}</span>, sort: (r) => r.eid },
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold">{r.name}</span>, sort: (r) => r.name },
    { key: 'training', header: 'Training', render: (r) => r.training, filter: (r) => r.training, sort: (r) => r.training },
    { key: 'labels', header: 'Labels', render: (r) => <span className="text-ink-2">{r.tags.join(', ') || '—'}</span> },
    { key: 'date', header: 'Date', render: (r) => <span className="whitespace-nowrap">{r.date}</span>, sort: (r) => r.ym ?? 0 },
    { key: 'hours', header: 'Hours', render: (r) => r.hours || '—', sort: (r) => r.hours },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge>, filter: (r) => r.status },
    { key: 'result', header: 'Assessment', render: (r) => (r.result === '—' ? <span className="text-ink-3">—</span> : <Badge>{r.result}</Badge>) },
  ];
}



/* ================================================================== */
/* Division Head: Division dashboard (FR 15, 186) and J1               */
/* ================================================================== */

export function DivisionDashboard() {
  const [summary, setSummary] = useState(false);
  return (
    <div>
      <TnaPage />
      <div className="mx-auto mt-12 max-w-[1280px] border-t border-line pt-6">
        <button onClick={() => setSummary((v) => !v)} aria-expanded={summary} className="text-[15px] text-ink-2 hover:text-brand">{summary ? 'Hide' : 'Show'} the division training summary</button>
        {summary && <div className="mt-6"><DivisionBody /></div>}
      </div>
    </div>
  );
}

function DivisionBody() {
  const s = useDemo();
  const drill = useDrill();
  const [period, setPeriod] = useState('fy2026');
  const [segment, setSegment] = useState<'Department' | 'Designation'>('Department');
  const people = inDivision(DIVISION_NAME);
  const rows = personRows(s, people);
  const eids = new Set(people.map((p) => p.eid));
  const recs = trainingRecords(s).filter((r) => eids.has(r.eid) && inPeriod(period, r.ym));
  const by = (r: PersonRow) => (segment === 'Department' ? r.p.department : r.p.designation);
  const stats = groupStats(rows, by, s);
  const hours: Record<string, number> = {};
  recs.forEach((r) => { const p = people.find((x) => x.eid === r.eid); if (p) { const k = segment === 'Department' ? p.department : p.designation; hours[k] = (hours[k] ?? 0) + r.hours; } });
  const totalHours = recs.reduce((n, r) => n + r.hours, 0);
  const trained = new Set(recs.filter(isDone).map((r) => r.eid)).size;
  const enrolled = rows.filter((r) => r.course);
  const mand = pct(enrolled.filter((r) => r.course?.status === 'Completed').length, enrolled.length);
  return (
    <>
      <Section title="Division learning" fr="FR 15" action={<Select label="Time frame" value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.key, label: p.label }))} />}>
        <Figures items={[
          { label: 'People trained', value: trained, sub: `of ${people.length} · ${PERIODS.find((p) => p.key === period)?.label}`, onOpen: () => drill.open({ title: 'People with a completed training in this time frame', rows: rows.filter((r) => recs.some((x) => x.eid === r.p.eid && isDone(x))) }) },
          { label: 'Learning hours', value: totalHours.toLocaleString('en-IN'), sub: 'from the training database', onOpen: () => drill.open({ title: 'People with learning hours in this time frame', rows: rows.filter((r) => recs.some((x) => x.eid === r.p.eid && x.hours > 0)) }) },
          { label: 'Below target', value: rows.filter((r) => r.p.creditLevel < CREDIT_TARGET).length, tone: 'warn', sub: 'Credit Analysis', onOpen: () => drill.open({ title: 'Below target in Credit Analysis', rows: rows.filter((r) => r.p.creditLevel < CREDIT_TARGET), needs: true }) },
          { label: 'Passed / failed', value: `${rows.filter((r) => r.completed).length} / ${rows.filter((r) => r.failed).length}`, sub: s.pta.released ? TRAINING.title : 'after results are released', onOpen: () => drill.open({ title: 'Assessment results', rows: rows.filter((r) => r.completed || r.failed) }) },
          { label: 'Mandatory compliance', value: pctText(mand), tone: mand !== null && mand >= 90 ? 'ok' : 'warn', sub: MANDATORY_COURSE, onOpen: () => drill.open({ title: `Not complete: ${MANDATORY_COURSE}`, rows: enrolled.filter((r) => r.course?.status !== 'Completed') }) },
        ]} />
      </Section>
      <Section title="Department and segment summary" fr="FR 15" action={<Select label="Segment by" value={segment} onChange={(v) => setSegment(v as 'Department' | 'Designation')} options={['Department', 'Designation']} />}>
        <DeptTable stats={stats} hours={hours} attendanceKnown={s.attendanceSubmitted} onOpen={(k) => drill.open({ title: `${k} · ${DIVISION_NAME}`, rows: rows.filter((r) => by(r) === k) })} />
      </Section>
      {drill.panel}
    </>
  );
}

/* ================================================================== */
/* HR: operations dashboard (FR 168) + Today                           */
/* ================================================================== */
interface ProgRow { id: string; title: string; date: string; venue: string; medium: string; status: string; participants: number; attended: number | null; story?: boolean }

export function programmeRows(s: DemoState): ProgRow[] {
  const story: ProgRow[] = s.scheduled ? [{ id: TRAINING.trainingId, title: TRAINING.title, date: '18–19 Nov 2026', venue: s.sched.venue || TRAINING.venue, medium: 'Classroom', status: trainingStatus(s), participants: roster(s).length, attended: s.attendanceSubmitted ? attendedIds(s).length : null, story: true }] : [];
  return [...story, ...s.programmes.map((p) => ({ id: p.id, title: p.title, date: p.date, venue: p.venue, medium: p.medium, status: p.status, participants: p.participants, attended: p.attended }))];
}

/* ================================================================== */
/* Trainer: sessions (FR 18) + Today                                   */
/* ================================================================== */
/* ================================================================== */
/* Finance (proposed): budget pipeline                                 */
/* ================================================================== */
function FinanceHome() {
  const s = useDemo();
  const nav = useNavigate();
  const status = !s.scheduled ? 'Not yet prepared by HR' : s.budgetApproved ? 'Approved' : s.budgetReturned ? 'Returned to HR' : 'Awaiting approval';
  const rows = [
    { id: TRAINING.trainingId, title: TRAINING.title, amount: TRAINING.budget, maker: TRAINING.organizer, status, approval: s.budgetApproved ? TRAINING.approvalNo : '—', actual: s.planned.actualExpense ? `BDT ${s.planned.actualExpense}` : '—' },
    ...s.programmes.filter((p) => p.fromRequest).map((p) => ({ id: p.id, title: p.title, amount: 'To be prepared', maker: TRAINING.organizer, status: 'Not yet prepared by HR', approval: '—', actual: '—' })),
  ];
  type Row = (typeof rows)[number];
  const cols: Column<Row>[] = [
    { key: 'id', header: 'Training ID', render: (r) => <span className="tabular-nums text-ink-2">{r.id}</span> },
    { key: 'title', header: 'Programme', render: (r) => <span className="font-semibold">{r.title}</span> },
    { key: 'amount', header: 'Budget', render: (r) => r.amount },
    { key: 'maker', header: 'Prepared by (maker)', render: (r) => r.maker },
    { key: 'status', header: 'Status', render: (r) => <Badge t={r.status === 'Awaiting approval' ? 'warn' : r.status === 'Approved' ? 'ok' : r.status === 'Returned to HR' ? 'brand' : 'neutral'}>{r.status}</Badge>, filter: (r) => r.status },
    { key: 'approval', header: 'Approval no.', render: (r) => r.approval },
    { key: 'actual', header: 'Actual expense', render: (r) => r.actual },
  ];
  const waiting = rows.filter((r) => r.status === 'Awaiting approval').length;
  return (
    <Section title="Budget pipeline" fr="Proposed · based on FR 135" action={<SourceTag kind="proposed">Proposed workflow, based on FR 135</SourceTag>}>
      <div className="mb-6">
        <Figures items={[
          { label: 'Awaiting approval', value: waiting, tone: waiting ? 'warn' : 'neutral', sub: waiting ? TRAINING.budget : 'nothing waiting', cta: 'Open', onOpen: waiting ? () => nav('/finance') : undefined },
          { label: 'Returned to HR', value: rows.filter((r) => r.status === 'Returned to HR').length, sub: s.budgetReturned ? s.budgetReturnReason : 'none' },
          { label: 'Approved', value: rows.filter((r) => r.status === 'Approved').length, tone: 'ok', sub: s.budgetApproved ? `${TRAINING.budget} · ${TRAINING.approvalNo}` : 'none yet' },
          { label: 'Actual expense recorded', value: s.planned.actualExpense ? `BDT ${s.planned.actualExpense}` : '—', sub: s.completed ? 'training closed by HR' : 'after HR closes the training' },
        ]} />
      </div>
      <DataTable rows={rows} columns={cols} rowKey={(r) => r.id} label="budgets" onRowClick={() => nav('/finance')} />
    </Section>
  );
}

/* ================================================================== */
/* Management (proposed role): bank-wide summary                       */
/* ================================================================== */
function ManagementHome() {
  const s = useDemo();
  const nav = useNavigate();
  const drill = useDrill();
  const rows = personRows(s, DIRECTORY);
  const res = rows.filter((r) => r.completed || r.failed);
  const enrolled = rows.filter((r) => r.course);
  const mand = pct(enrolled.filter((r) => r.course?.status === 'Completed').length, enrolled.length);
  return (
    <Section title="Bank-wide summary" fr="FR 168, 208" action={<Btn onClick={() => nav('/executive')}>Open Executive Insight <ArrowRight size={16} /></Btn>}>
      <Figures items={[
        { label: 'Employees in the directory', value: DIRECTORY.length, sub: `${DIVISIONS.length} divisions` },
        { label: 'In this training', value: rows.filter((r) => r.inTraining).length, sub: TRAINING.title, onOpen: () => drill.open({ title: `Participants: ${TRAINING.title}`, rows: rows.filter((r) => r.inTraining) }) },
        { label: 'Pass rate', value: res.length ? pctText(pct(rows.filter((r) => r.completed).length, res.length)) : '—', sub: s.pta.released ? 'post-training assessment' : 'after results are released', onOpen: res.length ? () => drill.open({ title: 'Assessment results', rows: res }) : undefined },
        { label: 'Mandatory compliance', value: pctText(mand), tone: mand !== null && mand >= 90 ? 'ok' : 'warn', sub: MANDATORY_COURSE, onOpen: () => drill.open({ title: `Not complete: ${MANDATORY_COURSE}`, rows: enrolled.filter((r) => r.course?.status !== 'Completed') }) },
        { label: 'Below target', value: creditGap().length, tone: 'warn', sub: 'Credit Analysis, all divisions', onOpen: () => drill.open({ title: 'Below target in Credit Analysis', rows: rows.filter((r) => creditGap().some((p) => p.id === r.p.id)), needs: true }) },
      ]} />
      {drill.panel}
    </Section>
  );
}

/* ================================================================== */
/* Admin: integration health (simulated) + access overview (FR 21)     */
/* ================================================================== */
function AdminHome() {
  const s = useDemo();
  const nav = useNavigate();
  const counts: Record<Role, number> = {
    employee: DIRECTORY.length, supervisor: SUPERVISORS.length, division_head: DIVISIONS.length, trainer: TRAINERS.length, hr: 1, finance: 1, admin: 1, management: 1,
  };
  const access = ROLE_ORDER.map((r) => ({ role: r, label: PERSONAS[r].label, person: PERSONAS[r].name, users: counts[r], pages: WORK_NAV[r].reduce((n, g) => n + g.items.length, 0), areas: ENTITLED[r].join(', ') }));
  type A = (typeof access)[number];
  const cols: Column<A>[] = [
    { key: 'label', header: 'Role', render: (a) => <span className="font-semibold">{a.label}</span> },
    { key: 'person', header: 'Demo user', render: (a) => a.person },
    { key: 'users', header: 'Users in the demo directory', render: (a) => a.users, sort: (a) => a.users },
    { key: 'pages', header: 'Work pages', render: (a) => a.pages, sort: (a) => a.pages },
    { key: 'areas', header: 'May open without switching', render: (a) => <span className="text-[14px] text-ink-2">{a.areas}</span> },
  ];
  const extra = s.extraAttendees;
  return (
    <>
      {extra.length > 0 && (
        <Section title="Extra attendees" fr="FR 143">
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {extra.map((x) => (
              <li key={x.eid} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span><span className="block text-[17px] font-semibold">{x.name} <span className="font-normal text-ink-3">· {x.eid}</span></span><span className="text-[15px] text-ink-3">Joined the online session but was not on the participant list</span></span>
                {x.status === 'approved' ? <Badge t="ok">Approved</Badge> : <Btn onClick={() => s.approveExtraAttendee(x.eid)}>Approve extra attendee</Btn>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Integration health" fr="FR 244" action={<SourceTag kind="simulated" />}>
        <ul className="grid gap-x-8 gap-y-0 rounded-2xl border border-line bg-white px-5 py-2 md:grid-cols-2">
          {INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ok" aria-label="Healthy" />
              <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{i.name}</span><span className="block text-[14px] text-ink-3">{i.sync}</span></span>
            </li>
          ))}
        </ul>
        <div className="mt-3"><Btn v="link" onClick={() => nav('/admin/integrations')}>Open Integrations <ArrowRight size={15} /></Btn></div>
      </Section>
      <Section title="Access overview" fr="FR 21" action={<SourceTag kind="architecture" />}>
        <DataTable rows={access} columns={cols} rowKey={(a) => a.role} label="roles" onRowClick={() => nav('/admin/security')} />
      </Section>
    </>
  );
}

/* ================================================================== */
/* Employee: My Learning card                                          */
/* ================================================================== */
