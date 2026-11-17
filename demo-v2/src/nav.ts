/**
 * Work navigation (F5): one canonical name per page, each role's pages grouped in process order,
 * with a live status per item. Used by the side menu, breadcrumbs, the step bar and page headers.
 */
import type { Role } from './types';
import type { DemoState } from './store';

type S = DemoState;
export type ItemStatus = { text: string; tone: 'new' | 'waiting' | 'done' | 'idle' } | null;
export interface NavItem { label: string; to: string; fr: string; status?: (s: S) => ItemStatus }
export interface NavGroup { label: string; items: NavItem[] }

/** Canonical page names (workbook terms). Longest prefix wins. */
export const PAGE_NAME: [string, string][] = [
  ['/r/', 'Home'],
  ['/division', 'Training needs'],
  ['/request/new', 'Training Request'],
  ['/nominate', 'Nomination'],
  ['/hr/requests/', 'Training Request Review'],
  ['/hr/requests', 'Training Request Received'],
  ['/hr/nomination-request', 'Training Nomination Request Setup'],
  ['/hr/nomination-status', 'Training Nomination Status'],
  ['/hr/schedule', 'Training Scheduling'],
  ['/hr/approvals', 'Approvals'],
  ['/hr/attendance', 'Attendance'],
  ['/hr/planned', 'Planned Training'],
  ['/hr/bonds', 'Training Bond Database'],
  ['/hr/training-db', 'Training Database'],
  ['/hr/calendar', 'Training Calendar'],
  ['/hr/courses', 'Course Enrolments'],
  ['/hr/setup', 'Setup Options'],
  ['/finance', 'Budget Approval'],
  ['/trainer', 'Trainer Sessions'],
  ['/employee/record', 'My Learning Record'],
  ['/employee/feedback', 'Training Feedback'],
  ['/employee/certificates', 'Certificates'],
  ['/employee', 'My Learning'],
  ['/supervisor/team', 'Team Dashboard'],
  ['/supervisor', 'Withdrawal Requests'],
  ['/executive', 'Executive Insight'],
  ['/learning/course', 'e-Learning Course'],
  ['/assessment/review', 'Post-training Assessment Review'],
  ['/assessment/results', 'Assessment Results'],
  ['/assessment', 'Assessments & exams'],
  ['/assessment/aml', 'AML Assessment (standalone)'],
  ['/competency', 'Competency Profile'],
  ['/journey', 'Learning Journey'],
  ['/tna', 'Training Needs Assessment'],
  ['/knowledge', 'Knowledge Corner'],
  ['/library', 'Physical Library'],
  ['/learning', 'Learning'],
  ['/people', 'People & Organisation'],
  ['/reports', 'Reports'],
  ['/overview', 'Home'],
  ['/workflow', 'Workflows'],
  ['/platform', 'Platform'],
  ['/connected', 'Connected Bank'],
  ['/coverage', 'Requirements Coverage'],
  ['/admin/integrations', 'Integrations'],
  ['/admin/audit', 'Audit Trail'],
  ['/admin/security', 'Users, Roles & Security'],
  ['/mobile', 'Mobile Preview'],
];
export const pageName = (path: string) => [...PAGE_NAME].sort((a, b) => b[0].length - a[0].length).find(([k]) => path.startsWith(k))?.[1] ?? '';

const st = (text: string, tone: NonNullable<ItemStatus>['tone']): ItemStatus => ({ text, tone });

