import type { Role } from './types';
import { DIRECTORY, GAP_TEXT } from './org';
import type { DemoState } from './store';

type S = DemoState;
const T = '20260182';

export const ROLE_LABEL: Record<Role, string> = {
  division_head: 'Division Head / LC', hr: 'HR Admin', finance: 'Finance', trainer: 'Trainer',
  employee: 'Employee', supervisor: 'Supervisor', admin: 'System Admin', management: 'Management',
};

/* ---------------- Tasks: each role's inbox, derived from shared state ---------------- */
export interface Task { id: string; title: string; detail: string; fr: string; to: string; from: string; emp?: string; urgent?: boolean }

export function tasksFor(role: Role, s: S): Task[] {
  const t: Task[] = [];
  const w = s.withdrawal.status;
  const ready = s.invitesSent && s.trainerResponse !== 'pending';
  switch (role) {
    case 'division_head':
      if (!s.requestSubmitted) t.push({ id: 'req', title: 'Submit training request: Advanced Credit Risk Management', detail: `Credit Analysis · ${GAP_TEXT} officers below target`, fr: 'FR 14, 49–64, 186', to: '/division', from: 'Training needs assessment' });
      if (s.nominationRequested && !s.nominationSubmitted) t.push({ id: 'nom', title: 'Nominate participants', detail: 'Nomination request NR-2026-00057 · deadline 14 Nov 17:00', fr: 'FR 88', to: '/nominate', from: 'HR Admin', urgent: true });
      break;
    case 'hr':
      if (s.requestSubmitted && !s.reviewed) t.push({ id: 'rev', title: 'Review new training request TR-2026-00418', detail: 'Corporate Banking · 32 proposed · 18–19 Nov', fr: 'FR 65–66', to: '/hr/requests/TR-2026-00418', from: 'Division Head' });
      if (s.reviewed && !s.nominationRequested) t.push({ id: 'nreq', title: 'Create nomination request', detail: 'Choose divisions, deadline and email template', fr: 'FR 67–87', to: '/hr/nomination-request', from: 'Request TR-2026-00418' });
      if (s.nominationSubmitted && !s.finalized) t.push({ id: 'nstat', title: 'Review nominations · 4 need attention', detail: '35 received · leave, calendar, overlap and retirement flags', fr: 'FR 89–91, 114', to: '/hr/nomination-status', from: 'Learning Champions', urgent: true });
      if (s.finalized && !s.scheduled) t.push({ id: 'sched', title: 'Schedule training · load nomination profile', detail: 'Venue check, trainers, participants, feedback, bond', fr: 'FR 92–131', to: '/hr/schedule', from: 'Nomination status' });
      if (s.budgetReturned && !s.budgetApproved) t.push({ id: 'resub', title: 'Finance returned the budget · attach quotation and resubmit', detail: 'Reason: BIBM quotation for the external trainer fee', fr: 'FR 135', to: '/hr/schedule', from: 'Finance', urgent: true });
      if (s.budgetApproved && !s.invitesSent) t.push({ id: 'inv', title: 'Send invitations to trainers and participants', detail: 'Programme saved · reminders and supervisor CC', fr: 'FR 116–120', to: '/hr/schedule?tab=Notifications', from: 'Training Scheduling' });
      Object.values(s.otherWithdrawals).filter((x) => x.status === 'proposed').forEach((x) => t.push({ id: `wdo-${x.empId}`, title: 'Approve withdrawal from supervisor', detail: x.replacementId ? 'With replacement' : 'Without replacement', fr: 'FR 119', to: '/hr/approvals', from: 'Supervisor', urgent: true }));
      if (s.pta.released && Object.keys(s.remediation).length === 0) t.push({ id: 'rem', title: 'Assign re-attempts for failed participants', detail: 'Post-training assessment results released', fr: 'FR 214, 243', to: '/assessment/results', from: 'Trainer' });
      if (w === 'proposed') t.push({ id: 'wd', title: s.withdrawal.replacementId ? 'Approve replacement: Tanvir Hasan → Sadia Islam' : 'Approve withdrawal: Tanvir Hasan', detail: 'Supervisor approved · inclusion / exclusion emails follow', fr: 'FR 119', to: '/hr/approvals', from: 'Supervisor', urgent: true });
      if (s.materialLinkRequested && !s.materialLinked) t.push({ id: 'mat', title: 'Link trainer material to training', detail: 'Credit_Risk_Case_Pack_v3.pdf from Nafis Ahmed', fr: 'FR 19', to: '/hr/approvals', from: 'Trainer' });
      if (s.recordRequest === 'pending') t.push({ id: 'rec', title: 'Validate employee training record', detail: 'Ayesha Rahman · CFA Level I', fr: 'FR 6, 172', to: '/hr/approvals', from: 'Employee' });
      if (ready && (w === 'approved' || w === 'rejected') && !s.attendanceSubmitted) t.push({ id: 'att', title: 'Take attendance and update training database', detail: '18–19 Nov · Teams sync · Mark All', fr: 'FR 137–143', to: '/hr/attendance', from: 'Training day' });
      if (s.feedbackSubmitted && !s.completed) t.push({ id: 'close', title: 'Close planned training · actual expense', detail: 'Payment no., actual expense, documents', fr: 'FR 132–136', to: '/hr/planned', from: 'Feedback received' });
      break;
    case 'finance':
      if (s.scheduled && !s.budgetApproved && !s.budgetReturned) t.push({ id: 'bud', title: 'Approve training budget · BDT 14,40,000', detail: `Training ${T} · maker: Nusrat Jahan (HR)`, fr: 'FR 135 · maker-checker', to: '/finance', from: 'HR Admin', urgent: !s.budgetReturned });
      break;
    case 'trainer':
      if (s.invitesSent && s.trainerResponse === 'pending') t.push({ id: 'fac', title: 'Accept or decline invitation to facilitate', detail: 'Advanced Credit Risk Management · Day 1 and Day 2 morning', fr: 'FR 17', to: '/trainer', from: 'HR Admin', urgent: true });
      if (s.trainerResponse === 'accepted' && !s.courseSetup) t.push({ id: 'setup', title: 'Set up the course', detail: 'Modules, assessment and AI assistant', fr: 'FR 19, 190–198, 210', to: '/trainer/course-setup', from: 'Your session', urgent: true });
      if (s.trainerResponse === 'accepted' && !s.materialUploaded) t.push({ id: 'upl', title: 'Upload training material', detail: 'HR links it to the training for participants', fr: 'FR 19', to: '/trainer', from: 'Your session' });
      if (s.ptaSubmitted && !s.pta.released) t.push({ id: 'pta', title: 'Review and release the post-training assessment', detail: 'Advanced Credit Risk Management · integrity, score, result', fr: 'FR 210–217', to: '/assessment/review', from: 'Training day', urgent: s.courseCompleted });
      if (s.aiScore.state === 'suggested') t.push({ id: 'eval', title: 'Evaluate AML assessment (standalone exam)', detail: 'AI suggests, you decide', fr: 'FR 211–213, 247', to: '/assessment/aml', from: 'Exam module' });
      break;
    case 'employee':
      if (s.participation.e1 === 'Accepted' && s.tcourse.done < (s.courseModules.length || 4)) t.push({ id: 'course1', title: 'Take the course: Advanced Credit Risk Management', detail: 'Modules, notes and AI assistant', fr: 'FR 190–198', to: '/learning/training', from: 'Nafis Ahmed', emp: 'e1' });
      if (s.attendanceSubmitted && !s.ptaSubmitted) t.push({ id: 'ptasub', title: 'Submit the post-training assessment', detail: 'Advanced Credit Risk Management', fr: 'FR 210–212', to: '/learning/training/assessment', from: 'Training day', emp: 'e1', urgent: true });
      if (s.participation.e1 === 'Invited') t.push({ id: 'inv1', title: 'Respond to training invitation', detail: 'Ayesha Rahman · Advanced Credit Risk Management', fr: 'FR 119', to: '/employee', from: 'HR Admin', emp: 'e1', urgent: true });
      if ((s.participation.e2 === 'Invited' || s.participation.e2 === 'Accepted') && s.withdrawal.status === 'none' && !s.attendanceSubmitted) t.push({ id: 'inv2', title: 'Client meeting clash · request withdrawal', detail: 'Tanvir Hasan · Advanced Credit Risk Management', fr: 'FR 1, 119', to: '/employee', from: 'HR Admin', emp: 'e2', urgent: true });
      if (s.participation.e4 === 'Invited') t.push({ id: 'inv4', title: 'Replacement invitation received', detail: 'Sadia Islam · Advanced Credit Risk Management', fr: 'FR 119', to: '/employee', from: 'HR Admin', emp: 'e4' });
      if (ready && s.participation.e1 === 'Accepted' && !s.selfMarked.e1 && (w === 'approved' || w === 'rejected')) t.push({ id: 'self', title: 'Mark your attendance · training day', detail: 'Ayesha Rahman · Day 1, 09:30', fr: 'FR 3, 138', to: '/employee', from: 'Training day', emp: 'e1' });
      if (s.pta.released && !s.feedbackSubmitted) t.push({ id: 'fb', title: 'Give feedback: Advanced Credit Risk Management', detail: 'Content, trainer, relevance, logistics', fr: 'FR 4, 222', to: '/employee/feedback', from: 'HR Admin', emp: 'e1' });
      if (!s.courseCompleted) t.push({ id: 'course', title: 'Complete Information Security Awareness 2026', detail: `Mandatory · due in 8 days · ${s.courseProgress}%`, fr: 'FR 190–201', to: '/learning/course', from: 'Compliance', emp: 'e1' });
      if (s.examStatus === 'upcoming') t.push({ id: 'exam', title: 'AML Annual Certification Assessment', detail: 'Proctored · opens 30 Nov', fr: 'FR 210–212', to: '/assessment/take/EX007', from: 'Compliance', emp: 'e1' });
      break;
    case 'supervisor':
      if (w === 'requested') t.push({ id: 'wd', title: 'Tanvir Hasan requests withdrawal', detail: `Reason: ${s.withdrawal.reason}`, fr: 'FR 9–10, 119', to: '/supervisor', from: 'Employee', urgent: true });
      Object.values(s.otherWithdrawals).filter((x) => x.status === 'requested').forEach((x) => t.push({ id: `wd-${x.empId}`, title: 'Withdrawal request from your team', detail: `Reason: ${x.reason}`, fr: 'FR 9–10, 119', to: '/supervisor', from: 'Employee', urgent: true }));
      { const overdue = s.enrollments.filter((e) => e.status === 'Overdue' && DIRECTORY.find((p) => p.id === e.personId)?.supervisor === 'Mahmud Karim').length;
        if (overdue) t.push({ id: 'team', title: `${overdue} team member${overdue > 1 ? 's' : ''} overdue on mandatory learning`, detail: 'Information Security Awareness 2026', fr: 'FR 206', to: '/supervisor/team', from: 'Compliance' }); }
      break;
    case 'admin':
      s.extraAttendees.filter((x) => x.status === 'requested').forEach((x) => t.push({ id: `xa-${x.eid}`, title: `Approve extra attendee: ${x.name}`, detail: 'Joined the online session but was not on the list', fr: 'FR 143', to: '/hr/attendance', from: 'HR Admin', urgent: true }));
      t.push({ id: 'mc', title: 'Approve role change: HR Admin rights for CBL-09115', detail: 'Maker: Shahana Parvin · checker required', fr: 'TR · maker-checker', to: '/admin/security', from: 'HR Division' });
      break;
    case 'management':
      break;
  }
  return t;
}

