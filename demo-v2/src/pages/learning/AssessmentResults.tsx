import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';
import { PERSONAS, TRAINING } from '../../data';
import { ptResults, useDemo, type PtStatus } from '../../store';
import { findById, type Person } from '../../org';
import { JOURNEY } from '../../lifecycle';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { NotYet, PageHead } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { Alert, Badge, Btn } from '../../components/ui';

interface Row { id: string; p: Person | undefined; status: PtStatus; score: number | null; grade: string; remediation: string }

const STATUS_TONE: Record<PtStatus, string> = { Passed: 'ok', Failed: 'brand', Absent: 'neutral', 'Awaiting release': 'warn', 'Not taken': 'neutral' };

export function AssessmentResults() {
  const s = useDemo();
  const nav = useNavigate();
  const attStep = JOURNEY.findIndex((j) => j.impactKey === 'Attendance submitted') + 1;
  const scope = s.role === 'supervisor' ? `Your direct reports (${PERSONAS.supervisor.name})` : s.role === 'division_head' ? 'Corporate Banking' : 'All participants';
  const head = (
    <PageHead
      title="Assessment Results"
      meta={<>{TRAINING.title} · training {TRAINING.trainingId} · post-training assessment · {scope}</>}
      fr="FR 214, 217"
      tags={<SourceTag kind="fictional" />}
    />
  );
  if (!s.attendanceSubmitted) return <div>{head}<NotYet title="Results appear after the training" after={`attendance is submitted (Step ${attStep}) and the trainer releases the results`} /></div>;

  const all: Row[] = ptResults(s).map((r) => ({ ...r, p: findById(r.id), remediation: s.remediation[r.id] ?? '' }));
  const rows = all.filter((r) => (s.role === 'supervisor' ? r.p?.supervisor === PERSONAS.supervisor.name : s.role === 'division_head' ? r.p?.division === 'Corporate Banking' : true));
  const n = (st: PtStatus) => rows.filter((r) => r.status === st).length;
  const passed = n('Passed'), failed = n('Failed'), absent = n('Absent'), waiting = n('Awaiting release');
  const scored = rows.filter((r) => r.score !== null);
  const avg = scored.length ? Math.round(scored.reduce((t, r) => t + (r.score ?? 0), 0) / scored.length) : 0;
  const canAssign = s.role === 'hr' || s.role === 'trainer';
  const openFailed = rows.filter((r) => r.status === 'Failed' && !r.remediation).length;

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-semibold">{r.p?.name ?? r.id}</span>, sort: (r) => r.p?.name ?? r.id },
    { key: 'eid', header: 'EID', render: (r) => <span className="tabular-nums text-ink-2">{r.p?.eid ?? '—'}</span>, sort: (r) => r.p?.eid ?? '' },
    { key: 'division', header: 'Division', render: (r) => r.p?.division ?? '—', filter: (r) => r.p?.division ?? '—', sort: (r) => r.p?.division ?? '' },
    { key: 'supervisor', header: 'Supervisor', render: (r) => r.p?.supervisor ?? '—', sort: (r) => r.p?.supervisor ?? '' },
    { key: 'score', header: 'Score', render: (r) => (r.score === null ? <span className="text-ink-3">—</span> : <span className="tabular-nums font-semibold">{r.score}%</span>), sort: (r) => r.score ?? -1 },
    { key: 'grade', header: 'Grade', render: (r) => (r.status === 'Passed' || r.status === 'Failed' ? r.grade : <span className="text-ink-3">—</span>), sort: (r) => r.score ?? -1 },
    { key: 'status', header: 'Status', render: (r) => <Badge t={STATUS_TONE[r.status]}>{r.status}</Badge>, filter: (r) => r.status, sort: (r) => r.status },
    { key: 'rem', header: 'Remediation', render: (r) => (r.remediation ? <Badge t="info">{r.remediation}</Badge> : r.status === 'Failed' ? <span className="text-[15px] text-warn">Not assigned</span> : <span className="text-ink-3">—</span>) },
  ];

  const exportCsv = () => downloadCsv('assessment-results-20260182.csv', ['Name', 'EID', 'Division', 'Supervisor', 'Score', 'Grade', 'Status', 'Remediation'],
    rows.map((r) => [r.p?.name ?? r.id, r.p?.eid ?? '', r.p?.division ?? '', r.p?.supervisor ?? '', r.score ?? '', r.status === 'Passed' || r.status === 'Failed' ? r.grade : '', r.status, r.remediation]));

  const assign = (sel: Row[], clear: () => void, kind: 'Re-attempt scheduled' | 'Refresher assigned') => {
    const ids = sel.map((r) => r.id);
    s.withUndo(`${kind} · ${ids.length} employee${ids.length > 1 ? 's' : ''}`, () => s.assignRemediation(ids, kind));
    clear();
  };

  const stats: [string, string, string][] = [
    [passed + failed ? `${Math.round((passed / (passed + failed)) * 100)}%` : '—', 'Pass rate', passed + failed ? `${passed} passed · ${failed} failed` : 'After release'],
    [scored.length ? `${avg}%` : '—', 'Average score', `${scored.length} candidates took it`],
    [String(absent), 'Absent', 'Did not attend · no attempt'],
    [String(waiting), 'Awaiting release', waiting ? 'With the trainer' : 'All released'],
  ];

  return (
    <div>
      {head}
      {!s.pta.released && (
        <div className="mb-6">
          <Alert kind="warn" title="Results are awaiting the trainer’s release" action={s.role === 'trainer' ? <Btn v="secondary" onClick={() => nav('/assessment/review')}>Open the review <ArrowRight size={16} /></Btn> : undefined}>
            Scores are visible to you; candidates see them after Nafis Ahmed releases the results (FR 214).
          </Alert>
        </div>
      )}
      <dl className="mb-8 flex flex-wrap divide-x divide-line border-y border-line">
        {stats.map(([v, l, sub]) => (
          <div key={l} className="min-w-[180px] flex-1 px-6 py-4 first:pl-0">
            <dd className="num text-[32px] leading-none">{v}</dd>
            <dt className="mt-1 text-[16px] font-semibold">{l}</dt>
            <div className="text-[14px] text-ink-3">{sub}</div>
          </div>
        ))}
      </dl>
      {canAssign && s.pta.released && openFailed > 0 && (
        <p className="mb-3 text-[16px] text-ink-2">{openFailed} failed candidate{openFailed > 1 ? 's' : ''} without remediation. Select them to assign a re-attempt or a refresher course.</p>
      )}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        searchText={(r) => `${r.p?.name ?? ''} ${r.p?.eid ?? ''}`}
        selectable={canAssign}
        canSelect={(r) => r.status === 'Failed'}
        bulk={(sel, clear) => (
          <>
            <Btn v="secondary" size="sm" onClick={() => assign(sel, clear, 'Refresher assigned')}>Assign refresher course</Btn>
            <Btn size="sm" onClick={() => assign(sel, clear, 'Re-attempt scheduled')}>Assign re-attempt</Btn>
          </>
        )}
        toolbar={<Btn v="secondary" size="sm" onClick={exportCsv}><Download size={15} />Export CSV</Btn>}
        label="candidates"
        emptyText="No candidates match these filters."
        testId="pta-results"
      />
      <p className="mt-3 text-[15px] text-ink-3">Pass mark 70%. Grades: Excellent ≥ 90 · Very Good ≥ 85 · Good ≥ 70. Remediation is shown on the supervisor and management dashboards.</p>
    </div>
  );
}
