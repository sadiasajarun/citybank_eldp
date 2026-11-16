import { useState, type ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { CONFLICT_IDS, PERSONAS, TRAINING } from '../data';
import { attendedIds, ptResults, roster, useDemo, type DemoState } from '../store';
import { IMPACTS, JOURNEY, journeyAction, journeyIndex, ROLE_LABEL } from '../lifecycle';
import { cx, Drawer } from '../components/ui';
import { personaFor, useSwitchRole } from '../components/perspective';
import { ImpactBody } from '../components/Shell';
import { FrRef, SourceTag } from '../components/Source';
import { GAP, GapScale, mandatoryStats, PriorityPill, REC_TITLE, ROLES_TEXT, TNA_COMPETENCY, TNA_DIVISION } from '../components/Tna';
import { DivisionHome } from './oversight/DivisionHome';
import { HrOperations } from './oversight/HrOps';
import { TaskList } from './oversight/Dashboards';

const NOTHING = 'Nothing needs attention';

/* ---------------- derived facts (no business logic in JSX) ---------------- */
function focus(s: DemoState) {
  const ji = journeyIndex(s);
  const done = ji >= JOURNEY.length;
  const cur = JOURNEY[Math.min(ji, JOURNEY.length - 1)];
  const act = journeyAction(cur, s);
  const ownerRole = cur.who === 'system' ? 'System' : ROLE_LABEL[act.role];
  const ownerName = cur.who === 'system' ? 'ELDP (automatic)' : personaFor(act.role, act.emp ?? s.employeeId).name;
  const ws = s.withdrawal.status;
  const openConflicts = CONFLICT_IDS.filter((id) => !s.resolutions[id]).length;
  const attention = s.nominationSubmitted && !s.finalized && openConflicts > 0 ? `${openConflicts} nominee${openConflicts > 1 ? 's' : ''} need review`
    : ws === 'requested' || ws === 'proposed' ? '1 withdrawal in progress'
      : s.budgetReturned && !s.budgetApproved ? 'Budget returned by Finance'
        : s.pta.integrity === 'flagged' && !s.pta.committeeCleared ? 'Assessment result withheld' : NOTHING;
  const proposed = s.draft.participantIds.length || s.draft.participants;
  const participants = s.attendanceSubmitted ? `${attendedIds(s).length} attended of ${roster(s).length}` : s.finalized ? `${roster(s).length} confirmed` : s.nominationSubmitted ? `${s.nominatedCount} nominated` : `${proposed} proposed`;
  const atNeed = !s.requestSubmitted;
  return { ji, done, cur, act, ownerRole, ownerName, attention, participants, atNeed };
}
type Focus = ReturnType<typeof focus>;

export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/* ================================================================== */
/* Home                                                                */
/* ================================================================== */
/** Home: the Division Head sees the division home; every other role sees the training and its own tasks. */
export function CommandCenter() {
  const role = useDemo((x) => x.role);
  return role === 'division_head' ? <DivisionHome /> : role === 'hr' ? <HrOperations /> : <OverviewHome />;
}

function OverviewHome() {
  const s = useDemo();
  const switchRole = useSwitchRole();
  const f = focus(s);
  const me = personaFor(s.role, s.employeeId);
  const [impact, setImpact] = useState<string | null>(null);

  const raise = () => {
    if (s.tna.recommendation !== 'accepted') s.prepareRequest({ competency: true, survey: s.tna.survey, idpIds: s.tna.idpIds });
    switchRole('division_head', '/request/new');
  };
  const cont = () => {
    if (f.done) return switchRole('management', '/executive');
    return switchRole(f.act.role, f.act.to, f.act.emp);
  };

  return (
    <div className="mx-auto max-w-[1760px] px-8 pb-12">
      {/* 1 · greeting and role */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[40px] font-semibold leading-[1.1] tracking-tight">{greeting()}, {me.name.split(' ')[0]}</h1>
          <p className="mt-1.5 text-[18px] text-ink-2">
            {f.atNeed ? `Here is the most important learning need for ${TNA_DIVISION}.` : f.done ? `${TRAINING.title} is complete. Here is what changed.` : `Here is where ${TRAINING.title} stands.`}
          </p>
        </div>
        <p className="text-[15px] text-ink-3">Viewing as <b className="text-ink">{PERSONAS[s.role].label}</b></p>
      </header>

      {/* 2–4 · the need, the recommendation, one primary action  |  or the live training */}
      {f.atNeed ? (
        <div className="mt-6">
          <NeedPanel onRaise={raise} onOpenTna={() => switchRole('division_head', '/division')} />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <StatusPanel f={f} onPrimary={cont} onImpact={setImpact} />
          <LatestUpdate f={f} />
        </div>
      )}

      {/* 5 · what happens next (before the request) */}
      {f.atNeed && <NextSteps step={s.needConfirmed ? 1 : 0} />}

      <div className="mt-8"><TaskList role={s.role} /></div>


      <p className="mt-10 flex flex-wrap items-center gap-2 text-[14px] text-ink-3">
        <SourceTag kind="fictional" /> People, figures and activity are fictional. Sources:
        <FrRef>FR 15</FrRef><FrRef>FR 185</FrRef><FrRef>FR 186</FrRef><FrRef>FR 209</FrRef><FrRef>FR 247</FrRef>
      </p>

      <Drawer open={impact !== null} onClose={() => setImpact(null)} title="Full impact of this change">
        {impact && IMPACTS[impact] && (
          <div>
            <div className="text-[22px] font-semibold tracking-tight">{IMPACTS[impact].headline}</div>
            <div className="mb-3 mt-1 text-[14px] text-ink-3">{impact}</div>
            <ImpactBody k={impact} />
            <p className="mt-2 text-[14px] text-ink-3">Integrations are simulated in this demo.</p>
          </div>
        )}
      </Drawer>
    </div>
  );
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

/* ---------------- AI training recommendation (FR 185) ---------------- */
/* ---------------- after the request: where the training stands ---------------- */
function StatusPanel({ f, onPrimary, onImpact }: { f: Focus; onPrimary: () => void; onImpact: (k: string) => void }) {
  const s = useDemo();
  const last = s.audit[0];
  const facts: [string, string][] = [
    ['Current step', f.done ? `All ${JOURNEY.length} steps complete` : `Step ${f.ji + 1} of ${JOURNEY.length} · ${f.cur.title}`],
    ['Owner', f.done ? 'Management · outcome ready' : `${f.ownerRole} · ${f.ownerName}`],
    ['Participants', f.participants],
    ['Attention', f.attention],
  ];
  return (
    <section className="min-w-0 rounded-2xl bg-white px-7 py-6 shadow-sm ring-1 ring-line" aria-live="polite">
      <div className="text-[15px] font-semibold text-ink-3">{TRAINING.requestId} · {TNA_DIVISION}</div>
      <h2 className="mt-1 text-[28px] font-semibold leading-tight tracking-tight">{TRAINING.title}</h2>
      <p className="mt-1 text-[15px] text-ink-3">From the {TNA_DIVISION} learning need · {TNA_COMPETENCY} gap, {GAP.gap.length} of {GAP.total} officers</p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[14px] text-ink-3">{k}</dt>
            <dd title={v} className={cx('truncate text-[16px]', k === 'Attention' && v !== NOTHING && 'text-warn')}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button onClick={onPrimary} className="flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {f.done ? 'See the outcome' : 'Continue this workflow'} <ArrowRight size={18} />
        </button>
        {last && IMPACTS[last.action] && <button onClick={() => onImpact(last.action)} className="text-[15px] font-semibold text-brand hover:underline">View full impact of the last change</button>}
      </div>
    </section>
  );
}

/** Short completion summary: what changed, who receives the next task, the next action. */
function LatestUpdate({ f }: { f: Focus }) {
  const s = useDemo();
  const last = s.audit[0];
  if (f.done) {
    const r = ptResults(s);
    const passed = r.filter((x) => x.status === 'Passed').length, failed = r.filter((x) => x.status === 'Failed').length;
    const changed = [
      `${attendedIds(s).length} attended · learning records updated`,
      `Assessment released · ${passed} passed, ${failed} failed`,
      `${TNA_COMPETENCY} journey ${s.journeyDone} of 5 · competency moved up`,
      'Executive insight refreshed with cost and completion',
    ];
    return (
      <aside className="min-w-0 rounded-2xl bg-ok-soft/60 px-7 py-6">
        <h2 className="text-[22px] font-semibold tracking-tight">What changed</h2>
        <ul className="mt-3 space-y-2 text-[16px]">{changed.map((t) => <li key={t} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-ok" />{t}</li>)}</ul>
      </aside>
    );
  }
  const rows: [string, ReactNode][] = [
    ['What changed', last ? <span>{IMPACTS[last.action]?.headline ?? last.action}<span className="block text-[14px] font-normal text-ink-3">{last.actor} · {last.at.slice(12)}</span></span> : '—'],
    ['Next task goes to', f.cur.who === 'system' ? 'ELDP (automatic check)' : `${f.ownerName}, ${f.ownerRole}`],
    ['Next action', f.cur.who === 'system' ? f.cur.title : f.act.cta],
  ];
  return (
    <aside className="min-w-0 rounded-2xl bg-[#fdf8f7] px-7 py-6" aria-live="polite">
      <h2 className="text-[22px] font-semibold tracking-tight">Latest update</h2>
      <dl className="mt-3 space-y-3">
        {rows.map(([k, v]) => <div key={k}><dt className="text-[14px] text-ink-3">{k}</dt><dd className="text-[16px]">{v}</dd></div>)}
      </dl>
    </aside>
  );
}

/* ---------------- what happens next: one band, three steps ---------------- */
function NextSteps({ step }: { step: number }) {
  const steps: [string, string][] = [
    ['Review the recommendation', 'Confirm the learning need and suggested training.'],
    ['Raise the training request', 'Send the requirement to HR.'],
    ['HR starts the next step', 'HR reviews the request and opens nominations.'],
  ];
  return (
    <section aria-labelledby="next-title" className="mt-5 rounded-2xl bg-white px-7 py-5 shadow-sm ring-1 ring-line">
      <h2 id="next-title" className="text-[20px] font-semibold tracking-tight">What happens next</h2>
      <ol className="mt-3 grid gap-4 md:grid-cols-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full text-[16px] font-bold', i < step ? 'bg-ok text-white' : i === step ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{i < step ? <Check size={17} /> : i + 1}</span>
            <span><span className="text-[17px] font-medium">{t}</span><span className="block text-[15px] text-ink-2">{d}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