/* ---------------- Guided tour: auto-advances with state ---------------- */
export interface TourStep { cta: string; label: string; role: Role; to: string; hint: string; done: (s: S) => boolean; emp?: string; fr: string }
export const TOUR: TourStep[] = [
  { cta: 'Submit training request', label: 'Division Head submits a training request', role: 'division_head', to: '/request/new', hint: 'Use the suggested title, Save & Next through the tabs, Submit.', done: (s) => s.requestSubmitted, fr: 'FR 14, 49–64' },
  { cta: 'Review request', label: 'HR reviews the request', role: 'hr', to: '/hr/requests/TR-2026-00418', hint: 'Same record, HR view. Choose "Create Nomination Request".', done: (s) => s.reviewed, fr: 'FR 65–66' },
  { cta: 'Send nomination request', label: 'HR sends the nomination request', role: 'hr', to: '/hr/nomination-request', hint: 'Divisions, deadline, email with nomination link. Send.', done: (s) => s.nominationRequested, fr: 'FR 67–87' },
  { cta: 'Open nomination board', label: 'Learning Champion nominates', role: 'division_head', to: '/nominate', hint: 'Conflicts are flagged from HRIS, leave and calendar. Submit.', done: (s) => s.nominationSubmitted, fr: 'FR 88, 10' },
  { cta: 'Finalise participants', label: 'HR checks nomination status', role: 'hr', to: '/hr/nomination-status', hint: 'Open Tanvir Hasan to see live checks. Finalize 32.', done: (s) => s.finalized, fr: 'FR 89–91, 114' },
  { cta: 'Schedule training', label: 'HR schedules the training', role: 'hr', to: '/hr/schedule', hint: 'Load Training Profile = Yes. Fix the venue clash. Save.', done: (s) => s.scheduled, fr: 'FR 92–115' },
  { cta: 'Approve budget', label: 'Finance approves the budget', role: 'finance', to: '/finance', hint: 'Maker-checker: HR made it, Finance checks it.', done: (s) => s.budgetApproved, fr: 'FR 135' },
  { cta: 'Send invitations', label: 'HR sends invitations', role: 'hr', to: '/hr/schedule?tab=Notifications', hint: 'Organizer, trainer and participant communication.', done: (s) => s.invitesSent, fr: 'FR 116–120' },
  { cta: 'Respond as trainer', label: 'Trainer accepts to facilitate', role: 'trainer', to: '/trainer', hint: 'Accept, then upload material for HR to link.', done: (s) => s.trainerResponse !== 'pending', fr: 'FR 17–19' },
  { cta: 'Accept invitation', label: 'Employee accepts the invitation', role: 'employee', to: '/employee', emp: 'e1', hint: 'Ayesha accepts and adds it to her calendar.', done: (s) => s.participation.e1 !== 'Invited' && s.invitesSent, fr: 'FR 119' },
  { cta: 'Request withdrawal', label: 'Another employee requests withdrawal', role: 'employee', to: '/employee', emp: 'e2', hint: 'Tanvir Hasan: reason is mandatory.', done: (s) => s.withdrawal.status !== 'none', fr: 'FR 1, 119' },
  { cta: 'Approve with replacement', label: 'Supervisor approves with replacement', role: 'supervisor', to: '/supervisor', hint: 'Pick Sadia Islam; the system checks her eligibility live.', done: (s) => ['proposed', 'approved', 'rejected'].includes(s.withdrawal.status), fr: 'FR 9–10, 119' },
  { cta: 'Approve replacement', label: 'HR approves the replacement', role: 'hr', to: '/hr/approvals', hint: 'Roster stays at 32; inclusion and exclusion emails go out.', done: (s) => s.withdrawal.status === 'approved' || s.withdrawal.status === 'rejected', fr: 'FR 119' },
  { cta: 'Submit attendance', label: 'Training day: attendance', role: 'hr', to: '/hr/attendance', hint: 'Self-marked, Teams-synced, Mark All. Submit & Update Training Database.', done: (s) => s.attendanceSubmitted, fr: 'FR 3, 137–143' },
  { cta: 'Give feedback', label: 'Employee gives feedback', role: 'employee', to: '/employee/feedback', emp: 'e1', hint: 'Then see the learning record update.', done: (s) => s.feedbackSubmitted, fr: 'FR 4, 222' },
  { cta: 'Close the training', label: 'HR closes the training', role: 'hr', to: '/hr/planned', hint: 'Actual expense and payment no. → cost per employee.', done: (s) => s.completed, fr: 'FR 132–142' },
  { cta: 'Complete e-learning', label: 'Employee completes mandatory e-learning', role: 'employee', to: '/learning/course', emp: 'e1', hint: 'Finish the modules, pass the checkpoint, get the QR certificate.', done: (s) => s.courseCompleted, fr: 'FR 190–201' },
  { cta: 'Review post-training assessment', label: 'Trainer reviews and releases the post-training assessment', role: 'trainer', to: '/assessment/review', hint: 'Integrity, then score, then release the result.', done: (s) => s.pta.released, fr: 'FR 210–217' },
  { cta: 'Complete journey milestone', label: 'Learning journey closes the competency gap', role: 'employee', to: '/journey', emp: 'e1', hint: 'Complete the next milestone: Credit Risk Workshop (this training).', done: (s) => s.journeyDone >= 3, fr: 'FR 241–243' },
  { cta: 'View executive insight', label: 'Management sees the results', role: 'management', to: '/executive', hint: 'Review the outcome, then mark the insight as reviewed.', done: (s) => s.execViewed, fr: 'FR 168, 208' },
  { cta: 'Set up the course', label: 'Trainer sets up the course', role: 'trainer', to: '/trainer/course-setup', fr: 'FR 19, 190–198, 210', hint: 'Modules, assessment and the AI assistant.', done: (s) => s.courseSetup },
  { cta: 'Open the course', label: 'Employee takes the course', role: 'employee', to: '/learning/training', emp: 'e1', fr: 'FR 190–198', hint: 'Course overview, modules and AI assistant.', done: (s) => s.tcourse.done >= (s.courseModules.length || 4) },
  { cta: 'Submit the assessment', label: 'Employee submits the assessment', role: 'employee', to: '/learning/training/assessment', emp: 'e1', fr: 'FR 210–212', hint: 'Objective and descriptive answers.', done: (s) => s.ptaSubmitted },
];
export const tourIndex = (s: S) => { const i = TOUR.findIndex((x) => !x.done(s)); return i === -1 ? TOUR.length : i; };