export const WORK_NAV: Record<Role, NavGroup[]> = {
  hr: [
    { label: 'Work queue', items: [
      { label: 'Training requests', to: '/hr/requests', fr: 'FR 65–66', status: (s) => (s.requestSubmitted && !s.reviewed ? st('1 new', 'new') : s.reviewed ? st('Done', 'done') : null) },
      { label: 'Nomination request', to: '/hr/nomination-request', fr: 'FR 67–87', status: (s) => (s.nominationRequested ? st('Sent', 'done') : s.reviewed ? st('To do', 'new') : null) },
      { label: 'Nomination status', to: '/hr/nomination-status', fr: 'FR 89–91', status: (s) => (s.finalized ? st('Finalised', 'done') : s.nominationSubmitted ? st('To review', 'new') : s.nominationRequested ? st('Open', 'waiting') : null) },
      { label: 'Approvals', to: '/hr/approvals', fr: 'FR 6, 19, 119, 172', status: (s) => { const n = [s.withdrawal.status === 'proposed', s.materialLinkRequested && !s.materialLinked, s.recordRequest === 'pending', ...Object.values(s.otherWithdrawals).map((w) => w.status === 'proposed')].filter(Boolean).length; return n ? st(`${n} waiting`, 'new') : null; } },
    ] },
    { label: 'Training operations', items: [
      { label: 'Scheduling', to: '/hr/schedule', fr: 'FR 92–131', status: (s) => (s.invitesSent ? st('Invited', 'done') : s.scheduled ? st('Send invitations', 'new') : s.finalized ? st('To do', 'new') : null) },
      { label: 'Planned training', to: '/hr/planned', fr: 'FR 132–136', status: (s) => (s.completed ? st('Closed', 'done') : s.feedbackSubmitted ? st('Close', 'new') : null) },
      { label: 'Attendance', to: '/hr/attendance', fr: 'FR 137–143', status: (s) => (s.attendanceSubmitted ? st('Submitted', 'done') : s.invitesSent ? st('Open', 'waiting') : null) },
      { label: 'Training bonds', to: '/hr/bonds', fr: 'FR 144–167' },
      { label: 'Training database', to: '/hr/training-db', fr: 'FR 169–174' },
    ] },
    { label: 'Setup and reporting', items: [
      { label: 'Setup masters', to: '/hr/setup', fr: 'FR 22–48' },
      { label: 'e-Learning courses', to: '/learning/hub?tab=manage', fr: 'FR 190–200' },
      { label: 'Reports', to: '/reports', fr: 'FR 175–185' },
      { label: 'Feedback setup', to: '/hr/setup?tab=feedback', fr: 'FR 45–46, 122–125' },
      { label: 'Feedback & sentiment', to: '/feedback?tab=analytics', fr: 'FR 225–226' },
      { label: 'Training calendar', to: '/hr/calendar', fr: 'FR 43–44, 182' },
    ] },
    { label: 'System', items: [
      { label: 'Integrations', to: '/admin/integrations', fr: 'FR 244' },
      { label: 'Audit', to: '/admin/maker-checker', fr: 'FR 21' },
      { label: 'Security', to: '/admin/roles', fr: 'FR 21' },
    ] },
  ],
  division_head: [
    { label: 'My division', items: [
      { label: 'Training needs', to: '/division', fr: 'FR 15, 186–188' },
      { label: 'Training Request', to: '/request/new', fr: 'FR 14, 49–64', status: (s) => (s.requestSubmitted ? st('Submitted', 'done') : st('To do', 'new')) },
      { label: 'Nomination', to: '/nominate', fr: 'FR 88', status: (s) => (s.nominationSubmitted ? st('Submitted', 'done') : s.nominationRequested ? st('Due 14 Nov', 'new') : st('Not open', 'idle')) },
    ] },
    { label: 'My team', items: [
      { label: 'Team Dashboard', to: '/supervisor/team', fr: 'FR 11–12 (FR 13 inherits)' },
      { label: 'Reports', to: '/reports', fr: 'FR 12' },
    ] },
  ],
  finance: [
    { label: 'Approvals (proposed workflow)', items: [
      { label: 'Budget Approval', to: '/finance', fr: 'Proposed · FR 135', status: (s) => (s.budgetApproved ? st('Approved', 'done') : s.scheduled && !s.budgetReturned ? st('1 waiting', 'new') : s.budgetReturned ? st('Returned', 'waiting') : null) },
      { label: 'Reports', to: '/reports', fr: 'FR 142' },
    ] },
  ],
  trainer: [
    { label: 'My work', items: [
      { label: 'My calendar', to: '/trainer?s=calendar', fr: 'FR 18' },
      { label: 'My sessions', to: '/trainer', fr: 'FR 16–19', status: (s) => (s.invitesSent && s.trainerResponse === 'pending' ? st('Respond', 'new') : s.trainerResponse === 'accepted' ? st('Confirmed', 'done') : null) },
    ] },
    { label: 'Trainer operations', items: [
      { label: 'Course management', to: '/learning/hub?tab=manage', fr: 'FR 190–200' },
      { label: 'Course setup', to: '/trainer/course-setup', fr: 'FR 19, 190–198, 210', status: (s) => (s.courseSetup ? st('Ready', 'done') : s.trainerResponse === 'accepted' ? st('To do', 'new') : null) },
      { label: 'Materials', to: '/trainer?s=materials', fr: 'FR 19', status: (s) => (s.materialLinked ? st('Linked', 'done') : s.materialLinkRequested ? st('With HR', 'waiting') : s.materialUploaded ? st('Request link', 'new') : null) },
      { label: 'Assessments', to: '/assessment', fr: 'FR 210–213, 247' },
      { label: 'Post-training review', to: '/assessment/review', fr: 'FR 210–217', status: (s) => (s.pta.released ? st('Released', 'done') : s.attendanceSubmitted ? st('To review', 'new') : st('After training', 'idle')) },
    ] },
  ],
  employee: [
    { label: 'My work', items: [
      { label: 'My calendar', to: '/employee?s=calendar', fr: 'FR 2' },
    ] },
    { label: 'My learning', items: [
      { label: 'Learning hub', to: '/learning/hub', fr: 'FR 190–205' },
      { label: 'Courses', to: '/learning/training', fr: 'FR 190–198' },
      { label: 'Training', to: '/employee', fr: 'FR 1–3, 119' },
      { label: 'Assessments', to: '/assessment', fr: 'FR 210–220' },
      { label: 'Feedback', to: '/feedback', fr: 'FR 4, 221–226' },
      { label: 'Certificates', to: '/employee/certificates', fr: 'FR 198' },
    ] },
    { label: 'My development', items: [
      { label: 'Training record', to: '/employee/record', fr: 'FR 5–6' },
      { label: 'Competencies', to: '/competency', fr: 'FR 241–242' },
      { label: 'Learning journey', to: '/journey', fr: 'FR 243' },
      { label: 'Development requests', to: '/employee?s=development', fr: 'FR 188' },
    ] },
  ],
  supervisor: [
    { label: 'My team', items: [
      { label: 'Team Dashboard', to: '/supervisor/team', fr: 'FR 11–12, 206' },
      { label: 'Withdrawal Requests', to: '/supervisor', fr: 'FR 9–10, 119', status: (s) => { const n = (s.withdrawal.status === 'requested' ? 1 : 0) + Object.values(s.otherWithdrawals).filter((w) => w.status === 'requested').length; return n ? st(`${n} waiting`, 'new') : null; } },
      { label: 'Reports', to: '/reports', fr: 'FR 12' },
    ] },
  ],
  admin: [
    { label: 'Administration', items: [
      { label: 'Roles & permissions', to: '/admin/roles', fr: 'FR 21' },
      { label: 'Users & accounts', to: '/admin/users', fr: 'FR 21, 200' },
      { label: 'Maker-checker & audit log', to: '/admin/maker-checker', fr: 'FR 248–249 · proposed', status: (s) => { const n = s.admin.mc.filter((m) => m.status === 'Pending').length; return n ? st(`${n} pending`, 'new') : null; } },
      { label: 'Integrations & SSO / SIEM', to: '/admin/integrations', fr: 'FR 244' },
      { label: 'System settings', to: '/admin/settings', fr: 'FR 248–249 · proposed' },
    ] },
    { label: 'Platform setup', items: [
      { label: 'Global master setup', to: '/hr/setup', fr: 'FR 22–48' },
      { label: 'Training Database', to: '/hr/training-db', fr: 'FR 169, 173' },
      { label: 'Reports', to: '/reports', fr: 'FR 175–185' },
    ] },
  ],
  management: [
    { label: 'Insight (proposed role)', items: [
      { label: 'Executive Insight', to: '/executive', fr: 'FR 168, 208' },
      { label: 'Reports', to: '/reports', fr: 'FR 175–185' },
      { label: 'People & Organisation', to: '/people', fr: 'FR 11, 15' },
    ] },
  ],
};

