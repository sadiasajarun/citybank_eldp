import type { Employee, Role } from './types';

export const TRAINING = {
  requestId: 'TR-2026-00418',
  nominationId: 'NR-2026-00057',
  trainingId: '20260182',
  title: 'Advanced Credit Risk Management',
  division: 'Corporate Banking Division',
  audience: 'Relationship Managers and Credit Analysts',
  mode: 'In-house + External-local',
  medium: 'Classroom + Webinar',
  proposed: 32,
  venue: 'City Bank Learning Center — Hall A',
  trainer: 'Nafis Ahmed (Internal) + Dr. Farhan Chowdhury (External, BIBM)',
  duration: '2 days · 16 man-hours per participant',
  category: 'Functional',
  competency: 'Functional · Credit Analysis',
  tags: ['Credit', 'Risk', 'City Future Fit'],
  pdus: '16',
  organizedBy: 'City Bank L&D with BIBM',
  dates: '18–19 November 2026',
  time: '09:30 – 17:30',
  deadline: '14 Nov 2026, 17:00',
  budget: 'BDT 14,40,000',
  approvalNo: 'FIN-APP-2026-0771',
  organizer: 'Nusrat Jahan, HR Admin',
};

/** Master data exactly as listed in Annexure-II FR 22–27. */
export const MASTERS = {
  competencies: ['Functional', 'Innovation', 'Collaboration', 'Customer Experience', 'Leadership', 'Execution Excellence'],
  tags: ['City Foundation', 'Banking Foundation', 'AML', 'ICT', 'CRM', 'Risk', 'Islamic Banking', 'ISS', 'IGN', 'FRA', 'City Future Fit', 'MT Development', 'Credit', 'GB', 'POSH', 'Foreign Trade', 'Anti-Bribery & Corruption', 'Values', 'Speak Up', 'Sustainable Finance', 'Clearing', 'BACH', 'Fraud Risk', 'ICC', 'ESRM', 'SME', 'Fire Drill'],
  categories: ['General', 'Functional', 'Soft-skill', 'Mandatory'],
  /** FR 27 · Mode of Training */
  modes: ['In-house', 'External-local', 'External-foreign'],
  /** FR 26 · Training Medium */
  mediums: ['Classroom', 'Webinar', 'e-Learning'],
};

export const PERSONAS: Record<Role, { name: string; title: string; eid: string; label: string; dept: string }> = {
  division_head: { name: 'Farzana Haque', title: 'Head of Corporate Banking · Learning Champion', eid: 'CBL-04417', label: 'Division Head / Learning Champion', dept: 'Corporate Banking Division' },
  hr: { name: 'Nusrat Jahan', title: 'HR Admin, Learning & Development', eid: 'CBL-08236', label: 'HR Admin (L&D)', dept: 'Human Resources Division' },
  finance: { name: 'Rezaul Karim', title: 'Senior Manager, Financial Control', eid: 'CBL-05518', label: 'Finance Approver', dept: 'Finance & Accounts Division' },
  trainer: { name: 'Nafis Ahmed', title: 'Head of Credit Risk · Internal Trainer', eid: 'CBL-05903', label: 'Trainer', dept: 'Risk Management Division' },
  employee: { name: 'Ayesha Rahman', title: 'Relationship Manager', eid: 'CBL-10482', label: 'Employee', dept: 'Corporate Banking Division' },
  supervisor: { name: 'Mahmud Karim', title: 'Unit Head, Corporate Banking', eid: 'CBL-07120', label: 'Supervisor', dept: 'Corporate Banking Division' },
  admin: { name: 'Arif Mahmud', title: 'System Administrator', eid: 'CBL-06610', label: 'System Admin', dept: 'IT Division' },
  management: { name: 'Tahsin Rahman', title: 'Deputy Managing Director', eid: 'CBL-01022', label: 'Management', dept: 'Executive Committee' },
};

export const ROLE_ORDER: Role[] = ['division_head', 'hr', 'finance', 'trainer', 'employee', 'supervisor', 'admin', 'management'];
export const ROLE_HOME = Object.fromEntries(ROLE_ORDER.map((r) => [r, `/r/${r}`])) as Record<Role, string>;

/** Fictional reporting lines: one supervisor per division (stands in for HRIS). */
export const SUPERVISOR_OF: Record<string, string> = { 'Corporate Banking': 'Mahmud Karim', 'SME Banking': 'Nasir Uddin', 'Risk Management': 'Rafiq Uddin', 'Credit Administration': 'Lutfa Begum' };