/* ---------------- Lifecycle: the one record's journey (single source for every view) ---------------- */
export type Pid = 'dh' | 'hr' | 'lc' | 'fin' | 'tr' | 'emp' | 'sup' | 'mgmt';
export const PEOPLE: { id: Pid; label: string; role: Role; to?: string; emp?: string }[] = [
  { id: 'dh', label: 'Division Head', role: 'division_head' },
  { id: 'hr', label: 'HR / L&D', role: 'hr' },
  { id: 'lc', label: 'Learning Champion', role: 'division_head', to: '/nominate' },
  { id: 'fin', label: 'Finance', role: 'finance' },
  { id: 'tr', label: 'Trainer', role: 'trainer' },
  { id: 'emp', label: 'Employee', role: 'employee' },
  { id: 'sup', label: 'Supervisor', role: 'supervisor' },
  { id: 'mgmt', label: 'Management', role: 'management' },
];
export const SYSTEMS = ['HRIS', 'Leave Management', 'Outlook Calendar', 'Meeting Room', 'Teams / Zoom', 'Finance', 'Notification Engine', 'Training Database', 'Power BI', 'Audit / SIEM'];

export interface Stage {
  key: string; label: string; module: string;
  owner: (s: S) => Pid; affected: Pid[]; systems: string[]; impacts: string[];
  next: string; done: (s: S) => boolean; route: { role: Role; to: string; emp?: string };
  detail: (s: S) => { records: string; pending: string };
  /** kept for older views */ integrations: string[];
}
const st = (x: Omit<Stage, 'integrations'>): Stage => ({ ...x, integrations: x.systems });
const w = (s: S) => s.withdrawal.status;

