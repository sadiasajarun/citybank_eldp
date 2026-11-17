/**
 * Requirements coverage (C1): an honest status per Annexure-II requirement, grouped by the five modules (O3).
 * Requirement text comes from docs/annexure-ii/requirements.json (the workbook); status, screen, gap and plan are ours.
 * Rule: "Demonstrated" only when the field, action or behaviour is visible and usable in this demo.
 */
import reqsRaw from '../docs/annexure-ii/requirements.json?raw';

export interface Requirement { no: number; category: string; sub: string; subsub: string; text: string }
export const REQUIREMENTS: Requirement[] = JSON.parse(reqsRaw) as Requirement[];

export type CovStatus = 'Demonstrated' | 'Partially demonstrated' | 'Simulated' | 'Conceptual' | 'Dependent on Bank integration' | 'Proposed interpretation' | 'Missing';
export const STATUSES: CovStatus[] = ['Demonstrated', 'Partially demonstrated', 'Simulated', 'Conceptual', 'Dependent on Bank integration', 'Proposed interpretation', 'Missing'];

export type ModuleKey = 'LMS' | 'TMS' | 'L&D management' | 'Enterprise workflow' | 'AI-assisted';

/** The five high-level modules (U19 / O3). AI-assisted requirements also keep an `ai` flag. */
export const MODULES: { key: ModuleKey; name: string; frs: string; desc: string }[] = [
  { key: 'TMS', name: 'Training Management System', frs: 'FR 49–174 (setup FR 22–48)', desc: 'Request, nomination, scheduling, invitations, attendance, planned training, bonds and the training database.' },
  { key: 'LMS', name: 'Learning Management System', frs: 'FR 190–220, 227–240 (feedback FR 221–226)', desc: 'e-Learning courses, assessments, feedback, Knowledge Corner and the physical library.' },
  { key: 'L&D management', name: 'L&D management', frs: 'FR 186–189, 241–243', desc: 'Training needs assessment, competency frameworks and learning journeys.' },
  { key: 'Enterprise workflow', name: 'Enterprise workflow', frs: 'FR 1–21, 175–185, 244, 246–250', desc: 'Roles and approvals, reports, integrations, security and governance.' },
  { key: 'AI-assisted', name: 'AI-assisted platform', frs: 'FR 185, 209, 213, 226, 245', desc: 'Suggestions, risk signals, marking support, feedback themes and the learning assistant. A person always decides.' },
];
export const moduleName = (k: ModuleKey) => MODULES.find((m) => m.key === k)?.name ?? k;

export interface CovEntry {
  from: number; to: number; module: ModuleKey; ai?: boolean;
  screen: string; route: string; status: CovStatus; gap: string; dependency: string; plan: string;
}

const NOW = 'Shown now · production build phase 1';
const P1 = 'Build phase 1 (months 1–3)';
const P2 = 'Build phase 2 (months 4–6)';
const P3 = 'Build phase 3 (months 7–9)';
const IT = 'With Bank IT during integration';
const KO = 'Confirm with City Bank at kick-off';

const e = (from: number, to: number, module: ModuleKey, screen: string, route: string, status: CovStatus, gap: string, dependency = 'None', plan = status === 'Demonstrated' ? NOW : P1, ai = false): CovEntry =>
  ({ from, to, module, screen, route, status, gap, dependency, plan, ai });

const EW: ModuleKey = 'Enterprise workflow';
const TMS: ModuleKey = 'TMS';
const LMS: ModuleKey = 'LMS';
const LD: ModuleKey = 'L&D management';
const AI: ModuleKey = 'AI-assisted';

