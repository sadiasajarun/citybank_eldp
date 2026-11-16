import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { roster, useDemo } from '../store';
import { activeStage, pidRole, ROLE_LABEL, STAGES_LC, stagePeople, TOUR, tourIndex } from '../lifecycle';
import { INTEGRATIONS, TRAINING } from '../data';
import { MODULES, type ModuleKey } from '../coverage';
import type { DemoState as S } from '../store';
import type { Role } from '../types';
import { Badge, Btn, cx, Drawer } from '../components/ui';
import { PageHead } from '../components/Templates';
import { FrRef, SourceTag } from '../components/Source';

/* =================== WORKFLOW EXPLORER =================== */
const LANES: { key: string; label: string; role: Role }[] = [
  { key: 'dh', label: 'Division Head / LC', role: 'division_head' },
  { key: 'hr', label: 'HR / L&D', role: 'hr' },
  { key: 'sys', label: 'System checks', role: 'hr' },
  { key: 'fin', label: 'Finance', role: 'finance' },
  { key: 'tr', label: 'Trainer', role: 'trainer' },
  { key: 'emp', label: 'Employee', role: 'employee' },
  { key: 'sup', label: 'Supervisor', role: 'supervisor' },
  { key: 'eldp', label: 'ELDP record', role: 'hr' },
];
const TT = TRAINING.trainingId;
interface WNode { lane: string; label: string; done: (s: S) => boolean; to: string; role?: Role; desc: string; emp?: string }
const WNODES: WNode[] = [
  { lane: 'dh', label: 'Submit Request', done: (s) => s.requestSubmitted, to: '/request/new', desc: 'Program, Trainer and Participants tabs; request ID fixed on save. FR 14, 49–64.' },
  { lane: 'hr', label: 'Review Request', done: (s) => s.reviewed, to: '/hr/requests/TR-2026-00418', desc: 'Training Request Received window: Schedule Training or Forward. FR 65–66.' },
  { lane: 'hr', label: 'Nomination Request', done: (s) => s.nominationRequested, to: '/hr/nomination-request', desc: 'Divisions, deadline and email with nomination link. FR 67–87.' },
  { lane: 'dh', label: 'Nominate', done: (s) => s.nominationSubmitted, to: '/nominate', desc: 'Learning Champion nominates on own dashboard. FR 88.' },
  { lane: 'sys', label: 'HRIS · Leave · Calendar', done: (s) => s.nominationSubmitted, to: '/hr/nomination-status', desc: 'Calendar conflict, leave, resignation and retirement flags. FR 10, 114.' },
  { lane: 'hr', label: 'Nomination Status', done: (s) => s.finalized, to: '/hr/nomination-status', desc: 'Review 35, resolve 4, finalise 32. FR 89–91.' },
  { lane: 'hr', label: 'Schedule', done: (s) => s.scheduled, to: '/hr/schedule', desc: 'Load Training Profile = Yes; venue-and-date clash check. FR 92–115.' },
  { lane: 'fin', label: 'Approve Budget', done: (s) => s.budgetApproved, to: '/finance', role: 'finance', desc: 'Maker-checker: HR prepares, Finance approves. FR 135.' },
  { lane: 'hr', label: 'Send Invitations', done: (s) => s.invitesSent, to: '/hr/schedule?tab=Notifications', desc: 'Organizer, trainer and participant communication; supervisors CC. FR 116–120.' },
  { lane: 'tr', label: 'Accept to Facilitate', done: (s) => s.trainerResponse !== 'pending', to: '/trainer', role: 'trainer', desc: 'Accept or reject with reason; upload material. FR 17–19.' },
  { lane: 'emp', label: 'Accept / Withdraw', done: (s) => s.withdrawal.status !== 'none', to: '/employee', emp: 'e2', desc: 'Accept, or request withdrawal with a mandatory reason. FR 1, 119.' },
  { lane: 'sup', label: 'Approve + Replace', done: (s) => ['proposed', 'approved'].includes(s.withdrawal.status), to: '/supervisor', desc: 'Approve, approve with replacement, or reject. FR 9–10, 119.' },
  { lane: 'hr', label: 'Approve Replacement', done: (s) => s.withdrawal.status === 'approved', to: '/hr/approvals', desc: 'Inclusion / exclusion emails, supervisors CC. FR 119.' },
  { lane: 'emp', label: 'Self-mark Attendance', done: (s) => Boolean(s.selfMarked.e1) || s.attendanceSubmitted, to: '/employee', emp: 'e1', desc: 'Employee marks own attendance. FR 3, 138.' },
  { lane: 'hr', label: 'Attendance', done: (s) => s.attendanceSubmitted, to: '/hr/attendance', desc: 'Teams sync, Mark All, Submit & Update Training Database. FR 137–143.' },
  { lane: 'emp', label: 'Feedback', done: (s) => s.feedbackSubmitted, to: '/employee/feedback', emp: 'e1', desc: 'Post-training feedback. FR 4, 222.' },
  { lane: 'hr', label: 'Close & Expense', done: (s) => s.completed, to: '/hr/planned', desc: 'Actual expense, payment no.; investment and cost per employee. FR 132–142.' },
  { lane: 'eldp', label: 'Learning Record', done: (s) => s.completed, to: '/employee/record', role: 'employee', emp: 'e1', desc: 'One continuous learning record per employee.' },
  { lane: 'eldp', label: 'Dashboards', done: (s) => s.completed, to: '/executive', role: 'management', desc: 'Executive dashboard and Power BI read the same data. FR 168, 208.' },
];