export const STAGES_LC: Stage[] = [
  st({ key: 'need', label: 'Needs', module: 'Training Needs Assessment / Divisional Requirement', owner: () => 'dh', affected: ['hr', 'mgmt'], systems: ['Training Database', 'Power BI'], impacts: ['Business need identified', 'Training need added'], next: 'Division Head raises a training request', done: (s) => s.needConfirmed || s.requestSubmitted, route: { role: 'division_head', to: '/division' }, detail: () => ({ records: `Credit Analysis gap · ${GAP_TEXT} officers below target`, pending: 'Identified from the competency matrix' }) }),
  st({ key: 'request', label: 'Request', module: 'Training Request', owner: () => 'dh', affected: ['hr'], systems: ['HRIS', 'Notification Engine', 'Audit / SIEM'], impacts: ['Training request submitted'], next: 'HR reviews the request', done: (s) => s.requestSubmitted, route: { role: 'division_head', to: '/request/new' }, detail: (s) => ({ records: s.requestSubmitted ? 'TR-2026-00418 · Pending HR Review' : 'Not submitted yet', pending: s.requestSubmitted ? '—' : 'Division Head submits' }) }),
  st({ key: 'review', label: 'HR Review', module: 'Training Request Received', owner: () => 'hr', affected: ['dh'], systems: ['Training Database', 'Audit / SIEM'], impacts: ['Request accepted for nomination'], next: 'HR asks divisions for nominations', done: (s) => s.reviewed, route: { role: 'hr', to: '/hr/requests/TR-2026-00418' }, detail: (s) => ({ records: s.reviewed ? 'Under Review' : 'Waiting in HR inbox', pending: s.requestSubmitted && !s.reviewed ? 'HR review' : '—' }) }),
  st({ key: 'nominate', label: 'Nomination', module: 'Nomination Request & Process', owner: (s) => (s.nominationRequested ? 'lc' : 'hr'), affected: ['hr', 'emp'], systems: ['Notification Engine', 'HRIS'], impacts: ['Nomination request sent', 'Nominations submitted'], next: 'Conflicts are validated', done: (s) => s.nominationSubmitted, route: { role: 'division_head', to: '/nominate' }, detail: (s) => ({ records: s.nominationSubmitted ? '35 nominated' : s.nominationRequested ? 'NR-2026-00057 open · deadline 14 Nov' : 'Not requested', pending: s.nominationRequested && !s.nominationSubmitted ? 'Learning Champion nominates' : s.reviewed && !s.nominationRequested ? 'HR sends the request' : '—' }) }),
  st({ key: 'validate', label: 'Validation', module: 'Nomination Status', owner: () => 'hr', affected: ['lc', 'sup'], systems: ['HRIS', 'Leave Management', 'Outlook Calendar', 'Training Database'], impacts: ['Participants finalized', 'Conflict overridden', 'Nominee removed'], next: 'HR schedules the training', done: (s) => s.finalized, route: { role: 'hr', to: '/hr/nomination-status' }, detail: (s) => ({ records: s.finalized ? '32 participants finalised' : s.nominationSubmitted ? '4 nominees flagged' : 'Waiting for nominations', pending: s.nominationSubmitted && !s.finalized ? 'HR resolves 4 conflicts' : '—' }) }),
  st({ key: 'schedule', label: 'Scheduling', module: 'Training Scheduling', owner: () => 'hr', affected: ['tr', 'fin'], systems: ['Meeting Room', 'Outlook Calendar', 'Training Database'], impacts: ['Training scheduled'], next: 'Finance approves the budget', done: (s) => s.scheduled, route: { role: 'hr', to: '/hr/schedule' }, detail: (s) => ({ records: s.scheduled ? 'Training 20260182 · Hall A · 18–19 Nov' : 'Not scheduled', pending: s.finalized && !s.scheduled ? 'HR schedules' : '—' }) }),
  st({ key: 'budget', label: 'Budget', module: 'Finance approval (maker-checker)', owner: (s) => (s.budgetReturned ? 'hr' : 'fin'), affected: ['hr'], systems: ['Finance', 'Audit / SIEM'], impacts: ['Budget approved', 'Budget returned', 'Budget resubmitted'], next: 'HR sends invitations', done: (s) => s.budgetApproved, route: { role: 'finance', to: '/finance' }, detail: (s) => ({ records: s.budgetApproved ? 'FIN-APP-2026-0771 · BDT 14,40,000' : s.budgetReturned ? 'Returned to HR' : 'BDT 14,40,000 requested', pending: s.scheduled && !s.budgetApproved ? (s.budgetReturned ? 'HR resubmits' : 'Finance approves') : '—' }) }),
  st({ key: 'invite', label: 'Invitation', module: 'Notifications', owner: () => 'hr', affected: ['tr', 'emp', 'sup'], systems: ['Outlook Calendar', 'Notification Engine'], impacts: ['Invitations sent'], next: 'Trainer and employees respond', done: (s) => s.invitesSent, route: { role: 'hr', to: '/hr/schedule?tab=Notifications' }, detail: (s) => ({ records: s.invitesSent ? '32 participants · 2 trainers invited' : 'Not sent', pending: s.budgetApproved && !s.invitesSent ? 'HR sends' : '—' }) }),
  st({ key: 'respond', label: 'Response', module: 'Withdrawal & replacement', owner: (s) => (s.trainerResponse === 'pending' ? 'tr' : w(s) === 'requested' ? 'sup' : w(s) === 'proposed' ? 'hr' : 'emp'), affected: ['sup', 'hr', 'tr'], systems: ['HRIS', 'Leave Management', 'Outlook Calendar', 'Notification Engine'], impacts: ['Facilitation accepted', 'Facilitation declined', 'Invitation accepted', 'Withdrawal requested', 'Replacement proposed', 'Participant replaced', 'Participant withdrawn', 'Withdrawal rejected', 'Withdrawal approved'], next: 'Training day: attendance', done: (s) => s.invitesSent && s.trainerResponse !== 'pending' && ['approved', 'rejected'].includes(w(s)), route: { role: 'supervisor', to: '/supervisor' }, detail: (s) => ({ records: w(s) === 'approved' ? 'Tanvir → Sadia · roster stays 32' : w(s) === 'none' ? 'Invitations open' : `Withdrawal ${w(s)}`, pending: w(s) === 'requested' ? 'Supervisor decides' : w(s) === 'proposed' ? 'HR approves' : s.trainerResponse === 'pending' ? 'Trainer responds' : s.invitesSent && !['approved', 'rejected'].includes(w(s)) ? 'Employees accept or withdraw' : '—' }) }),
  st({ key: 'attend', label: 'Attendance', module: 'Attendance', owner: () => 'hr', affected: ['emp', 'tr', 'sup'], systems: ['Teams / Zoom', 'HRIS', 'Training Database'], impacts: ['Attendance submitted', 'Online attendance synced', 'Attendance self-marked'], next: 'Feedback and training database update', done: (s) => s.attendanceSubmitted, route: { role: 'hr', to: '/hr/attendance' }, detail: (s) => ({ records: s.attendanceSubmitted ? '30 present · 1 absent · 1 excused' : 'Not taken', pending: '—' }) }),
  st({ key: 'feedback', label: 'Feedback', module: 'Feedback / Survey', owner: () => 'emp', affected: ['hr', 'tr'], systems: ['Notification Engine'], impacts: ['Feedback submitted'], next: 'HR closes the training', done: (s) => s.feedbackSubmitted, route: { role: 'employee', to: '/employee/feedback', emp: 'e1' }, detail: (s) => ({ records: s.feedbackSubmitted ? '4.6 / 5 · 89% positive' : '—', pending: s.attendanceSubmitted && !s.feedbackSubmitted ? 'Employees respond' : '—' }) }),
  st({ key: 'record', label: 'Record', module: 'Training Database', owner: () => 'hr', affected: ['emp', 'sup', 'mgmt'], systems: ['Training Database', 'HRIS', 'Power BI'], impacts: ['Training completed'], next: 'Learning and assessment build capability', done: (s) => s.completed, route: { role: 'employee', to: '/employee/record', emp: 'e1' }, detail: (s) => ({ records: s.completed ? 'Learning records + cost per employee updated' : 'Waiting', pending: s.feedbackSubmitted && !s.completed ? 'HR closes with actual expense' : '—' }) }),
  st({ key: 'develop', label: 'Capability', module: 'e-Learning · Assessment · Competency', owner: (s) => (!s.courseCompleted ? 'emp' : !s.pta.released ? 'tr' : 'emp'), affected: ['sup', 'hr'], systems: ['Training Database', 'Audit / SIEM'], impacts: ['Course completed', 'AI-suggested score accepted', 'AI-suggested score adjusted', 'Journey milestone completed', 'Integrity review cleared', 'Integrity review flagged', 'Assessment result released'], next: 'Management sees the result', done: (s) => s.courseCompleted && s.pta.released && s.journeyDone >= 3, route: { role: 'hr', to: '/competency' }, detail: (s) => ({ records: `Course ${s.courseCompleted ? 'complete' : `${s.courseProgress}%`} · journey ${s.journeyDone}/5`, pending: !s.courseCompleted ? 'Employee completes e-learning' : !s.pta.released ? 'Trainer reviews assessment' : s.journeyDone < 3 ? 'Journey milestone' : '—' }) }),
  st({ key: 'analyse', label: 'Insight', module: 'Reports · Executive dashboard', owner: () => 'mgmt', affected: ['hr', 'dh'], systems: ['Power BI', 'Training Database'], impacts: [], next: 'Management decisions', done: (s) => s.execViewed, route: { role: 'management', to: '/executive' }, detail: (s) => ({ records: s.completed ? 'Hours, cost and capability published' : 'Live', pending: '—' }) }),
];
export const activeStage = (s: S) => { const i = STAGES_LC.findIndex((x) => !x.done(s)); return i === -1 ? STAGES_LC.length : i; };
export const stageForImpact = (key: string) => STAGES_LC.findIndex((x) => x.impacts.includes(key));
export const pidRole = (p: Pid) => PEOPLE.find((x) => x.id === p)!;

