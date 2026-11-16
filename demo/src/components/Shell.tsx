import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bell, Calendar, ChevronLeft, ChevronRight, ClipboardCheck, FileText, Layers, Maximize2, Minimize2, Network, RotateCcw, ScrollText,
  Search, Sparkles, SkipForward, Users, Workflow, X, type LucideIcon,
} from 'lucide-react';
import { PERSONAS, ROLE_HOME } from '../data';
import { useDemo } from '../store';
import { activeStage, IMPACTS, MODULE_ACTIVE, ROLE_LABEL, STAGES_LC } from '../lifecycle';
import type { Role } from '../types';
import { Avatar, cx, Drawer } from './ui';

type S = ReturnType<typeof useDemo.getState>;
const T = 'TRN-2026-00182';

export function contextRoute(role: Role, s: S): string {
  switch (role) {
    case 'division_head':
      if (!s.requestSubmitted) return '/division-head/training-request/new';
      if (s.nominationRequested && !s.nominationSubmitted) return '/learning-champion/nominations';
      return '/division-head/dashboard';
    case 'hr':
      if (!s.requestSubmitted) return '/hr/requests';
      if (s.withdrawal.status === 'proposed') return `/hr/training/${T}/schedule?tab=Participants`;
      if (!s.scheduleStarted) return '/hr/requests/TR-2026-00418';
      if (s.invitesSent) return `/hr/training/${T}/attendance`;
      if (s.nominationSubmitted) return `/hr/training/${T}/schedule?tab=Participants`;
      return `/hr/training/${T}/schedule`;
    case 'employee':
      if (s.attendanceSubmitted && !s.feedbackSubmitted) return '/employee/feedback';
      if (s.attendanceSubmitted) return '/employee/learning-history';
      return '/employee/dashboard';
    default:
      return ROLE_HOME[role];
  }
}

/* ---------- people in workflow ---------- */
type RState = 'active' | 'next' | 'done' | 'idle';
interface Chip { id: string; role: Role; label: string; to?: string }
export const CHIPS: Chip[] = [
  { id: 'dh', role: 'division_head', label: 'Division Head' },
  { id: 'hr', role: 'hr', label: 'HR Admin' },
  { id: 'lc', role: 'division_head', label: 'Learning Champion', to: '/learning-champion/nominations' },
  { id: 'emp', role: 'employee', label: 'Employee' },
  { id: 'sup', role: 'supervisor', label: 'Supervisor' },
  { id: 'tr', role: 'trainer', label: 'Trainer' },
];

export function chipStatus(id: string, s: S): { st: RState; text: string } {
  const w = s.withdrawal.status;
  switch (id) {
    case 'dh':
      if (!s.requestSubmitted) return { st: 'active', text: 'Drafting request' };
      if (s.completed) return { st: 'done', text: 'Programme closed' };
      return { st: 'done', text: 'Request submitted' };
    case 'hr':
      if (!s.requestSubmitted) return { st: 'next', text: 'Awaiting request' };
      if (!s.scheduled) return { st: 'active', text: s.scheduleStarted ? 'Scheduling' : 'Review required' };
      if (!s.nominationRequested) return { st: 'active', text: 'Request nomination' };
      if (!s.nominationSubmitted) return { st: 'idle', text: 'Waiting on nominations' };
      if (!s.finalized) return { st: 'active', text: 'Resolving 4 conflicts' };
      if (!s.invitesSent) return { st: 'active', text: 'Send invitations' };
      if (w === 'proposed') return { st: 'active', text: 'Approve replacement' };
      if (!s.attendanceSubmitted) return { st: 'next', text: 'Attendance due' };
      if (!s.completed) return { st: s.feedbackSubmitted ? 'active' : 'idle', text: s.feedbackSubmitted ? 'Complete training' : 'Collecting feedback' };
      return { st: 'done', text: 'Completed' };
    case 'lc':
      if (!s.nominationRequested) return { st: s.scheduled ? 'next' : 'idle', text: s.scheduled ? 'Nomination next' : 'Waiting' };
      if (!s.nominationSubmitted) return { st: 'active', text: 'Nominate employees' };
      return { st: 'done', text: '35 nominated' };
    case 'emp':
      if (!s.invitesSent) return { st: 'idle', text: 'Not involved yet' };
      if (s.attendanceSubmitted && !s.feedbackSubmitted) return { st: 'active', text: 'Feedback due' };
      if (s.attendanceSubmitted) return { st: 'done', text: 'Learning recorded' };
      if (w === 'none') return { st: 'active', text: 'Invitation received' };
      return { st: 'done', text: 'Responded' };
    case 'sup':
      if (w === 'requested') return { st: 'active', text: 'Approval needed' };
      if (w === 'proposed' || w === 'approved') return { st: 'done', text: 'Replacement approved' };
      if (w === 'rejected') return { st: 'done', text: 'Rejected' };
      return { st: s.invitesSent ? 'idle' : 'idle', text: s.invitesSent ? 'CC on invitations' : '—' };
    case 'tr':
      if (!s.scheduled) return { st: 'idle', text: 'Not assigned' };
      if (s.attendanceSubmitted) return { st: 'done', text: 'Session delivered' };
      return { st: 'done', text: 'Assigned · invited' };
  }
  return { st: 'idle', text: '' };
}

