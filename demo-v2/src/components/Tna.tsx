/**
 * Training Needs Assessment: shared facts and pieces for Home and the TNA page.
 * FR 15 (division summary), FR 22 (competency setup), FR 185 (AI training suggestion), FR 186–188 (TNA paths),
 * FR 209 (AI: mandatory-learning risk, division skill gaps). All people and figures are fictional demonstration data.
 */
import { Check, Sparkles } from 'lucide-react';
import { TRAINING } from '../data';
import { CB_TARGET_COUNT, creditGap, CREDIT_TARGET, findById, inDivision } from '../org';
import type { DemoState } from '../store';
import { inPeriod, mandatoryOf, trainingRecords, type Mandatory } from '../pages/oversight/dash';
import { cx, Drawer } from './ui';
import { FrRef } from './Source';

export const TNA_DIVISION = 'Corporate Banking';
export const TNA_COMPETENCY = 'Credit Analysis';
export const REC_TITLE = TRAINING.title;

/* ---------------- competency and role gap (computed from the directory) ---------------- */
function gapFacts() {
  const gap = creditGap(TNA_DIVISION);
  const lv = new Map<number, number>();
  const rl = new Map<string, number>();
  gap.forEach((p) => { lv.set(p.creditLevel, (lv.get(p.creditLevel) ?? 0) + 1); rl.set(p.designation, (rl.get(p.designation) ?? 0) + 1); });
  const levels = [...lv.entries()].sort((a, b) => a[0] - b[0]);
  const current = [...lv.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
  const roles = [...rl.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
  return { gap, total: CB_TARGET_COUNT, current, target: CREDIT_TARGET, levels, roles };
}
export const GAP = gapFacts();
export const ROLES_TEXT = GAP.roles.length <= 1 ? GAP.roles.join('') : `${GAP.roles.slice(0, -1).join(', ')} and ${GAP.roles[GAP.roles.length - 1]}`;

/** Why the AI suggested the training (FR 185): skill gap, role requirement, mandatory courses, current levels, division data. */
export const REC_FACTORS: { label: string; detail: string }[] = [
  { label: 'Credit Analysis skill gap', detail: `${GAP.gap.length} of ${GAP.total} officers are below the target level ${GAP.target}. Most are at level ${GAP.current}.` },
  { label: 'Role requirement', detail: `${GAP.roles.slice(0, 2).join(' and ')} roles require Credit Analysis at level ${GAP.target} in the competency setup (Functional).` },
  { label: 'Mandatory learning requirement', detail: 'Credit risk training is mandatory for credit-sanctioning roles.' },
  { label: 'Current competency levels', detail: GAP.levels.map(([l, n]) => `Level ${l}: ${n} officer${n > 1 ? 's' : ''}`).join(' · ') },
  { label: 'Division learning data', detail: 'No Credit Analysis programme for Corporate Banking in the last 12 months.' },
];
export const REC_REASONS = ['Skill gap detected', 'Role requirement', 'Mandatory learning requirement', 'Current role', 'Competency level', 'Division learning data'];

/* ---------------- programme-wise survey / nomination output (FR 187) ---------------- */
export const SURVEY = {
  topic: 'Credit Risk and Analysis',
  closed: '8 Nov 2026',
  responses: 28,
  high: 19,
  priority: [['High', 19], ['Medium', 6], ['Low', 3]] as [string, number][],
  champions: ['Corporate Banking', 'SME Banking', 'Risk Management'],
  top: 'Credit Analysis',
  byDivision: [['Corporate Banking', 14], ['SME Banking', 8], ['Risk Management', 6]] as [string, number][],
  topics: [
    { topic: 'Credit Analysis', votes: 19, training: REC_TITLE, story: true },
    { topic: 'Financial modelling', votes: 11, training: 'Financial Modelling for Bankers', story: false },
    { topic: 'Trade finance documentation', votes: 7, training: 'Trade Finance Operations', story: false },
    { topic: 'Negotiation', votes: 4, training: 'Negotiation Skills for Relationship Managers', story: false },
  ],
};

/* ---------------- individual development requests (FR 188) ---------------- */
export { IDP_REQUESTS, type IdpRequest } from '../tnaData';
import type { IdpRequest } from '../tnaData';
export const idpPerson = (r: IdpRequest) => findById(r.personId);

/* ---------------- division signals (FR 15, 209) ---------------- */
export function mandatoryStats(s: DemoState) {
  const m = inDivision(TNA_DIVISION).map((p) => mandatoryOf(s, p.id)).filter((x): x is Mandatory => !!x);
  const done = m.filter((x) => x.status === 'Completed').length;
  const overdue = m.filter((x) => x.overdue).length;
  const atRisk = m.filter((x) => x.status !== 'Completed' && (x.overdue || x.progress < 50)).length;
  return { enrolled: m.length, done, pct: m.length ? Math.round((done / m.length) * 100) : null, overdue, atRisk };
}
export function divisionHours(s: DemoState) {
  const eids = new Set(inDivision(TNA_DIVISION).map((p) => p.eid));
  return trainingRecords(s).filter((r) => eids.has(r.eid) && inPeriod('fy2026', r.ym)).reduce((n, r) => n + r.hours, 0);
}
/** The division's open training needs: the story need closes when the training is closed. */
export function activeNeeds(s: DemoState) {
  return [
    { topic: TNA_COMPETENCY, source: 'Competency gap', open: !s.completed },
    { topic: 'Financial modelling', source: 'Development requests', open: true },
    { topic: 'Trade finance documentation', source: 'Survey', open: true },
  ].filter((x) => x.open).length;
}

/* ---------------- small UI pieces ---------------- */
export function AiTag({ short, className }: { short?: boolean; className?: string }) {
  return (
    <span title="ELDP suggests. A person reviews and decides." className={cx('inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[14px] font-semibold text-sky-900', className)}>
      <Sparkles size={15} />{short ? 'AI-assisted · Human decision required' : 'AI-assisted recommendation · Human decision required'}
    </span>
  );
}

export function PriorityPill({ children = 'High' }: { children?: string }) {
  const tone = children === 'High' ? 'bg-amber-100 text-amber-900' : children === 'Medium' ? 'bg-sky-100 text-sky-900' : 'bg-canvas text-ink-2';
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-3 py-0.5 text-[14px] font-medium', tone)}>{children} priority</span>;
}

/** Current vs target on the 1–5 competency scale. */
export function GapScale({ current = GAP.current, target = GAP.target, className }: { current?: number; target?: number; className?: string }) {
  return (
    <div className={className} role="img" aria-label={`${TNA_COMPETENCY}: current level ${current}, target level ${target}`}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((l) => (
          <span key={l} className={cx('h-3 flex-1 rounded-full', l <= current ? 'bg-ink' : l <= target ? 'bg-amber-300' : 'bg-line')} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[14px]">
        <span><b>Level {current}</b> <span className="text-ink-3">current</span></span>
        <span className="text-amber-800">Gap of {target - current} level{target - current === 1 ? '' : 's'}</span>
        <span><b>Level {target}</b> <span className="text-ink-3">target</span></span>
      </div>
    </div>
  );
}

/** "Why was this recommended?" side panel (FR 185, 209). */
export function WhyDrawer({ open, onClose, accepted }: { open: boolean; onClose: () => void; accepted: boolean }) {
  return (
    <Drawer open={open} onClose={onClose} title="Why this training was recommended">
      <div className="space-y-5 text-[16px]">
        <div>
          <div className="text-[14px] text-ink-3">Recommended for {TNA_DIVISION}</div>
          <div className="text-[22px] font-extrabold tracking-tight">{REC_TITLE}</div>
          <AiTag className="mt-2" />
        </div>
        <p className="text-ink-2">The recommendation is based on skill gap, role requirement and mandatory learning rules.</p>
        <ul className="divide-y divide-line border-y border-line">
          {REC_FACTORS.map((f) => (
            <li key={f.label} className="flex gap-3 py-3">
              <Check size={18} className="mt-0.5 shrink-0 text-sky-700" />
              <span><b>{f.label}</b><span className="block text-[15px] text-ink-2">{f.detail}</span></span>
            </li>
          ))}
        </ul>
        <p className="rounded-xl bg-canvas px-4 py-3 text-[15px] text-ink-2">
          {accepted ? 'Farzana Haque accepted this recommendation.' : 'Nothing is decided yet. The Division Head reviews the evidence and decides whether to raise the request.'}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-[14px] text-ink-3"><FrRef>FR 185</FrRef><FrRef>FR 209</FrRef>Competency levels and rules are fictional.</p>
      </div>
    </Drawer>
  );
}

/* ---------------- competencies the Division Head can look at (FR 22 setup categories) ---------------- */
export interface CompetencyView { name: string; category: string; below: number; total: number; current: number; target: number; roles: string; priority: 'High' | 'Medium' | 'Low'; training: string | null; reason: string; story: boolean }
export const COMPETENCIES: CompetencyView[] = [
  { name: TNA_COMPETENCY, category: 'Functional', below: GAP.gap.length, total: GAP.total, current: GAP.current, target: GAP.target, roles: ROLES_TEXT, priority: 'High', training: REC_TITLE, reason: 'Skill gap, role requirement and mandatory learning', story: true },
  { name: 'Customer Experience', category: 'Customer Experience', below: 9, total: 20, current: 3, target: 4, roles: 'Relationship Manager', priority: 'Medium', training: 'Customer Experience Excellence', reason: 'Skill gap and role requirement', story: false },
  { name: 'Execution Excellence', category: 'Execution Excellence', below: 6, total: 20, current: 3, target: 4, roles: 'Senior Officer and Credit Analyst', priority: 'Medium', training: 'Execution Excellence Workshop', reason: 'Skill gap', story: false },
  { name: 'Leadership', category: 'Leadership', below: 4, total: 6, current: 2, target: 3, roles: 'Unit Heads and team leads', priority: 'Medium', training: 'Leadership Essentials for Managers', reason: 'Role requirement for people managers', story: false },
  { name: 'Innovation', category: 'Innovation', below: 7, total: 20, current: 2, target: 3, roles: 'All officers', priority: 'Low', training: 'Design Thinking for Bankers', reason: 'Skill gap', story: false },
  { name: 'Collaboration', category: 'Collaboration', below: 2, total: 20, current: 3, target: 3, roles: 'All officers', priority: 'Low', training: null, reason: 'Most officers are at target', story: false },
];