export type PState = 'active' | 'attention' | 'complete' | 'affected' | 'waiting' | 'idle';
/** Status of one person for the selected stage (journey layer 2). */
export function stagePeople(stage: Stage, s: S, idx: number, current: number): { p: (typeof PEOPLE)[number]; state: PState }[] {
  const owner = stage.owner(s);
  const done = stage.done(s) && idx !== current;
  return PEOPLE.map((p) => {
    let state: PState = 'idle';
    if (p.id === owner) state = done ? 'complete' : idx === current ? 'active' : 'waiting';
    else if (stage.affected.includes(p.id)) state = 'affected';
    return { p, state };
  });
}

/** One-line status per person for the whole record (people ribbon). */
export function personStatus(id: Pid, s: S): { state: PState; text: string } {
  const ti = tourIndex(s);
  const step = ti < TOUR.length ? TOUR[ti] : null;
  const ws = s.withdrawal.status;
  const actingNow = step && ((id === 'lc' && step.to === '/nominate') || (id === 'dh' && step.role === 'division_head' && step.to !== '/nominate') || (id !== 'lc' && id !== 'dh' && pidRole(id).role === step.role));
  if (actingNow && step) return { state: 'active', text: step.cta };
  switch (id) {
    case 'dh': return s.requestSubmitted ? { state: 'complete', text: s.completed ? 'Programme closed' : 'Request submitted' } : { state: 'waiting', text: 'Drafting request' };
    case 'hr': return !s.requestSubmitted ? { state: 'waiting', text: 'Waiting for the request' } : s.completed ? { state: 'complete', text: 'Training closed' } : { state: 'waiting', text: 'Waiting on others' };
    case 'lc': return s.nominationSubmitted ? { state: 'complete', text: '35 nominated' } : s.nominationRequested ? { state: 'attention', text: 'Nominations due' } : { state: 'idle', text: 'Will nominate employees later' };
    case 'fin': return s.budgetApproved ? { state: 'complete', text: 'Budget approved' } : s.scheduled ? { state: 'attention', text: 'Approval pending' } : { state: 'idle', text: 'Not involved yet' };
    case 'tr': return s.trainerResponse === 'accepted' ? { state: 'complete', text: s.attendanceSubmitted ? 'Session delivered' : 'Confirmed' } : s.trainerResponse === 'rejected' ? { state: 'complete', text: 'Declined · reassigned' } : s.scheduled ? { state: 'affected', text: 'Assigned' } : { state: 'idle', text: 'Not assigned' };
    case 'emp': return s.feedbackSubmitted ? { state: 'complete', text: 'Learning recorded' } : s.invitesSent ? { state: 'affected', text: 'Invited' } : s.finalized ? { state: 'affected', text: 'Nominated' } : { state: 'idle', text: 'Not involved yet' };
    case 'sup': return ws === 'requested' ? { state: 'attention', text: 'Approval needed' } : ws === 'proposed' || ws === 'approved' ? { state: 'complete', text: 'Replacement decided' } : s.invitesSent ? { state: 'affected', text: 'Copied on invitations' } : { state: 'idle', text: 'Not involved yet' };
    case 'mgmt': return s.execViewed ? { state: 'complete', text: 'Insight reviewed' } : { state: 'waiting', text: 'Watching' };
  }
}

/** Plain-language perspective message used when switching role. */
export const perspectiveMessage = (role: Role, name: string, s: S) => {
  const stage = STAGES_LC[Math.min(activeStage(s), STAGES_LC.length - 1)];
  return `Here is what ${role === 'employee' ? name : ROLE_LABEL[role]} sees for TR-2026-00418 · ${stage.label.toLowerCase()} stage`;
};

export const MODULES_ALL = ['Training Management', 'Nomination', 'Finance', 'e-Learning', 'Assessment', 'Feedback', 'TNA', 'Competency', 'Knowledge Corner', 'Library', 'Reporting', 'Notifications', 'Integrations', 'Audit & Security'];
export const MODULE_ACTIVE: Record<string, string[]> = {
  request: ['Training Management', 'Notifications', 'Audit & Security'],
  nominate: ['Nomination', 'Integrations', 'Notifications'],
  schedule: ['Training Management', 'Integrations'],
  budget: ['Finance', 'Audit & Security'],
  invite: ['Notifications', 'Integrations'],
  respond: ['Training Management', 'Notifications', 'Audit & Security'],
  attend: ['Training Management', 'Integrations'],
  feedback: ['Feedback'],
  record: ['Training Management', 'Reporting'],
  develop: ['Competency', 'TNA'],
  analyse: ['Reporting'],
};

