import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Bell, Building2, Check, ChevronDown, Compass, Database, Gauge, FileCheck2, Hash, LayoutGrid, Maximize2, MoreHorizontal, Network, PanelLeftClose,
  LogOut, PanelLeftOpen, RotateCcw, ScrollText, Search, ShieldCheck, SkipForward, Undo2, Workflow, X, type LucideIcon,
} from 'lucide-react';
import { PERSONAS, ROLE_HOME, ROLE_ORDER, TRAINING } from '../data';
import { useDemo } from '../store';
import {
  activeStage, IMPACTS, JOURNEY, journeyAction, journeyDone, journeyEvent, journeyIndex, journeyScreens, PEOPLE, personStatus, ROLE_DASHBOARD, ROLE_LABEL, showcasesNow, STAGES_LC, tasksFor,
  type Pid, type Showcase,
} from '../lifecycle';
import { ENTITLED, navGroupOf, WORK_NAV, type ItemStatus } from '../nav';
import type { Role } from '../types';
import { Avatar, cx, Drawer } from './ui';
import { personaFor, useSwitchRole } from './perspective';
import { FrRef, SourceTag } from './Source';

export { personaFor };

type Switch = (r: Role, to?: string, emp?: string) => void;

/* ---------------- navigation model ---------------- */
const NAV: { label: string; to: string | 'role'; match: (p: string, role: Role) => boolean }[] = [
  { label: 'Home', to: '/overview', match: (p, r) => p.startsWith('/overview') || p.startsWith('/r/') || !!navGroupOf(r, p) },
  { label: 'Modules', to: '/learning', match: (p) => ['/learning', '/assessment', '/competency', '/journey', '/knowledge', '/library', '/mobile', '/employee/certificates', '/tna'].some((x) => p.startsWith(x)) },
  { label: 'People', to: '/people', match: (p) => p.startsWith('/people') || p.startsWith('/employee/record') },
  { label: 'Reports', to: '/reports', match: (p) => p.startsWith('/reports') || p.startsWith('/executive') },
];

/** Work pages shown on white, so the form fills the screen. */
const WHITE = ['/division', '/tna'];
const FULL_BLEED = ['/overview', '/workflow', '/platform', '/executive'];
/** Hub pages hide the guidance note on an exact match only (sub-pages always show it). */
const NO_NOTE = ['/request/new', '/division', '/tna', '/overview', '/workflow', '/platform', '/coverage', '/reports', '/connected', '/people', '/learning', '/login'];

/** Which role owns a page when the current role is not entitled to it. */
const OWNER: [string, Role][] = [
  ['/request', 'division_head'], ['/nominate', 'division_head'], ['/division', 'division_head'],
  ['/hr/', 'hr'], ['/finance', 'finance'], ['/trainer', 'trainer'], ['/assessment/review', 'trainer'], ['/employee', 'employee'],
  ['/supervisor/team', 'supervisor'], ['/supervisor', 'supervisor'], ['/admin', 'admin'], ['/executive', 'management'],
];
const ownerOf = (path: string) => [...OWNER].sort((a, b) => b[0].length - a[0].length).find(([p]) => path.startsWith(p))?.[1];
const entitled = (role: Role, path: string) => ENTITLED[role].some((p) => path.startsWith(p));

const pending = (r: Role, s: ReturnType<typeof useDemo.getState>) => tasksFor(r, s).filter((t) => t.id !== 'mc').length;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return ref;
}

