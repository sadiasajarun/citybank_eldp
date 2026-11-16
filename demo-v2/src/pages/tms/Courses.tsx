import { useMemo, useState } from 'react';
import { Bell, Download } from 'lucide-react';
import { courseOf, useDemo, type Enrollment } from '../../store';
import { findById } from '../../org';
import { PageHead } from '../../components/Templates';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { Badge, Btn, cx, Progress } from '../../components/ui';
import { SourceTag } from '../../components/Source';

type Status = Enrollment['status'];
interface Row { id: string; course: string; personId: string; name: string; eid: string; division: string; department: string; supervisor: string; progress: number; due: string; status: Status; reminded: boolean }

const TONE: Record<Status, string> = { Completed: 'ok', 'In progress': 'info', Overdue: 'warn', 'Not started': 'neutral' };
const ORDER: Status[] = ['Completed', 'In progress', 'Overdue', 'Not started'];

export function CourseEnrolments() {
  const s = useDemo();
  const [view, setView] = useState<{ key: number; status: string }>({ key: 0, status: '' });

  const rows: Row[] = useMemo(() => s.enrollments.map((en) => {
    const p = findById(en.personId);
    const tracked = en.personId === 'e1' || Boolean(s.courseOthers[en.personId]);
    const live = tracked ? courseOf(s, en.personId) : { progress: en.progress, completed: en.status === 'Completed' };
    const status: Status = live.completed || live.progress >= 100 ? 'Completed' : en.status === 'Overdue' ? 'Overdue' : live.progress === 0 ? 'Not started' : 'In progress';
    return {
      id: en.id, course: en.course, personId: en.personId, name: p?.name ?? en.personId, eid: p?.eid ?? '', division: p?.division ?? '', department: p?.department ?? '',
      supervisor: p?.supervisor ?? '', progress: live.completed ? 100 : live.progress, due: en.due, status, reminded: en.reminded,
    };
  }), [s.enrollments, s.courseProgress, s.courseCompleted, s.courseOthers]);

  const count = (x: Status) => rows.filter((r) => r.status === x).length;
  const course = rows[0]?.course ?? 'Information Security Awareness 2026';

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Employee', sort: (r) => r.name, render: (r) => <div><div className="font-semibold">{r.name}</div><div className="text-[14px] text-ink-3">{r.eid}</div></div> },
    { key: 'division', header: 'Division', filter: (r) => r.division, sort: (r) => r.division, render: (r) => <div><div>{r.division}</div><div className="text-[14px] text-ink-3">{r.department}</div></div> },
    { key: 'supervisor', header: 'Supervisor', sort: (r) => r.supervisor, render: (r) => r.supervisor },
    { key: 'progress', header: 'Progress', sort: (r) => r.progress, width: 'w-48', render: (r) => <div className="flex items-center gap-3"><div className="w-28"><Progress value={r.progress} tone={r.progress === 100 ? 'ok' : 'brand'} /></div><span className="tabular-nums font-semibold">{r.progress}%</span></div> },
    { key: 'due', header: 'Due', render: (r) => r.due },
    { key: 'status', header: 'Status', filter: (r) => r.status, sort: (r) => ORDER.indexOf(r.status), render: (r) => <div className="flex flex-wrap items-center gap-1.5"><Badge t={TONE[r.status]}>{r.status}</Badge>{r.reminded && r.status !== 'Completed' && <Badge t="neutral"><Bell size={13} /> Reminded</Badge>}</div> },
  ];

  const exportCsv = () => downloadCsv('course-enrolments.csv', ['Course', 'Employee ID', 'Name', 'Division', 'Department', 'Supervisor', 'Progress %', 'Due', 'Status', 'Reminded'],
    rows.map((r) => [r.course, r.eid, r.name, r.division, r.department, r.supervisor, r.progress, r.due, r.status, r.reminded ? 'Yes' : 'No']));

  return (
    <div>
      <PageHead
        title="Course Enrolments"
        meta={`${course} · mandatory · due ${rows[0]?.due ?? '20 Nov 2026'}`}
        sub="Enrolment, progress and overdue learners. Reminders go by email, in-app and SMS with the line manager copied."
        fr="FR 200–201"
        tags={<SourceTag kind="fictional" />}
        actions={<Btn v="secondary" icon={<Download size={16} />} onClick={exportCsv}>Export CSV</Btn>}
      />

      <div className="mb-6 flex flex-wrap divide-x divide-line border-y border-line">
        {ORDER.map((x) => (
          <button key={x} onClick={() => setView({ key: view.key + 1, status: view.status === x ? '' : x })} className={cx('flex-1 px-6 py-4 text-left first:pl-0 hover:bg-[#faf8f5]', view.status === x && 'bg-[#faf8f5]')} aria-pressed={view.status === x}>
            <div className={cx('text-[32px] font-extrabold leading-none tabular-nums', x === 'Completed' && 'text-ok', x === 'Overdue' && 'text-warn')}>{count(x)}</div>
            <div className="mt-1 text-[15px] text-ink-2">{x} <span className="text-ink-3">· show</span></div>
          </button>
        ))}
        <div className="flex-1 px-6 py-4">
          <div className="text-[32px] font-extrabold leading-none tabular-nums">{rows.length ? Math.round((count('Completed') / rows.length) * 100) : 0}%</div>
          <div className="mt-1 text-[15px] text-ink-2">Completion · {rows.length} enrolled</div>
        </div>
      </div>

      <DataTable<Row>
        key={view.key}
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.name} ${r.eid} ${r.supervisor}`}
        initialFilters={view.status ? { status: view.status } : {}}
        selectable
        canSelect={(r) => r.status !== 'Completed'}
        label="learners"
        emptyText="No learners match these filters."
        bulk={(sel, clear) => (
          <Btn onClick={() => { s.sendReminders(sel.map((r) => r.id)); clear(); }} icon={<Bell size={16} />}>Send reminder</Btn>
        )}
      />
      <p className="mt-3 text-[15px] text-ink-3">Select learners who have not completed (use the Overdue or Not started figures above to filter), then choose Send reminder. Completed learners cannot be selected. Notifications are simulated.</p>
    </div>
  );
}
