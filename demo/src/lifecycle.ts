import type { Role } from './types';
import type { useDemo } from './store';

type S = ReturnType<typeof useDemo.getState>;

export interface Stage {
  key: string;
  label: string;
  module: string;
  owner: Role | 'system';
  affected: Role[];
  integrations: string[];
  next: string;
  done: (s: S) => boolean;
  route: { role: Role; to: string };
  detail: (s: S) => { records: string; pending: string };
}

const T = 'TRN-2026-00182';

export const STAGES_LC: Stage[] = [
  { key: 'need', label: 'Need', module: 'TNA · Competency', owner: 'division_head', affected: ['hr'], integrations: ['HRIS', 'Performance'], next: 'Division Head raises a training request', done: () => true, route: { role: 'division_head', to: '/division-head/dashboard' }, detail: () => ({ records: 'Credit Analysis gap: 2 levels across 32 officers', pending: 'Identified by competency matrix' }) },
  { key: 'request', label: 'Request', module: 'Training Management', owner: 'division_head', affected: ['hr'], integrations: ['HRIS'], next: 'HR Admin reviews and schedules', done: (s) => s.requestSubmitted, route: { role: 'division_head', to: '/division-head/training-request/new' }, detail: (s) => ({ records: s.requestSubmitted ? 'TR-2026-00418 · Pending → Scheduled' : 'No request yet', pending: s.requestSubmitted ? 'HR review' : 'Division Head to submit' }) },
  { key: 'schedule', label: 'Schedule', module: 'Training Management', owner: 'hr', affected: ['division_head', 'trainer'], integrations: ['Meeting Room', 'Outlook', 'Teams / Zoom'], next: 'HR requests nominations', done: (s) => s.scheduled, route: { role: 'hr', to: `/hr/training/${T}/schedule` }, detail: (s) => ({ records: s.scheduled ? `${T} · 18–19 Nov · Learning Center` : s.scheduleStarted ? `${T} draft · venue check running` : 'Training ID not generated', pending: s.scheduled ? 'None' : 'Review, venue check, publish' }) },
  { key: 'nominate', label: 'Nomination', module: 'Training Management', owner: 'division_head', affected: ['hr', 'supervisor', 'employee'], integrations: ['HRIS', 'Leave', 'Calendar'], next: 'HR finalises participants', done: (s) => s.finalized, route: { role: 'division_head', to: '/learning-champion/nominations' }, detail: (s) => ({ records: s.finalized ? '32 participants finalised' : s.nominationSubmitted ? '35 nominated · 4 conflicts' : s.nominationRequested ? 'Awaiting nominations' : 'Not requested', pending: s.finalized ? 'None' : s.nominationSubmitted ? 'HR resolves 4 conflicts' : 'Nomination by divisions' }) },
  { key: 'participate', label: 'Participate', module: 'Notifications · Attendance', owner: 'employee', affected: ['supervisor', 'hr', 'trainer'], integrations: ['Outlook', 'SMS', 'WhatsApp', 'Teams'], next: 'HR submits attendance', done: (s) => s.attendanceSubmitted, route: { role: 'employee', to: '/employee/dashboard' }, detail: (s) => ({ records: s.invitesSent ? 'Invitations queued · replacement handled' : 'Invitations not sent', pending: s.withdrawal.status === 'requested' ? 'Supervisor decision' : s.withdrawal.status === 'proposed' ? 'HR approval' : s.attendanceSubmitted ? 'None' : 'Accept · attend' }) },
  { key: 'learn', label: 'Learn', module: 'e-Learning', owner: 'employee', affected: ['supervisor', 'hr'], integrations: ['IAM / SSO'], next: 'Employee completes mandatory course', done: (s) => s.courseCompleted, route: { role: 'employee', to: '/learning/course/info-security-2026' }, detail: (s) => ({ records: `Information Security Awareness · ${s.courseProgress}%`, pending: s.courseCompleted ? 'None' : 'Complete modules' }) },
  { key: 'assess', label: 'Assess', module: 'Assessment', owner: 'trainer', affected: ['employee', 'hr'], integrations: ['Proctoring (on-prem AI)'], next: 'Evaluator decides result', done: (s) => s.proctorFlag !== 'Review Required' && s.aiScore.state !== 'suggested', route: { role: 'trainer', to: '/assessment/aml-certification' }, detail: (s) => ({ records: `AML Certification · ${s.proctorFlag}`, pending: s.aiScore.state === 'suggested' ? 'Evaluator review' : 'None' }) },
  { key: 'feedback', label: 'Feedback', module: 'Feedback / Survey', owner: 'employee', affected: ['hr', 'trainer'], integrations: ['Email', 'Push'], next: 'L&D reviews AI-assisted insight', done: (s) => s.feedbackSubmitted, route: { role: 'employee', to: '/employee/feedback' }, detail: (s) => ({ records: s.feedbackSubmitted ? '4.6 / 5 · 89% positive' : 'Not opened', pending: s.attendanceSubmitted && !s.feedbackSubmitted ? 'Employee feedback' : 'None' }) },
  { key: 'record', label: 'Record', module: 'Training Database', owner: 'system', affected: ['employee', 'supervisor', 'hr'], integrations: ['HRIS', 'Power BI'], next: 'Competency movement is recalculated', done: (s) => s.attendanceSubmitted, route: { role: 'employee', to: '/employee/learning-history' }, detail: (s) => ({ records: s.attendanceSubmitted ? 'Learning history updated for all attendees' : 'Waiting for attendance', pending: 'Automatic' }) },
  { key: 'develop', label: 'Develop', module: 'Competency · Journey', owner: 'supervisor', affected: ['employee', 'hr'], integrations: ['Performance'], next: 'Gap closes level by level', done: (s) => s.journeyDone >= 5, route: { role: 'hr', to: '/hr/competencies' }, detail: (s) => ({ records: `Learning journey ${s.journeyDone} / 5`, pending: 'Next milestone' }) },
  { key: 'analyse', label: 'Analyse', module: 'Reporting · AI', owner: 'hr', affected: ['division_head', 'admin'], integrations: ['Power BI', 'SIEM'], next: 'Management decisions', done: (s) => s.completed, route: { role: 'hr', to: '/hr/analytics' }, detail: (s) => ({ records: s.completed ? 'Cost, hours and investment published' : 'Updates on completion', pending: 'Executive review' }) },
];

