import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useDemo } from '../store';
import { useSwitchRole } from '../components/perspective';
import { GAP, GapScale, mandatoryStats, PriorityPill, REC_TITLE, ROLES_TEXT, TNA_COMPETENCY, TNA_DIVISION } from '../components/Tna';
import { DivisionHome } from './oversight/DivisionHome';
import { HrOperations } from './oversight/HrOps';
import { RoleHome } from './oversight/Dashboards';

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/* ================================================================== */
/* Home                                                                */
/* ================================================================== */
/**
 * Home is always the dashboard of the role you are viewing as: what that person needs to see and do,
 * whatever step the guided journey is at. Division Head and HR have their own homes; every other role
 * uses its role dashboard (employee: My Learning, trainer: sessions, supervisor: team, others: My work).
 */
export function CommandCenter() {
  const role = useDemo((x) => x.role);
  if (role === 'division_head') return <DivisionHome />;
  if (role === 'hr') return <HrOperations />;
  return <RoleHome role={role} />;
}

/** The learning need card with its own actions (used on the Division Head home). */
export function NeedCard() {
  const s = useDemo();
  const switchRole = useSwitchRole();
  const raise = () => {
    if (!s.requestSubmitted && s.tna.recommendation !== 'accepted') s.prepareRequest({ competency: true, survey: s.tna.survey, idpIds: s.tna.idpIds });
    switchRole('division_head', '/request/new');
  };
  return <NeedPanel onRaise={raise} onOpenTna={() => switchRole('division_head', '/division')} />;
}

/* ---------------- the division learning need (FR 15, 186, 209) ---------------- */
function NeedPanel({ onRaise, onOpenTna }: { onRaise: () => void; onOpenTna: () => void }) {
  const s = useDemo();
  const m = mandatoryStats(s);
  const rows: [string, ReactNode][] = [
    ['Affected roles', ROLES_TEXT],
    ['Mandatory learning', m.pct === null ? '—' : <span>{m.pct}% complete · <span className="text-warn">{m.atRisk} at risk</span></span>],
    ['Recommended training', REC_TITLE],
  ];
  return (
    <section aria-labelledby="need-title" className="min-w-0 rounded-2xl bg-white px-7 py-6 shadow-sm ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[15px] text-ink-3">{TNA_DIVISION} learning need</div>
        <PriorityPill />
      </div>
      <h2 id="need-title" className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{TNA_COMPETENCY} capability gap</h2>

      <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div>
          <div className="num text-[48px] leading-none">{GAP.gap.length}<span className="text-[26px] text-ink-3"> of {GAP.total}</span></div>
          <div className="mt-1 text-[16px] text-ink-2">officers below target</div>
        </div>
        <GapScale />
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-line pt-4 md:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[14px] text-ink-3">{k}</dt>
            <dd className="text-[16px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={onRaise} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {s.requestSubmitted ? 'View training request' : s.needConfirmed ? 'Continue the training request' : 'Raise training request'} <ArrowRight size={18} />
        </button>
        <button onClick={onOpenTna} className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[16px] hover:border-ink/30">See all training needs</button>
      </div>
    </section>
  );
}
