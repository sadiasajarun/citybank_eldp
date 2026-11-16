/**
 * Executive Insight (management, proposed role): bank-wide figures computed from the records,
 * division progress, who still needs training, a capability heatmap and trends. Every figure drills down.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { MASTERS, TRAINING } from '../../data';
import { CREDIT_TARGET, DIRECTORY, DIVISIONS } from '../../org';
import { JOURNEY, journeyIndex } from '../../lifecycle';
import { attendedIds, roster, useDemo } from '../../store';
import { PageHead, Section } from '../../components/Templates';
import { DivisionHome } from './DivisionHome';
import { SourceTag } from '../../components/Source';
import { DataTable, type Column } from '../../components/DataTable';
import { Btn, cx } from '../../components/ui';
import { Bars, Figures, groupStats, MANDATORY_COURSE, monthLabel, pct, pctText, personRows, trainingRecords, useDrill, type GroupStat, type PersonRow } from './dash';

const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];
const money = (n: number) => `BDT ${Math.round(n).toLocaleString('en-IN')}`;
const num = (v: string) => Number(v.replace(/[^0-9.]/g, '')) || 0;

/** Fictional capability levels (% at target) for competencies the demo does not model. */
const FICTIONAL_HEAT: number[][] = [
  [82, 74, 88, 79, 71, 84],
  [77, 69, 81, 86, 66, 78],
  [91, 72, 84, 70, 75, 89],
  [85, 64, 79, 73, 68, 87],
  [74, 78, 83, 92, 72, 76],
];

export function Executive() {
  const [view, setView] = useState<'Management' | 'Division Head / Learning Champion'>('Management');
  return (
    <div>
      <div className="mx-auto flex max-w-[1480px] justify-end px-6 pt-6 lg:px-10">
        <div className="flex gap-1 rounded-lg bg-white p-1 ring-1 ring-line" role="tablist" aria-label="Insight view">
          {(['Management', 'Division Head / Learning Champion'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={v === view ? 'rounded-md bg-ink px-4 py-2 text-[15px] text-white' : 'rounded-md px-4 py-2 text-[15px] text-ink-2 hover:text-ink'}>{v}</button>
          ))}
        </div>
      </div>
      {view === 'Management' ? <ManagementInsight /> : <div className="pt-4"><DivisionHome /></div>}
    </div>
  );
}