/* ---------------- What changed ---------------- */
export interface ImpactDef { headline: string; records: string[]; users: string[]; integrations: string[]; audit: string; analytics: string; notifications: string }
const I = (headline: string, records: string[], users: string[], integrations: string[], notifications: string, analytics: string, audit = '1 event recorded'): ImpactDef => ({ headline, records, users, integrations, notifications, analytics, audit });
export const IMPACTS: Record<string, ImpactDef> = {
  'Course set up': I('Course ready for participants', ['Modules, assessment and AI assistant set'], ['Participants · course opens'], ['e-Learning'], 'Participants notified', 'Courses ready +1'),
  'Course started': I('Ayesha started the course', ['Course progress recorded'], ['Trainer · progress visible'], ['e-Learning'], 'None', 'Active learners +1'),
  'Assessment submitted': I('Assessment submitted for evaluation', ['Answers recorded'], ['Trainer · evaluate and release'], ['Assessment engine'], 'Trainer notified', 'Submissions +1'),
  'Training need added': I('Training need added to the request by the Division Head', ['Advanced Credit Risk Management · training for the gap'], ['Division Head · next: raise the training request'], ['Competency matrix', 'Training database'], 'None', 'Training need confirmed (human decision)'),
  'Business need identified': I('Business need confirmed for Corporate Banking', [`Credit Analysis gap · ${GAP_TEXT} officers below target`], ['Division Head · next: submit the training request', 'HR Admin · will receive the request'], ['Competency matrix', 'Training database'], 'None yet', 'Division capability gap recorded'),
  'Training request submitted': I('Request TR-2026-00418 created', ['TR-2026-00418 · Pending HR Review'], ['HR Admin · new task in inbox'], ['HRIS (requester validated)'], 'HR notified', 'Pending requests +1'),
  'Request accepted for nomination': I('Request moved to Under Review', ['TR-2026-00418 · Under Review'], ['HR Admin · next: nomination request', 'Division Head · status updated'], [], 'None', '—'),
  'Nomination request sent': I('Nomination request NR-2026-00057 sent', ['NR-2026-00057 · deadline 14 Nov'], ['Learning Champions of 4 divisions · new task'], ['Email with nomination link'], 'Email sent to 4 division heads', 'Open nominations +1'),
  'Nominations submitted': I('35 employees nominated', ['Nomination list · 35'], ['HR Admin · 4 conflicts to review'], ['HRIS ✓', 'Leave portal · 1', 'Outlook · 2', 'Training DB · 1'], 'HR notified', 'Eligible 31 · attention 4'),
  'Participants finalized': I('32 participants finalised', ['Participant list locked'], ['HR Admin · next: scheduling'], ['HRIS'], 'Removed nominees informed', 'Participants 32'),
  'Training scheduled': I('Training 20260182 scheduled', ['Training 20260182', 'Training calendar entry', 'Budget request'], ['Finance · approval task', '2 Trainers · assigned'], ['Meeting room booked', 'Training calendar'], 'Finance notified', 'Active programmes +1'),
  'Budget approved': I('Budget approved by Finance', ['FIN-APP-2026-0771'], ['HR Admin · next: invitations'], ['Finance system (simulated)'], 'HR notified', 'Committed spend +BDT 14.4 lakh', 'Maker-checker approval recorded'),
  'Invitations sent': I('Invitations sent to 32 participants and 2 trainers', ['32 invitations', '34 calendar events'], ['32 Employees · task', '6 Supervisors · CC', '2 Trainers · task'], ['Outlook', 'Email', 'SMS', 'WhatsApp'], '34 notifications queued (simulated)', 'Invitations +32'),
  'Facilitation accepted': I('Trainer confirmed', ['Trainer status · Accepted'], ['HR Admin · trainer confirmed'], ['Outlook calendar'], 'HR notified', '—'),
  'Material uploaded': I('Material waiting for HR link', ['Credit_Risk_Case_Pack_v3.pdf'], ['HR Admin · link task'], [], 'HR notified', '—'),
  'Invitation accepted': I('Participation confirmed', ['Participation · Accepted'], ['HR Admin · count updated', 'Supervisor · CC'], ['Outlook calendar'], 'Supervisor CC', 'Acceptance rate updated'),
  'Withdrawal requested': I('Withdrawal routed to Supervisor', ['Participation · Withdrawal Requested'], ['Supervisor · new task'], ['Leave portal context'], 'Supervisor emailed with approval link', 'Pending approvals +1'),
  'Replacement proposed': I('Sadia Islam proposed as replacement', ['Withdrawal · Replacement Proposed'], ['HR Admin · approval task'], ['HRIS ✓', 'Leave ✓', 'Outlook ✓', 'Training DB ✓'], 'HR notified', 'Supervisor −1 · HR +1'),
  'Participant replaced': I('Tanvir Hasan → Sadia Islam · roster stays 32', ['Participant list updated'], ['Sadia Islam · invitation', 'Tanvir Hasan · withdrawn', 'Both supervisors · CC'], ['Outlook', 'Email'], 'Inclusion + exclusion emails', 'Roster unchanged at 32'),
  'Attendance submitted': I('Attendance written to the training database', ['Training database', '30 learning records'], ['Attendees · learning history', 'Supervisors · team view'], ['Teams (12 synced)', 'Attendance system', 'HRIS'], 'Feedback requests released', 'Learning hours +480 · cost per employee recalculated'),
  'Feedback submitted': I('Feedback captured', ['Feedback response'], ['HR Admin · insight updated', 'Trainer · score updated'], ['On-prem NLP (simulated)'], 'None', 'Feedback score 4.6 / 5'),
  'Training completed': I('Training closed · cost per employee published', ['Training 20260182 · Completed', 'TR-2026-00418 · Closed'], ['Division Head · notified', 'Management · dashboard'], ['Power BI dataset (simulated)'], 'Division Head notified', 'Investment +BDT 13.9 lakh'),
  'Assessment result released': I('Post-training assessment results released', ['Results for every attendee', 'Learning records updated'], ['Employees · result available', 'Supervisors · pass / fail on dashboard', 'HR · re-attempts to assign'], ['Training database'], 'Result emails sent', 'Pass rate published'),
  'Integrity review cleared': I('Integrity review cleared by the trainer', ['Assessment integrity · Cleared'], ['Trainer · next: score decision'], ['Audit / SIEM'], 'None', '—'),
  'Request forwarded': I('Request assigned to another HR Admin', ['TR-2026-00418 · Forwarded'], ['Assigned HR Admin · new task'], [], 'Assignee notified', '—'),
  'Attendance marked': I('Attendance updated', ['Attendance register'], ['HR Admin'], ['Training database (on submit)'], 'None', '—'),
  'Course completed': I('Course completed · certificate issued', ['Certificate CERT-2026-088412'], ['Supervisor · compliance', 'HR · report'], ['HRIS'], 'Certificate emailed', 'Mandatory compliance +0.1%'),
};