export const COVERAGE: CovEntry[] = [
  // Roles (FR 1–21)
  e(1, 1, EW, 'My Learning', '/employee', 'Demonstrated', 'Any invited employee can choose Withdraw Request with a required reason.', 'Email (simulated)'),
  e(2, 2, EW, 'My Learning', '/employee', 'Partially demonstrated', 'Upcoming trainings are listed on My Learning; a month calendar view is not built.', 'Outlook calendar sync'),
  e(3, 3, EW, 'My Learning', '/employee', 'Demonstrated', 'Self-marked attendance shows on the HR register with the source "Self".'),
  e(4, 4, EW, 'Training Feedback', '/employee/feedback', 'Demonstrated', 'Ratings and comment, then a forward action.'),
  e(5, 5, EW, 'My Learning Record', '/employee/record', 'Partially demonstrated', 'The record lists each training from the training database; period filtering is shown on Reports and the Team Dashboard.'),
  e(6, 6, EW, 'My Learning Record', '/employee/record', 'Demonstrated', 'Employee submits, HR validates on Approvals, and a training database row is added.'),
  e(7, 7, EW, '—', '', 'Proposed interpretation', 'No requirement text ("Others"). To be clarified.', 'City Bank clarification', KO),
  e(8, 8, EW, 'Team Dashboard', '/supervisor/team', 'Partially demonstrated', 'Supervisors open employee pages without switching role; their own learning record is not modelled separately.'),
  e(9, 9, EW, 'Withdrawal Requests', '/supervisor', 'Demonstrated', 'Approve Withdrawal, Approve Withdrawal with Replacement or Reject, with a required reason.'),
  e(10, 10, EW, 'Withdrawal Requests', '/supervisor', 'Demonstrated', 'Replacement is searched from the directory; leave, calendar, resignation and retirement alerts use simulated HRIS and leave data.', 'HRIS, Leave Management (simulated)'),
  e(11, 11, EW, 'Team Dashboard', '/supervisor/team', 'Demonstrated', 'Select one, several or all direct reports; period filter; CSV export.'),
  e(12, 12, EW, 'Team Dashboard · Reports', '/supervisor/team', 'Demonstrated', 'Label and period filters with CSV export and a print view.'),
  e(13, 13, EW, 'Division dashboard', '/division', 'Partially demonstrated', 'Inherits the Team Dashboard and employee pages; no separate personal record for the head.'),
  e(14, 14, EW, 'Training Request', '/request/new', 'Demonstrated', 'Submitted through the Training Request step form.'),
  e(15, 15, EW, 'Division dashboard', '/division', 'Demonstrated', 'Department or designation segments with a time-frame selector, computed from records.'),
  e(16, 16, EW, 'Trainer Sessions', '/trainer', 'Partially demonstrated', 'Inherits employee pages; a supervisor-style team view is not applicable to trainers.'),
  e(17, 17, EW, 'Trainer Sessions', '/trainer', 'Demonstrated', 'Reject requires a reason; HR reassigns the session.'),
  e(18, 18, EW, 'My work (Trainer)', '/r/trainer', 'Partially demonstrated', 'Sessions and a "Today" to-do list; no month calendar view.'),
  e(19, 19, EW, 'Trainer Sessions · Approvals', '/trainer', 'Demonstrated', 'Trainer uploads; HR links the material with a protection option.'),
  e(20, 20, EW, '—', '', 'Proposed interpretation', 'Blank row in Annexure-II; no requirement text.', 'City Bank clarification', KO),
  e(21, 21, EW, 'System administration', '/admin/roles', 'Demonstrated', 'Role × module permission matrix, users and accounts, maker-checker queue (proposed), audit log and system settings (proposed); changes stay in the demo.', 'IAM / Active Directory'),
  // Setup options (FR 22–48), feeding the TMS
  e(22, 27, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'Master values are listed and used by the forms; add, edit and archive are deferred.'),
  e(28, 33, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'The duplicate-check search works; Add does not save a new entry yet.'),
  e(34, 34, TMS, 'Setup Options', '/hr/setup', 'Missing', 'No venue document uploader.'),
  e(35, 37, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'The trainer master is searchable from every form; Add trainer and Bulk Upload are deferred.', 'HRIS (internal trainer lookup)'),
  e(38, 40, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'Vendor duplicate check works; Add does not save yet.'),
  e(41, 41, TMS, 'Setup Options', '/hr/setup', 'Missing', 'No vendor document uploader.'),
  e(42, 42, TMS, 'Setup Options', '/hr/setup', 'Missing', 'No vendor email template.'),
  e(43, 44, TMS, 'Training Calendar', '/hr/calendar', 'Partially demonstrated', 'Scheduled programmes appear on the calendar; the admin upload of the approved yearly calendar is not built.'),
  e(45, 46, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'Questions and types are shown; Add New Question is deferred.'),
  e(47, 48, TMS, 'Setup Options', '/hr/setup', 'Partially demonstrated', 'External participant fields are shown; the bulk upload template is deferred.'),
  // TMS (FR 49–174)
  e(49, 64, TMS, 'Training Request', '/request/new', 'Demonstrated', 'Program, Trainer and Nominations tabs with the workbook buttons. The Review step is a proposed addition.', 'HRIS employee lookup (simulated)'),
  e(65, 66, TMS, 'Training Request Received', '/hr/requests', 'Demonstrated', 'Schedule Training opens Scheduling with Load Training Profile = No; Forward assigns another HR Admin.'),
  e(67, 85, TMS, 'Training Nomination Request Setup', '/hr/nomination-request', 'Demonstrated', 'Venue clash is checked against the demo calendar.'),
  e(86, 86, TMS, 'Training Nomination Request Setup', '/hr/nomination-request', 'Simulated', 'Email to division heads and Learning Champions is simulated; the record and audit trail update.', 'Outlook / Microsoft 365', IT),
  e(87, 87, TMS, 'Training Nomination Request Setup', '/hr/nomination-request', 'Demonstrated', 'Editable template with the nominate link.'),
  e(88, 88, TMS, 'Nomination', '/nominate', 'Demonstrated', 'The email link is simulated; the Learning Champion nominates on their own dashboard.', 'Email link (simulated)'),
  e(89, 91, TMS, 'Training Nomination Status', '/hr/nomination-status', 'Demonstrated', 'Details opens the editable summary; flagged nominees are kept or removed with a reason.'),
  e(92, 115, TMS, 'Training Scheduling', '/hr/schedule', 'Demonstrated', 'Both Load Training Profile paths; venue clash against the demo calendar.'),
  e(116, 118, TMS, 'Training Scheduling · Notification', '/hr/schedule?tab=Notifications', 'Demonstrated', 'Each send updates the record; email delivery is simulated.', 'Outlook / Microsoft 365 (simulated)'),
  e(119, 119, TMS, 'My Learning · Withdrawal Requests · Approvals', '/employee', 'Demonstrated', 'Accept / Withdraw Request, supervisor decision with replacement, HR approval; mails are previewed, not sent.', 'Email (simulated)'),
  e(120, 120, TMS, 'Training Scheduling · Notification', '/hr/schedule?tab=Notifications', 'Simulated', 'SMS and WhatsApp notifications are simulated.', 'SMS gateway, WhatsApp Business API', IT),
  e(121, 131, TMS, 'Training Scheduling', '/hr/schedule', 'Demonstrated', 'Feedback template load and the Training Bond pop-up with a Legal-page print view.'),
  e(132, 136, TMS, 'Planned Training', '/hr/planned', 'Demonstrated', 'View and Edit, mandatory budget fields, Reschedule / Postpone / Delete with email preview.'),
  e(137, 142, TMS, 'Attendance', '/hr/attendance', 'Demonstrated', 'Day registers, Mark All, Add Participant, Submit & Update Training Database.'),
  e(143, 143, TMS, 'Attendance', '/hr/attendance', 'Simulated', 'Teams attendance sync and the extra-attendee request to Admin are simulated.', 'MS Teams / Zoom', IT),
  e(144, 163, TMS, 'Training Bond Database', '/hr/bonds', 'Demonstrated', 'EID lookup with auto-filled fields, calculated end date and a Legal-page print view.', 'HRIS (simulated)'),
  e(164, 167, TMS, 'Training Bond Database', '/hr/bonds', 'Demonstrated', 'Edit, calculated remaining liability; bonds from scheduling are included.'),
  e(168, 168, TMS, 'My work (HR) · Reports', '/r/hr', 'Partially demonstrated', 'Operations dashboard and Reports with period filters; the full reporting criteria are to be agreed.'),
  e(169, 169, TMS, 'Training Database', '/hr/training-db', 'Simulated', 'The migration uploader is simulated; no real migration.', 'Legacy training records', IT),
  e(170, 171, TMS, 'Training Database', '/hr/training-db', 'Demonstrated', 'Submitted attendance and saved bonds add rows automatically.'),
  e(172, 172, TMS, 'Training Database', '/hr/training-db', 'Simulated', 'Single and bulk entry are simulated uploads; the employee request path works.'),
  e(173, 174, TMS, 'Training Database', '/hr/training-db', 'Simulated', 'External trainee uploads are simulated.'),
  // Reports (FR 175–185)
  e(175, 179, EW, 'Reports', '/reports', 'Demonstrated', 'Computed from the training database, the roster and the directory; CSV export and a print view for PDF.'),
  e(180, 180, EW, 'Reports', '/reports', 'Proposed interpretation', '"Group" is read as grade band; to be confirmed.', 'City Bank clarification', KO),
  e(181, 181, EW, 'Reports', '/reports', 'Partially demonstrated', 'Only feedback submitted in this demo is reported; trainer comparison is not built.'),
  e(182, 183, EW, 'Reports', '/reports', 'Demonstrated', 'Training calendar and multiple-criteria reports with working filters.'),
  e(184, 184, EW, 'Reports', '/reports', 'Simulated', 'Schedules are saved and logged; delivery is simulated.', 'Email / Power BI', IT),
  e(185, 185, AI, 'Home · Training needs (AI training recommendation)', '/division', 'Simulated', 'The recommendation shows its factors (skill gap, role requirement, mandatory learning) and needs the Division Head’s decision. Transparent rules stand in for the AI engine.', 'AI model and data governance (on-premise)', P2, true),
  // L&D management (FR 186–189)
  e(186, 186, LD, 'Training needs', '/division', 'Demonstrated', 'Three evidence paths feed one requirement summary, which pre-fills the training request with division, officers, gap, recommendation and sources.'),
  e(187, 187, LD, 'Training needs · survey and nomination signals', '/division', 'Partially demonstrated', 'A survey output summary (fictional responses) can be reviewed and used as evidence; the survey module that collects responses is not built.'),
  e(188, 188, LD, 'Training needs · individual development requests', '/division', 'Partially demonstrated', 'Development requests can be opened, selected and combined as evidence; the employee-side IDP submission form is not built.'),
  e(189, 189, LD, 'Training Needs Assessment', '/tna', 'Proposed interpretation', 'Handled through configurable workflows and change requests.', 'None', KO),
  // LMS: e-learning (FR 190–209)
  e(190, 190, LMS, 'e-Learning Course', '/learning/course', 'Partially demonstrated', 'The course overview shows the configuration; there is no authoring screen.'),
  e(191, 192, LMS, 'e-Learning Course', '/learning/course', 'Demonstrated', 'Module → lesson → checkpoint → feedback → certificate, sequential with a pass mark.'),
  e(193, 193, LMS, 'e-Learning Course', '/learning/course', 'Partially demonstrated', 'Video, PDF and H5P are shown (simulated); other types and uploads are not.'),
  e(194, 194, LMS, 'e-Learning Course', '/learning/course', 'Missing', 'No content upload, drag & drop or reordering.', 'None', P2),
  e(195, 195, LMS, 'e-Learning Course', '/learning/course', 'Demonstrated', 'Speed control, seek lock and resume.'),
  e(196, 197, LMS, 'e-Learning Course', '/learning/course', 'Partially demonstrated', 'Checkpoint and course feedback only.'),
  e(198, 198, LMS, 'Certificates', '/employee/certificates', 'Demonstrated', 'QR-verified certificate on completion; the template designer is not shown.'),
  e(199, 199, LMS, 'Learning Journey', '/journey', 'Conceptual', 'Sequencing and prerequisites are described, not configurable.', 'None', P2),
  e(200, 201, LMS, 'Course Enrolments', '/hr/courses', 'Partially demonstrated', 'Enrolments, overdue learners and Send reminder; bulk enrolment upload is not built.', 'Email / SMS (simulated)'),
  e(202, 203, LMS, 'e-Learning Course', '/learning/course', 'Missing', 'No version control, global search or course filters.', 'None', P2),
  e(204, 204, LMS, 'e-Learning Course', '/learning/course', 'Conceptual', 'Deep links are not demonstrated.', 'IAM / SSO'),
  e(205, 205, LMS, 'My Learning · Learning hub', '/learning/hub', 'Demonstrated', 'Progress, last viewed course, bookmarks, offline downloads, discussion forum, learning goals, exams and results, certificates, calendar, points, badges and leaderboard (fictional data).'),
  e(206, 206, LMS, 'Team Dashboard', '/supervisor/team', 'Demonstrated', 'Reportees’ progress, absence, non-completion and assessment results.'),
  e(207, 207, LMS, 'Reports', '/reports', 'Partially demonstrated', 'Course completion and assessment results by period; branch-wise reports are not built.'),
  e(208, 208, LMS, 'Role dashboards and Reports', '/reports?type=investment', 'Demonstrated', 'Separate dashboards per role plus investment, e-learning and exam, feedback sentiment and bond analytics (fictional bank data).'),
  e(209, 209, AI, 'Home · Training needs', '/overview', 'Simulated', 'Mandatory-learning risk and the division skill gap are flagged from records by rules; forecasting is not modelled.', 'AI model and data governance (on-premise)', P2, true),
  // LMS: assessment (FR 210–220)
  e(210, 210, LMS, 'AML Assessment (standalone)', '/assessment', 'Partially demonstrated', 'The exam opens from My Learning; link access is not shown.'),
  e(211, 212, LMS, 'Exam builder · secure exam · evidence review', '/assessment/new', 'Demonstrated', 'Nine question types, exam configuration and proctoring controls; secure exam with webcam, face match, tab-switch, copy-paste and gaze / head-pose events (simulated) and a human evidence review.', 'Proctoring engine (simulated)', NOW, true),
  e(213, 213, LMS, 'Post-training Assessment Review', '/assessment/review', 'Demonstrated', 'Automatic marking plus an AI-suggested score that the trainer accepts or adjusts with a reason.', 'AI model (simulated)', NOW, true),
  e(214, 214, LMS, 'Post-training Assessment Review', '/assessment/review', 'Demonstrated', 'Instant or scheduled release with grades.'),
  e(215, 216, LMS, 'Question bank', '/assessment?tab=bank', 'Demonstrated', 'Question bank with type, topic and difficulty filters, add question and bulk upload (simulated); random pick in the exam builder.'),
  e(217, 217, LMS, 'Assessment Results', '/assessment/results', 'Partially demonstrated', 'The exam is tagged to the scheduled training with participation and results; editing the exam is not built.'),
  e(218, 220, LMS, 'Leaderboard · exam builder', '/learning/hub?tab=leaderboard', 'Partially demonstrated', 'Top-scorer gallery with star and the several-exams-in-a-month rule (highest, average, latest); exam reminders are templates only.', 'None', P2),
  // LMS: feedback / survey (FR 221–226)
  e(221, 221, LMS, 'Training Feedback', '/employee/feedback', 'Conceptual', 'Link access is not shown.'),
  e(222, 223, LMS, 'Training Feedback', '/employee/feedback', 'Partially demonstrated', 'Post-training feedback with star ratings; other feedback and question types are not built.'),
  e(224, 224, LMS, 'Training Feedback', '/employee/feedback', 'Simulated', 'Feedback requests by email, SMS and WhatsApp are simulated.', 'Email / SMS / WhatsApp', IT),
  e(225, 225, LMS, 'Feedback & sentiment', '/feedback?tab=analytics', 'Demonstrated', 'Feedback export, trainer comparison, trend and pie charts (fictional data).'),
  e(226, 226, AI, 'Planned Training · feedback themes', '/hr/planned', 'Partially demonstrated', 'AI-suggested themes reviewed by L&D; no live model.', 'AI model (on-premise)', P2, true),
  // LMS: Knowledge Corner and library (FR 227–240)
  e(227, 227, LMS, 'Knowledge Corner', '/knowledge', 'Partially demonstrated', 'Protection options are shown on linked trainer material.'),
  e(228, 228, LMS, 'Knowledge Corner', '/knowledge', 'Conceptual', 'Folders are shown; no upload or reordering.', 'None', P2),
  e(229, 229, LMS, 'Knowledge Corner', '/knowledge', 'Partially demonstrated', 'Search and folder filter work; sharing and privacy controls are not built.'),
  e(230, 231, LMS, 'Physical Library', '/library', 'Conceptual', 'Books are listed; there is no book entry form or numbering.', 'None', P3),
  e(232, 232, LMS, 'Physical Library', '/library', 'Missing', 'No individual or bulk book entry.', 'None', P3),
  e(233, 234, LMS, 'Physical Library', '/library', 'Partially demonstrated', 'Search and availability work.'),
  e(235, 237, LMS, 'Physical Library', '/library', 'Missing', 'No assignment to an employee with a return date.', 'None', P3),
  e(238, 238, LMS, 'Physical Library', '/library', 'Partially demonstrated', 'The employee request changes local state only; no HR approval.'),
  e(239, 240, LMS, 'Physical Library', '/library', 'Missing', 'No library reports.', 'None', P3),
  // L&D management: competency (FR 241–243)
  e(241, 242, LD, 'Competency', '/competency', 'Demonstrated', 'Six-pillar radar per person, gaps with recommended courses, self and manager review with weighting, and framework setup (fictional data).'),
  e(243, 243, LD, 'Learning Journey', '/journey', 'Demonstrated', 'Milestones update competency progress.'),
  // Platform (FR 244–250)
  e(244, 244, EW, 'Integrations', '/admin/integrations', 'Dependent on Bank integration', 'Every integration is simulated in the demo.', 'HRIS, Leave, Meeting Room, Teams / Zoom, Outlook, SMS, WhatsApp, Power BI, SIEM', IT),
  e(245, 245, AI, 'e-Learning Course · AI Assistant', '/learning/course', 'Conceptual', 'A preview of the assistant; no live model.', 'AI model hosting (on-premise)', P2, true),
  e(246, 246, EW, 'Mobile Preview', '/mobile', 'Conceptual', 'Mobile is a preview; the web app is responsive.', 'App store accounts, MDM', P3),
  e(247, 247, EW, 'Platform', '/platform', 'Partially demonstrated', 'The standalone AML exam and the linked post-training assessment show both modes; other modules are shown linked only.'),
  e(248, 250, EW, '—', '', 'Proposed interpretation', 'Governance requirement, not a screen; covered in the delivery approach.', 'IT Division', KO),
];

export const coverageFor = (no: number): CovEntry =>
  COVERAGE.find((c) => no >= c.from && no <= c.to) ?? e(no, no, EW, '—', '', 'Missing', 'Not yet mapped.');

export interface CoverageRow extends Requirement, Omit<CovEntry, 'from' | 'to'> { fr: string }
export const COVERAGE_ROWS: CoverageRow[] = REQUIREMENTS.map((r) => {
  const { from: _f, to: _t, ...c } = coverageFor(r.no);
  return { ...r, ...c, fr: `FR ${r.no}` };
});