function ManagementInsight() {
  const s = useDemo();
  const nav = useNavigate();
  const drill = useDrill();
  useEffect(() => {
    const st = useDemo.getState();
    if (journeyIndex(st) >= JOURNEY.length - 1) st.viewExec();
  }, []);
  const finished = journeyIndex(s) >= JOURNEY.length;

  const rows = personRows(s, DIRECTORY);
  const ros = roster(s);
  const att = attendedIds(s);
  const res = rows.filter((r) => r.completed || r.failed);
  const passed = rows.filter((r) => r.completed);
  const enrolled = rows.filter((r) => r.course);
  const mand = pct(enrolled.filter((r) => r.course?.status === 'Completed').length, enrolled.length);
  const recs = trainingRecords(s);
  const hours = recs.reduce((n, r) => n + r.hours, 0);
  const spend = s.planned.actualExpense ? num(s.planned.actualExpense) : num(s.planned.budgetApproved);
  const costPer = s.attendanceSubmitted && att.length ? spend / att.length : null;

  const divStats = groupStats(rows, (r) => r.p.division, s);
  const needsByDiv = rows.filter((r) => r.needs && r.p.creditLevel < CREDIT_TARGET && TARGET_ROLES.includes(r.p.designation));

  const divCols: Column<GroupStat>[] = [
    { key: 'key', header: 'Division', render: (g) => <span className="font-semibold">{g.key}</span>, sort: (g) => g.key },
    { key: 'people', header: 'People', render: (g) => g.people, sort: (g) => g.people },
    { key: 'in', header: 'In this training', render: (g) => g.inTraining, sort: (g) => g.inTraining },
    { key: 'att', header: 'Attendance', render: (g) => (s.attendanceSubmitted ? pctText(g.attendance) : <span className="text-ink-3">after training</span>), sort: (g) => g.attendance ?? -1 },
    { key: 'pass', header: 'Passed / failed', render: (g) => `${g.passed} / ${g.failed}`, sort: (g) => g.passed },
    { key: 'mand', header: 'Mandatory course', render: (g) => pctText(g.mandatory), sort: (g) => g.mandatory ?? -1 },
    { key: 'below', header: 'Below target', render: (g) => g.belowTarget, sort: (g) => g.belowTarget },
    { key: 'needs', header: 'Still need training', render: (g) => <span className="font-semibold text-warn">{needsByDiv.filter((r) => r.p.division === g.key).length}</span>, sort: (g) => needsByDiv.filter((r) => r.p.division === g.key).length },
  ];
  const needCols: Column<PersonRow>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold">{r.p.name}</span>, sort: (r) => r.p.name },
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums text-ink-2">{r.p.eid}</span> },
    { key: 'div', header: 'Division', render: (r) => r.p.division, filter: (r) => r.p.division },
    { key: 'dept', header: 'Department', render: (r) => r.p.department, filter: (r) => r.p.department },
    { key: 'des', header: 'Designation', render: (r) => r.p.designation, filter: (r) => r.p.designation },
    { key: 'lvl', header: 'Credit Analysis', render: (r) => `Level ${r.p.creditLevel} of ${CREDIT_TARGET}`, sort: (r) => r.p.creditLevel },
    { key: 'why', header: 'Why', render: (r) => <span className="text-ink-2">{r.needReason}</span> },
  ];

  // Capability heatmap: Credit Analysis computed from the directory and results; other competencies fictional.
  const creditAtTarget = (div: string) => {
    const pop = rows.filter((r) => r.p.division === div && TARGET_ROLES.includes(r.p.designation));
    return pct(pop.filter((r) => r.p.creditLevel >= CREDIT_TARGET || r.completed).length, pop.length) ?? 0;
  };
  const heat = (v: number) => (v >= 85 ? 'bg-ok-soft text-ok' : v >= 70 ? 'bg-slate-100 text-ink' : v >= 50 ? 'bg-warn-soft text-warn' : 'bg-brand-soft text-brand-dark');

  // Trends: learning hours and completed records by month, from the records.
  const months = [...new Set(recs.map((r) => r.ym).filter((m): m is number => m !== null))].sort((a, b) => a - b).slice(-6);
  const hoursByMonth = months.map((m) => ({ label: monthLabel(m), value: recs.filter((r) => r.ym === m).reduce((n, r) => n + r.hours, 0) }));
  const doneByMonth = months.map((m) => ({ label: monthLabel(m), value: recs.filter((r) => r.ym === m && (r.status === 'Completed' || r.status === 'Attended')).length }));

  return (
    <div className="mx-auto max-w-[1480px] px-6 pb-8 pt-2 lg:px-10">
      <PageHead title="Executive Insight" meta={`All ${DIVISIONS.length} divisions · ${DIRECTORY.length} employees in the demo directory · computed from the training records`} fr="FR 168, 175–185, 208"
        tags={<><SourceTag kind="proposed">Management role and Executive Center are proposed based on reporting and analytics requirements.</SourceTag><SourceTag kind="fictional" /></>}
        actions={<Btn v="secondary" onClick={() => nav('/reports')}>Open Reports</Btn>} />

      {finished && (
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ok/30 bg-ok-soft px-6 py-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="shrink-0 text-ok" />
            <div><div className="text-[19px] font-bold">All steps complete</div><div className="text-[16px] text-ink-2">Every record in this story, from the divisional requirement to the assessment results, is now in these figures.</div></div>
          </div>
          <Btn onClick={() => nav('/overview')}>Back to Home <ArrowRight size={16} /></Btn>
        </div>
      )}

      <Section title="Bank-wide learning" fr="FR 168, 208">
        <Figures items={[
          { label: 'Participants', value: ros.length, sub: TRAINING.title, onOpen: () => drill.open({ title: `Participants: ${TRAINING.title}`, rows: rows.filter((r) => r.inTraining) }) },
          { label: 'Attendance', value: s.attendanceSubmitted ? pctText(pct(att.length, ros.length)) : '—', sub: s.attendanceSubmitted ? `${att.length} of ${ros.length} attended` : 'after the training days', cta: 'See who was absent', onOpen: s.attendanceSubmitted ? () => drill.open({ title: 'Absent from the training', rows: rows.filter((r) => r.story === 'Absent') }) : undefined },
          { label: 'Pass rate', value: res.length ? pctText(pct(passed.length, res.length)) : '—', tone: 'ok', sub: s.pta.released ? `${passed.length} passed · ${res.length - passed.length} failed` : 'after results are released', onOpen: res.length ? () => drill.open({ title: 'Post-training assessment results', rows: res }) : undefined },
          { label: 'Learning hours', value: hours.toLocaleString('en-IN'), sub: 'training database and e-learning', onOpen: () => drill.open({ title: 'People with recorded learning hours', rows: rows.filter((r) => recs.some((x) => x.personId === r.p.id && x.hours > 0)) }) },
          { label: 'Cost per employee', value: costPer === null ? '—' : money(costPer), sub: costPer === null ? 'after attendance is submitted' : `${s.planned.actualExpense ? 'actual' : 'approved budget'} ${money(spend)} ÷ ${att.length} attended` },
          { label: 'Mandatory compliance', value: pctText(mand), tone: mand !== null && mand >= 90 ? 'ok' : 'warn', sub: MANDATORY_COURSE, onOpen: () => drill.open({ title: `Not complete: ${MANDATORY_COURSE}`, rows: enrolled.filter((r) => r.course?.status !== 'Completed') }) },
        ]} />
      </Section>

      <Section title="Division progress" fr="FR 176, 208">
        <DataTable rows={divStats} columns={divCols} rowKey={(g) => g.key} label="divisions" onRowClick={(g) => drill.open({ title: `${g.key} Division`, rows: rows.filter((r) => r.p.division === g.key) })} />
      </Section>

      <Section title="Who still needs training" fr="FR 185, 241–243">
        <p className="mb-4 max-w-3xl text-[16px] text-ink-2">Officers below the Credit Analysis target who have not completed the training: not nominated, absent, withdrawn or failed.</p>
        <DataTable rows={needsByDiv} columns={needCols} rowKey={(r) => r.p.id} searchText={(r) => `${r.p.name} ${r.p.eid}`} groupBy={(r) => r.p.division} groupOrder={DIVISIONS.map((d) => d.name)} label="people" maxHeight={460} emptyText="Everyone below target is covered." />
      </Section>

      <div className="mt-10 grid gap-10 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[24px] font-bold tracking-tight">Capability heatmap · % at target</h2>
            <SourceTag kind="fictional">Credit Analysis computed; other competencies fictional</SourceTag>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white p-4">
            <table className="w-full min-w-[640px] border-separate border-spacing-1 text-[15px]">
              <thead><tr><th className="text-left text-[14px] font-semibold text-ink-3">Division</th><th className="text-[14px] font-semibold text-ink-3">Credit Analysis</th>{MASTERS.competencies.map((c) => <th key={c} className="text-[14px] font-semibold text-ink-3">{c}</th>)}</tr></thead>
              <tbody>
                {DIVISIONS.map((d, i) => {
                  const ca = creditAtTarget(d.name);
                  return (
                    <tr key={d.name}>
                      <td className="pr-2 font-semibold">{d.name}</td>
                      <td><button onClick={() => drill.open({ title: `${d.name} · below target in Credit Analysis`, rows: rows.filter((r) => r.p.division === d.name && r.p.creditLevel < CREDIT_TARGET && !r.completed), needs: true })} className={cx('h-11 w-full rounded-md font-bold tabular-nums hover:ring-2 hover:ring-ink/20', heat(ca))} aria-label={`${d.name} Credit Analysis ${ca}% at target, see who is below`}>{ca}%</button></td>
                      {FICTIONAL_HEAT[i].map((v, c) => <td key={c}><span className={cx('grid h-11 place-items-center rounded-md font-bold tabular-nums', heat(v))}>{v}%</span></td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[14px] text-ink-3">Select a Credit Analysis cell to see who is below target. Green ≥ 85% · grey 70–84% · amber 50–69% · red below 50%.</p>
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-[24px] font-bold tracking-tight">Trends</h2>
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-3 text-[16px] font-semibold">Learning hours by month</div>
            <Bars data={hoursByMonth} unit=" h" />
            <div className="mb-3 mt-6 text-[16px] font-semibold">Completed trainings by month</div>
            <Bars data={doneByMonth} />
            <p className="mt-4 text-[14px] text-ink-3">From the training database, this training and e-learning records.</p>
          </div>
        </section>
      </div>
      {drill.panel}
    </div>
  );
}