export default function Shell() {
  const s = useDemo();
  const nav = useNavigate();
  const loc = useLocation();
  const path = loc.pathname;
  const switchRole = useSwitchRole();
  const [palette, setPalette] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [impactKey, setImpactKey] = useState<string | null>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [handing, setHanding] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [menuCollapsed, setMenuCollapsed] = useState(() => { try { return localStorage.getItem('eldp-menu') === 'collapsed'; } catch { return false; } });
  const roleRef = useOutside(roleOpen, () => setRoleOpen(false));
  const notifRef = useOutside(notifOpen, () => setNotifOpen(false));
  const moreRef = useOutside(moreOpen, () => setMoreOpen(false));
  const persona = personaFor(s.role, s.employeeId);
  const myNotices = s.notices.filter((n) => n.to === s.role || n.to === 'all');
  const ji = journeyIndex(s);

  useEffect(() => { document.documentElement.classList.toggle('presenter', s.presenter); }, [s.presenter]);
  // /r/:role is the role's own home: opening it is an explicit choice.
  useEffect(() => {
    const rr = path.match(/^\/r\/([a-z_]+)/)?.[1] as Role | undefined;
    if (rr && ROLE_ORDER.includes(rr) && useDemo.getState().role !== rr) s.setRole(rr);
  }, [path]);
  // Arrival lines and revisit banners belong to one page.
  useEffect(() => {
    const st = useDemo.getState();
    if (st.arrival && st.arrival.path !== path) st.setArrival(null);
    if (st.stop && st.stop.path !== path) st.setStop(null);
    // A new page starts at the top (the scroll container is <main>, not the window).
    mainRef.current?.scrollTo({ top: 0 });
  }, [path]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
      if (e.key === 'Escape') { setPalette(false); setRoleOpen(false); setMoreOpen(false); setNotifOpen(false); setJourneyOpen(false); setOverviewOpen(false); setAuditOpen(false); setImpactKey(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    if (!s.toast) return;
    const t = setTimeout(() => s.dismissToast(), s.undo ? 10000 : 3800);
    return () => clearTimeout(t);
  }, [s.toast, s.undo]);

  /* ---------- hand-off engine (F6.1): when the next step belongs to someone else, go there ---------- */
  const prevJi = useRef(ji);
  useEffect(() => {
    const before = prevJi.current;
    prevJi.current = ji;
    if (ji <= before || ji >= JOURNEY.length) return;
    const st = useDemo.getState();
    if (st.revisit !== null) return;
    const cur = JOURNEY[ji];
    const act = journeyAction(cur, st);
    const sameRole = act.role === st.role && (!act.emp || act.emp === st.employeeId || act.role !== 'employee');
    if (sameRole) return;
    const ev = st.audit[0];
    const name = cur.who === 'system' ? 'the system' : personaFor(act.role, act.emp ?? st.employeeId).name;
    setHanding(name);
    const dash = st.handoffTarget === 'dashboard' ? ROLE_DASHBOARD[act.role] : undefined;
    const target = dash ?? act.to;
    const go = () => {
      setHanding(null);
      useDemo.getState().setArrival({ path: target.split('?')[0], from: ev ? `${ev.actor}, ${ev.actorRole}` : '', text: ev ? (IMPACTS[ev.action]?.headline ?? ev.action) : cur.title, at: ev ? ev.at.slice(12) : '', key: ev?.action });
      switchRole(act.role, target, act.emp);
    };
    if (reducedMotion()) go(); else setTimeout(go, 900);
  }, [ji]);

  const section = NAV.find((n) => n.match(path, s.role))?.label;
  const showMenu = path.startsWith('/r/') || !!navGroupOf(s.role, path);
  const owner = ownerOf(path);
  const needsPrompt = !!owner && owner !== s.role && !entitled(s.role, path) && !path.startsWith('/r/');
  const toggleMenu = () => { const v = !menuCollapsed; setMenuCollapsed(v); try { localStorage.setItem('eldp-menu', v ? 'collapsed' : 'open'); } catch { /* storage unavailable */ } };

  const MORE: { l: string; i: LucideIcon; go: () => void; on?: boolean; sep?: boolean; count?: number }[] = [
    { l: 'Notifications', i: Bell, go: () => setNotifOpen(true), count: myNotices.length },
    { l: 'Workflows', i: Workflow, go: () => nav('/workflow'), sep: true },
    { l: 'Platform', i: Network, go: () => nav('/platform') },
    { l: 'Connected Bank', i: Building2, go: () => nav('/connected') },
    { l: 'Requirements coverage', i: FileCheck2, go: () => nav('/coverage') },
    { l: 'Training database', i: Database, go: () => switchRole('hr', '/hr/training-db') },
    { l: 'Audit trail', i: ScrollText, go: () => setAuditOpen(true), sep: true },
    { l: 'Security & roles', i: ShieldCheck, go: () => switchRole('admin', '/admin/security') },
    { l: 'Integrations', i: Network, go: () => switchRole('admin', '/admin/integrations') },
    { l: 'Show requirement numbers', i: Hash, go: () => s.setShowFr(!s.showFr), on: s.showFr, sep: true },
    { l: 'Presenter mode (larger text)', i: Maximize2, go: () => s.setPresenter(!s.presenter), on: s.presenter },
    { l: 'Hand-offs open the role dashboard first', i: Gauge, go: () => s.setHandoffTarget(s.handoffTarget === 'dashboard' ? 'task' : 'dashboard'), on: s.handoffTarget === 'dashboard' },
    { l: 'Reset demo', i: RotateCcw, go: () => { s.reset(); nav('/overview'); }, sep: true },
  ];

  return (
    <div className="flex h-full flex-col bg-[#f7f5f2]">
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex h-[68px] items-center gap-8 px-6">
          <NavLink to="/overview" className="flex shrink-0 items-center gap-3" aria-label="City Bank ELDP home">
            <img src="/brand/citybank-mark.png" alt="" className="h-9 w-auto" />
            <span className="leading-tight"><span className="block text-[17px] font-extrabold tracking-tight">City Bank ELDP</span><span className="block text-[14px] text-ink-3">Learning &amp; Development</span></span>
          </NavLink>
          <nav aria-label="Main" className="flex h-full items-stretch">
            {NAV.map((n) => {
              const on = section === n.label;
              const count = n.label === 'Home' ? pending(s.role, s) : 0;
              return (
                <button key={n.label} onClick={() => nav(n.to === 'role' ? ROLE_HOME[s.role] : n.to)} aria-current={on ? 'page' : undefined}
                  className={cx('relative flex items-center gap-2 whitespace-nowrap px-3 text-[16px] font-semibold transition-colors 2xl:px-4', on ? 'text-ink' : 'text-ink-3 hover:text-ink')}>
                  {n.label}
                  {count > 0 && <span className="rounded-full bg-brand px-2 text-[14px] font-bold leading-5 text-white">{count}</span>}
                  {on && <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-full bg-brand" />}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={() => setPalette(true)} title="Search (Ctrl K)" aria-label="Search" className="grid h-11 w-11 place-items-center rounded-lg text-ink-2 hover:bg-canvas"><Search size={20} /></button>
            <div ref={moreRef} className="relative">
              <button onClick={() => setMoreOpen((v) => !v)} aria-label="More: workflows, platform, audit, settings" title="More" className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-[15px] font-semibold text-ink-2 hover:bg-canvas"><MoreHorizontal size={20} /><span className="hidden 2xl:inline">More</span></button>
              {moreOpen && (
                <div className="anim-slide absolute right-0 top-12 z-50 w-80 rounded-xl border border-line bg-white p-1.5 shadow-2xl">
                  {MORE.map((m) => (
                    <button key={m.l} onClick={() => { m.go(); setMoreOpen(false); }} className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-canvas', m.sep && 'mt-1 border-t border-line pt-3')}>
                      <m.i size={18} className="text-ink-3" /><span className="flex-1">{m.l}</span>
                      {!!m.count && <span className="rounded-full bg-canvas px-2 text-[14px] font-semibold leading-6 text-ink-2">{m.count} new</span>}
                      {m.on !== undefined && <span className={cx('h-5 w-9 rounded-full p-0.5 transition-colors', m.on ? 'bg-ok' : 'bg-line')}><span className={cx('block h-4 w-4 rounded-full bg-white transition-transform', m.on && 'translate-x-4')} /></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div ref={notifRef} className="relative">
              {notifOpen && (
                <div className="anim-slide absolute right-0 top-8 z-50 w-96 rounded-xl border border-line bg-white p-2 shadow-2xl">
                  <div className="px-3 py-2 text-[14px] font-semibold text-ink-3">Notifications for {ROLE_LABEL[s.role]}</div>
                  {myNotices.length === 0 && <div className="px-3 py-5 text-center text-[15px] text-ink-3">Nothing new. Your tasks are in My work.</div>}
                  {myNotices.slice(0, 6).map((n) => <div key={n.id} className="rounded-lg px-3 py-2.5 hover:bg-canvas"><div className="text-[15px] font-semibold">{n.title}</div><div className="text-[14px] text-ink-3">{n.at.slice(12)}</div></div>)}
                </div>
              )}
            </div>
            <div ref={roleRef} className="relative ml-1 border-l border-line pl-3">
              <button onClick={() => setRoleOpen((v) => !v)} aria-label={`Signed in as ${persona.name}, ${ROLE_LABEL[s.role]}. Switch profile`} className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-canvas">
                <Avatar name={persona.name} size={40} />
                <span className="hidden max-w-[190px] text-left leading-tight min-[1420px]:block"><span className="block truncate text-[15px] font-bold">{persona.name}</span><span className="block truncate text-[14px] text-ink-3">{PERSONAS[s.role].label} · {persona.dept.replace(' Division', '')}</span></span>
                <ChevronDown size={17} className="text-ink-3" />
              </button>
              {roleOpen && (
                <div className="anim-slide absolute right-0 top-14 z-50 w-[400px] overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
                  <div className="border-b border-line px-5 py-4"><div className="text-[16px] font-bold">Switch profile</div><div className="text-[14px] text-ink-3">See the same training from another person’s desk. <SourceTag kind="fictional">People are fictional</SourceTag></div></div>
                  <ul className="max-h-[70vh] overflow-y-auto py-1">
                    {ROLE_ORDER.map((r) => {
                      const p = personaFor(r, s.employeeId);
                      const n = pending(r, s);
                      return (
                        <li key={r}>
                          <button onClick={() => { switchRole(r); setRoleOpen(false); }} className={cx('flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-canvas', s.role === r && 'bg-canvas')}>
                            <Avatar name={p.name} size={36} />
                            <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{p.name}</span><span className="block truncate text-[14px] text-ink-3">{PERSONAS[r].label} · {p.dept}</span></span>
                            {n > 0 && <span className="rounded-full bg-brand px-2 text-[14px] font-bold leading-5 text-white">{n}</span>}
                            {s.role === r && <Check size={17} className="text-ok" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-line p-1.5">
                    <button onClick={() => { setRoleOpen(false); nav('/login'); }} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[15px] hover:bg-canvas">
                      <LogOut size={18} className="text-ink-3" /><span className="flex-1">Log out</span><span className="text-[14px] text-ink-3">{persona.name}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => nav('/login')} title="Log out" aria-label="Log out" className="ml-1 flex h-11 items-center gap-2 rounded-lg px-3 text-[15px] text-ink-2 hover:bg-canvas hover:text-ink">
              <LogOut size={19} /><span className="hidden xl:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <ContextBar switchRole={switchRole} openOverview={() => setOverviewOpen(true)} openJourney={() => setJourneyOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {showMenu && <WorkMenu collapsed={menuCollapsed} onToggle={toggleMenu} />}
        <main ref={mainRef} className={cx('relative min-h-0 flex-1 overflow-y-auto scroll-thin', WHITE.some((p) => path.startsWith(p)) && 'bg-white')}>
          <div className={cx(FULL_BLEED.some((p) => path.startsWith(p)) ? 'px-8' : 'mx-auto max-w-[1440px] px-10', 'pt-8')}>
            {needsPrompt && owner && <RolePrompt owner={owner} />}
            <StopBanner switchRole={switchRole} />
            <RevisitBanner switchRole={switchRole} />
            <EarlyStepBanner switchRole={switchRole} />
            {!NO_NOTE.includes(path) && !s.revisit && <GuidedStepNote switchRole={switchRole} openImpact={setImpactKey} />}
          </div>
          <div key={path + s.role + s.employeeId} className={cx('anim-fade', FULL_BLEED.some((p) => path.startsWith(p)) ? '' : 'mx-auto max-w-[1440px] px-10 py-8')}>
            <Outlet />
          </div>
          <div className="h-16" />
        </main>
      </div>

      {handing && (
        <div role="status" className="anim-slide fixed left-1/2 top-24 z-[65] -translate-x-1/2 rounded-2xl border border-line bg-white px-6 py-4 text-[16px] font-semibold shadow-2xl">
          <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-brand" />Sending to {handing}…
        </div>
      )}
      {s.toast && (
        <div role="status" className="anim-slide fixed bottom-6 left-1/2 z-[60] flex max-w-[90vw] -translate-x-1/2 items-center gap-4 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white shadow-xl">
          <span>{s.toast}</span>
          {s.undo && <button onClick={s.undoLast} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 hover:bg-white/25"><Undo2 size={15} />Undo</button>}
        </div>
      )}
      <JourneyDrawer open={journeyOpen} onClose={() => setJourneyOpen(false)} switchRole={switchRole} />
      <OverviewDrawer open={overviewOpen} onClose={() => setOverviewOpen(false)} switchRole={switchRole} />
      <ImpactDrawer k={impactKey} onClose={() => setImpactKey(null)} />
      <AuditDrawer open={auditOpen} onClose={() => setAuditOpen(false)} />
      {palette && <Palette onClose={() => setPalette(false)} switchRole={switchRole} openAudit={() => setAuditOpen(true)} />}
    </div>
  );
}

/* ---------------- side menu for work pages (F5.1) ---------------- */
const TONE: Record<NonNullable<ItemStatus>['tone'], string> = { new: 'bg-brand text-white', waiting: 'bg-amber-100 text-amber-900', done: 'bg-ok-soft text-ok', idle: 'bg-canvas text-ink-3' };
function WorkMenu({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const loc = useLocation();
  const groups = WORK_NAV[s.role];
  const n = pending(s.role, s);
  if (collapsed) {
    return (
      <aside className="hidden w-14 shrink-0 border-r border-line bg-white lg:block">
        <button onClick={onToggle} aria-label="Open the work menu" title="Open the work menu" className="m-2 grid h-10 w-10 place-items-center rounded-lg text-ink-2 hover:bg-canvas"><PanelLeftOpen size={20} /></button>
      </aside>
    );
  }
  return (
    <aside aria-label="My work" className="hidden w-[264px] shrink-0 overflow-y-auto border-r border-line bg-white scroll-thin lg:block">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-[14px] font-semibold text-ink-3">{PERSONAS[s.role].label}</span>
        <button onClick={onToggle} aria-label="Collapse the work menu" title="Collapse" className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 hover:bg-canvas"><PanelLeftClose size={18} /></button>
      </div>
      {groups[0]?.label === 'My work' && <div className="mt-4 px-5 pb-1.5 text-[14px] font-semibold text-ink-3">My work</div>}
      <button onClick={() => nav(`/r/${s.role}`)} aria-current={loc.pathname.startsWith('/r/') ? 'page' : undefined} className={cx('mx-2 flex w-[calc(100%-16px)] items-center justify-between rounded-lg px-3 py-2.5 text-left text-[16px] font-semibold', loc.pathname.startsWith('/r/') ? 'bg-brand-soft text-brand-dark' : 'hover:bg-canvas')}>
        My tasks {n > 0 && <span className="rounded-full bg-brand px-2 text-[14px] font-bold leading-5 text-white">{n}</span>}
      </button>
      {groups.map((g) => (
        <div key={g.label} className={g.label === 'My work' ? 'mt-0.5' : 'mt-4'}>
          {g.label !== 'My work' && <div className="px-5 pb-1.5 text-[14px] font-semibold text-ink-3">{g.label}</div>}
          <ul>
            {g.items.map((it) => {
              const on = it.to.includes('?') ? loc.pathname + loc.search === it.to : !loc.search.includes('s=') && navGroupOf(s.role, loc.pathname)?.item.to === it.to;
              const status = it.status?.(s) ?? null;
              return (
                <li key={it.to}>
                  <button onClick={() => nav(it.to)} aria-current={on ? 'page' : undefined} title={it.fr} className={cx('mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-3 py-2 text-left text-[15px]', on ? 'bg-canvas font-semibold text-ink' : 'text-ink-2 hover:bg-canvas hover:text-ink')}>
                    <span className="min-w-0 flex-1 leading-snug">{it.label}</span>
                    {status && <span className={cx('shrink-0 rounded-full px-2 text-[13px] font-semibold leading-5', TONE[status.tone])}>{status.text}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="h-6" />
    </aside>
  );
}

/* ---------------- prompts and banners above the page ---------------- */
function RolePrompt({ owner }: { owner: Role }) {
  const s = useDemo();
  const nav = useNavigate();
  const switchRole = useSwitchRole();
  const loc = useLocation();
  const name = personaFor(owner, s.employeeId).name;
  return (
    <div className="anim-slide mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
      <div className="flex-1 text-[16px]">This page belongs to <b>{PERSONAS[owner].label}</b>. You are viewing as {PERSONAS[s.role].label}. View it as <b>{name}</b>?</div>
      <button onClick={() => nav(-1)} className="min-h-11 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">Stay as {PERSONAS[s.role].label}</button>
      <button onClick={() => switchRole(owner, loc.pathname + loc.search)} className="min-h-11 rounded-lg bg-brand px-4 text-[15px] font-bold text-white hover:bg-brand-dark">Switch to {name}</button>
    </div>
  );
}

function RevisitBanner({ switchRole }: { switchRole: Switch }) {
  const s = useDemo();
  if (s.revisit === null) return null;
  const j = JOURNEY[s.revisit];
  const ji = journeyIndex(s);
  const cur = JOURNEY[Math.min(ji, JOURNEY.length - 1)];
  const act = journeyAction(cur, s);
  const ev = journeyEvent(j, s);
  return (
    <div className="anim-slide mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
      <div className="flex-1 text-[16px]"><b>Viewing completed step {s.revisit + 1}: {j.title}</b>{ev && <span className="text-ink-2"> · done by {ev.actor}, {ev.at.slice(12)}</span>}. Nothing here changes the record.</div>
      {ji < JOURNEY.length && <button onClick={() => { s.setRevisit(null); switchRole(act.role, act.to, act.emp); }} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-bold text-white hover:bg-brand-dark">Back to current step {ji + 1} <ArrowRight size={16} /></button>}
      <button onClick={() => s.setRevisit(null)} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-white"><X size={18} /></button>
    </div>
  );
}

function EarlyStepBanner({ switchRole }: { switchRole: Switch }) {
  const s = useDemo();
  const loc = useLocation();
  const ji = journeyIndex(s);
  if (s.revisit !== null || ji >= JOURNEY.length) return null;
  const later = JOURNEY.findIndex((j, i) => i > ji && journeyScreens(j).includes(loc.pathname) && !journeyScreens(JOURNEY[ji]).includes(loc.pathname) && !journeyDone(j, s));
  if (later === -1) return null;
  const cur = JOURNEY[ji];
  const act = journeyAction(cur, s);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4">
      <div className="flex-1 text-[16px]">This page is <b>Step {later + 1}</b> in the story. The training is now at <b>Step {ji + 1}: {cur.title}</b> ({cur.who === 'system' ? 'System' : ROLE_LABEL[act.role]}). You can still use this page on its own.</div>
      <button onClick={() => switchRole(act.role, act.to, act.emp)} className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">Go to current step <ArrowRight size={16} /></button>
    </div>
  );
}

/** Shown on the screen a hand-off lands on: who sent what, and when (F6.1). */
export function ArrivalLine({ openImpact }: { openImpact: (k: string) => void }) {
  const s = useDemo();
  const loc = useLocation();
  const a = s.arrival;
  if (!a || a.path !== loc.pathname) return null;
  return (
    <div className="anim-slide mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[#cfe7d7] bg-[#f3faf5] px-5 py-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-white"><Check size={18} /></span>
      <div className="min-w-0 flex-1 text-[16px]"><span className="text-ink-2">Received{a.from ? ` from ${a.from}` : ''}:</span> <b>{a.text}</b>{a.at && <span className="text-ink-3"> · {a.at}</span>}</div>
      {a.key && IMPACTS[a.key] && <button onClick={() => openImpact(a.key!)} className="min-h-11 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">View full impact</button>}
      <button onClick={() => s.setArrival(null)} aria-label="Dismiss" className="grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-white"><X size={18} /></button>
    </div>
  );
}

/* ---------------- context bar (P1): one line · perspective · record · step chip · one action · one menu ---------------- */
/** Open a dashboard stop: switch to its role and page, and show the stop banner there. */
export function useOpenStop() {
  const switchRole = useSwitchRole();
  return (x: Showcase) => { useDemo.getState().setStop({ label: x.label, path: x.to }); switchRole(x.role, x.to); };
}

function ContextBar({ switchRole, openOverview, openJourney }: { switchRole: Switch; openOverview: () => void; openJourney: () => void }) {
  const s = useDemo();
  const nav = useNavigate();
  const loc = useLocation();
  const openStop = useOpenStop();
  const [menu, setMenu] = useState(false);
  const ref = useOutside(menu, () => setMenu(false));
  const ji = journeyIndex(s);
  const done = ji >= JOURNEY.length;
  const cur = JOURNEY[Math.min(ji, JOURNEY.length - 1)];
  const act = journeyAction(cur, s);
  const here = !done && loc.pathname + loc.search === act.to && (!act.emp || act.emp === s.employeeId);
  let pi = Math.min(ji, JOURNEY.length) - 1;
  while (pi > 0 && JOURNEY[pi].who === 'system') pi--;
  const prevStep = pi >= 0 ? pi : null;
  const stops = showcasesNow(s).filter((x) => x.to !== loc.pathname);
  const openPrev = () => {
    if (prevStep === null) return;
    const a = journeyAction(JOURNEY[prevStep], s);
    s.setRevisit(prevStep);
    switchRole(a.role, a.to, a.emp);
  };
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-canvas';
  return (
    <div className="relative shrink-0 border-b border-line bg-[#fbf9f6]">
      <div className="flex h-[52px] items-center gap-4 px-6">
        <ViewingAs switchRole={switchRole} />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {done ? (
            <button onClick={openJourney} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[15px] font-semibold text-ok hover:bg-white"><Check size={18} />All {JOURNEY.length} steps complete</button>
          ) : (
            <>
              <button onClick={openJourney} title={`Step ${ji + 1} of ${JOURNEY.length}: ${cur.title} (${cur.who === 'system' ? 'System' : ROLE_LABEL[act.role]}) · open the guided journey`} aria-label={`Step ${ji + 1} of ${JOURNEY.length}: ${cur.title}. Open the guided journey`} className="flex min-w-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[15px] hover:bg-white">
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', here ? 'bg-ok' : 'anim-pulse bg-brand')} />
                <Compass size={16} className="shrink-0 text-ink-3" />
                <span className="shrink-0 font-semibold">Step {ji + 1}/{JOURNEY.length}</span>
                <span className="hidden min-w-0 truncate text-ink-2 md:block md:max-w-[220px] xl:max-w-[340px] 2xl:max-w-[460px]">· {cur.title}</span>
              </button>
              {s.presenter && <button onClick={() => s.advance()} className="flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[15px] font-semibold text-ink-2 hover:bg-white hover:text-ink"><SkipForward size={16} />Do this step for me</button>}
              {!here && <button data-testid="tour-go" onClick={() => switchRole(act.role, act.to, act.emp)} className={cx('flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', loc.pathname === '/overview' || act.role !== s.role ? 'border border-brand/40 bg-white text-brand hover:bg-brand-soft' : 'bg-brand text-white hover:bg-brand-dark')}>{act.role !== s.role ? `Go to ${ROLE_LABEL[act.role]}` : act.cta} <ArrowRight size={16} /></button>}
            </>
          )}
          <div ref={ref} className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-label="Tour options" title="Tour options" className="grid h-10 w-10 place-items-center rounded-lg text-ink-3 hover:bg-white hover:text-ink"><MoreHorizontal size={19} /></button>
            {menu && (
              <div className="anim-slide absolute right-0 top-12 z-50 w-80 rounded-xl border border-line bg-white p-1.5 shadow-xl">
                {prevStep !== null && <button onClick={() => { openPrev(); setMenu(false); }} className={item}><ArrowLeft size={16} />Previous step</button>}
                <button onClick={() => { openOverview(); setMenu(false); }} className={item}><LayoutGrid size={16} />Overview</button>
                <button onClick={() => { openJourney(); setMenu(false); }} className={item}><Compass size={16} />Guided journey</button>
                {stops.map((x) => <button key={x.label + x.to} onClick={() => { openStop(x); setMenu(false); }} className={item}><Gauge size={16} /><span className="min-w-0 flex-1">Show: {x.label}<span className="block text-[14px] text-ink-3">{x.why}</span></span></button>)}
                {!done && <button onClick={() => { s.advance(); setMenu(false); }} className={cx(item, 'mt-1 border-t border-line pt-3')}><SkipForward size={16} />Do this step for me</button>}
                <button onClick={() => { s.reset(); setMenu(false); nav('/overview'); }} className={item}><RotateCcw size={16} />Reset demo</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-[3px] bg-brand transition-all duration-700" style={{ width: `${(Math.min(ji, JOURNEY.length) / JOURNEY.length) * 100}%` }} />
    </div>
  );
}

/** Shown on a dashboard opened as a presenter stop: it changes nothing, and leads back (P2). */
function StopBanner({ switchRole }: { switchRole: Switch }) {
  const s = useDemo();
  const loc = useLocation();
  if (!s.stop || s.stop.path !== loc.pathname) return null;
  const ji = journeyIndex(s);
  const cur = JOURNEY[Math.min(ji, JOURNEY.length - 1)];
  const act = journeyAction(cur, s);
  return (
    <div className="anim-slide mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
      <Gauge size={20} className="shrink-0 text-sky-700" />
      <div className="flex-1 text-[16px]"><b>Dashboard stop: {s.stop.label}.</b> <span className="text-ink-2">Viewing this changes nothing in the record.</span></div>
      {ji < JOURNEY.length && <button onClick={() => { s.setStop(null); switchRole(act.role, act.to, act.emp); }} className="flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-bold text-white hover:bg-brand-dark">Back to the current step <ArrowRight size={16} /></button>}
      <button onClick={() => s.setStop(null)} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-white"><X size={18} /></button>
    </div>
  );
}

/* ---------------- "Viewing this record as": same record, another desk ---------------- */
const SHARED_PAGES = ['/overview', '/workflow', '/people', '/learning', '/reports', '/platform', '/connected', '/coverage'];
const VIEWS: { label: string; role: Role; to?: string; emp?: string; sub?: boolean }[] = [
  { label: 'HR Admin', role: 'hr' },
  { label: 'Division Head', role: 'division_head' },
  { label: 'Learning Champion', role: 'division_head', to: '/nominate' },
  { label: 'Employee · Ayesha Rahman', role: 'employee', emp: 'e1' },
  { label: 'Employee · Tanvir Hasan', role: 'employee', emp: 'e2', sub: true },
  { label: 'Employee · Sadia Islam', role: 'employee', emp: 'e4', sub: true },
  { label: 'Supervisor', role: 'supervisor' },
  { label: 'Trainer', role: 'trainer' },
  { label: 'Finance (proposed)', role: 'finance' },
  { label: 'Management (proposed)', role: 'management' },
];
function ViewingAs({ switchRole }: { switchRole: Switch }) {
  const s = useDemo();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const onLc = s.role === 'division_head' && loc.pathname === '/nominate';
  const current = VIEWS.find((v) => v.role === s.role && (v.role !== 'employee' || v.emp === s.employeeId) && (v.to === '/nominate') === onLc) ?? VIEWS[0];
  const shared = SHARED_PAGES.some((p) => loc.pathname.startsWith(p));
  return (
    <div ref={ref} className="relative hidden shrink-0 md:block">
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} aria-label={`Viewing this record as ${current.label}. Change perspective`} className="flex items-center gap-2 rounded-lg px-2 py-1 text-left leading-tight hover:bg-white">
        <span className="flex items-baseline gap-1.5 whitespace-nowrap"><span className="text-[15px] text-ink-3">Viewing as:</span><span className="max-w-[220px] truncate text-[15px] font-bold">{current.label}</span></span>
        <ChevronDown size={16} className="text-ink-3" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Viewing this record as" className="anim-slide absolute left-0 top-12 z-50 w-80 rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {VIEWS.map((v) => {
            const on = v === current;
            const n = v.sub ? 0 : pending(v.role, s);
            return (
              <li key={v.label}>
                <button role="option" aria-selected={on} onClick={() => { setOpen(false); switchRole(v.role, v.to ?? (shared ? loc.pathname : v.role === 'employee' && loc.pathname.startsWith('/employee') ? loc.pathname : undefined), v.emp); }} className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] hover:bg-canvas', on && 'bg-canvas font-semibold', v.sub && 'pl-7')}>
                  <span className="flex-1">{v.label}{!v.emp && <span className="block text-[14px] font-normal text-ink-3">{personaFor(v.role, s.employeeId).name}</span>}</span>
                  {n > 0 && !v.to && <span className="rounded-full bg-brand px-2 text-[14px] font-bold leading-5 text-white">{n}</span>}
                  {on && <Check size={16} className="text-ok" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- guidance note above every task screen ---------------- */
export function GuidedStepNote({ switchRole, openImpact }: { switchRole: Switch; openImpact: (k: string) => void }) {
  const s = useDemo();
  const loc = useLocation();
  const path = loc.pathname;
  const ji = journeyIndex(s);
  if (ji >= JOURNEY.length) return null;
  const cur = JOURNEY[ji];
  const act = journeyAction(cur, s);
  let pi = ji - 1;
  while (pi > 0 && JOURNEY[pi].who === 'system') pi--;
  const prev = pi >= 0 ? JOURNEY[pi] : null;
  const hereCur = journeyScreens(cur).includes(path) && (!path.startsWith('/employee') || !act.emp || act.emp === s.employeeId);
  const prevEv = prev ? journeyEvent(prev, s) : undefined;
  const justDone = !hereCur && prev && prevEv && journeyScreens(prev).includes(path) && !s.arrival;
  const next = JOURNEY[ji + 1];

  if (hereCur) {
    const person = cur.person ? personaFor('employee', cur.person) : null;
    return (
      <section key={`a${ji}`} aria-live="polite" className="anim-up mb-2 flex flex-wrap items-center gap-x-8 gap-y-1 rounded-xl border border-[#efd9d6] bg-white px-5 py-3">
        <span className="flex items-center gap-2 text-[15px] font-medium text-brand"><span className="anim-pulse h-2 w-2 rounded-full bg-brand" />Step {ji + 1} of {JOURNEY.length}</span>
        <span className="text-[17px] font-medium">{person ? `${person.name}: ` : ''}{act.label}</span>
        {next && <span className="ml-auto text-[15px] text-ink-3">Next: {next.short}</span>}
      </section>
    );
  }
  if (justDone && prev && prevEv) {
    return (
      <section key={`b${ji}`} aria-live="polite" className="anim-up mb-2 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#cfe7d7] bg-white px-5 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ok text-white"><Check size={16} /></span>
        <span className="text-[17px] font-medium">{prev.short}</span>
        <span className="flex-1" />
        <button onClick={() => switchRole(act.role, act.to, act.emp)} className="flex min-h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-medium text-white hover:bg-brand-dark">{act.cta} <ArrowRight size={16} /></button>
      </section>
    );
  }
  // elsewhere: nothing here (the step bar shows the step and opens it)
  return null;
}


/* ---------------- guided journey drawer: every step, revisit and rewind (F6.3) ---------------- */
function JourneyDrawer({ open, onClose, switchRole }: { open: boolean; onClose: () => void; switchRole: Switch }) {
  const s = useDemo();
  const [confirm, setConfirm] = useState<number | null>(null);
  if (!open) return null;
  const ji = journeyIndex(s);
  return (
    <div className="anim-fade fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="Guided journey" className="anim-drawer absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-7 py-5">
          <div><div className="text-[14px] text-ink-3">{TRAINING.requestId} · {TRAINING.title} · <SourceTag kind="concept">Example business flow</SourceTag></div><h2 className="text-[26px] font-extrabold tracking-tight">Guided journey</h2></div>
          <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded-lg text-ink-3 hover:bg-canvas"><X size={20} /></button>
        </div>
        <p className="border-b border-line px-7 py-4 text-[15px] text-ink-2">An example flow through one training. Each module also works on its own (FR 247). Open any finished step to see it again, or restart the story from that step.</p>
        <ol className="px-7 py-6">
          {JOURNEY.map((j, i) => {
            const done = journeyDone(j, s);
            const current = i === ji;
            const ev = journeyEvent(j, s);
            const act = journeyAction(j, s);
            const canRewind = done && s.snaps[i] !== undefined;
            return (
              <li key={j.title} className="relative flex gap-5 pb-6">
                {i < JOURNEY.length - 1 && <span className={cx('absolute left-[19px] top-11 h-[calc(100%-36px)] w-[2px]', done ? 'bg-ok' : 'bg-line')} />}
                <span className={cx('relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold', done ? 'bg-ok text-white' : current ? 'anim-pulse bg-brand text-white' : 'border-2 border-line bg-white text-ink-3')}>{done ? <Check size={18} /> : i + 1}</span>
                <div className={cx('min-w-0 flex-1', current && 'rounded-2xl border border-[#efd9d6] bg-[#fdf7f6] p-5', !done && !current && 'opacity-60')}>
                  <div className="flex flex-wrap items-center gap-2 text-[14px] text-ink-3">Step {i + 1} · {j.who === 'system' ? 'System' : ROLE_LABEL[j.who]}<FrRef>{j.fr}</FrRef></div>
                  <div className={cx('font-bold', current ? 'text-[20px]' : 'text-[17px]')}>{j.title}</div>
                  {current && <p className="mt-1 text-[16px] text-ink-2">{j.explain}</p>}
                  {(j.showcase ?? []).map((x) => (
                    <button key={x.label + x.to} onClick={() => { onClose(); useDemo.getState().setStop({ label: x.label, path: x.to }); switchRole(x.role, x.to); }} className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-1.5 text-left text-[15px] text-sky-900 hover:border-sky-300">
                      <Gauge size={15} />Show{x.when === 'after' ? ' after this step' : ''}: <b>{x.label}</b><span className="text-sky-800/80">· {x.why}</span>
                    </button>
                  ))}
                  {done && <p className="mt-0.5 text-[15px] text-ink-2">{j.result}{ev && <span className="text-ink-3"> · {ev.actor}, {ev.at.slice(12)}</span>}</p>}
                  {current && <button onClick={() => { onClose(); switchRole(act.role, act.to, act.emp); }} className="mt-3 flex min-h-11 items-center gap-2 rounded-lg bg-brand px-4 text-[15px] font-bold text-white hover:bg-brand-dark">{act.cta} <ArrowRight size={15} /></button>}
                  {done && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => { onClose(); s.setRevisit(i); switchRole(act.role, act.to, act.emp); }} className="flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[15px] font-semibold hover:border-ink/30">Revisit this step <ArrowRight size={15} /></button>
                      {canRewind && confirm !== i && <button onClick={() => setConfirm(i)} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-[15px] font-semibold text-ink-2 hover:bg-canvas"><RotateCcw size={15} />Restart from here</button>}
                    </div>
                  )}
                  {confirm === i && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-[15px]">
                      Restart the story at step {i + 1}? Steps {i + 1}–{ji} will be undone and can be done again.
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setConfirm(null)} className="min-h-10 rounded-lg border border-line bg-white px-4 font-semibold">Cancel</button>
                        <button onClick={() => { s.rewindTo(i); setConfirm(null); onClose(); const a = journeyAction(JOURNEY[i], useDemo.getState()); switchRole(a.role, a.to, a.emp); }} className="min-h-10 rounded-lg bg-brand px-4 font-bold text-white">Restart from step {i + 1}</button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

/* ---------------- overview drawer (F5.7): the big picture from any screen ---------------- */
const STATE_DOT: Record<string, string> = { active: 'bg-brand', attention: 'bg-amber-500', complete: 'bg-ok', affected: 'bg-info', waiting: 'bg-ink-3', idle: 'bg-line' };
function OverviewDrawer({ open, onClose, switchRole }: { open: boolean; onClose: () => void; switchRole: Switch }) {
  const s = useDemo();
  if (!open) return null;
  const a = activeStage(s);
  return (
    <Drawer open onClose={onClose} title="Overview of this training">
      <div className="text-[15px] text-ink-3">{s.requestSubmitted ? TRAINING.requestId : 'New divisional requirement'} · {TRAINING.title}</div>
      <h3 className="mt-5 text-[18px] font-bold">Stages</h3>
      <ol className="mt-3 grid grid-cols-2 gap-2">
        {STAGES_LC.map((st, i) => (
          <li key={st.key}>
            <button onClick={() => { onClose(); switchRole(st.route.role, st.route.to, st.route.emp); }} className={cx('flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[15px]', i < a ? 'border-ok/30 bg-ok-soft/40' : i === a ? 'border-brand bg-brand-soft/40 font-semibold' : 'border-line')}>
              <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[13px] font-bold', i < a ? 'bg-ok text-white' : i === a ? 'bg-brand text-white' : 'bg-canvas text-ink-3')}>{i < a ? <Check size={13} /> : i + 1}</span>
              {st.label}
            </button>
          </li>
        ))}
      </ol>
      <h3 className="mt-7 text-[18px] font-bold">People</h3>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
        {PEOPLE.map((p) => {
          const ps = personStatus(p.id as Pid, s);
          return (
            <li key={p.id}>
              <button onClick={() => { onClose(); switchRole(p.role, p.to); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas">
                <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', STATE_DOT[ps.state])} />
                <span className="flex-1 text-[15px]"><b>{p.label}</b> · <span className="text-ink-2">{ps.text}</span></span>
                <ArrowRight size={15} className="text-ink-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </Drawer>
  );
}

export function ImpactBody({ k }: { k: string }) {
  const def = IMPACTS[k];
  if (!def) return null;
  const rows: [string, string[]][] = [['Records changed', def.records], ['People affected', def.users], ['Systems contacted', def.integrations.length ? def.integrations : ['—']], ['Notifications', [def.notifications]], ['Audit', [def.audit]], ['Dashboards', [def.analytics]]];
  return (
    <dl>
      {rows.map(([h, items]) => (
        <div key={h} className="grid grid-cols-[150px_1fr] gap-4 border-t border-line py-3">
          <dt className="text-[15px] font-semibold text-ink-3">{h}</dt>
          <dd className="space-y-1 text-[16px]">{items.map((x) => <div key={x}>{x}</div>)}</dd>
        </div>
      ))}
    </dl>
  );
}

function ImpactDrawer({ k, onClose }: { k: string | null; onClose: () => void }) {
  const s = useDemo();
  const [key, setKey] = useState<string | null>(k);
  useEffect(() => setKey(k), [k]);
  if (!k) return null;
  return (
    <Drawer open onClose={onClose} title="Full impact of this decision">
      {key && IMPACTS[key] && (
        <div>
          <div className="text-[22px] font-extrabold tracking-tight">{IMPACTS[key].headline}</div>
          <div className="mb-3 mt-1 text-[14px] text-ink-3">{key}</div>
          <ImpactBody k={key} />
          <p className="mt-2 text-[14px] text-ink-3">Integrations are simulated in this demo.</p>
          <div className="mt-5 border-t border-line pt-3"><div className="mb-2 text-[14px] font-semibold text-ink-3">Earlier changes</div>{s.audit.filter((a) => IMPACTS[a.action]).slice(0, 10).map((a) => <button key={a.id} onClick={() => setKey(a.action)} className={cx('mb-0.5 flex w-full justify-between rounded-lg px-3 py-2 text-left text-[15px] hover:bg-canvas', a.action === key && 'bg-canvas font-semibold')}><span>{IMPACTS[a.action].headline}</span><span className="text-[14px] text-ink-3">{a.at.slice(12)}</span></button>)}</div>
        </div>
      )}
    </Drawer>
  );
}

function AuditDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audit = useDemo((s) => s.audit);
  return (
    <Drawer open={open} onClose={onClose} title="Audit trail">
      <p className="mb-4 text-[15px] text-ink-3">Every action is recorded with who did it and when, and forwarded to the Bank’s security monitoring (simulated).</p>
      {audit.length === 0 && <div className="rounded-lg border border-dashed border-line p-6 text-center text-[15px] text-ink-3">No actions yet.</div>}
      <ol className="relative space-y-4 border-l border-line pl-5">
        {audit.map((a) => (
          <li key={a.id} className="relative text-[15px]">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
            <div className="flex justify-between gap-3"><b>{IMPACTS[a.action]?.headline ?? a.action}</b><span className="text-[14px] text-ink-3">{a.at.slice(12)}</span></div>
            <div className="text-ink-2">{a.detail}</div>
            <div className="mt-0.5 text-[14px] text-ink-3">{a.actor}, {a.actorRole}</div>
            {a.approvedBy && <div className="text-[14px] font-semibold text-ok">Approved: {a.approvedBy}</div>}
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

function Palette({ onClose, switchRole, openAudit }: { onClose: () => void; switchRole: Switch; openAudit: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const items = useMemo(() => [
    ...ROLE_ORDER.map((r) => ({ l: `View as ${PERSONAS[r].label}`, go: () => switchRole(r) })),
    { l: 'Training database', go: () => switchRole('hr', '/hr/training-db') }, { l: 'Training calendar', go: () => switchRole('hr', '/hr/calendar') },
    { l: 'Training bonds', go: () => switchRole('hr', '/hr/bonds') }, { l: 'Reports', go: () => nav('/reports') },
    { l: 'Requirements coverage', go: () => nav('/coverage') }, { l: 'People & organisation', go: () => nav('/people') }, { l: 'Connected Bank', go: () => nav('/connected') },
    { l: 'Audit trail', go: openAudit }, { l: 'Knowledge Corner', go: () => nav('/knowledge') }, { l: 'Physical Library', go: () => nav('/library') },
    { l: 'Team dashboard (supervisor)', go: () => switchRole('supervisor', '/supervisor/team') },
    { l: 'Executive dashboard', go: () => switchRole('management', '/executive') },
  ].filter((c) => c.l.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <div className="anim-fade fixed inset-0 z-[70] bg-ink/40 p-4 pt-[14vh]" onClick={onClose}>
      <div role="dialog" aria-label="Search" className="anim-slide mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-line px-4"><Search size={18} className="text-ink-3" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles, modules, trainings…" className="w-full py-4 text-[16px] outline-none" /></div>
        <ul className="max-h-96 overflow-y-auto p-2">{items.map((c) => <li key={c.l}><button onClick={() => { c.go(); onClose(); }} className="w-full rounded-lg px-3 py-2.5 text-left text-[16px] hover:bg-canvas">{c.l}</button></li>)}</ul>
      </div>
    </div>
  );
}