const dot: Record<RState, string> = { active: 'bg-brand anim-pulse', next: 'bg-amber-400', done: 'bg-emerald-500', idle: 'bg-white/20' };

function PeopleRibbon({ onSwitch }: { onSwitch: (c: Chip) => void }) {
  const s = useDemo();
  const lc = useLocation();
  return (
    <div className="flex items-center gap-4 overflow-x-auto scroll-thin">
      <div className="shrink-0">
        <div className="eyebrow text-[9.5px] text-white/45">People in this workflow</div>
        <div className="text-[12px] font-semibold text-white/80">View as</div>
      </div>
      <div className="flex gap-1.5">
        {CHIPS.map((c) => {
          const st = chipStatus(c.id, s);
          const current = s.role === c.role && (c.id !== 'lc' ? !lc.pathname.startsWith('/learning-champion') : lc.pathname.startsWith('/learning-champion'));
          return (
            <button
              key={c.id}
              onClick={() => onSwitch(c)}
              className={cx(
                'group flex min-w-[148px] items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left transition-colors',
                current ? 'border-white/40 bg-white/12 bg-white/10' : 'border-white/8 hover:border-white/25 hover:bg-white/5',
              )}
            >
              <span className={cx('h-2 w-2 shrink-0 rounded-full', dot[st.st])} />
              <span className="min-w-0">
                <span className={cx('block truncate text-[12px] font-bold', current ? 'text-white' : 'text-white/85')}>{c.label}</span>
                <span className={cx('block truncate text-[10.5px]', st.st === 'active' ? 'text-red-300' : st.st === 'next' ? 'text-amber-200' : 'text-white/45')}>{st.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- story rails ---------- */
function LifecycleRail() {
  const s = useDemo();
  const nav = useNavigate();
  const a = activeStage(s);
  return (
    <aside className="hidden w-[210px] shrink-0 overflow-y-auto border-r border-line bg-white px-4 py-5 xl:block scroll-thin">
      <div className="th mb-3">Lifecycle · TR-2026-00418</div>
      <ol className="relative">
        <span className="absolute bottom-3 left-[9px] top-3 w-px bg-line" />
        {STAGES_LC.map((st, i) => {
          const done = st.done(s);
          const active = i === a;
          return (
            <li key={st.key} className="relative">
              <button onClick={() => { s.setRole(st.route.role); nav(st.route.to); }} className="group flex w-full items-start gap-3 py-1.5 text-left">
                <span className={cx('relative z-10 mt-0.5 grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-2 transition-colors', done ? 'border-ink bg-ink' : active ? 'anim-pulse border-brand bg-white' : 'border-line bg-white')}>
                  {done && <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white"><path d="M2.5 6.2l2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </span>
                <span>
                  <span className={cx('block text-[13px] font-bold group-hover:text-brand', active ? 'text-brand' : done ? 'text-ink' : 'text-ink-3')}>{st.label}</span>
                  <span className="block text-[10.5px] text-ink-3">{st.module}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function AffectedRail() {
  const s = useDemo();
  const a = Math.min(activeStage(s), STAGES_LC.length - 1);
  const st = STAGES_LC[a];
  const d = st.detail(s);
  const latest = s.audit[0];
  return (
    <aside className="hidden w-[270px] shrink-0 overflow-y-auto border-l border-line bg-white px-5 py-5 2xl:block scroll-thin">
      <div className="th">Current stage</div>
      <div className="mt-1 text-[18px] font-extrabold tracking-tight">{st.label}</div>
      <div className="text-xs text-ink-3">{st.module}</div>
      <div className="mt-4 space-y-3 text-[12.5px]">
        <div><div className="th mb-0.5">Responsible</div><b>{st.owner === 'system' ? 'ELDP (automatic)' : ROLE_LABEL[st.owner]}</b></div>
        <div><div className="th mb-1">Stakeholders affected</div><div className="flex flex-wrap gap-1">{st.affected.map((r) => <span key={r} className="rounded-md bg-canvas px-2 py-0.5 font-semibold">{ROLE_LABEL[r]}</span>)}</div></div>
        <div><div className="th mb-0.5">Record</div>{d.records}</div>
        <div><div className="th mb-0.5">Pending action</div>{d.pending}</div>
        <div><div className="th mb-1">Integrations involved</div><div className="flex flex-wrap gap-1">{st.integrations.map((r) => <span key={r} className="flex items-center gap-1 rounded-md border border-line px-2 py-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{r}</span>)}</div></div>
        <div><div className="th mb-1">Modules lit</div><div className="flex flex-wrap gap-1">{(MODULE_ACTIVE[st.key] ?? []).map((m) => <span key={m} className="rounded-md bg-brand-soft px-2 py-0.5 font-semibold text-brand-dark">{m}</span>)}</div></div>
        <div className="rounded-lg bg-canvas p-3"><div className="th mb-0.5">Next step</div><b>{st.next}</b></div>
      </div>
      {latest && (
        <div className="mt-5 border-t border-line pt-4">
          <div className="th mb-1">Last recorded action</div>
          <div className="text-[12.5px] font-bold">{latest.action}</div>
          <div className="text-[11px] text-ink-3">{latest.actor} · {latest.at.slice(12)}</div>
        </div>
      )}
    </aside>
  );
}

/* ---------- impact ---------- */
function ImpactCard({ onOpen }: { onOpen: () => void }) {
  const s = useDemo();
  const [hover, setHover] = useState(false);
  const def = s.impact ? IMPACTS[s.impact.key] : undefined;
  useEffect(() => {
    if (!s.impact || hover) return;
    const t = setTimeout(() => s.clearImpact(), 11000);
    return () => clearTimeout(t);
  }, [s.impact?.id, hover]);
  if (!s.impact || !def) return null;
  const rows: [string, string][] = [
    ['Record', def.records[0]],
    ['People', def.users[0]],
    ['Audit', def.audit],
    ['Notifications', def.notifications],
    ['Analytics', def.analytics],
  ];
  return (
    <div key={s.impact.id} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="anim-up fixed bottom-5 left-5 z-40 w-[360px] xl:left-[226px] overflow-hidden rounded-2xl bg-graphite text-white shadow-2xl ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <div className="eyebrow text-[9.5px] text-red-300">What changed?</div>
          <div className="mt-1 text-[15px] font-extrabold leading-snug">{def.headline}</div>
        </div>
        <button onClick={s.clearImpact} aria-label="Dismiss" className="text-white/40 hover:text-white"><X size={16} /></button>
      </div>
      <ul className="mt-3 space-y-0 px-5">
        {rows.map(([k, v], i) => (
          <li key={k} className="anim-slide flex gap-3 border-t border-white/8 py-2 text-[12px]" style={{ animationDelay: `${120 + i * 110}ms` }}>
            <span className="w-[86px] shrink-0 font-semibold text-white/45">{k}</span><span className="text-white/90">{v}</span>
          </li>
        ))}
      </ul>
      <button onClick={onOpen} className="flex w-full items-center justify-between border-t border-white/8 bg-white/5 px-5 py-2.5 text-[12px] font-bold hover:bg-white/10">Behind this action <ArrowRight size={14} /></button>
    </div>
  );
}

function ImpactDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useDemo();
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => { if (open) setKey(s.impact?.key ?? s.audit.find((a) => IMPACTS[a.action])?.action ?? null); }, [open]);
  const def = key ? IMPACTS[key] : undefined;
  const ev = s.audit.find((a) => a.action === key);
  return (
    <Drawer open={open} onClose={onClose} title="Behind This Action">
      {!def ? <p className="text-[13px] text-ink-3">Perform a workflow action to see its system impact.</p> : (
        <div>
          <div className="th">{key}</div>
          <div className="mb-1 mt-1 text-[19px] font-extrabold tracking-tight">{def.headline}</div>
          {ev && <div className="mb-5 text-xs text-ink-3">{ev.actor}, {ev.actorRole} · {ev.at}</div>}
          {([['Records updated', def.records], ['Users affected', def.users], ['Integrations', def.integrations], ['Audit', [def.audit]], ['Notifications', [def.notifications]], ['Analytics', [def.analytics]]] as [string, string[]][]).map(([h, items]) => (
            <div key={h} className="border-t border-line py-3.5">
              <div className="th mb-1.5">{h}</div>
              <ul className="space-y-1">{items.map((x) => <li key={x} className="flex items-center gap-2 text-[13px] font-medium"><span className="h-1.5 w-1.5 rounded-full bg-brand" />{x}</li>)}</ul>
            </div>
          ))}
          <p className="mt-2 text-[11px] text-ink-3">Integrations in this demo are simulated. Production uses adapters behind stable internal interfaces with correlation-ID logging.</p>
          <div className="mt-5 border-t border-line pt-4">
            <div className="th mb-2">Recent impacts</div>
            {s.audit.filter((a) => IMPACTS[a.action]).slice(0, 8).map((a) => <button key={a.id} onClick={() => setKey(a.action)} className={cx('mb-1 block w-full rounded-lg px-3 py-2 text-left text-[12.5px] hover:bg-canvas', a.action === key && 'bg-canvas font-bold')}>{a.action}<span className="float-right text-[11px] text-ink-3">{a.at.slice(12)}</span></button>)}
          </div>
        </div>
      )}
    </Drawer>
  );
}

/* ---------- presenter ---------- */
export const STORY: { label: string; role: Role; to: string; hint: string; emp?: string }[] = [
  { label: 'Start Demo', role: 'hr', to: '/demo', hint: 'Open with the living lifecycle: one connected ecosystem.' },
  { label: 'Organisational Need', role: 'division_head', to: '/division-head/dashboard', hint: 'Credit Analysis gap of 2 levels in Corporate Banking.' },
  { label: 'Division Head Request', role: 'division_head', to: '/division-head/training-request/new', hint: 'Fill title with the suggestion, continue, Submit Request.' },
  { label: 'HR Review', role: 'hr', to: '/hr/requests/TR-2026-00418', hint: 'Same record, HR perspective → Convert to Training Program.' },
  { label: 'Scheduling', role: 'hr', to: `/hr/training/${T}/schedule`, hint: 'Show venue conflict, accept suggestion, Save & Schedule.' },
  { label: 'Nomination', role: 'division_head', to: '/learning-champion/nominations', hint: 'Learning Champion nominates 35 employees.' },
  { label: 'Conflict Detection', role: 'hr', to: `/hr/training/${T}/schedule?tab=Participants`, hint: 'Open Tanvir Hasan: live HRIS / Leave / Calendar checks.' },
  { label: 'Employee Invitation', role: 'employee', to: '/employee/dashboard', hint: 'Ayesha accepts. Then switch to Tanvir.', emp: 'e1' },
  { label: 'Withdrawal / Replacement', role: 'supervisor', to: '/supervisor/approvals', hint: 'Approve with Replacement → Sadia Islam, eligibility checks.' },
  { label: 'Attendance', role: 'hr', to: `/hr/training/${T}/attendance`, hint: 'Sync Teams, mark all, Submit Attendance — watch propagation.' },
  { label: 'Learning Record', role: 'employee', to: '/employee/learning-history', hint: 'Everything accumulates into one development journey.', emp: 'e1' },
  { label: 'Digital Learning', role: 'employee', to: '/learning/course/info-security-2026', hint: 'Mandatory sequence, offline, subtitles, certificate.' },
  { label: 'Assessment', role: 'employee', to: '/assessment/aml-certification', hint: 'Secure mode, integrity review, AI-assisted evaluation.' },
  { label: 'Competency', role: 'hr', to: '/hr/competencies', hint: 'Priority gap → recommended learning journey.' },
  { label: 'Executive Analytics', role: 'hr', to: '/hr/analytics', hint: 'All workflows feed one intelligence layer.' },
];

function PresenterBar() {
  const s = useDemo();
  const nav = useNavigate();
  const go = (i: number) => {
    const st = STORY[Math.max(0, Math.min(STORY.length - 1, i))];
    s.setStoryStep(STORY.indexOf(st));
    s.setRole(st.role);
    if (st.emp) s.setEmployee(st.emp);
    nav(st.to);
  };
  const cur = STORY[s.storyStep];
  return (
    <div className="anim-up fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl bg-graphite p-1.5 text-white shadow-2xl ring-1 ring-white/10">
      <button onClick={() => go(s.storyStep - 1)} disabled={s.storyStep === 0} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10" aria-label="Previous step"><ChevronLeft size={18} /></button>
      <div className="w-[340px] px-2">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold text-white/50"><span className="eyebrow text-[9.5px] text-red-300">Step {s.storyStep + 1} / {STORY.length}</span>· {ROLE_LABEL[s.role]}</div>
        <div className="truncate text-[14px] font-extrabold">{cur.label}</div>
        <div className="truncate text-[11px] text-white/55">Next action: {cur.hint}</div>
      </div>
      <button onClick={() => go(s.storyStep + 1)} disabled={s.storyStep === STORY.length - 1} className="flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-[13px] font-bold hover:bg-brand-dark">Next <ChevronRight size={16} /></button>
      <select aria-label="Jump to stage" value={s.storyStep} onChange={(e) => go(Number(e.target.value))} className="ml-1 h-10 rounded-xl border border-white/10 bg-white/5 px-2 text-[12px] font-semibold outline-none">
        {STORY.map((x, i) => <option key={x.label} value={i} className="text-ink">{i + 1}. {x.label}</option>)}
      </select>
      <button onClick={s.advance} title="Advance workflow state" className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold hover:bg-white/10"><SkipForward size={15} /> Advance</button>
      <button onClick={() => { s.reset(); go(0); }} title="Reset demo" className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold hover:bg-white/10"><RotateCcw size={15} /> Reset</button>
      <button onClick={() => s.setPresenter(false)} title="Exit presenter mode" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10"><Minimize2 size={16} /></button>
    </div>
  );
}

/* ---------- navigation ---------- */
const PRIMARY: { label: string; to: string; match: string[] }[] = [
  { label: 'Command Center', to: '/demo', match: ['/demo'] },
  { label: 'Workflow Explorer', to: '/workflow', match: ['/workflow'] },
  { label: 'My Work', to: '__role', match: ['/employee/dashboard', '/division-head', '/supervisor', '/trainer', '/hr/dashboard'] },
  { label: 'Training', to: '/hr/requests', match: ['/hr/requests', '/hr/training', '/learning-champion', '/hr/tna'] },
  { label: 'Learning', to: '/learning/course/info-security-2026', match: ['/learning', '/assessment', '/employee/certificates', '/resources', '/employee/feedback'] },
  { label: 'Development', to: '/hr/competencies', match: ['/hr/competencies', '/employee/journey', '/employee/learning-history'] },
  { label: 'Analytics', to: '/hr/analytics', match: ['/hr/analytics'] },
  { label: 'Platform', to: '/platform', match: ['/platform', '/admin', '/mobile'] },
];

const SECONDARY: Record<string, { label: string; to: string }[]> = {
  Training: [
    { label: 'Requests', to: '/hr/requests' }, { label: 'Nominations', to: '/learning-champion/nominations' }, { label: 'Scheduling', to: `/hr/training/${T}/schedule` },
    { label: 'Attendance', to: `/hr/training/${T}/attendance` }, { label: 'Training Database', to: '/hr/training-database' }, { label: 'Training Bonds', to: `/hr/training/${T}/schedule?tab=Undertaking / Bond` }, { label: 'TNA', to: '/hr/tna' },
  ],
  Learning: [
    { label: 'Courses', to: '/learning/course/info-security-2026' }, { label: 'Exams', to: '/assessment/aml-certification' }, { label: 'Certificates', to: '/employee/certificates' },
    { label: 'Feedback', to: '/employee/feedback' }, { label: 'Knowledge Corner', to: '/resources/knowledge' }, { label: 'Library', to: '/resources/library' },
  ],
  Development: [{ label: 'Competencies', to: '/hr/competencies' }, { label: 'Learning Journeys', to: '/employee/journey' }, { label: 'Learning Record', to: '/employee/learning-history' }, { label: 'IDP', to: '/hr/tna' }],
  Platform: [{ label: 'Ecosystem Map', to: '/platform' }, { label: 'Integrations', to: '/admin/integrations' }, { label: 'Audit', to: '/admin/audit' }, { label: 'Users, Roles & Maker-Checker', to: '/admin/security' }, { label: 'Mobile', to: '/mobile' }],
  'My Work': [],
};

const MYWORK: Record<Role, { label: string; to: string }[]> = {
  employee: [{ label: 'Home', to: '/employee/dashboard' }, { label: 'My Development', to: '/employee/learning-history' }, { label: 'Feedback', to: '/employee/feedback' }, { label: 'Certificates', to: '/employee/certificates' }],
  supervisor: [{ label: 'Approvals', to: '/supervisor/approvals' }, { label: 'Team Learning', to: '/supervisor/team' }],
  division_head: [{ label: 'Division', to: '/division-head/dashboard' }, { label: 'Request Training', to: '/division-head/training-request/new' }, { label: 'Nominations', to: '/learning-champion/nominations' }],
  trainer: [{ label: 'Sessions', to: '/trainer/dashboard' }, { label: 'Evaluation', to: '/assessment/aml-certification' }],
  hr: [{ label: 'Operations', to: '/hr/dashboard' }, { label: 'Requests', to: '/hr/requests' }],
  admin: [{ label: 'Integrations', to: '/admin/integrations' }, { label: 'Audit', to: '/admin/audit' }],
};

const STORY_ROUTES = ['/division-head', '/learning-champion', '/hr/requests', '/hr/training/', '/employee/dashboard', '/employee/feedback', '/supervisor', '/trainer', '/hr/dashboard'];

export default function Shell() {
  const s = useDemo();
  const nav = useNavigate();
  const loc = useLocation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [perspective, setPerspective] = useState<string | null>(null);
  const persp = useRef<number | undefined>(undefined);
  const path = loc.pathname;
  const story = STORY_ROUTES.some((p) => path.startsWith(p));
  const section = PRIMARY.find((p) => p.match.some((m) => path.startsWith(m)))?.label ?? '';
  const sub = section === 'My Work' ? MYWORK[s.role] : SECONDARY[section];
  const base = PERSONAS[s.role];
  const emp = ({ e1: ['Ayesha Rahman', 'Relationship Manager'], e2: ['Tanvir Hasan', 'Credit Analyst'], e4: ['Sadia Islam', 'Senior Credit Analyst'] } as Record<string, string[]>)[s.employeeId];
  const persona = s.role === 'employee' && emp ? { ...base, name: emp[0], title: emp[1] } : base;
  const myNotices = s.notices.filter((n) => n.to === s.role || n.to === 'all');

  useEffect(() => { document.documentElement.classList.toggle('presenter', s.presenter); }, [s.presenter]);
  useEffect(() => {
    const owner: [string, Role][] = [['/division-head', 'division_head'], ['/learning-champion', 'division_head'], ['/hr/requests', 'hr'], ['/hr/training', 'hr'], ['/hr/dashboard', 'hr'], ['/employee/dashboard', 'employee'], ['/employee/feedback', 'employee'], ['/supervisor', 'supervisor'], ['/trainer', 'trainer'], ['/admin', 'admin']];
    const hit = owner.find(([p]) => path.startsWith(p));
    if (hit && useDemo.getState().role !== hit[1]) s.setRole(hit[1]);
  }, [path]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
      if (e.key === 'Escape') setPalette(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => s.dismissToast(), 3200);
    return () => clearTimeout(t);
  }, [s.toast]);

  const switchTo = (c: Chip) => {
    s.setRole(c.role);
    const to = c.to ?? contextRoute(c.role, useDemo.getState());
    nav(to);
    const msg: Record<string, string> = {
      dh: 'Here is what the Division Head sees for this same request.',
      hr: 'Here is what HR Admin sees for this same request.',
      lc: 'Here is the Learning Champion’s nomination view of the same training.',
      emp: 'Here is what the employee sees for the same training.',
      sup: 'Here is the supervisor’s view of the same participant list.',
      tr: 'Here is what the trainer sees for the same programme.',
    };
    setPerspective(msg[c.id]);
    window.clearTimeout(persp.current);
    persp.current = window.setTimeout(() => setPerspective(null), 3600);
  };

  return (
    <div className="flex h-full flex-col">
      {/* top nav */}
      <header className="shrink-0 bg-graphite text-white">
        <div className="flex h-[58px] items-center gap-6 px-5">
          <NavLink to="/demo" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-11 place-items-center rounded-lg bg-white px-1"><img src="/brand/citybank-mark.png" alt="City Bank" className="h-6 w-auto" /></span>
            <span className="leading-none"><span className="block text-[15px] font-extrabold tracking-tight">ELDP</span><span className="eyebrow mt-0.5 block text-[8.5px] text-white/45">Learning Platform</span></span>
          </NavLink>
          <nav className="flex h-full items-stretch gap-0.5 overflow-x-auto scroll-thin">
            {PRIMARY.map((p) => {
              const active = p.label === section;
              return (
                <button key={p.label} onClick={() => nav(p.to === '__role' ? ROLE_HOME[s.role] : p.to)} className={cx('relative whitespace-nowrap px-3 text-[13px] font-semibold transition-colors', active ? 'text-white' : 'text-white/55 hover:text-white')}>
                  {p.label}
                  {active && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-brand" />}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {!s.presenter && (
              <button onClick={() => setPalette(true)} className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-white/50 hover:text-white lg:flex">
                <Search size={14} /> Search employees, courses, trainings… <kbd className="rounded bg-white/10 px-1.5 text-[10px] font-bold">Ctrl K</kbd>
              </button>
            )}
            <button onClick={() => setImpactOpen(true)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" title="Behind this action"><Layers size={17} /></button>
            {!s.presenter && <button onClick={() => setAuditOpen(true)} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" title="Audit trail"><ScrollText size={17} /></button>}
            <div className="relative">
              <button onClick={() => setNotifOpen((v) => !v)} className="relative rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" title="Notifications">
                <Bell size={17} />{myNotices.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-graphite" />}
              </button>
              {notifOpen && (
                <div className="anim-slide absolute right-0 top-11 z-50 w-80 rounded-xl border border-line bg-white p-2 text-ink shadow-2xl">
                  <div className="th px-2 py-1.5">Notifications · {ROLE_LABEL[s.role]}</div>
                  {myNotices.length === 0 && <div className="px-2 py-4 text-center text-xs text-ink-3">No new notifications</div>}
                  {myNotices.slice(0, 6).map((n) => <div key={n.id} className="rounded-lg px-2 py-2 text-[13px] hover:bg-canvas"><div className="font-semibold">{n.title}</div><div className="text-[11px] text-ink-3">{n.at}</div></div>)}
                </div>
              )}
            </div>
            <button onClick={() => { s.setPresenter(!s.presenter); }} className={cx('ml-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold', s.presenter ? 'bg-brand text-white' : 'border border-white/15 text-white/80 hover:bg-white/10')}>
              <Maximize2 size={13} /> Presenter
            </button>
            <div className="ml-2 flex items-center gap-2.5 border-l border-white/10 pl-3">
              <Avatar name={persona.name} size={30} />
              <div className="hidden leading-tight xl:block"><div className="text-[12.5px] font-bold">{persona.name}</div><div className="text-[10.5px] text-white/50">{ROLE_LABEL[s.role]}</div></div>
            </div>
          </div>
        </div>
        {story && (
          <div className="border-t border-white/8 px-5 py-2.5"><PeopleRibbon onSwitch={switchTo} /></div>
        )}
      </header>

      {sub && sub.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-line bg-white px-5 scroll-thin">
          <span className="mr-3 py-2.5 text-[11px] font-bold uppercase tracking-[.12em] text-ink-3">{section}</span>
          {sub.map((x) => {
            const active = path + loc.search === x.to || (path === x.to.split('?')[0] && !x.to.includes('?') && !loc.search);
            return <button key={x.label} onClick={() => nav(x.to)} className={cx('whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold', active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas')}>{x.label}</button>;
          })}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {story && <LifecycleRail />}
        <main className="relative min-w-0 flex-1 overflow-y-auto scroll-thin">
          {perspective && (
            <div className="anim-slide sticky top-0 z-20 flex items-center gap-2 border-b border-ink/10 bg-ink px-6 py-2 text-[12.5px] font-semibold text-white">
              <Users size={14} className="text-red-300" /> {perspective} <span className="text-white/50">Same training ID · same participants · same state.</span>
            </div>
          )}
          <div key={path + s.role} className={cx('anim-fade', ['/demo', '/workflow', '/platform', '/hr/analytics', '/learning/course/info-security-2026'].includes(path) ? '' : 'mx-auto max-w-[1600px] px-6 py-7 lg:px-10')}>
            <Outlet />
          </div>
          <div className="h-24" />
        </main>
        {story && <AffectedRail />}
      </div>

      {s.presenter ? <PresenterBar /> : null}
      <ImpactCard onOpen={() => setImpactOpen(true)} />
      {s.toast && !s.impact && (
        <div className="anim-slide fixed left-1/2 top-[70px] z-[60] -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-semibold text-white shadow-xl"><span className="mr-2 text-emerald-400">✓</span>{s.toast}</div>
      )}
      <ImpactDrawer open={impactOpen} onClose={() => setImpactOpen(false)} />
      <AuditDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />
      {palette && <Palette onClose={() => setPalette(false)} switchTo={(r) => switchTo(CHIPS.find((c) => c.role === r && c.id !== 'lc') ?? { id: 'x', role: r, label: '' })} />}
    </div>
  );
}

function AuditDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audit = useDemo((s) => s.audit);
  return (
    <Drawer open={open} onClose={onClose} title="Audit Trail · TR-2026-00418">
      <p className="mb-4 text-xs text-ink-3">Append-only log. Every action is attributed, time-stamped and forwarded to the Bank SIEM (simulated).</p>
      {audit.length === 0 && <div className="rounded-lg border border-dashed border-line p-6 text-center text-[13px] text-ink-3">No actions recorded yet.</div>}
      <ol className="relative space-y-4 border-l border-line pl-5">
        {audit.map((a) => (
          <li key={a.id} className="anim-slide relative text-[13px]">
            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
            <div className="flex items-center justify-between"><b>{a.action}</b><span className="text-[11px] text-ink-3">{a.at.slice(12)}</span></div>
            <div className="mt-0.5 text-ink-2">{a.detail}</div>
            <div className="mt-1 text-[11px] text-ink-3">Changed by {a.actor}, {a.actorRole}</div>
            {a.previous && <div className="text-[11px] text-ink-3">Previous: {a.previous} → New: {a.next}</div>}
            {a.approvedBy && <div className="text-[11px] font-semibold text-ok">Approved by {a.approvedBy}</div>}
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

function Palette({ onClose, switchTo }: { onClose: () => void; switchTo: (r: Role) => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const cmds: { l: string; go: () => void; i: LucideIcon; g: string }[] = useMemo(() => [
    { g: 'Actions', l: 'Create Training Request', go: () => switchTo('division_head'), i: Sparkles },
    { g: 'Actions', l: 'Open Pending Approvals', go: () => switchTo('supervisor'), i: ClipboardCheck },
    { g: 'Actions', l: 'Create Exam', go: () => nav('/assessment/aml-certification'), i: FileText },
    { g: 'Navigate', l: 'Find Employee · Ayesha Rahman', go: () => nav('/employee/learning-history'), i: Users },
    { g: 'Navigate', l: 'Open Training Calendar', go: () => nav('/trainer/dashboard'), i: Calendar },
    { g: 'Navigate', l: 'Search Certificate · CERT-2026-088412', go: () => nav('/employee/certificates'), i: FileText },
    { g: 'Navigate', l: 'View Audit', go: () => nav('/admin/audit'), i: ScrollText },
    { g: 'Navigate', l: 'Workflow Explorer', go: () => nav('/workflow'), i: Workflow },
    { g: 'Navigate', l: 'View ELDP Ecosystem', go: () => nav('/platform'), i: Network },
    { g: 'Navigate', l: 'Executive Command Center', go: () => nav('/hr/analytics'), i: BarChart3 },
  ].filter((c) => c.l.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="anim-fade fixed inset-0 z-[70] bg-ink/50 p-4 pt-[14vh] backdrop-blur-sm" onClick={onClose}>
      <div className="anim-slide mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4"><Search size={16} className="text-ink-3" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employees, courses, trainings, certificates, exams…" className="w-full py-4 text-[14px] outline-none" /></div>
        <ul className="max-h-96 overflow-y-auto p-2">
          {['Actions', 'Navigate'].map((g) => cmds.some((c) => c.g === g) && (
            <li key={g}><div className="th px-3 pb-1 pt-2">{g}</div>
              {cmds.filter((c) => c.g === g).map((c) => (
                <button key={c.l} onClick={() => { c.go(); onClose(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium hover:bg-canvas"><c.i size={16} className="text-ink-3" />{c.l}</button>
              ))}
            </li>
          ))}
          {cmds.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-3">No results</li>}
        </ul>
      </div>
    </div>
  );
}