export const activeStage = (s: S) => {
  const i = STAGES_LC.findIndex((x) => !x.done(s));
  return i === -1 ? STAGES_LC.length : i;
};

export const MODULES_ALL = ['Training Management', 'e-Learning', 'Assessment', 'Feedback', 'TNA', 'Competency', 'Learning Journey', 'Knowledge Corner', 'Library', 'Reporting', 'Notifications', 'Integrations', 'Audit & Security'];

export const MODULE_ACTIVE: Record<string, string[]> = {
  need: ['TNA', 'Competency'],
  request: ['Training Management', 'Notifications', 'Audit & Security'],
  schedule: ['Training Management', 'Integrations', 'Notifications'],
  nominate: ['Training Management', 'Integrations', 'Notifications'],
  participate: ['Training Management', 'Notifications', 'Integrations'],
  learn: ['e-Learning', 'Knowledge Corner'],
  assess: ['Assessment', 'Audit & Security'],
  feedback: ['Feedback'],
  record: ['Training Management', 'Reporting'],
  develop: ['Competency', 'Learning Journey'],
  analyse: ['Reporting', 'Integrations'],
};

export const ROLE_LABEL: Record<Role, string> = { employee: 'Employee', supervisor: 'Supervisor', division_head: 'Division Head', trainer: 'Trainer', hr: 'HR Admin', admin: 'System Admin' };

export interface ImpactDef { headline: string; records: string[]; users: string[]; integrations: string[]; audit: string; analytics: string; notifications: string }

