/**
 * Requirements Coverage (C1): every Annexure-II requirement with an honest status, grouped by the five modules.
 * Rule: "Demonstrated" only when the field, action or behaviour is visible and usable in this demo.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { COVERAGE_ROWS, MODULES, moduleName, STATUSES, type CoverageRow, type CovStatus } from '../../coverage';
import { PageHead } from '../../components/Templates';
import { SourceTag } from '../../components/Source';
import { DataTable, downloadCsv, type Column } from '../../components/DataTable';
import { AiLabel, Btn, cx } from '../../components/ui';

const TONE: Record<CovStatus, string> = {
  Demonstrated: 'bg-ok-soft text-ok',
  'Partially demonstrated': 'bg-warn-soft text-warn',
  Simulated: 'bg-info-soft text-info',
  Conceptual: 'bg-slate-100 text-ink-2',
  'Dependent on Bank integration': 'bg-violet-50 text-violet-800',
  'Proposed interpretation': 'bg-amber-50 text-amber-800',
  Missing: 'bg-brand-soft text-brand-dark',
};
const short = (t: string, n = 120) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export function CoveragePage() {
  const nav = useNavigate();
  const [status, setStatus] = useState<CovStatus | ''>('');
  const [aiOnly, setAiOnly] = useState(false);
  const rows = COVERAGE_ROWS.filter((r) => !aiOnly || r.ai);
  const count = (st: CovStatus) => rows.filter((r) => r.status === st).length;

  const cols: Column<CoverageRow>[] = [
    { key: 'fr', header: 'FR', render: (r) => <span className="font-semibold tabular-nums">{r.no}</span>, sort: (r) => r.no, width: 'w-16' },
    { key: 'category', header: 'Category', render: (r) => <span className="text-ink-2">{r.category}</span>, filter: (r) => r.category },
    { key: 'sub', header: 'Sub-category', render: (r) => <span className="text-ink-2">{[r.sub, r.subsub].filter(Boolean).join(' · ') || '—'}</span> },
    { key: 'text', header: 'Requirement', render: (r) => <span className="block min-w-[220px]" title={r.text}>{r.text ? short(r.text) : <span className="text-ink-3">(no text in the workbook)</span>}{r.ai && <span className="ml-2"><AiLabel>AI</AiLabel></span>}</span> },
    { key: 'screen', header: 'Screen', render: (r) => r.screen },
    { key: 'route', header: 'Route', render: (r) => (r.route ? <Btn v="link" onClick={() => nav(r.route)}>Open <ArrowRight size={14} /></Btn> : <span className="text-ink-3">—</span>) },
    { key: 'status', header: 'Status', render: (r) => <span className={cx('inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[14px] font-semibold', TONE[r.status])}>{r.status}</span>, filter: (r) => r.status, sort: (r) => STATUSES.indexOf(r.status) },
    { key: 'gap', header: 'Gap note', render: (r) => <span className="block min-w-[220px] text-ink-2">{r.gap}</span> },
    { key: 'dep', header: 'Dependency', render: (r) => <span className="text-ink-2">{r.dependency}</span> },
    { key: 'plan', header: 'Planned completion', render: (r) => <span className="whitespace-nowrap text-ink-2">{r.plan}</span> },
    { key: 'module', header: 'Module', render: (r) => moduleName(r.module), filter: (r) => moduleName(r.module) },
  ];

  const exportCsv = () => downloadCsv('eldp-requirements-coverage.csv', ['FR', 'Module', 'AI-assisted', 'Category', 'Sub-category', 'Requirement', 'Screen', 'Route', 'Status', 'Gap note', 'Dependency', 'Planned completion'],
    COVERAGE_ROWS.map((r) => [r.no, moduleName(r.module), r.ai ? 'Yes' : '', r.category, [r.sub, r.subsub].filter(Boolean).join(' · '), r.text, r.screen, r.route, r.status, r.gap, r.dependency, r.plan]));

  return (
    <div>
      <PageHead title="Requirements Coverage" meta={`All ${COVERAGE_ROWS.length} Annexure-II functional requirements, grouped by the five platform modules.`} fr="FR 1–250"
        sub="“Demonstrated” means the field, action or behaviour is visible and usable in this demo. A route existing is not enough."
        tags={<><SourceTag kind="proposed">Status and planned completion are our assessment and proposal</SourceTag></>}
        actions={<Btn v="secondary" onClick={exportCsv}>Download CSV</Btn>} />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 xl:grid-cols-7" role="group" aria-label="Filter by status">
        {STATUSES.map((st) => (
          <button key={st} aria-pressed={status === st} onClick={() => setStatus(status === st ? '' : st)} className={cx('bg-white p-4 text-left transition-colors hover:bg-[#faf8f5]', status === st && 'ring-2 ring-inset ring-ink')}>
            <div className="num text-[28px] leading-none">{count(st)}</div>
            <div className="mt-2"><span className={cx('inline-block rounded-full px-2 py-0.5 text-[14px] font-semibold', TONE[st])}>{st}</span></div>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[15px] text-ink-3">
        <span>Select a status to filter the table{status && <> · showing <b className="text-ink">{status}</b> · <button className="font-semibold text-brand hover:underline" onClick={() => setStatus('')}>Show all</button></>}</span>
        <label className="flex items-center gap-2 text-ink-2"><input type="checkbox" checked={aiOnly} onChange={(e) => setAiOnly(e.target.checked)} />Only AI-assisted requirements (FR 185, 209, 213, 226, 245)</label>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[24px] font-bold tracking-tight">The five modules</h2>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {MODULES.map((m) => {
            const rs = COVERAGE_ROWS.filter((r) => r.module === m.key || (m.key === 'AI-assisted' && r.ai));
            const demo = rs.filter((r) => r.status === 'Demonstrated').length;
            return (
              <li key={m.key} className="rounded-2xl border border-line bg-white p-4">
                <div className="text-[17px] font-bold">{m.name}</div>
                <div className="text-[14px] text-ink-3">{m.frs}</div>
                <div className="mt-2 text-[15px] text-ink-2"><b className="text-ink">{demo}</b> of {rs.length} demonstrated</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <DataTable key={`${status}-${aiOnly}`} rows={rows} columns={cols} rowKey={(r) => String(r.no)} searchText={(r) => `FR ${r.no} ${r.text} ${r.screen} ${r.category} ${r.sub}`} searchPlaceholder="Search requirement, FR or screen"
          groupBy={(r) => moduleName(r.module)} groupOrder={MODULES.map((m) => m.name)} initialFilters={status ? { status } : {}} label="requirements" maxHeight={720} />
        <p className="mt-3 text-[14px] text-ink-3">Requirement text is taken from Annexure-II. The AI-assisted module also includes FR 213 (exam evaluation), listed under the LMS with an AI label. Planned completion is our proposed delivery plan.</p>
      </section>
    </div>
  );
}