const named: Employee[] = [
  { id: 'e1', eid: 'CBL-10482', name: 'Ayesha Rahman', role: 'Relationship Manager', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
  { id: 'e2', eid: 'CBL-09371', name: 'Tanvir Hasan', role: 'Credit Analyst', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: '1-day Leave (19 Nov)', calendar: 'Conflict', eligibility: 'Attention', issue: 'Approved leave overlaps Day 2' },
  { id: 'e3', eid: 'CBL-10977', name: 'Nusrat Karim', role: 'Senior Officer', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
];

export const SADIA: Employee = {
  id: 'e4', eid: 'CBL-11804', name: 'Sadia Islam', role: 'Senior Credit Analyst', division: 'Risk Management', supervisor: 'Rafiq Uddin', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible',
};

const conflicts: Employee[] = [
  { id: 'c1', eid: 'CBL-10663', name: 'Monir Hossain', role: 'Relationship Manager', division: 'SME Banking', supervisor: 'Nasir Uddin', leave: 'Clear', calendar: 'Clear', eligibility: 'Conflict', issue: 'Overlapping training: Retail Lending Workshop (18 Nov)' },
  { id: 'c2', eid: 'CBL-08411', name: 'Delwar Hossain', role: 'Senior Officer', division: 'Credit Administration', supervisor: 'Lutfa Begum', leave: 'Clear', calendar: 'Clear', eligibility: 'Conflict', issue: 'Retirement effective 30 Nov 2026' },
  { id: 'c3', eid: 'CBL-11095', name: 'Rima Akter', role: 'Credit Analyst', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Conflict', eligibility: 'Conflict', issue: 'Credit Committee meeting 19 Nov 10:00' },
];

const filler: [string, string, string, string][] = [
  ['Rashed Chowdhury', 'Relationship Manager', 'Corporate Banking', 'CBL-10120'],
  ['Farhana Yasmin', 'Credit Analyst', 'Corporate Banking', 'CBL-10231'],
  ['Imran Hossain', 'Senior Credit Analyst', 'Credit Administration', 'CBL-09844'],
  ['Mehnaz Sultana', 'Relationship Manager', 'SME Banking', 'CBL-10755'],
  ['Zahid Alam', 'Credit Analyst', 'SME Banking', 'CBL-11012'],
  ['Tahmina Akter', 'Officer, Credit Risk', 'Risk Management', 'CBL-11390'],
  ['Shafiq Rahman', 'Relationship Manager', 'Corporate Banking', 'CBL-09520'],
  ['Lamia Haque', 'Credit Analyst', 'Credit Administration', 'CBL-11147'],
  ['Arman Siddique', 'Senior Officer', 'SME Banking', 'CBL-10611'],
  ['Nabila Ferdous', 'Credit Analyst', 'Corporate Banking', 'CBL-11209'],
  ['Kamrul Islam', 'Relationship Manager', 'Corporate Banking', 'CBL-08932'],
  ['Sharmin Nahar', 'Senior Credit Analyst', 'Risk Management', 'CBL-10088'],
  ['Mizanur Rahman', 'Relationship Manager', 'SME Banking', 'CBL-09702'],
  ['Anika Tabassum', 'Credit Analyst', 'Corporate Banking', 'CBL-11533'],
  ['Habibur Rahman', 'Senior Officer', 'Credit Administration', 'CBL-09266'],
  ['Rubina Khatun', 'Officer, Credit Risk', 'Risk Management', 'CBL-11602'],
  ['Asif Mahmud', 'Relationship Manager', 'Corporate Banking', 'CBL-10390'],
  ['Moushumi Das', 'Credit Analyst', 'SME Banking', 'CBL-11455'],
  ['Tarek Aziz', 'Senior Credit Analyst', 'Corporate Banking', 'CBL-09118'],
  ['Sabrina Chowdhury', 'Relationship Manager', 'SME Banking', 'CBL-10874'],
  ['Parvez Ahmed', 'Credit Analyst', 'Credit Administration', 'CBL-11290'],
  ['Joya Biswas', 'Senior Officer', 'Corporate Banking', 'CBL-10029'],
  ['Redwan Karim', 'Relationship Manager', 'Corporate Banking', 'CBL-10516'],
  ['Naznin Sultana', 'Credit Analyst', 'Risk Management', 'CBL-11678'],
  ['Fahim Reza', 'Credit Analyst', 'Corporate Banking', 'CBL-11721'],
  ['Mahfuza Begum', 'Senior Officer', 'SME Banking', 'CBL-09905'],
  ['Saiful Alam', 'Relationship Manager', 'Corporate Banking', 'CBL-10304'],
  ['Tasnim Jahan', 'Credit Analyst', 'Credit Administration', 'CBL-11866'],
  ['Wasim Akram', 'Senior Credit Analyst', 'SME Banking', 'CBL-09677'],
];

const fillerEmployees: Employee[] = filler.map(([name, role, division, eid], i) => ({
  id: `f${i + 1}`,
  eid,
  name,
  role,
  division,
  supervisor: SUPERVISOR_OF[division] ?? 'Rafiq Uddin',
  leave: 'Clear',
  calendar: 'Clear',
  eligibility: 'Eligible' as const,
}));

/** 3 named + 3 conflicts + 29 filler = 35 nominations requested; 4 conflicts incl. Tanvir. */
export const NOMINEE_LIST: Employee[] = [...named, ...conflicts, ...fillerEmployees];
export const CONFLICT_IDS = ['e2', 'c1', 'c2', 'c3'];

export const REQUEST_QUEUE = [
  { id: 'TR-2026-00418', title: 'Advanced Credit Risk Management', division: 'Corporate Banking', by: 'Farzana Haque', dates: '18–19 Nov 2026', participants: 32, priority: 'High' },
  { id: 'TR-2026-00415', title: 'Trade Finance Operations Update', division: 'International Trade', by: 'Kabir Ahmed', dates: '07–08 Dec 2026', participants: 24, priority: 'Medium' },
  { id: 'TR-2026-00409', title: 'Customer Experience Excellence', division: 'Retail Banking', by: 'Shaila Parveen', dates: '15 Dec 2026', participants: 60, priority: 'Medium' },
  { id: 'TR-2026-00402', title: 'Sustainable Finance Fundamentals', division: 'Green Banking Unit', by: 'Tamjid Hasan', dates: '10–11 Jan 2027', participants: 28, priority: 'Low' },
];

export const INTEGRATIONS = [
  { name: 'HRIS', desc: 'Employee master, grades, reporting lines', iface: 'REST / DB view via middleware', dir: 'Inbound', sync: 'Last sync 06:00 · 8,742 records' },
  { name: 'IAM / Active Directory (SSO)', desc: 'Single sign-on, group-to-role mapping', iface: 'SAML 2.0 / OIDC / LDAP', dir: 'Inbound', sync: 'Session validated 11:38' },
  { name: 'Leave Management', desc: 'Leave conflict indicator at nomination', iface: 'REST / middleware', dir: 'Inbound', sync: 'Last sync 11:30' },
  { name: 'Meeting Room Booking', desc: 'Venue availability and booking', iface: 'REST / middleware', dir: 'Bidirectional', sync: 'Last sync 11:41' },
  { name: 'Microsoft Teams', desc: 'Online sessions and attendance report', iface: 'Microsoft Graph', dir: 'Bidirectional', sync: 'Report retrieved 11:40' },
  { name: 'Zoom', desc: 'Meeting creation and participant reports', iface: 'Zoom API + webhooks', dir: 'Bidirectional', sync: 'Webhook healthy' },
  { name: 'Outlook / Microsoft 365', desc: 'Calendar invitations, supervisor CC', iface: 'Microsoft Graph / SMTP', dir: 'Outbound', sync: 'Queue 0 pending' },
  { name: 'SMS Gateway', desc: 'Reminders with delivery log', iface: 'HTTP API of Bank gateway', dir: 'Outbound', sync: 'Queue 0 pending' },
  { name: 'WhatsApp Business', desc: 'Reminders and alerts', iface: 'WhatsApp Business API', dir: 'Outbound', sync: 'Queue 0 pending' },
  { name: 'Power BI', desc: 'Read-only reporting schema', iface: 'Scheduled extracts', dir: 'Outbound', sync: 'Dataset refreshed 06:30' },
  { name: 'SIEM / SOC', desc: 'Security and audit events', iface: 'Syslog / CEF over TLS', dir: 'Outbound', sync: 'Forwarding · 0 dropped' },
  { name: 'IBM MQ / Oracle OSB', desc: 'Interfaces routed via Bank ESB', iface: 'JMS / SOAP / REST', dir: 'Either', sync: 'Where applicable' },
];
