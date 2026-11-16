/** One training request, organised: outcome, progress, details, who took part. */
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { CREDIT_TARGET } from '../../org';
import { useDemo } from '../../store';
import { Badge, cx } from '../../components/ui';
import { personRows } from './dash';
import { findRequest } from './requests';

export function RequestDetail() {
  const { id = '' } = useParams();
  const s = useDemo();
  const nav = useNavigate();
  const r = findRequest(s, id);
  if (!r) {
    return (
      <div className="mx-auto max-w-[1280px] px-8 py-10">
        <button onClick={() => nav('/overview')} className="flex items-center gap-2 text-[15px] text-ink-2 hover:text-brand"><ArrowLeft size={16} />Back to Corporate Banking</button>
        <p className="mt-6 text-[17px]">This request was not found.</p>
      </div>
    );
  }
  const stats: [string, string][] = [
    ['People', String(r.people)],
    ['Attended', r.attended === null ? '—' : String(r.attended)],
    ['Passed', r.passed === null ? '—' : String(r.passed)],
    ['Failed', r.failed === null ? '—' : String(r.failed)],
    ['Feedback', r.feedback ?? '—'],
    ['Budget', r.cost],
  ];
  const details: [string, string][] = [
    ['Based on', r.source], ['Competency', r.competency], ['Raised', r.raised], ['Dates', r.dates], ['Venue', r.venue], ['Trainer', r.trainer], ['Mode · Medium', r.mode],
  ];
  const maxDept = Math.max(1, ...r.departments.map(([, n]) => n));
  const rows = r.participants ? personRows(s, r.participants) : [];
  const doneSteps = r.steps.filter((x) => x.when).length;
  return (
    <div className="mx-auto max-w-[1280px] px-8 pb-12">
      <button onClick={() => nav('/overview')} className="flex items-center gap-2 text-[15px] text-ink-2 hover:text-brand"><ArrowLeft size={16} />Corporate Banking</button>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[15px] text-ink-3">{r.id}</div>
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{r.title}</h1>
        </div>
        <Badge t={r.status === 'Completed' ? 'ok' : r.status === 'Ongoing' ? 'info' : 'neutral'}>{r.status}</Badge>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([l, v]) => (
          <li key={l} className="rounded-2xl bg-white px-5 py-4 ring-1 ring-line">
            <div className={cx('font-semibold leading-none tabular-nums', l === 'Budget' ? 'pt-1.5 text-[22px]' : 'text-[30px]', l === 'Failed' && v !== '—' && v !== '0' && 'text-amber-700', l === 'Passed' && v !== '—' && 'text-ok')}>{v}</div>
            <div className="mt-2 text-[15px] text-ink-2">{l}</div>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
          <h2 className="text-[20px] font-semibold">Progress <span className="text-[15px] font-normal text-ink-3">· {doneSteps} of {r.steps.length}</span></h2>
          <ol className="mt-4">
            {r.steps.map((x, i) => (
              <li key={x.label} className="relative flex gap-4 pb-5 last:pb-0">
                {i < r.steps.length - 1 && <span className={cx('absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5', x.when ? 'bg-ok/50' : 'bg-line')} />}
                <span className={cx('relative grid h-7 w-7 shrink-0 place-items-center rounded-full', x.when ? 'bg-ok text-white' : 'border-2 border-line bg-white')}>{x.when && <Check size={15} />}</span>
                <span className="flex flex-1 items-baseline justify-between gap-3 pt-0.5"><span className={cx('text-[16px]', !x.when && 'text-ink-3')}>{x.label}</span><span className="text-[14px] tabular-nums text-ink-3">{x.when ?? '—'}</span></span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
          <h2 className="text-[20px] font-semibold">Details</h2>
          <dl className="mt-3 divide-y divide-line">
            {details.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-2.5 text-[15px]"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          {r.departments.length > 0 && (
            <>
              <h3 className="mt-5 text-[15px] text-ink-3">People by department</h3>
              <ul className="mt-2 space-y-2">
                {r.departments.map(([d, n]) => (
                  <li key={d} className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-[15px]">
                    <span className="truncate">{d}</span>
                    <span className="h-2 rounded-full bg-canvas"><span className="block h-2 rounded-full bg-ink/70" style={{ width: `${(n / maxDept) * 100}%` }} /></span>
                    <span className="text-right tabular-nums">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {rows.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white px-7 py-6 ring-1 ring-line">
          <h2 className="text-[20px] font-semibold">Participants <span className="text-[15px] font-normal text-ink-3">· {rows.length}</span></h2>
          <div className="mt-3 max-h-[440px] overflow-y-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="sticky top-0 bg-white text-[14px] text-ink-3"><tr>{['Name', 'Department', 'Credit Analysis', 'Status', 'Day 1', 'Day 2', 'Result'].map((h) => <th key={h} className="py-2 pr-4 font-normal">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((x) => (
                  <tr key={x.p.id}>
                    <td className="py-2.5 pr-4"><span className="block">{x.p.name}</span><span className="text-[14px] text-ink-3">{x.p.designation}</span></td>
                    <td className="py-2.5 pr-4 text-ink-2">{x.p.department}</td>
                    <td className={cx('py-2.5 pr-4 tabular-nums', x.p.creditLevel < CREDIT_TARGET ? 'text-amber-700' : 'text-ok')}>Level {x.p.creditLevel}</td>
                    <td className="py-2.5 pr-4"><Badge>{x.story}</Badge></td>
                    <td className="py-2.5 pr-4 text-ink-2">{x.d1 ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-2">{x.d2 ?? '—'}</td>
                    <td className={cx('py-2.5', x.result === 'Passed' ? 'text-ok' : x.result === 'Failed' ? 'text-amber-700' : 'text-ink-3')}>{x.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