export const IMPACTS: Record<string, ImpactDef> = {
  'Training request submitted': { headline: 'Request TR-2026-00418 created', records: ['TR-2026-00418 created', 'Status: Pending HR Review'], users: ['HR Admin · 1 new request in inbox', 'Division Head · status updated'], integrations: ['HRIS (requester validated)'], audit: 'Submission event recorded', analytics: 'Pending requests +1', notifications: 'HR notification generated' },
  'Request opened for scheduling': { headline: 'Request moved to Under Review', records: ['TR-2026-00418 → Under Review', 'TRN-2026-00182 draft created'], users: ['Division Head · status changed'], integrations: ['Meeting room availability'], audit: 'Review event recorded', analytics: 'Pending requests unchanged', notifications: 'None' },
  'Training scheduled': { headline: 'TRN-2026-00182 published', records: ['Training program', 'Participant list shell', 'Training calendar'], users: ['Division Head · nomination next', '2 Trainers · assigned', '1 HR Admin · owner'], integrations: ['Outlook', 'Meeting Room', 'Teams / Zoom'], audit: '3 events recorded', analytics: 'Active Programs +1', notifications: 'Division Head notified' },
  'Nomination requested': { headline: 'Nomination request sent to 4 divisions', records: ['Nomination request · deadline 14 Nov'], users: ['Division Head / Learning Champions · 4 divisions'], integrations: ['HRIS', 'Leave', 'Calendar'], audit: '1 event recorded', analytics: 'Open nominations +1', notifications: 'Email with nomination link queued' },
  'Nominations submitted': { headline: '35 employees nominated', records: ['Nomination list · 35'], users: ['HR Admin · conflicts to resolve', '6 Supervisors · informed'], integrations: ['HRIS ✓', 'Leave · 1 conflict', 'Calendar · 2 conflicts', 'Training DB · 1 overlap'], audit: '1 event recorded', analytics: 'Eligible 31 · Attention 4', notifications: 'HR notified' },
  'Participants finalized': { headline: '32 participants finalised', records: ['Participant roster locked · 32'], users: ['3 nominees removed · notified', 'Supervisors informed'], integrations: ['HRIS'], audit: 'Override + removals recorded', analytics: 'Participants +32', notifications: 'Ready to send invitations' },
  'Invitations queued': { headline: '32 invitations and 2 trainer invitations queued', records: ['Invitations · 32', 'Calendar events · 34'], users: ['32 Employees', '6 Supervisors (CC)', '2 Trainers', '1 HR Admin'], integrations: ['Outlook', 'Email', 'SMS', 'WhatsApp', 'Push'], audit: '1 event recorded', analytics: 'Invitations sent +32', notifications: '34 notifications queued (simulated)' },
  'Invitation accepted': { headline: 'Participation confirmed', records: ['Participation: Accepted'], users: ['HR Admin · acceptance count updated'], integrations: ['Outlook calendar'], audit: '1 event recorded', analytics: 'Acceptance rate updated', notifications: 'Supervisor CC' },
  'Withdrawal requested': { headline: 'Withdrawal request routed to Supervisor', records: ['Participation: Withdrawal Requested'], users: ['Supervisor · 1 pending approval', 'HR Admin · informed'], integrations: ['Leave / Calendar context'], audit: '1 event recorded', analytics: 'Pending approvals +1', notifications: 'Supervisor notified' },
  'Replacement proposed': { headline: 'Sadia Islam proposed as replacement', records: ['Withdrawal → Replacement Proposed'], users: ['HR Admin · final approval needed'], integrations: ['HRIS ✓', 'Leave ✓', 'Calendar ✓', 'Mandatory requirement ✓'], audit: '1 event recorded', analytics: 'Pending approvals: Supervisor −1, HR +1', notifications: 'HR notified' },
  'Participant replaced': { headline: 'Tanvir Hasan → Sadia Islam · count stays 32', records: ['Participant roster updated', 'Replacement invitation issued'], users: ['Sadia Islam · new invitation', 'Tanvir Hasan · withdrawn', 'Supervisor · closed'], integrations: ['Outlook', 'Email'], audit: 'Maker-checker approval recorded', analytics: 'Roster unchanged at 32', notifications: 'Inclusion + exclusion emails queued' },
  'Attendance submitted': { headline: 'Attendance propagated across ELDP', records: ['Employee learning records', 'Training database'], users: ['Every attendee · learning history', 'Supervisors · team view', 'HR Admin'], integrations: ['Teams (12 synced)', 'HRIS'], audit: '1 event recorded', analytics: 'Learning hours +480 · cost per employee recalculated', notifications: 'Feedback requests released' },
  'Feedback submitted': { headline: 'Feedback captured', records: ['Feedback response'], users: ['HR Admin · AI-assisted insight updated', 'Trainer · score updated'], integrations: ['On-prem NLP service'], audit: '1 event recorded', analytics: 'Feedback score 4.6 / 5', notifications: 'None' },
  'Training completed': { headline: 'Training closed and published to analytics', records: ['TRN-2026-00182 → Completed', 'TR-2026-00418 → Closed'], users: ['Division Head', 'Management'], integrations: ['Power BI dataset refreshed'], audit: '1 event recorded', analytics: 'Investment +14.4 lakh', notifications: 'Division Head notified' },
  'Course completed': { headline: 'Course completed · certificate issued', records: ['Enrollment complete', 'Certificate CERT-2026-088412'], users: ['Employee · dashboard', 'Supervisor · compliance', 'HR Admin · report'], integrations: ['HRIS'], audit: '1 event recorded', analytics: 'Mandatory compliance +0.1%', notifications: 'Certificate delivered' },
};