/* ---------------- Guided journey: 24 plain-language steps over the 20 tour actions ---------------- */
export interface JourneyStep {
  title: string; short: string; explain: string; result: string; who: Role | 'system';
  tour: number[]; impactKey?: string; customDone?: (s: S) => boolean; route?: { role: Role; to: string; emp?: string }; cta?: string; action?: string;
  /** Optional dashboard stops for the presenter (change no records). `after` = show once this step is done. */
  showcase?: Showcase[];
  /** Annexure-II references, or a "proposed" note for demo additions. */
  fr: string;
  /** For employee steps: which employee is acting (person banner). */
  person?: string;
}
export interface Showcase { role: Role; to: string; label: string; why: string; when: 'during' | 'after'; emp?: string }
const SUP: Pick<Showcase, 'role' | 'to'> = { role: 'supervisor', to: '/supervisor/team' };
export const JOURNEY: JourneyStep[] = [
  { title: 'Training Needs Assessment / Divisional Requirement', short: 'Divisional requirement identified', who: 'division_head', fr: 'FR 15, 186', tour: [], customDone: (s) => s.needConfirmed || s.requestSubmitted, route: { role: 'division_head', to: '/division' }, cta: 'Start with the needs assessment', action: 'Review the learning need and the AI recommendation, then raise the training request', impactKey: 'Business need identified', explain: `Every City Bank learning programme begins with a divisional requirement. Corporate Banking’s competency data shows ${GAP_TEXT} officers below target in Credit Analysis.`, result: 'Farzana Haque, Division Head, will submit a training request to HR.' },
  { title: 'Division Head submits a training request', short: 'Request submitted', who: 'division_head', fr: 'FR 14, 49–64', tour: [0], impactKey: 'Training request submitted', explain: 'Farzana Haque asks HR for Advanced Credit Risk Management for the officers identified in her division.', result: 'HR has received the request. Next, HR reviews it and creates a nomination request.' },
  { title: 'HR reviews the request', short: 'Request reviewed', who: 'hr', fr: 'FR 65–66', tour: [1], impactKey: 'Request accepted for nomination', showcase: [{ role: 'hr', to: '/r/hr', label: 'HR operations dashboard', why: 'The new request arriving in HR’s work for today', when: 'during' }], explain: 'Nusrat Jahan checks the need, budget headroom and trainer availability, then decides: create a nomination request, schedule directly, or forward to another HR Admin.', result: 'The request is accepted. Next, HR creates a nomination request.' },
  { title: 'HR creates the nomination request', short: 'Nomination request sent', who: 'hr', fr: 'FR 67–87', tour: [2], impactKey: 'Nomination request sent', explain: 'HR sets the programme, trainers and deadline, chooses the divisions and Learning Champions, and sends the email with the nomination link.', result: 'Learning Champions can now nominate employees.' },
  { title: 'Learning Champion nominates employees', short: 'Employees nominated', who: 'division_head', fr: 'FR 88', tour: [3], impactKey: 'Nominations submitted', explain: 'Each Learning Champion picks the right people from their division before the deadline.', result: '35 employees were nominated. The system is checking leave, calendar and training conflicts.' },
  { title: 'System checks HRIS, leave and calendar conflicts', short: 'Conflicts checked', who: 'system', fr: 'FR 10, 114, 244', tour: [], customDone: (s) => s.conflictsChecked, route: { role: 'hr', to: '/hr/nomination-status' }, cta: 'Run the conflict checks', action: 'Run the HRIS, leave and calendar checks on the nominees', explain: 'ELDP checks every nominee against HRIS, leave management, Outlook calendars and other trainings (simulated integrations).', result: '4 nominees need attention: approved leave, a calendar clash, an overlapping training and a retirement.' },
  { title: 'HR reviews nomination status', short: 'Nomination status reviewed', who: 'hr', fr: 'FR 89–91', tour: [], customDone: (s) => Object.keys(s.resolutions).length > 0 || s.finalized, route: { role: 'hr', to: '/hr/nomination-status' }, cta: 'Review eligibility and conflicts', action: 'Keep or remove the flagged nominees, one by one or together', explain: 'HR opens each flagged nominee to see what HRIS, leave management and Outlook say, then keeps or removes them with a reason.', result: 'The flagged nominees have decisions. HR can now lock the participant list.' },
  { title: 'HR finalises participants', short: 'Participants finalised', who: 'hr', fr: 'FR 89–91, 114', tour: [4], impactKey: 'Participants finalized', explain: 'HR confirms the decisions on flagged nominees and locks the participant list.', result: '32 participants have been finalised. HR can now create the training programme.' },
  { title: 'HR creates the training programme', short: 'Programme created', who: 'hr', fr: 'FR 92–131', tour: [5], impactKey: 'Training scheduled', showcase: [{ role: 'hr', to: '/hr/setup?tab=calendar', label: 'Annual training calendar', why: 'The new batch in the month view with the bank’s other programmes', when: 'after' }], explain: 'Training Scheduling loads the nomination profile, then HR sets the trainers, venue, participants, notifications, feedback and undertaking.', result: 'The programme is saved and the budget goes to Finance (proposed workflow).' },
  { title: 'HR sends invitations', short: 'Invitations sent', who: 'hr', fr: 'FR 116–121', tour: [7], impactKey: 'Invitations sent', explain: 'The organizer, trainers and participants are invited by email and calendar (SMS and WhatsApp simulated). Supervisors are copied.', result: 'Invitations have gone to every participant and both trainers.' },
  { title: 'Trainer accepts or rejects facilitation', short: 'Trainer confirmed', who: 'trainer', fr: 'FR 17–19', tour: [8], impactKey: 'Facilitation accepted', showcase: [{ role: 'trainer', to: '/r/trainer', label: 'Trainer dashboard', why: 'Sessions, the invitation and evaluations due', when: 'during' }], explain: 'Nafis Ahmed confirms he will facilitate and uploads his case pack. A rejection would need a reason, and HR would reassign the session.', result: 'The trainer is confirmed. Employees are now responding to their invitations.' },
  { title: 'Trainer sets up the course', short: 'Course set up', who: 'trainer', fr: 'FR 19, 190–198, 210', tour: [20], impactKey: 'Course set up', showcase: [{ role: 'trainer', to: '/learning/hub?tab=manage', label: 'Course management', why: 'This course beside the e-learning catalogue: formats, versions and enrolments', when: 'after' }], explain: 'Nafis Ahmed sets the modules, the assessment and the AI course assistant before participants start.', result: 'The course is ready for participants.' },
  { title: 'Tanvir Hasan requests withdrawal', short: 'Withdrawal requested', who: 'employee', person: 'e2', fr: 'FR 1, 119', tour: [10], impactKey: 'Withdrawal requested', explain: 'Tanvir Hasan, Credit Analyst, has a client meeting on 18 Nov (flagged at nomination). He chooses Withdraw Request and gives a reason.', result: 'Tanvir’s request has gone to his supervisor, Mahmud Karim.' },
  { title: 'Supervisor approves withdrawal or proposes a replacement', short: 'Replacement proposed', who: 'supervisor', fr: 'FR 9–10, 119', tour: [11], impactKey: 'Replacement proposed', showcase: [{ ...SUP, label: 'Supervisor team dashboard', why: 'Approvals waiting from Mahmud Karim’s team', when: 'during' }], explain: 'Mahmud Karim sees all active requests from his team. He approves Tanvir’s withdrawal with a replacement after a live eligibility check.', result: 'A replacement has been proposed. HR gives the final approval.' },
  { title: 'HR approves the replacement', short: 'Replacement approved', who: 'hr', fr: 'FR 119', tour: [12], impactKey: 'Participant replaced', explain: 'HR confirms the change. The replacement is invited, Tanvir is released, and both supervisors are copied.', result: 'The participant list stays at 32.' },
  { title: 'Ayesha Rahman accepts the invitation', short: 'Ayesha accepted', who: 'employee', person: 'e1', fr: 'FR 2, 119', tour: [9], impactKey: 'Invitation accepted', explain: 'Ayesha Rahman, Relationship Manager, accepts. The training goes into her calendar.', result: 'Ayesha is confirmed. Next, Tanvir responds to his invitation.' },
  { title: 'Ayesha Rahman takes the course', short: 'Course modules done', who: 'employee', person: 'e1', fr: 'FR 190–198', tour: [21], impactKey: 'Course started', showcase: [{ role: 'employee', emp: 'e1', to: '/learning/hub', label: 'Ayesha’s learning hub', why: 'Progress, last viewed course, bookmarks, goals, points and badges', when: 'during' }], explain: 'After accepting, Ayesha opens the course overview, works through the modules and asks the AI assistant.', result: 'Ayesha is learning before the classroom days.' },
  { title: 'Attendance is recorded', short: 'Attendance recorded', who: 'hr', fr: 'FR 3, 137–143', tour: [13], impactKey: 'Attendance submitted', showcase: [{ ...SUP, label: 'Supervisor team dashboard', why: 'Who attended, and who missed which day', when: 'after' }], explain: 'On each training day employees self-mark, Teams adds online attendance, and HR completes the register for Day 1 and Day 2.', result: 'Attendance is written to the training database and learning records.' },
  { title: 'Ayesha Rahman submits the assessment', short: 'Assessment submitted', who: 'employee', person: 'e1', fr: 'FR 210–212', tour: [22], impactKey: 'Assessment submitted', showcase: [{ role: 'trainer', to: '/assessment/integrity/pta-e1', label: 'Proctoring evidence review', why: 'Face match, the event timeline and frames from Ayesha’s secure exam', when: 'after' }], explain: 'After the training days, participants answer objective and descriptive questions.', result: 'The answers go to the trainer for evaluation.' },
  { title: 'Trainer evaluates the assessment', short: 'Assessment evaluated', who: 'trainer', fr: 'FR 210–217', tour: [17], impactKey: 'Assessment result released', showcase: [{ ...SUP, label: 'Supervisor team dashboard', why: 'Who passed and who failed in Mahmud Karim’s team', when: 'after' }, { role: 'division_head', to: '/division', label: 'Corporate Banking training needs', why: 'The learning need and department progress across Corporate Banking', when: 'after' }, { role: 'employee', emp: 'e1', to: '/employee/certificates', label: 'Ayesha Rahman’s certificate', why: 'Her certificate is generated in her profile once the result is published', when: 'after' }], explain: 'Every attendee took the Advanced Credit Risk Management assessment. The trainer reviews integrity, decides the AI-suggested score, and releases the results.', result: 'Results are released: who passed, who failed, and who needs a re-attempt.' },
  { title: 'Employees submit feedback', short: 'Feedback submitted', who: 'employee', person: 'e1', fr: 'FR 4, 221–222', tour: [14], impactKey: 'Feedback submitted', showcase: [{ role: 'hr', to: '/feedback?tab=analytics', label: 'Feedback & sentiment', why: 'Trainer comparison, trend and themes with this feedback included', when: 'after' }], explain: 'Each participant rates the content, the trainer, relevance and logistics.', result: 'Feedback is saved. HR can review the themes before closing the training.' },
  { title: 'HR closes the training', short: 'Training closed', who: 'hr', fr: 'FR 132–136, 142', tour: [15], impactKey: 'Training completed', showcase: [{ role: 'hr', to: '/reports?type=investment', label: 'Investment & division report', why: 'Actual expense and cost per employee against the division budgets', when: 'after' }], explain: 'HR reviews feedback, records the approval no., payment no. and actual expense, and closes the training.', result: 'The training is closed. Cost per employee and learning hours are published.' },
  { title: 'Employee learning records update', short: 'Records updated', who: 'system', fr: 'FR 5, 170', tour: [], customDone: (s) => s.recordSynced, route: { role: 'employee', to: '/employee/record', emp: 'e1' }, cta: 'Update the learning record', action: 'Write the closed training into Ayesha’s learning record', explain: 'ELDP writes attendance, hours and feedback into every participant’s learning record and the training database.', result: 'Ayesha’s record shows the completed programme and 16 learning hours.' },
  { title: 'Management sees workforce insight', short: 'Insight delivered', who: 'management', fr: 'FR 168, 175–185, 208 · Management role proposed', tour: [19], showcase: [{ role: 'management', to: '/r/management', label: 'Management dashboard', why: 'Bank-wide KPIs, investment trend and division comparison', when: 'during' }], explain: 'Management and supervisors see who completed, who failed, who still needs training, and how each department is progressing.', result: 'Every record in this story is now visible in the dashboards.' },
];