export function WorkflowView() {
  const s = useDemo();
  const nav = useNavigate();
  const [open, setOpen] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  const COL = 86, ROW = 74, LX = 170, TOP = 46;
  const activeIdx = WNODES.findIndex((n) => !n.done(s));
  const pos = WNODES.map((n, i) => ({ x: LX + 40 + i * COL, y: TOP + LANES.findIndex((l) => l.key === n.lane) * ROW + ROW / 2 }));
  const W = LX + 80 + WNODES.length * COL, H = TOP + LANES.length * ROW + 10;
  const elbow = (a: { x: number; y: number }, b: { x: number; y: number }) => { const m = (a.x + b.x) / 2; if (a.y === b.y) return `M${a.x},${a.y} H${b.x}`; const r = 8, dy = b.y > a.y ? r : -r; return `M${a.x},${a.y} H${m - r} Q${m},${a.y} ${m},${a.y + dy} V${b.y - dy} Q${m},${b.y} ${m + r},${b.y} H${b.x}`; };
  const seg = (i: number) => elbow(pos[i], pos[i + 1]);
  const doneCount = activeIdx === -1 ? pos.length - 1 : Math.max(1, activeIdx);
  const donePath = Array.from({ length: doneCount }, (_, i) => seg(i)).join(' ');
  const node = open !== null ? WNODES[open] : null;
  const lane = node ? LANES.find((l) => l.key === node.lane)! : null;
  const a = activeStage(s);
  const cur = STAGES_LC[Math.min(a, STAGES_LC.length - 1)];
  const finished = a >= STAGES_LC.length;
  const people = stagePeople(cur, s, Math.min(a, STAGES_LC.length - 1), a).filter((x) => x.state !== 'idle');
  const ti = tourIndex(s);
  const step = ti < TOUR.length ? TOUR[ti] : null;
  const groups: [string, string[], string][] = [
    ['Completed', STAGES_LC.slice(0, Math.min(a, STAGES_LC.length)).map((x) => x.label), 'text-ink'],
    ['Current', finished ? [] : [cur.label], 'text-brand'],
    ['Next', STAGES_LC.slice(a + 1, a + 3).map((x) => x.label), 'text-ink-2'],
    ['Later', STAGES_LC.slice(a + 3).map((x) => x.label), 'text-ink-3'],
  ];
  return (
    <div className="px-6 py-10 lg:px-14">
      <div className="mx-auto max-w-[1760px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[14px] font-medium text-ink-3">Workflows · {TRAINING.requestId}</div>
            <h1 className="mt-1.5 text-[36px] font-extrabold tracking-tight">One record, travelling across City Bank</h1>
            <p className="mt-1.5 text-[17px] text-ink-2">{TRAINING.title} · Corporate Banking · {s.finalized ? roster(s).length : 32} participants</p>
          </div>
          <Btn v="secondary" onClick={() => nav('/platform')}>View platform ecosystem</Btn>
        </div>

        {/* where the record is: completed / current / next / later */}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {groups.map(([h, items, c]) => (
            <div key={h} className="bg-white p-5">
              <div className="text-[14px] font-semibold text-ink-3">{h}</div>
              <div className={cx('mt-2 text-[16px] font-semibold leading-relaxed', c)}>{items.length ? items.join(' → ') : '—'}</div>
            </div>
          ))}
        </div>

        {/* current stage, large, with people and integrations */}
        <div className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-brand/20 bg-[#fdf6f4] p-8">
            <div className="text-[15px] font-semibold text-brand">{finished ? 'Story complete' : `Current stage · ${a + 1} of ${STAGES_LC.length}`}</div>
            <div className="mt-2 text-[40px] font-extrabold leading-tight tracking-tight">{finished ? 'Insight delivered' : cur.label}</div>
            <div className="text-[16px] text-ink-2">{cur.module}</div>
            {!finished && (
              <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
                <div><dt className="text-[14px] font-semibold text-ink-3">Owner</dt><dd className="mt-1 text-[17px] font-semibold">{pidRole(cur.owner(s)).label}</dd></div>
                <div><dt className="text-[14px] font-semibold text-ink-3">Waiting on</dt><dd className="mt-1 text-[17px] font-semibold">{cur.detail(s).pending}</dd></div>
                <div><dt className="text-[14px] font-semibold text-ink-3">Next</dt><dd className="mt-1 text-[17px] font-semibold">{cur.next}</dd></div>
              </dl>
            )}
            {step && <button onClick={() => { const st = TOUR[ti]; s.setRole(st.role); if (st.emp) s.setEmployee(st.emp); nav(st.to); }} className="mt-7 flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-[15px] font-bold text-white hover:bg-brand-dark">{step.cta} <ArrowRight size={16} /></button>}
          </div>
          <div className="rounded-2xl border border-line bg-white p-7">
            <div className="text-[15px] font-bold">People affected</div>
            <ul className="mt-3 divide-y divide-line">
              {(finished ? [] : people).map(({ p, state }) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-[15px]"><span className="font-semibold">{p.label}</span><span className={cx('text-[14px] font-semibold', state === 'active' ? 'text-brand' : state === 'complete' ? 'text-ok' : 'text-ink-3')}>{state === 'active' ? 'Acting now' : state === 'affected' ? 'Affected' : state === 'complete' ? 'Done' : 'Waiting'}</span></li>
              ))}
              {finished && <li className="py-2.5 text-[15px] text-ink-3">Everyone has finished their part.</li>}
            </ul>
            <div className="mt-6 text-[15px] font-bold">Integrations involved <span className="font-normal text-ink-3">· simulated</span></div>
            <div className="mt-3 flex flex-wrap gap-2">{cur.systems.map((x) => <span key={x} className="rounded-lg border border-line px-3 py-1.5 text-[14px] font-semibold"><span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-ok" />{x}</span>)}</div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight">Full swimlane view</h2>
            <p className="text-[15px] text-ink-3">Every hand-off between people and systems. Circles are people; squares are automatic system checks.</p>
          </div>
          <Btn v="secondary" onClick={() => setFull(!full)}>{full ? 'Hide swimlanes' : 'Show full swimlanes'}</Btn>
        </div>
        {full && (
        <div className="anim-fade mt-5 overflow-x-auto rounded-2xl border border-line bg-white scroll-thin">
          <div className="relative" style={{ width: W, height: H }}>
            {LANES.map((l, i) => (
              <div key={l.key} className={cx('absolute left-0 right-0 flex items-center border-b border-line', i % 2 === 1 && 'bg-canvas/60')} style={{ top: TOP + i * ROW, height: ROW }}>
                <div className="sticky left-0 z-10 flex h-full w-[170px] items-center border-r border-line bg-white px-5"><span className={cx('text-[14px] font-bold', l.key === 'sys' || l.key === 'eldp' ? 'text-brand' : 'text-ink-2')}>{l.label}</span></div>
              </div>
            ))}
            <div className="absolute left-[170px] right-0 top-0 flex h-[46px] items-center border-b border-line px-5 text-[14px] font-semibold text-ink-3">Request → Nominate → Validate → Schedule → Budget → Invite → Respond → Replace → Attend → Feedback → Close → Record</div>
            <svg width={W} height={H} className="pointer-events-none absolute inset-0">
              {pos.slice(0, -1).map((_, i) => <path key={i} d={seg(i)} fill="none" stroke={i < activeIdx || activeIdx === -1 ? '#16181d' : '#d4d7dd'} strokeWidth={i < activeIdx || activeIdx === -1 ? 2 : 1.5} strokeDasharray={i < activeIdx || activeIdx === -1 ? '' : '4 5'} />)}
              <circle r="5" fill="#d71920"><animateMotion dur="4s" repeatCount="indefinite" path={donePath} /></circle>
            </svg>
            {WNODES.map((n, i) => {
              const done = n.done(s) && i !== activeIdx;
              const act = i === activeIdx;
              return (
                <button key={i} onClick={() => setOpen(i)} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos[i].x, top: pos[i].y }}>
                  <span className={cx('mx-auto block h-[18px] w-[18px] border-2 transition-transform', n.lane === 'sys' ? 'rounded-[4px]' : 'rounded-full', act ? 'anim-pulse border-brand bg-brand' : done ? 'border-ink bg-ink' : 'border-ink-3/60 bg-white', 'group-hover:ring-4 group-hover:ring-brand/15')} />
                  <span className={cx('absolute left-1/2 top-[22px] w-[80px] -translate-x-1/2 text-center text-[14px] font-bold leading-tight', act ? 'text-brand' : done ? 'text-ink' : 'text-ink-3')}>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        )}
        {full && <p className="mt-3 text-[14px] text-ink-3">The red marker shows where the record currently is. System lanes are automatic checks against HRIS, Leave Management and Outlook (simulated integrations).</p>}
      </div>
      <Drawer open={!!node} onClose={() => setOpen(null)} title={node ? node.label : ''}>
        {node && lane && (
          <div>
            <div className="th">{lane.label}</div>
            <div className="mt-2"><Badge t={node.done(s) && open !== activeIdx ? 'ok' : open === activeIdx ? 'brand' : 'neutral'}>{node.done(s) && open !== activeIdx ? 'Complete' : open === activeIdx ? 'Current step' : 'Upcoming'}</Badge></div>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{node.desc}</p>
            <div className="mt-5 rounded-xl bg-canvas p-4 text-[14px]"><div className="th mb-1">Record</div>TR-2026-00418 · {TT} · Advanced Credit Risk Management</div>
            <Btn className="mt-5 w-full" onClick={() => { const r = node.role ?? lane.role; s.setRole(r); if (node.emp) s.setEmployee(node.emp); nav(node.to); }}>Open this screen as {ROLE_LABEL[node.role ?? lane.role]} <ArrowRight size={14} /></Btn>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* =================== PLATFORM MAP (five modules, O3) =================== */
interface Mod { name: string; to: string; role: Role; desc: string; fr: string; emp?: string }
const m = (name: string, to: string, role: Role, fr: string, desc: string, emp?: string): Mod => ({ name, to, role, fr, desc, emp });
const MODULE_SCREENS: Record<ModuleKey, Mod[]> = {
  TMS: [
    m('Training Request', '/request/new', 'division_head', 'FR 49–64', 'Program, Trainer and Nominations tabs; request ID fixed on save.'),
    m('Request Received', '/hr/requests', 'hr', 'FR 65–66', 'HR reviews requests: Schedule Training or Forward.'),
    m('Nomination', '/hr/nomination-request', 'hr', 'FR 67–91', 'Nomination request setup, the Learning Champion board and nomination status with conflict checks.'),
    m('Training Scheduling', '/hr/schedule', 'hr', 'FR 92–131', 'Load Training Profile Yes / No; trainers, participants, notifications, feedback and bond.'),
    m('Planned Training', '/hr/planned', 'hr', 'FR 132–136', 'Training details, budget fields, reschedule, postpone or delete.'),
    m('Attendance', '/hr/attendance', 'hr', 'FR 137–143', 'Day registers, Mark All, Teams sync; Submit & Update Training Database.'),
    m('Training Bonds', '/hr/bonds', 'hr', 'FR 144–167', 'New Training Bond setup, Legal-page print, remaining liability.'),
    m('Training Database', '/hr/training-db', 'hr', 'FR 169–174', 'One record per employee, including migrated and external records.'),
    m('Training Calendar', '/hr/calendar', 'hr', 'FR 43–44, 182', 'Every programme with its status and attendance.'),
    m('Setup Options', '/hr/setup', 'hr', 'FR 22–48', 'Competencies, labels, categories, medium, mode, titles, venues, trainers and vendors.'),
  ],
  LMS: [
    m('e-Learning Courses', '/learning/course', 'employee', 'FR 190–198', 'Sequential modules, protected video, checkpoint and certificate.', 'e1'),
    m('Course Enrolments', '/hr/courses', 'hr', 'FR 200–201', 'Enrolments, overdue learners and reminders.'),
    m('Certificates', '/employee/certificates', 'employee', 'FR 198', 'QR-verified certificates.', 'e1'),
    m('Exams', '/assessment', 'employee', 'FR 210–212', 'Standalone exam with integrity review.', 'e1'),
    m('Assessment Review', '/assessment/review', 'trainer', 'FR 213–214', 'Integrity, score and release for the post-training assessment.'),
    m('Assessment Results', '/assessment/results', 'hr', 'FR 214, 217', 'Results per participant, linked to the training.'),
    m('Feedback', '/employee/feedback', 'employee', 'FR 221–225', 'Feedback attached to a training, course or exam.', 'e1'),
    m('Knowledge Corner', '/knowledge', 'employee', 'FR 227–229', 'Protected, searchable resources.', 'e1'),
    m('Physical Library', '/library', 'employee', 'FR 230–240', 'Book search, availability and requests.', 'e1'),
  ],
  'L&D management': [
    m('Divisional Requirement', '/division', 'division_head', 'FR 186, 15', 'Officers below target feed the training request.'),
    m('Training Needs Assessment', '/tna', 'hr', 'FR 187–189', 'Programme TNA and individual development plans.'),
    m('Competencies', '/competency', 'hr', 'FR 241–242', 'Framework, levels and the priority gap.'),
    m('Learning Journeys', '/journey', 'employee', 'FR 243', 'Training and course milestones by competency level.', 'e1'),
  ],
  'Enterprise workflow': [
    m('Approvals', '/hr/approvals', 'hr', 'FR 1, 6, 9–10, 19, 119', 'Withdrawals, replacements, material links and record requests.'),
    m('Team Dashboard', '/supervisor/team', 'supervisor', 'FR 11–12, 206', 'Who completed, who failed, who still needs training.'),
    m('Reports', '/reports', 'hr', 'FR 175–184', 'The named reports with filters, CSV and print.'),
    m('Integrations', '/admin/integrations', 'admin', 'FR 244', 'HRIS, IAM, Leave, Teams, Zoom, Outlook, SMS, WhatsApp, Power BI, SIEM (simulated).'),
    m('Roles & Security', '/admin/security', 'admin', 'FR 21, 249', 'Role profiles, maker-checker and access.'),
    m('Audit Trail', '/admin/audit', 'admin', 'FR 248–249', 'Every action with who, when and what changed.'),
    m('Mobile', '/mobile', 'employee', 'FR 246', 'Mobile preview.', 'e1'),
  ],
  'AI-assisted': [
    m('Training suggestions', '/reports?type=ai', 'hr', 'FR 185', 'Suggestions from skill gaps, role and mandatory courses.'),
    m('Compliance risk', '/executive', 'management', 'FR 209', 'Who may miss mandatory deadlines (concept).'),
    m('Marking support', '/assessment/review', 'trainer', 'FR 213', 'AI-suggested score; the trainer accepts or adjusts.'),
    m('Feedback themes', '/hr/planned', 'hr', 'FR 226', 'Themes from feedback, reviewed by L&D.'),
    m('Learning assistant', '/learning/course', 'employee', 'FR 245', 'Questions about course content (preview).', 'e1'),
  ],
};

export function PlatformMap() {
  const s = useDemo();
  const nav = useNavigate();
  const [sel, setSel] = useState<{ g: string; m: Mod } | null>(null);
  const total = Object.values(MODULE_SCREENS).reduce((n, x) => n + x.length, 0);
  const open = (x: Mod) => { s.setRole(x.role); if (x.emp) s.setEmployee(x.emp); nav(x.to); };
  const stats: [string, string][] = [[String(total), 'screens'], [String(MODULES.length), 'modules'], [String(INTEGRATIONS.length), 'integrations']];
  return (
    <div className="mx-auto max-w-[1480px] px-6 py-8 lg:px-10">
      <PageHead title="Platform" meta="Five modules, one governed learning record. Select any screen for a short preview and a link."
        sub="The guided journey (Advanced Credit Risk Management) is one example business flow; every module also works on its own (FR 247)."
        fr="FR 1–250" actions={<div className="flex gap-8 text-right">{stats.map(([n, l]) => <div key={l}><div className="num text-[36px] leading-none">{n}</div><div className="mt-1 text-[14px] text-ink-3">{l}</div></div>)}</div>} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((mod) => (
          <section key={mod.key} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-[22px] font-bold tracking-tight">{mod.name}</h2>
            <div className="mt-1"><FrRef>{mod.frs}</FrRef></div>
            <p className="mt-2 text-[15px] text-ink-2">{mod.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MODULE_SCREENS[mod.key].map((x) => (
                <button key={x.name} onClick={() => setSel({ g: mod.name, m: x })} className="rounded-lg border border-line bg-white px-3.5 py-2 text-[15px] font-semibold text-ink-2 transition-colors hover:border-ink/40 hover:text-ink">{x.name}</button>
              ))}
            </div>
          </section>
        ))}
        <section className="rounded-2xl border-2 border-dashed border-ink/20 bg-[#faf8f5] p-5">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-[22px] font-bold tracking-tight">Unified Learning Record</h2><SourceTag kind="architecture" /></div>
          <p className="mt-2 text-[15px] text-ink-2">One record per employee: classroom, e-learning, exams, bonds and migrated history. Every module writes to it; every dashboard and report reads from it.</p>
          <Btn className="mt-4" v="secondary" onClick={() => { s.setRole('hr'); nav('/hr/training-db'); }}>Open Training Database <ArrowRight size={16} /></Btn>
        </section>
      </div>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.m.name ?? ''}>
        {sel && (
          <div>
            <div className="text-[15px] font-semibold text-ink-3">{sel.g}</div>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{sel.m.desc}</p>
            <dl className="mt-5 divide-y divide-line border-y border-line text-[15px]">
              <div className="grid grid-cols-[140px_1fr] py-3"><dt className="text-ink-3">Requirements</dt><dd className="font-semibold">{sel.m.fr}</dd></div>
              <div className="grid grid-cols-[140px_1fr] py-3"><dt className="text-ink-3">Primary user</dt><dd className="font-semibold">{ROLE_LABEL[sel.m.role]}</dd></div>
              <div className="grid grid-cols-[140px_1fr] py-3"><dt className="text-ink-3">Writes to</dt><dd className="font-semibold">Unified learning record · audit trail</dd></div>
            </dl>
            <Btn className="mt-5 w-full" onClick={() => open(sel.m)}>Open {sel.m.name} <ArrowRight size={15} /></Btn>
          </div>
        )}
      </Drawer>
    </div>
  );
}