/** Pages each role may open without switching (its own pages + inherited, FR 8, 13, 16). */
export const ENTITLED: Record<Role, string[]> = {
  employee: ['/employee', '/feedback', '/learning', '/assessment', '/journey', '/knowledge', '/library', '/competency', '/mobile'],
  supervisor: ['/supervisor', '/employee', '/learning', '/journey', '/reports'],
  division_head: ['/division', '/request', '/nominate', '/supervisor/team', '/reports', '/employee', '/learning', '/journey', '/tna'],
  trainer: ['/trainer', '/feedback', '/competency', '/assessment', '/employee', '/learning', '/knowledge'],
  hr: ['/hr/', '/feedback', '/reports', '/tna', '/assessment/results', '/learning', '/competency', '/people', '/admin/integrations', '/admin/maker-checker', '/admin/roles', '/admin/audit', '/admin/security'],
  finance: ['/finance', '/reports'],
  admin: ['/admin', '/hr/training-db', '/hr/attendance', '/coverage', '/hr/setup', '/learning', '/reports'],
  management: ['/executive', '/reports', '/people', '/competency'],
};

export function navGroupOf(role: Role, path: string): { group: NavGroup; item: NavItem } | null {
  const groups = WORK_NAV[role];
  // 1 · exact page, 2 · a page below an item, 3 · a section link (/page?s=...) on its page
  for (const g of groups) { const item = g.items.find((i) => i.to === path); if (item) return { group: g, item }; }
  for (const g of groups) {
    const item = [...g.items].filter((i) => !i.to.includes('?')).sort((a, b) => b.to.length - a.to.length).find((i) => path.startsWith(i.to + '/') || (i.to.length > 3 && path.startsWith(i.to)));
    if (item) return { group: g, item };
  }
  for (const g of groups) { const item = g.items.find((i) => i.to.split('?')[0] === path); if (item) return { group: g, item }; }
  return null;
}