export const journeyDone = (j: JourneyStep, s: S) => (j.customDone ? j.customDone(s) : j.tour.every((i) => TOUR[i].done(s)));
export const journeyIndex = (s: S) => { const i = JOURNEY.findIndex((j) => !journeyDone(j, s)); return i === -1 ? JOURNEY.length : i; };
/** The concrete next click for a journey step: the first unfinished tour action inside it. */
export function journeyAction(j: JourneyStep, s: S): { role: Role; to: string; emp?: string; cta: string; label: string } {
  const t = j.tour.map((i) => TOUR[i]).find((x) => !x.done(s)) ?? (j.tour.length ? TOUR[j.tour[j.tour.length - 1]] : undefined);
  if (t) return { role: t.role, to: t.to, emp: t.emp, cta: t.cta, label: t.label };
  const r = j.route!;
  return { role: r.role, to: r.to, emp: r.emp, cta: j.cta ?? 'Open this step', label: j.action ?? j.cta ?? j.title };
}
/** Pathnames where a step's work happens (used to show the right guidance note). */
export const journeyScreens = (j: JourneyStep) => (j.tour.length ? j.tour.map((i) => TOUR[i].to.split('?')[0]) : j.route ? [j.route.to] : []);
export const journeyEvent = (j: JourneyStep, s: S) => (j.impactKey ? s.audit.find((a) => a.action === j.impactKey) : undefined);

/** Dashboard stops for the current moment: this step's "during" stops + the previous finished step's "after" stops. */
export function showcasesNow(s: S): Showcase[] {
  const ji = journeyIndex(s);
  const out: Showcase[] = [];
  if (ji < JOURNEY.length) out.push(...(JOURNEY[ji].showcase ?? []).filter((x) => x.when === 'during'));
  for (let i = ji - 1; i >= 0 && i >= ji - 2; i--) out.push(...(JOURNEY[i].showcase ?? []).filter((x) => x.when === 'after'));
  return out;
}
/** Each role's dashboard, used when hand-offs land on the dashboard first (P2). */
export const ROLE_DASHBOARD: Partial<Record<Role, string>> = { division_head: '/division', hr: '/r/hr', finance: '/r/finance', trainer: '/r/trainer', supervisor: '/supervisor/team' };
