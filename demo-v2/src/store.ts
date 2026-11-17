import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFLICT_IDS, NOMINEE_LIST, PERSONAS, TRAINING } from './data';
import { creditGap, DIRECTORY, findById, GAP_TEXT, VENUES, type Person } from './org';
import { idpPeople } from './tnaData';
import { BOOKMARKS_SEED, DOWNLOADS_SEED, FORUM, GOALS, MAKER_CHECKER, PERMISSIONS, USERS, type Exam, type ForumPost, type Goal, type MakerCheck, type Question, type UserRow } from './seed/bank';
import type { Attendance, AuditEvent, Employee, Notice, Participation, Role } from './types';

/* ================================================================== */
/* Shapes                                                              */
/* ================================================================== */
export interface TrainerRow { trainerId: string; name: string; topic: string; duration: string }

export interface RequestDraft {
  title: string;
  category: string;
  competency: string;
  mode: string; // FR 27 · Mode of Training
  medium: string; // FR 26 · Training Medium
  dates: string;
  duration: string;
  repeat: 'Single day' | 'Repeat daily' | 'Repeat weekly';
  repeatDays: number;
  venue: string;
  tags: string[];
  justification: string;
  trainer: string;
  trainers: TrainerRow[];
  participants: number;
  participantIds: string[];
  attachments: string[];
  /** Where the requirement came from (FR 186–188): competency gap, survey / nomination output, development requests. */
  sources: string[];
  savedAt: string | null;
}

/** Evidence chosen on the Training Needs Assessment page (FR 185–188). */
export interface TnaState {
  /** The AI-suggested training: a human decision is required before it is used. */
  recommendation: 'pending' | 'accepted';
  /** Include the competency and role gap in the requirement. */
  gap: boolean;
  /** Programme-wise survey / nomination output used as evidence. */
  survey: boolean;
  /** Individual development requests used as supporting evidence. */
  idpIds: string[];
  /** Other needs saved for the next TNA cycle (competencies or survey topics). */
  later: string[];
  /** Last generated justification, so a typed one is never overwritten. */
  why: string;
}
export const TNA_SOURCES = { gap: 'Competency and role gap', survey: 'Programme-wise survey / nomination output', idp: 'Individual development requests' } as const;

const T_ROWS: TrainerRow[] = [
  { trainerId: 't1', name: 'Nafis Ahmed', topic: 'Credit risk frameworks · portfolio case studies', duration: '6 h' },
  { trainerId: 't2', name: 'Dr. Farhan Chowdhury', topic: 'Regulatory credit risk (webinar)', duration: '3 h' },
];

export const DEFAULT_DRAFT: RequestDraft = {
  title: '',
  category: 'Functional',
  competency: 'Functional',
  mode: 'In-house',
  medium: 'Classroom',
  dates: '18–19 November 2026, 09:30–17:30',
  duration: '16 man-hours per participant',
  repeat: 'Repeat daily',
  repeatDays: 2,
  venue: 'City Bank Learning Center',
  tags: ['Credit', 'Risk', 'City Future Fit'],
  justification: '',
  trainer: 'Nafis Ahmed (Internal) + Dr. Farhan Chowdhury (External)',
  trainers: T_ROWS,
  participants: 32,
  participantIds: [],
  attachments: [],
  sources: [],
  savedAt: null,
};

export type WithdrawalStatus = 'none' | 'requested' | 'proposed' | 'approved' | 'rejected';
export type TrainerResponse = 'pending' | 'accepted' | 'rejected';
export type Day = 'd1' | 'd2';
export type AttSource = 'Self' | 'Teams' | 'HR';
export interface Withdrawal { status: WithdrawalStatus; empId: string; reason: string; supReason: string; replacementId: string }

export interface NominationSetup {
  title: string; dates: string; manHours: string; repeat: string; venue: string; category: string; mode: string; medium: string;
  tags: string[]; pdus: string; organizedBy: string; trainers: TrainerRow[];
  divisions: Record<string, boolean>; deadline: string; subject: string; body: string; docs: string[];
}
export interface ScheduleSetup {
  loadProfile: 'Yes' | 'No'; venue: string; trainers: TrainerRow[]; feedback: 'Yes' | 'No'; template: string;
  reminderTrainer: string; reminderParticipant: string; extraRecipients: string[];
  organizerSent: boolean; trainerInviteSent: boolean; feedbackSaved: boolean; listSaved: boolean; savedExit: boolean;
}
export interface PlannedFields {
  approvalNo: string; budgetApproved: string; paymentNo: string; actualExpense: string; docs: string[];
  status: 'Scheduled' | 'Rescheduled' | 'Postponed' | 'Deleted'; note: string; savedAt: string | null;
}
export interface Bond {
  id: string; eid: string; name: string; grade: string; designation: string; division: string; location: string;
  title: string; category: string; mode: string; medium: string; tags: string; institute: string;
  from: string; to: string; days: number; manHour: string;
  signDate: string; periodYears: number; periodWords: string; startDate: string; amount: number; amountWords: string;
}
export interface DbRow {
  eid: string; name: string; grade: string; designation: string; division: string; location: string;
  training: string; meta: string; institute: string; duration: string; manHour: string;
  source: 'Attendance' | 'Bond' | 'Single entry' | 'Bulk upload' | 'Migration' | 'Employee request' | 'Seed';
}
export interface PtAssessment {
  integrity: 'pending' | 'cleared' | 'flagged'; note: string;
  decision: 'pending' | 'accepted' | 'adjusted'; descriptive: number; reason: string;
  released: boolean; releaseMode: 'Instant' | 'Scheduled'; committeeCleared: boolean;
}
export interface Programme {
  id: string; title: string; date: string; venue: string; medium: string; mode: string;
  status: 'Scheduled' | 'Today' | 'Completed' | 'Postponed'; participants: number; attended: number | null; trainer: string; fromRequest?: string;
}
export interface Enrollment {
  id: string; course: string; personId: string; progress: number; due: string;
  status: 'Completed' | 'In progress' | 'Overdue' | 'Not started'; reminded: boolean;
}
export interface Arrival { path: string; from: string; text: string; at: string; key?: string }

export type ProctorKind = 'tab' | 'focus' | 'face' | 'multi' | 'gaze' | 'head' | 'copy';
export interface ProctorEvent { t: number; kind: ProctorKind; detail: string; mark?: 'ok' | 'concern' }
export interface Attempt {
  id: string; examId: string; empId: string; name: string; started: string; answers: Record<string, number>; flagged: string[];
  events: ProctorEvent[]; submitted: boolean; score: number | null; total: number; faceMatch: number;
  decision: 'pending' | 'cleared' | 'flagged' | 'withheld'; reason: string;
}
/** Scripted proctoring events (fully simulated, FR 212): fired during the exam and filled in on submit. */
export const PROCTOR_SCRIPT: ProctorEvent[] = [
  { t: 38, kind: 'tab', detail: 'Switched to another browser tab for 6 s' },
  { t: 95, kind: 'gaze', detail: 'Gaze away from the screen for 4 s' },
  { t: 140, kind: 'copy', detail: 'Copy attempt on question text blocked' },
  { t: 205, kind: 'head', detail: 'Head turned left for 5 s' },
  { t: 262, kind: 'focus', detail: 'Exam window lost focus for 3 s' },
  { t: 330, kind: 'face', detail: 'Face not visible for 2 s' },
];
const seedAttempt = (id: string, examId: string, empId: string, name: string, n: number, score: number, decision: Attempt['decision'] = 'pending'): Attempt => ({
  id, examId, empId, name, started: '11 Nov 2026, 10:00', answers: {}, flagged: [], events: PROCTOR_SCRIPT.slice(0, n).map((e) => ({ ...e })), submitted: true, score, total: 100, faceMatch: 96 - n, decision, reason: decision === 'cleared' ? 'Events explained by the candidate; no integrity concern.' : '',
});
export const SEED_ATTEMPTS: Record<string, Attempt> = {
  'pta-e1': seedAttempt('pta-e1', 'PTA', 'e1', 'Ayesha Rahman', 2, 86),
  'ex8-rahim': seedAttempt('ex8-rahim', 'EX008', 'r1', 'Rahim Uddin', 5, 72),
  'ex8-sumaiya': seedAttempt('ex8-sumaiya', 'EX008', 'r2', 'Sumaiya Rahman Mitu', 1, 81, 'cleared'),
  'ex6-rezaul': seedAttempt('ex6-rezaul', 'EX006', 'r3', 'Md. Rezaul Karim', 3, 88, 'cleared'),
};

export interface AdminSettings { portalTitle: string; language: 'English' | 'Bangla'; idleTimeout: number; bondLockIn: number; ssoMfa: boolean; makerChecker: boolean; smsWhatsapp: boolean; concurrentSessions: boolean }
export interface AdminState { mc: MakerCheck[]; perms: Record<string, boolean[]>; users: UserRow[]; settings: AdminSettings; synced: Record<string, string> }

export interface LearnState { lastViewed: string; bookmarks: string[]; downloads: { id: string; title: string; size: string; until: string }[]; goals: Goal[]; forum: ForumPost[]; extraPoints: number }

interface FlowState {
  role: Role;
  employeeId: string;
  clock: number;
  draft: RequestDraft;
  // the guided record (order follows Annexure-II)
  needConfirmed: boolean; // FR 186 · divisional requirement identified
  tna: TnaState; // FR 185–188 · evidence chosen on the TNA page
  requestSubmitted: boolean; // FR 14
  requestForward: { to: string; note: string; at: string } | null; // FR 66 Forward
  requestReturn: { note: string; at: string } | null; // proposed workflow
  requestForwards: Record<string, { to: string; note: string; at: string }>; // FR 66 · other queued requests
  reviewed: boolean; // FR 65-66
  nomSetup: NominationSetup; // FR 67-87
  nominationRequested: boolean;
  nominationSubmitted: boolean; // FR 88
  conflictsChecked: boolean; // FR 10, 114, 244 · HR runs the HRIS / leave / calendar checks
  recordSynced: boolean; // FR 5, 170 · learning records written after closure
  nominatedCount: number;
  nominatedIds: string[]; // who the Learning Champion actually submitted (FR 88)
  resolutions: Record<string, 'keep' | 'remove'>;
  resolutionReasons: Record<string, string>;
  finalized: boolean; // FR 89-91, 114
  schedulePath: 'profile' | 'direct'; // FR 66, 93-96
  sched: ScheduleSetup; // FR 92-131
  addedParticipants: string[]; // FR 113, 141 (DIRECTORY ids)
  scheduled: boolean;
  budgetApproved: boolean; // FR 135 (proposed Finance checker)
  budgetReturned: boolean;
  budgetReturnReason: string;
  invitesSent: boolean; // FR 116-118
  trainerResponse: TrainerResponse; // FR 17
  trainerReason: string;
  materialUploaded: boolean; // FR 19
  materialLinkRequested: boolean; // FR 19 · trainer asks HR to link
  courseSetup: boolean; // trainer set up modules, assessment and AI assistant
  courseModules: string[];
  tcourse: { started: boolean; done: number }; // Ayesha's progress in the training's course
  ptaSubmitted: boolean; // participant submitted the post-training assessment
  materialLinked: boolean;
  materialProtection: string;
  participation: Record<string, Participation>;
  withdrawal: Withdrawal; // FR 119 · story (Tanvir)
  otherWithdrawals: Record<string, Withdrawal>; // FR 1, 119 · any other employee
  selfMarked: Record<string, boolean>; // FR 3, 138
  attendance: Record<string, Attendance | undefined>; // Day 1
  attendance2: Record<string, Attendance | undefined>; // Day 2
  attSource: Record<string, AttSource>; // key `${day}:${id}`
  attendanceDraftAt: string | null;
  extraAttendees: { eid: string; name: string; status: 'requested' | 'approved' }[]; // FR 143
  attendanceSubmitted: boolean; // FR 142
  feedbackSubmitted: boolean; // FR 4
  feedback: { ratings: Record<string, number>; comment: string } | null;
  planned: PlannedFields; // FR 132-136
  completed: boolean;
  bondSaved: boolean; // FR 126-130
  bonds: Bond[]; // FR 144-167
  dbRows: DbRow[]; // FR 169-174
  recordRequest: 'none' | 'pending' | 'approved'; // FR 6, 172
  recordDetails: { title: string; institute: string; date: string; file: string };
  // learning
  courseProgress: number; // Ayesha (e1)
  courseCompleted: boolean;
  courseOthers: Record<string, { progress: number; completed: boolean }>;
  examStatus: 'upcoming' | 'in_progress' | 'submitted' | 'reviewed'; // standalone AML exam (FR 247)
  proctorFlag: 'Review Required' | 'Cleared' | 'Flagged';
  aiScore: { state: 'suggested' | 'accepted' | 'adjusted'; score: number };
  pta: PtAssessment; // post-training assessment for this training (FR 210-217)
  remediation: Record<string, 'Re-attempt scheduled' | 'Refresher assigned'>;
  journeyDone: number;
  execViewed: boolean;
  // operations (day to day)
  programmes: Programme[];
  enrollments: Enrollment[];
  // shell
  audit: AuditEvent[];
  notices: Notice[];
  toast: string | null;
  impact: { id: number; key: string } | null;
  undo: { label: string; snap: string } | null;
  arrival: Arrival | null;
  snaps: Record<number, string>;
  revisit: number | null;
  handoffTarget: 'task' | 'dashboard'; // P2 presenter setting
  stop: { label: string; path: string } | null; // open dashboard stop
  tour: boolean;
  showFr: boolean;
  presenter: boolean;
  /** UI language (FR 193): English or Bangla for the key screens. */
  lang: 'en' | 'bn';
  /** Learner workspace (FR 205): last viewed course, bookmarks, offline downloads, goals, forum. */
  learn: LearnState;
  /** Administration (FR 21, 244; maker-checker and settings are proposed, FR 248–249). */
  admin: AdminState;
  /** Exam attempts with simulated proctoring evidence; staff-created exams and questions (FR 210–220). */
  attempts: Record<string, Attempt>;
  customExams: Exam[];
  customQuestions: Question[];
  storyStep: number;
}

interface Actions {
  setRole: (r: Role) => void;
  setEmployee: (id: string) => void;
  setDraft: (p: Partial<RequestDraft>) => void;
  saveDraft: () => void;
  confirmNeed: () => void;
  setTna: (p: Partial<TnaState>) => void;
  /** Prepare the existing training request from the chosen evidence (division, officers, gap, recommendation, sources). */
  prepareRequest: (src?: { competency: boolean; survey: boolean; idpIds: string[] }) => void;
  submitRequest: () => void;
  forwardRequest: (to: string, note: string) => void;
  returnRequest: (note: string) => void;
  reviewRequest: () => void;
  scheduleDirect: (requestId: string, title: string) => void;
  setNomSetup: (p: Partial<NominationSetup>) => void;
  sendNomination: () => void;
  submitNominations: (count?: number, ids?: string[]) => void;
  resolve: (id: string, d: 'keep' | 'remove', reason?: string) => void;
  resolveMany: (ids: string[], d: 'keep' | 'remove', reason: string) => void;
  finalize: () => void;
  setSchedulePath: (p: 'profile' | 'direct') => void;
  setSched: (p: Partial<ScheduleSetup>) => void;
  addParticipants: (ids: string[]) => void;
  removeParticipants: (ids: string[], reason: string) => void;
  sendOrganizer: () => void;
  sendTrainerInvite: () => void;
  publishSchedule: () => void;
  approveBudget: () => void;
  returnBudget: (reason?: string) => void;
  resubmitBudget: () => void;
  sendInvites: () => void;
  trainerRespond: (r: 'accepted' | 'rejected', reason?: string) => void;
  uploadMaterial: () => void;
  requestMaterialLink: () => void;
  setupCourse: (modules: string[], assessment: string) => void;
  startTrainingCourse: () => void;
  completeModule: () => void;
  submitAssessment: () => void;
  checkConflicts: () => void;
  syncRecords: () => void;
  linkMaterial: (protection?: string) => void;
  accept: (id: string) => void;
  requestWithdrawal: (reason: string) => void;
  requestWithdrawalFor: (id: string, reason: string) => void;
  decideWithdrawal: (d: 'approve' | 'replace' | 'reject', reason?: string, replacementId?: string) => void;
  decideWithdrawalFor: (id: string, d: 'approve' | 'replace' | 'reject', reason: string, replacementId?: string) => void;
  hrApproveWithdrawal: () => void;
  hrRejectWithdrawal: () => void;
  hrDecideWithdrawalFor: (id: string, approve: boolean) => void;
  selfMark: (id: string) => void;
  mark: (id: string, a: Attendance, day?: Day) => void;
  markMany: (ids: string[], a: Attendance, day: Day) => void;
  markAll: (day?: Day) => void;
  syncOnline: (day?: Day) => void;
  saveAttendanceDraft: () => void;
  requestExtraAttendee: (eid: string, name: string) => void;
  approveExtraAttendee: (eid: string) => void;
  submitAttendance: () => void;
  submitFeedback: (ratings?: Record<string, number>, comment?: string) => void;
  unmark: (id: string, day: Day) => void;
  resolveReturn: (reply: string) => void;
  forwardRequestFor: (id: string, to: string, note: string) => void;
  setPlanned: (p: Partial<PlannedFields>) => void;
  savePlanned: () => void;
  plannedAction: (kind: 'Reschedule' | 'Postpone' | 'Delete', note: string) => void;
  complete: () => void;
  saveBond: () => void;
  saveBondRecord: (b: Bond, toDb: boolean) => void;
  updateBond: (id: string, p: Partial<Bond>) => void;
  addDbRows: (rows: DbRow[], source: DbRow['source']) => void;
  requestRecord: (d?: Partial<FlowState['recordDetails']>) => void;
  approveRecord: () => void;
  rejectRecord: () => void;
  setCourseProgress: (n: number) => void;
  completeCourse: () => void;
  setCourseProgressFor: (id: string, n: number) => void;
  completeCourseFor: (id: string) => void;
  setExam: (s: FlowState['examStatus']) => void;
  setProctor: (s: FlowState['proctorFlag']) => void;
  setAi: (s: 'accepted' | 'adjusted', score: number) => void;
  setIntegrity: (d: 'cleared' | 'flagged', note: string) => void;
  decideScore: (d: 'accepted' | 'adjusted', score: number, reason: string) => void;
  committeeClear: () => void;
  releaseResult: (mode: 'Instant' | 'Scheduled') => void;
  assignRemediation: (ids: string[], kind: 'Re-attempt scheduled' | 'Refresher assigned') => void;
  setJourney: (n: number) => void;
  viewExec: () => void;
  takeProgrammeAttendance: (id: string, attended: number) => void;
  sendReminders: (ids: string[]) => void;
  logEvent: (role: Role, action: string, detail: string) => void;
  withUndo: (label: string, fn: () => void) => void;
  undoLast: () => void;
  setArrival: (a: Arrival | null) => void;
  setRevisit: (n: number | null) => void;
  setHandoffTarget: (t: 'task' | 'dashboard') => void;
  setStop: (x: { label: string; path: string } | null) => void;
  rewindTo: (n: number) => void;
  advance: () => void;
  reset: () => void;
  dismissToast: () => void;
  clearImpact: () => void;
  setTour: (v: boolean) => void;
  setShowFr: (v: boolean) => void;
  setPresenter: (v: boolean) => void;
  setLang: (v: 'en' | 'bn') => void;
  viewCourse: (id: string) => void;
  decideMc: (id: string, decision: 'Approved' | 'Rejected') => void;
  proposePermission: (role: string, index: number, moduleName: string) => void;
  proposeRole: (eid: string, role: UserRow['role']) => void;
  setUserStatus: (eid: string, status: UserRow['status']) => void;
  saveSettings: (x: AdminSettings) => void;
  syncIntegration: (system: string) => void;
  startAttempt: (examId: string) => string;
  saveAttempt: (id: string, patch: Partial<Attempt>) => void;
  submitAttempt: (id: string, score: number, total: number) => void;
  markEvent: (id: string, index: number, mark: 'ok' | 'concern') => void;
  decideAttempt: (id: string, decision: 'cleared' | 'flagged' | 'withheld', reason: string) => void;
  publishExam: (e: Exam, draft: boolean) => void;
  addQuestion: (q: Question) => void;
  toggleBookmark: (id: string) => void;
  toggleDownload: (id: string, title: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  postForum: (course: string, text: string) => void;
  replyForum: (postId: string, text: string) => void;
  setStoryStep: (n: number) => void;
}

export type DemoState = FlowState & Actions;
export type { FlowState };

/* ================================================================== */
/* Seed (fictional demonstration data)                                 */
/* ================================================================== */
const SEED_BONDS: Bond[] = [
  { id: 'BND-2025-0098', eid: 'CBL-09844', name: 'Imran Hossain', grade: 'VP', designation: 'Senior Credit Analyst', division: 'Credit Administration', location: 'Motijheel', title: 'Executive Programme in Risk', category: 'Functional', mode: 'External-foreign', medium: 'Classroom', tags: 'Risk', institute: 'INSEAD', from: '02 Mar 2025', to: '14 Mar 2025', days: 13, manHour: '78', signDate: '20 Feb 2025', periodYears: 3, periodWords: 'Three years', startDate: '15 Mar 2025', amount: 600000, amountWords: 'Six lakh taka' },
  { id: 'BND-2026-0117', eid: 'CBL-10088', name: 'Sharmin Nahar', grade: 'SPO', designation: 'Senior Credit Analyst', division: 'Risk Management', location: 'Gulshan', title: 'Treasury Certification', category: 'Functional', mode: 'External-foreign', medium: 'Classroom', tags: 'Risk', institute: 'Singapore Institute of Banking', from: '01 Jun 2026', to: '12 Jun 2026', days: 12, manHour: '72', signDate: '25 May 2026', periodYears: 2, periodWords: 'Two years', startDate: '15 Jun 2026', amount: 400000, amountWords: 'Four lakh taka' },
  { id: 'BND-2026-0129', eid: 'CBL-08932', name: 'Kamrul Islam', grade: 'SPO', designation: 'Relationship Manager', division: 'Corporate Banking', location: 'Motijheel', title: 'Trade Finance (CDCS)', category: 'Functional', mode: 'External-local', medium: 'Classroom', tags: 'Foreign Trade', institute: 'BIBM', from: '20 Jul 2026', to: '31 Jul 2026', days: 10, manHour: '60', signDate: '15 Jul 2026', periodYears: 2, periodWords: 'Two years', startDate: '01 Aug 2026', amount: 150000, amountWords: 'One lakh fifty thousand taka' },
];
const SEED_DB: DbRow[] = [
  { eid: 'CBL-10120', name: 'Rashed Chowdhury', grade: 'SPO', designation: 'Relationship Manager', division: 'Corporate Banking', location: 'Gulshan', training: 'AML & CFT Refresher', meta: 'Mandatory · In-house · Classroom', institute: 'City Bank L&D', duration: '03 Nov 2026 · 1 day', manHour: '8', source: 'Seed' },
  { eid: 'CBL-09844', name: 'Imran Hossain', grade: 'VP', designation: 'Senior Credit Analyst', division: 'Credit Administration', location: 'Motijheel', training: 'Executive Programme in Risk', meta: 'Functional · External-foreign · Classroom', institute: 'INSEAD', duration: '02–14 Mar 2025 · 13 days', manHour: '78', source: 'Seed' },
];
const SEED_PROGRAMMES: Programme[] = [
  { id: '20260174', title: 'Customer Experience Excellence', date: '12 Nov 2026', venue: 'Chattogram Regional Training Room', medium: 'Classroom', mode: 'In-house', status: 'Today', participants: 24, attended: null, trainer: 'Sabina Yasmin' },
  { id: '20260179', title: 'AML & CFT Refresher', date: '24 Nov 2026', venue: 'Head Office Auditorium', medium: 'Classroom', mode: 'In-house', status: 'Scheduled', participants: 118, attended: null, trainer: 'Sabina Yasmin' },
  { id: '20260168', title: 'Leadership Essentials for Managers', date: '02 Dec 2026', venue: 'Executive Training Room', medium: 'Classroom', mode: 'External-local', status: 'Scheduled', participants: 20, attended: null, trainer: 'Ahsan Habib' },
  { id: '20260161', title: 'Sustainable Finance Fundamentals', date: '29 Oct 2026', venue: 'Webinar (Teams)', medium: 'Webinar', mode: 'In-house', status: 'Completed', participants: 28, attended: 26, trainer: 'Nafis Ahmed' },
];
const ENROLL_PROGRESS = [100, 100, 40, 0, 100, 80, 20, 100, 0, 55, 100, 30, 100, 90];
const SEED_ENROLL: Enrollment[] = DIRECTORY.slice(0, 14).map((p, i) => {
  const progress = p.id === 'e1' ? 65 : ENROLL_PROGRESS[i];
  const status: Enrollment['status'] = progress === 100 ? 'Completed' : [3, 8].includes(i) ? 'Overdue' : progress === 0 ? 'Not started' : 'In progress';
  return { id: `en${i + 1}`, course: 'Information Security Awareness 2026', personId: p.id, progress, due: '20 Nov 2026', status, reminded: false };
});

const initialNomSetup: NominationSetup = {
  title: TRAINING.title, dates: '18–19 November 2026 · 09:30–17:30', manHours: '16', repeat: 'Repeat daily · 2 days', venue: VENUES[0].name,
  category: TRAINING.category, mode: 'In-house', medium: 'Classroom', tags: [...TRAINING.tags], pdus: TRAINING.pdus, organizedBy: TRAINING.organizedBy,
  trainers: T_ROWS,
  divisions: { 'Corporate Banking': true, 'SME Banking': true, 'Risk Management': true, 'Credit Administration': true, 'Retail Banking': false },
  deadline: '2026-11-14T17:00',
  subject: 'Nomination required: {Training}',
  body: 'Dear {Learning Champion},\n\nPlease nominate eligible employees from your division for {Training} ({Dates}) by {Deadline}.\nPriority: Relationship Managers and Credit Analysts below target in Credit Analysis.\n\n{Nominate link}\n\nCity Bank L&D',
  docs: ['Programme_Outline.pdf', 'Eligibility_Criteria.pdf'],
};
const initialSched: ScheduleSetup = {
  loadProfile: 'Yes', venue: 'Executive Training Room', trainers: T_ROWS, feedback: 'Yes', template: 'Post-training · content, trainer, logistics (v3)',
  reminderTrainer: '2026-11-16', reminderParticipant: '2026-11-17', extraRecipients: [],
  organizerSent: false, trainerInviteSent: false, feedbackSaved: false, listSaved: false, savedExit: false,
};
const initialPlanned: PlannedFields = { approvalNo: '', budgetApproved: '14,40,000', paymentNo: '', actualExpense: '', docs: [], status: 'Scheduled', note: '', savedAt: null };
const initialPta: PtAssessment = { integrity: 'pending', note: '', decision: 'pending', descriptive: 7, reason: '', released: false, releaseMode: 'Instant', committeeCleared: false };

const initial: FlowState = {
  role: 'division_head',
  employeeId: 'e1',
  clock: 0,
  draft: DEFAULT_DRAFT,
  needConfirmed: false,
  tna: { recommendation: 'pending', gap: true, survey: false, idpIds: [], later: [], why: '' },
  requestSubmitted: false,
  requestForward: null,
  requestReturn: null,
  requestForwards: {},
  reviewed: false,
  nomSetup: initialNomSetup,
  nominationRequested: false,
  nominationSubmitted: false,
  conflictsChecked: false,
  recordSynced: false,
  nominatedCount: 0,
  nominatedIds: [],
  resolutions: {},
  resolutionReasons: {},
  finalized: false,
  schedulePath: 'profile',
  sched: initialSched,
  addedParticipants: [],
  scheduled: false,
  budgetApproved: false,
  budgetReturned: false,
  budgetReturnReason: '',
  invitesSent: false,
  trainerResponse: 'pending',
  trainerReason: '',
  materialUploaded: false,
  materialLinkRequested: false,
  courseSetup: false,
  courseModules: [],
  tcourse: { started: false, done: 0 },
  ptaSubmitted: false,
  materialLinked: false,
  materialProtection: 'Preview only + watermark',
  participation: {},
  withdrawal: { status: 'none', empId: 'e2', reason: '', supReason: '', replacementId: '' },
  otherWithdrawals: {},
  selfMarked: {},
  attendance: {},
  attendance2: {},
  attSource: {},
  attendanceDraftAt: null,
  extraAttendees: [],
  attendanceSubmitted: false,
  feedbackSubmitted: false,
  feedback: null,
  planned: initialPlanned,
  completed: false,
  bondSaved: false,
  bonds: SEED_BONDS,
  dbRows: SEED_DB,
  recordRequest: 'none',
  recordDetails: { title: 'CFA Level I', institute: 'CFA Institute', date: 'Aug 2026', file: 'CFA_L1_Result_2026.pdf' },
  courseProgress: 65,
  courseCompleted: false,
  courseOthers: { e2: { progress: 40, completed: false }, e4: { progress: 100, completed: true } },
  examStatus: 'upcoming',
  proctorFlag: 'Review Required',
  aiScore: { state: 'suggested', score: 7 },
  pta: initialPta,
  remediation: {},
  journeyDone: 2,
  execViewed: false,
  programmes: SEED_PROGRAMMES,
  enrollments: SEED_ENROLL,
  audit: [],
  notices: [],
  toast: null,
  impact: null,
  undo: null,
  arrival: null,
  snaps: {},
  revisit: null,
  handoffTarget: 'task',
  stop: null,
  tour: true,
  showFr: false,
  presenter: false,
  lang: 'en',
  attempts: { ...SEED_ATTEMPTS },
  admin: { mc: MAKER_CHECKER.map((m) => ({ ...m })), perms: Object.fromEntries(Object.entries(PERMISSIONS).map(([k, v]) => [k, [...v]])), users: USERS.map((u) => ({ ...u })), settings: { portalTitle: 'City Bank PLC — Learning Management System', language: 'English', idleTimeout: 15, bondLockIn: 12, ssoMfa: true, makerChecker: true, smsWhatsapp: true, concurrentSessions: false }, synced: {} },
  customExams: [],
  customQuestions: [],
  learn: { lastViewed: 'EL001', bookmarks: [...BOOKMARKS_SEED], downloads: DOWNLOADS_SEED.map((d) => ({ ...d })), goals: GOALS.map((g) => ({ ...g })), forum: FORUM.map((f) => ({ ...f, replies: [...f.replies] })), extraPoints: 0 },
  storyStep: 0,
};

/* ================================================================== */
/* Derived helpers (no business logic in JSX)                          */
/* ================================================================== */
const fmt = (n: number) => {
  const m = 40 + n * 3;
  return `12 Nov 2026 ${String(11 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const nowLabel = (s: Pick<FlowState, 'clock'>) => fmt(s.clock).slice(12);

const personToEmployee = (p: Person): Employee => ({ id: p.id, eid: p.eid, name: p.name, role: p.designation, division: p.division, supervisor: p.supervisor, leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' });

/** Final participant list: nominees not removed, plus replacements / added participants, minus withdrawn. */
export const roster = (s: Pick<FlowState, 'resolutions' | 'participation'> & Partial<Pick<FlowState, 'addedParticipants' | 'nominatedIds'>>): Employee[] => {
  const nominated = s.nominatedIds && s.nominatedIds.length ? new Set(s.nominatedIds) : null;
  const base = NOMINEE_LIST.filter((e) => s.resolutions[e.id] !== 'remove' && (!nominated || nominated.has(e.id)));
  const baseIds = new Set(base.map((e) => e.id));
  const extraIds = new Set<string>([...(s.addedParticipants ?? []), ...Object.keys(s.participation).filter((id) => !NOMINEE_LIST.some((e) => e.id === id))]);
  const extra = [...extraIds].filter((id) => !baseIds.has(id)).map((id) => findById(id)).filter((p): p is Person => !!p).map(personToEmployee);
  return [...base, ...extra].filter((e) => s.participation[e.id] !== 'Withdrawn' && s.resolutions[e.id] !== 'remove');
};

export const attendanceOf = (s: Pick<FlowState, 'attendance' | 'attendance2'>, day: Day) => (day === 'd1' ? s.attendance : s.attendance2);
/** Attended = present or late on at least one day. */
export const attendedIds = (s: FlowState) => roster(s).filter((e) => ['Present', 'Late'].includes(s.attendance[e.id] ?? '') || ['Present', 'Late'].includes(s.attendance2[e.id] ?? '')).map((e) => e.id);

export const courseOf = (s: Pick<FlowState, 'courseProgress' | 'courseCompleted' | 'courseOthers'>, id: string) =>
  id === 'e1' ? { progress: s.courseProgress, completed: s.courseCompleted } : s.courseOthers[id] ?? { progress: 0, completed: false };

/** Bond end date and remaining liability as of the demo date (straight-line over the bond period). */
export const DEMO_DATE = new Date('2026-11-12');
export const bondEndDate = (b: Pick<Bond, 'startDate' | 'periodYears'>) => {
  const d = new Date(b.startDate);
  if (Number.isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + b.periodYears);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const remainingLiability = (b: Pick<Bond, 'startDate' | 'periodYears' | 'amount'>) => {
  const start = new Date(b.startDate);
  if (Number.isNaN(start.getTime()) || b.periodYears <= 0) return b.amount;
  const totalMonths = b.periodYears * 12;
  const elapsed = Math.max(0, (DEMO_DATE.getFullYear() - start.getFullYear()) * 12 + (DEMO_DATE.getMonth() - start.getMonth()));
  return Math.max(0, Math.round((b.amount * (totalMonths - Math.min(elapsed, totalMonths))) / totalMonths));
};

/** Post-training assessment result per participant (fictional, deterministic). */
export const gradeOf = (pct: number) => (pct >= 90 ? 'Excellent' : pct >= 85 ? 'Very Good' : pct >= 70 ? 'Good' : 'Fail');
const FAILERS = ['f5', 'f17', 'f24'];
export type PtStatus = 'Not taken' | 'Absent' | 'Awaiting release' | 'Passed' | 'Failed';
export const ptResults = (s: FlowState): { id: string; status: PtStatus; score: number | null; grade: string }[] => {
  const attended = new Set(attendedIds(s));
  const released = s.pta.released && (s.pta.integrity !== 'flagged' || s.pta.committeeCleared);
  return roster(s).map((e, i) => {
    if (!s.attendanceSubmitted) return { id: e.id, status: 'Not taken', score: null, grade: '' };
    if (!attended.has(e.id)) return { id: e.id, status: 'Absent', score: null, grade: '' };
    let pct: number;
    if (e.id === 'e1') pct = Math.round(((36 + (s.pta.decision === 'pending' ? 7 : s.pta.descriptive)) / 50) * 100);
    else if (FAILERS.includes(e.id)) pct = 52 + (i % 4) * 4;
    else pct = 72 + ((i * 7) % 24);
    return { id: e.id, status: !released ? 'Awaiting release' : pct >= 70 ? 'Passed' : 'Failed', score: pct, grade: gradeOf(pct) };
  });
};

const STRIP: (keyof FlowState)[] = ['snaps', 'toast', 'impact', 'undo', 'arrival', 'revisit', 'stop', 'handoffTarget', 'tour', 'showFr', 'presenter', 'lang'];
export const snapshotOf = (s: FlowState) => JSON.stringify(Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== 'function' && !STRIP.includes(k as keyof FlowState))));

export const DEMO_VERSION = 15;

/* ================================================================== */
/* Store                                                               */
/* ================================================================== */
export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      const log = (actorRole: Role, action: string, detail: string, extra: Partial<AuditEvent> = {}, notice?: { title: string; to: Role | 'all' }) => {
        const s = get();
        const at = fmt(s.clock);
        const ev: AuditEvent = { id: s.audit.length + 1, at, actor: PERSONAS[actorRole].name, actorRole: PERSONAS[actorRole].label, action, detail, ...extra };
        set({
          clock: s.clock + 1,
          audit: [ev, ...s.audit],
          notices: notice ? [{ id: s.notices.length + 1, at, ...notice }, ...s.notices] : s.notices,
          impact: { id: ev.id, key: action },
        });
      };
      const once = (flag: keyof FlowState) => Boolean(get()[flag]);
      const nameOf = (id: string) => findById(id)?.name ?? id;

      return {
        ...initial,
        setRole: (r) => set({ role: r }),
        setEmployee: (id) => set({ employeeId: id }),
        setDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
        saveDraft: () => {
          set((s) => ({ draft: { ...s.draft, savedAt: nowLabel(s) } }));
          log('division_head', 'Training request draft saved', `${get().draft.title || 'Untitled request'} · Save & Exit`);
        },

        setTna: (p) => set((s) => ({ tna: { ...s.tna, ...p } })),
        prepareRequest: (src) => {
          const s = get();
          if (s.requestSubmitted) return;
          const { competency, survey, idpIds } = src ?? { competency: s.tna.gap, survey: s.tna.survey, idpIds: s.tna.idpIds };
          const sources = [
            competency ? TNA_SOURCES.gap : '',
            survey ? TNA_SOURCES.survey : '',
            idpIds.length ? `${TNA_SOURCES.idp} (${idpIds.length})` : '',
          ].filter(Boolean);
          const gapIds = competency || survey ? creditGap('Corporate Banking').map((p) => p.id) : [];
          const ids = [...new Set([...s.draft.participantIds, ...gapIds, ...idpPeople(idpIds)])];
          const why = [
            competency ? `Credit Analysis is below target for ${GAP_TEXT} Relationship Managers and Credit Analysts in Corporate Banking.` : '',
            survey ? 'The programme-wise survey ranked Credit Analysis as the top requested capability (19 high-priority responses).' : '',
            idpIds.length ? `${idpIds.length} individual development request${idpIds.length > 1 ? 's ask' : ' asks'} for related learning.` : '',
            'FY2027 portfolio quality targets need this uplift before the Q1 lending cycle.',
          ].filter(Boolean).join(' ');
          const keepTyped = !!s.draft.justification && s.draft.justification !== s.tna.why;
          set({
            tna: { ...s.tna, recommendation: competency ? 'accepted' : s.tna.recommendation, gap: competency, survey, idpIds, why },
            draft: { ...s.draft, title: s.draft.title || TRAINING.title, justification: keepTyped ? s.draft.justification : why, participantIds: ids, sources },
          });
          if (competency && !s.audit.some((a) => a.action === 'Training need added')) log('division_head', 'Training need added', `${TRAINING.title} · reviewed by ${PERSONAS.division_head.name}`, { next: 'Training request' });
          get().confirmNeed();
        },
        confirmNeed: () => {
          if (once('needConfirmed') || once('requestSubmitted')) return;
          set({ needConfirmed: true });
          log('division_head', 'Business need identified', `Credit Analysis · ${GAP_TEXT} Corporate Banking officers below target`, { next: 'Training request' });
        },
        submitRequest: () => {
          if (once('requestSubmitted')) return;
          set((s) => ({ needConfirmed: true, requestSubmitted: true, requestReturn: null, draft: { ...s.draft, title: s.draft.title || TRAINING.title } }));
          const d = get().draft;
          log('division_head', 'Training request submitted', `TR-2026-00418 · ${d.title} · ${d.participantIds.length || d.participants} participants`, { next: 'Pending HR Review' }, { title: 'New training request TR-2026-00418', to: 'hr' });
        },
        forwardRequest: (to, note) => {
          set((s) => ({ requestForward: { to, note, at: nowLabel(s) } }));
          log('hr', 'Request forwarded', `TR-2026-00418 → ${to}${note ? ` · ${note}` : ''}`, {}, { title: 'Request TR-2026-00418 assigned to you', to: 'hr' });
          set({ toast: `Forwarded to ${to}. A task was created in their inbox.` });
        },
        returnRequest: (note) => {
          set((s) => ({ requestReturn: { note, at: nowLabel(s) } }));
          log('hr', 'Request returned for information', `TR-2026-00418 · ${note}`, {}, { title: 'HR asked for more information on TR-2026-00418', to: 'division_head' });
          set({ toast: 'Returned to the Division Head for information (proposed workflow).' });
        },
        reviewRequest: () => {
          if (once('reviewed')) return;
          set({ reviewed: true, requestForward: null });
          log('hr', 'Request accepted for nomination', 'TR-2026-00418 → nomination request NR-2026-00057', { previous: 'Pending HR Review', next: 'Under Review' });
        },
        scheduleDirect: (requestId, title) => {
          if (get().programmes.some((p) => p.fromRequest === requestId)) return;
          const id = `2026${String(190 + get().programmes.length).padStart(4, '0')}`;
          set((s) => ({ programmes: [{ id, title, date: 'To be confirmed', venue: 'To be confirmed', medium: 'Classroom', mode: 'In-house', status: 'Scheduled', participants: 0, attended: null, trainer: 'To be assigned', fromRequest: requestId }, ...s.programmes] }));
          log('hr', 'Training scheduled directly', `${requestId} · ${title} → Training ${id} · Load Training Profile = No (FR 66, 96)`);
          set({ toast: `${title} scheduled directly as training ${id}` });
        },
        setNomSetup: (p) => set((s) => ({ nomSetup: { ...s.nomSetup, ...p } })),
        sendNomination: () => {
          if (once('nominationRequested')) return;
          const divs = Object.entries(get().nomSetup.divisions).filter(([, v]) => v).map(([k]) => k);
          set({ nominationRequested: true, reviewed: true });
          log('hr', 'Nomination request sent', `NR-2026-00057 · ${divs.join(', ')} · deadline 14 Nov 17:00`, {}, { title: 'Nomination required: Advanced Credit Risk Management', to: 'division_head' });
        },
        submitNominations: (count = 35, ids = []) => {
          if (once('nominationSubmitted')) return;
          set({ nominationSubmitted: true, nominatedCount: ids.length || count, nominatedIds: ids });
          log('division_head', 'Nominations submitted', `${count} employees nominated before deadline`, {}, { title: `${count} nominations received · 4 need attention`, to: 'hr' });
        },
        resolve: (id, d, reason = '') => {
          set((s) => ({ resolutions: { ...s.resolutions, [id]: d }, resolutionReasons: { ...s.resolutionReasons, [id]: reason } }));
          const e = NOMINEE_LIST.find((x) => x.id === id);
          log('hr', d === 'keep' ? 'Conflict overridden' : 'Nominee removed', `${e?.name ?? nameOf(id)} · ${e?.issue ?? ''}${reason ? ` · reason: ${reason}` : ''}`);
        },
        resolveMany: (ids, d, reason) => {
          ids.forEach((id) => get().resolve(id, d, reason));
          set({ toast: `${ids.length} nominee${ids.length > 1 ? 's' : ''} ${d === 'keep' ? 'kept (override logged)' : 'removed · Learning Champions notified'}` });
        },
        finalize: () => {
          const s = get();
          if (s.finalized) return;
          const res = { ...s.resolutions };
          CONFLICT_IDS.forEach((id) => { if (!res[id]) res[id] = id === 'e2' ? 'keep' : 'remove'; });
          set({ finalized: true, resolutions: res });
          const final = roster({ ...get(), resolutions: res }).length;
          log('hr', 'Participants finalized', `Received 35 · eligible 31 · conflicts 4 · final ${final}`, { previous: '35 nominees', next: `${final} participants` });
        },
        setSchedulePath: (p) => set((s) => ({ schedulePath: p, sched: { ...s.sched, loadProfile: p === 'profile' ? 'Yes' : 'No' } })),
        setSched: (p) => set((s) => ({ sched: { ...s.sched, ...p } })),
        addParticipants: (ids) => {
          const add = ids.filter((id) => !get().addedParticipants.includes(id));
          if (!add.length) return;
          set((s) => ({ addedParticipants: [...s.addedParticipants, ...add], resolutions: Object.fromEntries(Object.entries(s.resolutions).filter(([k]) => !add.includes(k))) }));
          log('hr', 'Participants added', add.map(nameOf).join(', '));
        },
        removeParticipants: (ids, reason) => {
          set((s) => ({
            resolutions: { ...s.resolutions, ...Object.fromEntries(ids.map((id) => [id, 'remove' as const])) },
            resolutionReasons: { ...s.resolutionReasons, ...Object.fromEntries(ids.map((id) => [id, reason])) },
            addedParticipants: s.addedParticipants.filter((x) => !ids.includes(x)),
          }));
          log('hr', 'Participants removed', `${ids.map(nameOf).join(', ')} · ${reason}`);
          set({ toast: `${ids.length} participant${ids.length > 1 ? 's' : ''} removed` });
        },
        sendOrganizer: () => {
          set((s) => ({ sched: { ...s.sched, organizerSent: true } }));
          log('hr', 'Nomination sent to organizer', `Participant list sent to ${TRAINING.organizedBy} (FR 116)`);
        },
        sendTrainerInvite: () => {
          set((s) => ({ sched: { ...s.sched, trainerInviteSent: true } }));
          log('hr', 'Trainer invitations sent', `${get().sched.trainers.map((t) => t.name).join(', ')} · reminder ${get().sched.reminderTrainer} (FR 117)`, {}, { title: 'Invitation to facilitate: Advanced Credit Risk Management', to: 'trainer' });
        },
        publishSchedule: () => {
          if (once('scheduled')) return;
          set((s) => ({ scheduled: true, finalized: true, budgetReturned: false, budgetApproved: true, planned: { ...s.planned, approvalNo: TRAINING.approvalNo } }));
          log('hr', 'Training scheduled', 'Training ID 20260182 · 18–19 Nov · Learning Center Hall A · budget BDT 14,40,000', { previous: 'Under Review', next: 'Scheduled' });
        },
        approveBudget: () => {
          if (once('budgetApproved')) return;
          set((s) => ({ budgetApproved: true, budgetReturned: false, planned: { ...s.planned, approvalNo: TRAINING.approvalNo } }));
          log('finance', 'Budget approved', 'BDT 14,40,000 · approval FIN-APP-2026-0771', { approvedBy: 'Rezaul Karim, Finance (checker) · maker: Nusrat Jahan, HR' }, { title: 'Budget approved · ready to send invitations', to: 'hr' });
        },
        returnBudget: (reason = "Please attach BIBM's quotation for the external trainer fee.") => {
          set({ budgetReturned: true, budgetReturnReason: reason });
          log('finance', 'Budget returned', reason, {}, { title: 'Budget returned by Finance', to: 'hr' });
        },
        resubmitBudget: () => {
          set({ budgetReturned: false });
          log('hr', 'Budget resubmitted', 'BIBM quotation attached', {}, { title: 'Budget resubmitted for approval', to: 'finance' });
        },
        sendInvites: () => {
          const s = get();
          if (s.invitesSent) return;
          const p: Record<string, Participation> = {};
          roster(s).forEach((e) => { p[e.id] = 'Invited'; });
          set((x) => ({ invitesSent: true, participation: p, sched: { ...x.sched, trainerInviteSent: true, organizerSent: true } }));
          log('hr', 'Invitations sent', `${Object.keys(p).length} participants (supervisors CC, PDF list attached) · 2 trainers · organizer · reminders set`, {}, { title: 'Invitation: Advanced Credit Risk Management · 18–19 Nov', to: 'employee' });
        },
        trainerRespond: (r, reason = '') => {
          set({ trainerResponse: r, trainerReason: reason });
          log('trainer', r === 'accepted' ? 'Facilitation accepted' : 'Facilitation declined', r === 'accepted' ? 'Nafis Ahmed · Day 1 and Day 2 morning' : `Reason: ${reason}`, {}, { title: `Trainer ${r}: Nafis Ahmed`, to: 'hr' });
        },
        uploadMaterial: () => {
          if (once('materialUploaded')) return;
          set({ materialUploaded: true });
          log('trainer', 'Material uploaded', 'Credit_Risk_Case_Pack_v3.pdf · not linked yet');
        },
        requestMaterialLink: () => {
          if (once('materialLinkRequested') || !get().materialUploaded) return;
          set({ materialLinkRequested: true });
          log('trainer', 'Material link requested', 'Credit_Risk_Case_Pack_v3.pdf · HR Admin to link it to training 20260182 (FR 19)', {}, { title: 'Trainer requests material link', to: 'hr' });
        },
        setupCourse: (modules, assessment) => {
          if (once('courseSetup')) return;
          set({ courseSetup: true, courseModules: modules });
          log('trainer', 'Course set up', `${TRAINING.title} · ${modules.length} modules · ${assessment} · AI course assistant on`, {}, { title: 'Course ready: Advanced Credit Risk Management', to: 'employee' });
        },
        startTrainingCourse: () => {
          if (get().tcourse.started) return;
          set((s) => ({ tcourse: { ...s.tcourse, started: true } }));
          log('employee', 'Course started', `Ayesha Rahman · ${TRAINING.title} · module 1`);
        },
        completeModule: () => {
          const n = get().courseModules.length || 4;
          set((s) => ({ tcourse: { started: true, done: Math.min(n, s.tcourse.done + 1) } }));
          log('employee', 'Module completed', `Ayesha Rahman · ${TRAINING.title} · module ${get().tcourse.done} of ${n}`);
        },
        checkConflicts: () => {
          if (once('conflictsChecked')) return;
          set({ conflictsChecked: true });
          log('hr', 'Conflict checks run', `${get().nominatedCount} nominees checked against HRIS, leave, Outlook calendar and the training database (simulated) · 4 need attention`);
        },
        syncRecords: () => {
          if (once('recordSynced')) return;
          set({ recordSynced: true });
          log('hr', 'Learning records updated', `${TRAINING.title} · attendance, 16 learning hours and feedback written to every participant's record and the training database`);
        },
        submitAssessment: () => {
          if (once('ptaSubmitted')) return;
          set({ ptaSubmitted: true });
          log('employee', 'Assessment submitted', `Ayesha Rahman · ${TRAINING.title} · post-training assessment`, {}, { title: 'Assessment submitted for evaluation', to: 'trainer' });
        },
        linkMaterial: (protection = 'Preview only + watermark') => {
          set({ materialLinked: true, materialProtection: protection });
          log('hr', 'Material linked', `Credit_Risk_Case_Pack_v3.pdf linked to training 20260182 (${protection})`);
        },
        accept: (id) => {
          set((s) => ({ participation: { ...s.participation, [id]: 'Accepted' } }));
          log('employee', 'Invitation accepted', `${nameOf(id)} · training 20260182`);
        },
        requestWithdrawal: (reason) => {
          set((s) => ({ participation: { ...s.participation, e2: 'Withdrawal Requested' }, withdrawal: { ...s.withdrawal, status: 'requested', empId: 'e2', reason } }));
          log('employee', 'Withdrawal requested', `Tanvir Hasan · ${reason}`, {}, { title: 'Withdrawal request: Tanvir Hasan', to: 'supervisor' });
        },
        requestWithdrawalFor: (id, reason) => {
          if (id === 'e2') return get().requestWithdrawal(reason);
          set((s) => ({ participation: { ...s.participation, [id]: 'Withdrawal Requested' }, otherWithdrawals: { ...s.otherWithdrawals, [id]: { status: 'requested', empId: id, reason, supReason: '', replacementId: '' } } }));
          log('employee', 'Withdrawal requested', `${nameOf(id)} · ${reason}`, {}, { title: `Withdrawal request: ${nameOf(id)}`, to: 'supervisor' });
        },
        decideWithdrawal: (d, reason = '', replacementId = 'e4') => {
          if (d === 'reject') {
            set((s) => ({ participation: { ...s.participation, e2: 'Accepted' }, withdrawal: { ...s.withdrawal, status: 'rejected', supReason: reason } }));
            log('supervisor', 'Withdrawal rejected', `Tanvir Hasan remains a participant · ${reason}`, {}, { title: 'Your withdrawal request was not approved', to: 'employee' });
            return;
          }
          if (d === 'approve') {
            set((s) => ({ participation: { ...s.participation, e2: 'Approved' }, withdrawal: { ...s.withdrawal, status: 'proposed', replacementId: '', supReason: reason } }));
            log('supervisor', 'Withdrawal approved', `Reason: ${reason} · awaiting HR`, {}, { title: 'Withdrawal awaiting HR approval', to: 'hr' });
            return;
          }
          set((s) => ({ participation: { ...s.participation, e2: 'Replacement Proposed' }, withdrawal: { ...s.withdrawal, status: 'proposed', replacementId, supReason: reason } }));
          log('supervisor', 'Replacement proposed', `Tanvir Hasan → ${nameOf(replacementId)} (HRIS, leave, calendar, training overlap, eligibility: clear)`, { previous: 'Tanvir Hasan', next: nameOf(replacementId) }, { title: `Replacement proposed: ${nameOf(replacementId)}`, to: 'hr' });
        },
        decideWithdrawalFor: (id, d, reason, replacementId = '') => {
          if (id === 'e2') return get().decideWithdrawal(d, reason, replacementId || 'e4');
          const w = get().otherWithdrawals[id];
          if (!w) return;
          const status: WithdrawalStatus = d === 'reject' ? 'rejected' : 'proposed';
          set((s) => ({ participation: { ...s.participation, [id]: d === 'reject' ? 'Accepted' : d === 'replace' ? 'Replacement Proposed' : 'Approved' }, otherWithdrawals: { ...s.otherWithdrawals, [id]: { ...w, status, supReason: reason, replacementId: d === 'replace' ? replacementId : '' } } }));
          log('supervisor', d === 'reject' ? 'Withdrawal rejected' : d === 'replace' ? 'Replacement proposed' : 'Withdrawal approved', `${nameOf(id)}${d === 'replace' ? ` → ${nameOf(replacementId)}` : ''} · ${reason}`);
        },
        hrApproveWithdrawal: () => {
          const s = get();
          if (s.withdrawal.status !== 'proposed') return;
          const rep = s.withdrawal.replacementId;
          set({ participation: { ...s.participation, e2: 'Withdrawn', ...(rep ? { [rep]: 'Invited' as Participation } : {}) }, withdrawal: { ...s.withdrawal, status: 'approved' } });
          log('hr', rep ? 'Participant replaced' : 'Participant withdrawn', rep ? `Inclusion email to ${nameOf(rep)}, exclusion email to Tanvir Hasan, supervisors CC` : 'Exclusion email sent, supervisor CC', { previous: 'Tanvir Hasan', next: rep ? nameOf(rep) : '—', approvedBy: 'Nusrat Jahan, HR Admin' }, rep ? { title: 'Invitation (replacement): Advanced Credit Risk Management', to: 'employee' } : undefined);
        },
        hrRejectWithdrawal: () => {
          const s = get();
          if (s.withdrawal.status !== 'proposed') return;
          set({ participation: { ...s.participation, e2: 'Accepted' }, withdrawal: { ...s.withdrawal, status: 'rejected', replacementId: '' } });
          log('hr', 'Withdrawal rejected', 'Tanvir Hasan remains a participant · supervisor informed', {}, { title: 'Your withdrawal request was not approved', to: 'employee' });
        },
        hrDecideWithdrawalFor: (id, approve) => {
          if (id === 'e2') return approve ? get().hrApproveWithdrawal() : get().hrRejectWithdrawal();
          const w = get().otherWithdrawals[id];
          if (!w || w.status !== 'proposed') return;
          set((s) => ({
            participation: { ...s.participation, [id]: approve ? 'Withdrawn' : 'Accepted', ...(approve && w.replacementId ? { [w.replacementId]: 'Invited' as Participation } : {}) },
            otherWithdrawals: { ...s.otherWithdrawals, [id]: { ...w, status: approve ? 'approved' : 'rejected' } },
          }));
          log('hr', approve ? 'Participant withdrawn' : 'Withdrawal rejected', `${nameOf(id)}${approve && w.replacementId ? ` → ${nameOf(w.replacementId)}` : ''} · inclusion / exclusion email, supervisor CC`);
        },
        selfMark: (id) => {
          set((s) => ({ selfMarked: { ...s.selfMarked, [id]: true }, attendance: { ...s.attendance, [id]: 'Present' }, attSource: { ...s.attSource, [`d1:${id}`]: 'Self' } }));
          log('employee', 'Attendance self-marked', `${nameOf(id)} · Day 1 · 09:24 via ELDP`);
        },
        mark: (id, a, day = 'd1') => set((s) => (day === 'd1'
          ? { attendance: { ...s.attendance, [id]: a }, attSource: { ...s.attSource, [`d1:${id}`]: 'HR' as AttSource } }
          : { attendance2: { ...s.attendance2, [id]: a }, attSource: { ...s.attSource, [`d2:${id}`]: 'HR' as AttSource } })),
        markMany: (ids, a, day) => {
          set((s) => {
            const map = { ...(day === 'd1' ? s.attendance : s.attendance2) };
            const src = { ...s.attSource };
            ids.forEach((id) => { map[id] = a; src[`${day}:${id}`] = 'HR'; });
            return day === 'd1' ? { attendance: map, attSource: src } : { attendance2: map, attSource: src };
          });
          log('hr', 'Attendance marked', `${ids.length} marked ${a} · ${day === 'd1' ? 'Day 1 (18 Nov)' : 'Day 2 (19 Nov)'}`);
        },
        markAll: (day = 'd1') => {
          const s = get();
          const map = day === 'd1' ? s.attendance : s.attendance2;
          const ids = roster(s).map((e) => e.id).filter((id) => !map[id]);
          if (!ids.length) return;
          get().markMany(ids, 'Present', day);
        },
        syncOnline: (day = 'd1') => {
          const ids = roster(get()).map((e) => e.id).slice(0, 12);
          set((s) => {
            const map = { ...(day === 'd1' ? s.attendance : s.attendance2) };
            const src = { ...s.attSource };
            ids.forEach((id) => { map[id] = 'Present'; src[`${day}:${id}`] = 'Teams'; });
            return day === 'd1' ? { attendance: map, attSource: src } : { attendance2: map, attSource: src };
          });
          log('hr', 'Online attendance synced', `12 attendees matched by Employee ID from Teams login · ${day === 'd1' ? 'Day 1' : 'Day 2'} (simulated)`);
        },
        saveAttendanceDraft: () => {
          set((s) => ({ attendanceDraftAt: nowLabel(s) }));
          log('hr', 'Attendance draft saved', 'Marked entries kept; not yet written to the training database');
        },
        requestExtraAttendee: (eid, name) => {
          if (get().extraAttendees.some((x) => x.eid === eid)) return;
          set((s) => ({ extraAttendees: [...s.extraAttendees, { eid, name, status: 'requested' }] }));
          log('hr', 'Extra attendee request', `${name} (${eid}) joined online but is not on the list · sent to Admin (FR 143)`, {}, { title: `Approve extra attendee: ${name}`, to: 'admin' });
        },
        approveExtraAttendee: (eid) => {
          const x = get().extraAttendees.find((a) => a.eid === eid);
          if (!x) return;
          const p = DIRECTORY.find((d) => d.eid === eid);
          set((s) => ({
            extraAttendees: s.extraAttendees.map((a) => (a.eid === eid ? { ...a, status: 'approved' as const } : a)),
            addedParticipants: p && !s.addedParticipants.includes(p.id) ? [...s.addedParticipants, p.id] : s.addedParticipants,
            ...(p ? { attendance: { ...s.attendance, [p.id]: 'Present' as Attendance }, attSource: { ...s.attSource, [`d1:${p.id}`]: 'Teams' as AttSource } } : {}),
          }));
          log('admin', 'Extra attendee approved', `${x.name} added and marked present (FR 143)`);
        },
        submitAttendance: () => {
          const s = get();
          if (s.attendanceSubmitted) return;
          const next: Record<string, Participation> = { ...s.participation };
          roster(s).forEach((e) => {
            if (next[e.id] === 'Withdrawn') return;
            const present = ['Present', 'Late'].includes(s.attendance[e.id] ?? '') || ['Present', 'Late'].includes(s.attendance2[e.id] ?? '');
            next[e.id] = present ? 'Attended' : 'Absent';
          });
          set({ attendanceSubmitted: true, participation: next });
          const attended = Object.values(next).filter((v) => v === 'Attended').length;
          get().addDbRows(roster(get()).filter((e) => next[e.id] === 'Attended').map((e) => {
            const p = findById(e.id);
            return { eid: e.eid, name: e.name, grade: p?.grade ?? '', designation: e.role, division: e.division, location: p?.location ?? '', training: TRAINING.title, meta: `Functional · ${TRAINING.mode} · ${TRAINING.medium}`, institute: TRAINING.organizedBy, duration: '18–19 Nov 2026 · 2 days', manHour: '16', source: 'Attendance' as const };
          }), 'Attendance');
          log('hr', 'Attendance submitted', `${attended} attended · training database, learning records, investment and cost per employee updated`, {}, { title: 'Feedback request: Advanced Credit Risk Management', to: 'employee' });
        },
        submitFeedback: (ratings, comment = '') => {
          if (once('feedbackSubmitted')) return;
          const r = ratings && Object.keys(ratings).length ? ratings : { Content: 5, Trainer: 5, Relevance: 4, Logistics: 4 };
          set({ feedbackSubmitted: true, feedback: { ratings: r, comment } });
          log('employee', 'Feedback submitted', `${Object.entries(r).map(([k, v]) => `${k} ${v}`).join(' · ')}${comment ? ` · “${comment.slice(0, 60)}”` : ''}`);
        },
        unmark: (id, day) => set((s) => {
          const map = { ...(day === 'd1' ? s.attendance : s.attendance2) };
          delete map[id];
          const src = { ...s.attSource };
          delete src[`${day}:${id}`];
          return day === 'd1' ? { attendance: map, attSource: src } : { attendance2: map, attSource: src };
        }),
        resolveReturn: (reply) => {
          set({ requestReturn: null });
          log('division_head', 'Information provided', `TR-2026-00418 · ${reply}`, {}, { title: 'Division Head replied on TR-2026-00418', to: 'hr' });
        },
        forwardRequestFor: (id, to, note) => {
          if (id === 'TR-2026-00418') return get().forwardRequest(to, note);
          set((s) => ({ requestForwards: { ...s.requestForwards, [id]: { to, note, at: nowLabel(s) } } }));
          log('hr', 'Request forwarded', `${id} → ${to}${note ? ` · ${note}` : ''}`);
          set({ toast: `Forwarded to ${to}. A task was created in their inbox.` });
        },
        setPlanned: (p) => set((s) => ({ planned: { ...s.planned, ...p } })),
        savePlanned: () => {
          set((s) => ({ planned: { ...s.planned, savedAt: nowLabel(s) } }));
          const p = get().planned;
          log('hr', 'Planned training saved', `Approval ${p.approvalNo || '—'} · payment ${p.paymentNo || '—'} · actual BDT ${p.actualExpense || '—'}`);
        },
        plannedAction: (kind, note) => {
          const status: PlannedFields['status'] = kind === 'Reschedule' ? 'Rescheduled' : kind === 'Postpone' ? 'Postponed' : 'Deleted';
          set((s) => ({ planned: { ...s.planned, status, note } }));
          log('hr', `Training ${status.toLowerCase()}`, `${TRAINING.title} · ${note} · participants emailed, line managers CC (FR 136)`, {}, { title: `${kind}: ${TRAINING.title}`, to: 'employee' });
        },
        complete: () => {
          if (once('completed')) return;
          set((s) => ({ completed: true, planned: { ...s.planned, actualExpense: s.planned.actualExpense || '13,86,500', paymentNo: s.planned.paymentNo || 'PAY-2026-3381' } }));
          const p = get().planned;
          log('hr', 'Training completed', `Actual expense BDT ${p.actualExpense} · payment ${p.paymentNo} · request TR-2026-00418 closed`, { previous: 'Scheduled', next: 'Completed' }, { title: 'Training completed: Advanced Credit Risk Management', to: 'division_head' });
        },
        saveBond: () => {
          set({ bondSaved: true });
          log('hr', 'Training bond saved', 'Bond BND-2026-0142 · 2 years · BDT 2,00,000 · printed on Legal page');
        },
        saveBondRecord: (b, toDb) => {
          set((s) => ({ bonds: [b, ...s.bonds.filter((x) => x.id !== b.id)], bondSaved: true }));
          if (toDb) get().addDbRows([{ eid: b.eid, name: b.name, grade: b.grade, designation: b.designation, division: b.division, location: b.location, training: b.title, meta: `${b.category} · ${b.mode} · ${b.medium}`, institute: b.institute, duration: `${b.from} – ${b.to} · ${b.days} days`, manHour: b.manHour, source: 'Bond' }], 'Bond');
          log('hr', 'Training bond saved', `${b.id} · ${b.name} · ${b.periodYears} years · BDT ${b.amount.toLocaleString('en-IN')}${toDb ? ' · added to training database' : ''}`);
        },
        updateBond: (id, p) => {
          set((s) => ({ bonds: s.bonds.map((b) => (b.id === id ? { ...b, ...p } : b)) }));
          log('hr', 'Training bond edited', `${id} · ${Object.keys(p).join(', ')}`);
        },
        addDbRows: (rows, source) => {
          if (!rows.length) return;
          set((s) => ({ dbRows: [...rows.map((r) => ({ ...r, source })), ...s.dbRows] }));
          if (source !== 'Attendance' && source !== 'Bond' && source !== 'Employee request') log('admin', 'Training database updated', `${rows.length} record${rows.length > 1 ? 's' : ''} · ${source}`);
        },
        requestRecord: (d) => {
          set((s) => ({ recordRequest: 'pending', recordDetails: { ...s.recordDetails, ...d } }));
          const r = get().recordDetails;
          log('employee', 'Training record submitted', `${r.title} (${r.institute}) · awaiting HR validation`, {}, { title: 'Record validation: Ayesha Rahman', to: 'hr' });
        },
        approveRecord: () => {
          const r = get().recordDetails;
          set({ recordRequest: 'approved' });
          get().addDbRows([{ eid: 'CBL-10482', name: 'Ayesha Rahman', grade: 'PO', designation: 'Relationship Manager', division: 'Corporate Banking', location: 'Gulshan', training: r.title, meta: 'Functional · External-local · Classroom', institute: r.institute, duration: r.date, manHour: '—', source: 'Employee request' }], 'Employee request');
          log('hr', 'Training record approved', `Ayesha Rahman · ${r.title} added to training database`);
        },
        rejectRecord: () => {
          set({ recordRequest: 'none' });
          log('hr', 'Training record rejected', 'Ayesha Rahman · certificate could not be verified');
        },
        setCourseProgress: (n) => set({ courseProgress: n }),
        completeCourse: () => {
          set({ courseCompleted: true, courseProgress: 100 });
          log('employee', 'Course completed', 'Information Security Awareness 2026 · certificate issued');
        },
        setCourseProgressFor: (id, n) => (id === 'e1' ? set({ courseProgress: n }) : set((s) => ({ courseOthers: { ...s.courseOthers, [id]: { progress: n, completed: s.courseOthers[id]?.completed ?? false } } }))),
        completeCourseFor: (id) => {
          if (id === 'e1') return get().completeCourse();
          set((s) => ({ courseOthers: { ...s.courseOthers, [id]: { progress: 100, completed: true } } }));
          log('employee', 'Course completed', `${nameOf(id)} · Information Security Awareness 2026 · certificate issued`);
        },
        setExam: (x) => set({ examStatus: x }),
        setProctor: (p) => {
          set({ proctorFlag: p });
          log('trainer', `Proctoring ${p === 'Cleared' ? 'cleared' : 'flagged'}`, 'AML Annual Certification · human review');
        },
        setAi: (state, score) => {
          set({ aiScore: { state, score } });
          log('trainer', state === 'accepted' ? 'AI-suggested score accepted' : 'AI-suggested score adjusted', `AML essay Q9 · final ${score}/10 · logged`);
        },
        setIntegrity: (d, note) => {
          set((s) => ({ pta: { ...s.pta, integrity: d, note } }));
          log('trainer', d === 'cleared' ? 'Integrity review cleared' : 'Integrity review flagged', `Post-training assessment · Ayesha Rahman${note ? ` · ${note}` : ''}`);
        },
        decideScore: (d, score, reason) => {
          set((s) => ({ pta: { ...s.pta, decision: d, descriptive: score, reason } }));
          log('trainer', d === 'accepted' ? 'AI-suggested score accepted' : 'AI-suggested score adjusted', `Post-training assessment · descriptive answer ${score}/10${reason ? ` · ${reason}` : ''}`);
        },
        committeeClear: () => {
          set((s) => ({ pta: { ...s.pta, committeeCleared: true } }));
          log('trainer', 'Assessment committee cleared the result', 'Integrity flag reviewed · result can be released (simulated)');
        },
        releaseResult: (mode) => {
          set((s) => ({ pta: { ...s.pta, released: true, releaseMode: mode } }));
          const r = ptResults(get());
          const passed = r.filter((x) => x.status === 'Passed').length, failed = r.filter((x) => x.status === 'Failed').length;
          log('trainer', 'Assessment result released', `Advanced Credit Risk Management · ${passed} passed · ${failed} failed · release ${mode.toLowerCase()}`, { approvedBy: 'Nafis Ahmed, Trainer' }, { title: 'Your assessment result is available', to: 'employee' });
        },
        assignRemediation: (ids, kind) => {
          set((s) => ({ remediation: { ...s.remediation, ...Object.fromEntries(ids.map((id) => [id, kind])) } }));
          log('hr', kind, `${ids.map(nameOf).join(', ')} · supervisors notified`);
          set({ toast: `${kind} for ${ids.length} employee${ids.length > 1 ? 's' : ''}` });
        },
        setJourney: (n) => {
          const before = get().journeyDone;
          set({ journeyDone: n });
          if (n > before) log('employee', 'Journey milestone completed', `Credit Analysis journey ${n}/5 · competency movement recalculated`);
        },
        viewExec: () => { if (!get().execViewed) set({ execViewed: true }); },
        takeProgrammeAttendance: (id, attended) => {
          set((s) => ({ programmes: s.programmes.map((p) => (p.id === id ? { ...p, attended, status: 'Completed' as const } : p)) }));
          const p = get().programmes.find((x) => x.id === id);
          log('hr', 'Attendance submitted', `${p?.title} · ${attended} of ${p?.participants} attended`);
        },
        sendReminders: (ids) => {
          set((s) => ({ enrollments: s.enrollments.map((e) => (ids.includes(e.id) ? { ...e, reminded: true } : e)) }));
          log('hr', 'Course reminders sent', `${ids.length} learner${ids.length > 1 ? 's' : ''} · email, in-app and SMS (simulated) · managers copied (FR 201)`);
          set({ toast: `Reminder sent to ${ids.length} learner${ids.length > 1 ? 's' : ''}` });
        },
        logEvent: (role, action, detail) => log(role, action, detail),
        withUndo: (label, fn) => {
          const snap = snapshotOf(get());
          fn();
          set({ undo: { label, snap } });
        },
        undoLast: () => {
          const u = get().undo;
          if (!u) return;
          const restored = JSON.parse(u.snap) as Partial<FlowState>;
          set({ ...restored, undo: null, toast: `Undone: ${u.label}` });
          log(get().role, 'Action undone', u.label);
        },
        setArrival: (a) => set({ arrival: a }),
        setRevisit: (n) => set({ revisit: n }),
        setHandoffTarget: (t) => set({ handoffTarget: t }),
        setStop: (x) => set({ stop: x }),
        rewindTo: (n) => {
          const snap = get().snaps[n];
          if (!snap) return;
          const restored = JSON.parse(snap) as Partial<FlowState>;
          const snaps = Object.fromEntries(Object.entries(get().snaps).filter(([k]) => Number(k) <= n));
          set({ ...restored, snaps, revisit: null, undo: null, arrival: null, toast: `Rewound to step ${n + 1}. Later steps were undone.` });
        },
        advance: () => {
          const s = get();
          if (!s.needConfirmed && !s.requestSubmitted) return get().confirmNeed();
          if (!s.requestSubmitted) return get().submitRequest();
          if (!s.reviewed) return get().reviewRequest();
          if (!s.nominationRequested) return get().sendNomination();
          if (!s.nominationSubmitted) return get().submitNominations();
          if (!s.conflictsChecked) return get().checkConflicts();
          if (!s.finalized && Object.keys(s.resolutions).length === 0) { CONFLICT_IDS.forEach((id) => get().resolve(id, id === 'e2' ? 'keep' : 'remove', id === 'e2' ? 'Leave is one day only; supervisor to confirm' : 'Conflict confirmed')); return; }
          if (!s.finalized) return get().finalize();
          if (!s.scheduled) return get().publishSchedule();
          if (!s.budgetApproved) return get().approveBudget();
          if (!s.invitesSent) return get().sendInvites();
          if (s.trainerResponse === 'pending') return get().trainerRespond('accepted');
          if (!s.courseSetup) return get().setupCourse(['Credit risk frameworks', 'Financial statement analysis', 'Cash flow and early-warning signals', 'Portfolio case studies'], '20 objective + 1 descriptive · pass 70%');
          if (s.withdrawal.status === 'none') return get().requestWithdrawal('Client meeting scheduled during training.');
          if (s.withdrawal.status === 'requested') return get().decideWithdrawal('replace', 'Client commitment on 18 Nov', 'e4');
          if (s.withdrawal.status === 'proposed') return get().hrApproveWithdrawal();
          if (s.participation.e1 === 'Invited') return get().accept('e1');
          if (s.tcourse.done < (s.courseModules.length || 4)) { get().startTrainingCourse(); const n = get().courseModules.length || 4; while (get().tcourse.done < n) get().completeModule(); return; }
          if (!s.attendanceSubmitted) {
            if (!s.selfMarked.e1) get().selfMark('e1');
            const ids = roster(get()).map((e) => e.id);
            get().markAll('d1');
            if (ids.length > 2) { get().mark(ids[ids.length - 1], 'Absent', 'd1'); get().mark(ids[ids.length - 2], 'Excused', 'd1'); }
            get().markAll('d2');
            if (ids.length > 2) get().mark(ids[ids.length - 1], 'Absent', 'd2');
            return get().submitAttendance();
          }
          if (!s.ptaSubmitted) return get().submitAssessment();
          if (!s.pta.released) {
            if (get().pta.integrity === 'pending') get().decideAttempt('pta-e1', 'cleared', 'Events explained by the candidate; no integrity concern.');
            if (get().pta.decision === 'pending') get().decideScore('accepted', 7, '');
            return get().releaseResult('Instant');
          }
          if (!s.feedbackSubmitted) return get().submitFeedback();
          if (!s.completed) return get().complete();
          if (!s.recordSynced) return get().syncRecords();
          if (!s.execViewed) return get().viewExec();
        },
        reset: () => set({ ...initial, tour: get().tour, showFr: get().showFr, presenter: get().presenter, lang: get().lang, handoffTarget: get().handoffTarget, toast: 'Demo reset to the start' }),
        dismissToast: () => set({ toast: null, undo: null }),
        clearImpact: () => set({ impact: null }),
        setTour: (v) => set({ tour: v }),
        setShowFr: (v) => set({ showFr: v }),
        setPresenter: (v) => set({ presenter: v }),
        setLang: (v) => set({ lang: v }),
        viewCourse: (id) => set((s) => ({ learn: { ...s.learn, lastViewed: id } })),
        decideMc: (id, decision) => {
          const item = get().admin.mc.find((m) => m.id === id);
          if (!item) return;
          const checker = PERSONAS.admin.name;
          let users = get().admin.users;
          let perms = get().admin.perms;
          if (decision === 'Approved' && item.apply?.kind === 'role') users = users.map((u) => (u.eid === item.apply!.eid ? { ...u, role: item.apply!.role as UserRow['role'] } : u));
          if (decision === 'Approved' && item.apply?.kind === 'perm') perms = { ...perms, [item.apply.role!]: perms[item.apply.role!].map((v, i) => (i === item.apply!.index ? !v : v)) };
          set((s) => ({ admin: { ...s.admin, users, perms, mc: s.admin.mc.map((m) => (m.id === id ? { ...m, status: decision, checker } : m)) }, toast: `${item.type}: ${decision.toLowerCase()} by the checker` }));
          log('admin', decision === 'Approved' ? 'Maker-checker approved' : 'Maker-checker rejected', `${item.type} · maker ${item.maker} · checker ${checker}`, { approvedBy: checker });
        },
        proposePermission: (role, index, moduleName) => {
          const cur = get().admin.perms[role]?.[index];
          const mc: MakerCheck = { id: `mc${Date.now()}`, type: 'Permission change', maker: `${PERSONAS.admin.name} (System Admin)`, summary: `${role}: ${cur ? 'remove' : 'grant'} “${moduleName}”`, status: 'Pending', apply: { kind: 'perm', role, index } };
          set((s) => ({ admin: { ...s.admin, mc: [mc, ...s.admin.mc] }, toast: 'Change sent to the maker-checker queue. A second administrator must approve it.' }));
          log('admin', 'Permission change requested', mc.summary);
        },
        proposeRole: (eid, role) => {
          const u = get().admin.users.find((x) => x.eid === eid);
          const mc: MakerCheck = { id: `mc${Date.now()}`, type: 'Role change', maker: `${PERSONAS.admin.name} (System Admin)`, summary: `${eid} ${u?.name}: ${u?.role} → ${role}`, status: 'Pending', apply: { kind: 'role', eid, role } };
          set((s) => ({ admin: { ...s.admin, mc: [mc, ...s.admin.mc] }, toast: 'Role change sent for checker approval' }));
          log('admin', 'Role change requested', mc.summary);
        },
        setUserStatus: (eid, status) => {
          set((s) => ({ admin: { ...s.admin, users: s.admin.users.map((u) => (u.eid === eid ? { ...u, status } : u)) }, toast: `Account ${status.toLowerCase()}` }));
          log('admin', `Account ${status.toLowerCase()}`, eid);
        },
        saveSettings: (x) => {
          set((s) => ({ admin: { ...s.admin, settings: x }, lang: x.language === 'Bangla' ? 'bn' : 'en', toast: 'System settings saved' }));
          log('admin', 'System settings changed', `Idle timeout ${x.idleTimeout} min · SSO + MFA ${x.ssoMfa ? 'on' : 'off'} · maker-checker ${x.makerChecker ? 'on' : 'off'} · default language ${x.language}`);
        },
        syncIntegration: (system) => {
          set((s) => ({ admin: { ...s.admin, synced: { ...s.admin.synced, [system]: 'Just now' } }, toast: `${system} synced (simulated)` }));
          log('admin', 'Integration sync', `${system} · manual sync (simulated)`);
        },
        startAttempt: (examId) => {
          const s0 = get();
          const empId = s0.employeeId;
          const id = `${examId.toLowerCase()}-${empId}`;
          const prev = s0.attempts[id];
          if (prev && !prev.submitted) return id;
          set((s) => ({ attempts: { ...s.attempts, [id]: { id, examId, empId, name: nameOf(empId), started: examId === 'PTA' ? '20 Nov 2026, 10:00' : '30 Nov 2026, 10:00', answers: {}, flagged: [], events: [], submitted: false, score: null, total: 0, faceMatch: 96, decision: 'pending', reason: '' } } }));
          if (examId === 'EX007') get().setExam('in_progress');
          log('employee', 'Secure exam started', `${examId} · ${nameOf(empId)} · identity matched 96% to the Employee ID photo (simulated)`);
          return id;
        },
        saveAttempt: (id, patch) => set((s) => ({ attempts: { ...s.attempts, [id]: { ...s.attempts[id], ...patch } } })),
        submitAttempt: (id, score, total) => {
          const a = get().attempts[id];
          if (!a) return;
          const have = new Set(a.events.map((e) => e.t));
          const events = [...a.events, ...PROCTOR_SCRIPT.filter((e) => !have.has(e.t)).slice(0, 4).map((e) => ({ ...e }))].sort((x, y) => x.t - y.t);
          set((s) => ({ attempts: { ...s.attempts, [id]: { ...a, events, submitted: true, score, total } } }));
          if (a.examId === 'EX007') get().setExam('submitted');
          log('employee', 'Secure exam submitted', `${a.examId} · ${a.name} · ${events.length} proctoring events for human review`);
        },
        markEvent: (id, index, mark) => set((s) => {
          const a = s.attempts[id];
          return { attempts: { ...s.attempts, [id]: { ...a, events: a.events.map((e, i) => (i === index ? { ...e, mark } : e)) } } };
        }),
        decideAttempt: (id, decision, reason) => {
          const a = get().attempts[id];
          set((s) => ({ attempts: { ...s.attempts, [id]: { ...s.attempts[id], decision, reason } } }));
          if (a?.examId === 'PTA') get().setIntegrity(decision === 'cleared' ? 'cleared' : 'flagged', reason);
          else if (a?.examId === 'EX007') get().setProctor(decision === 'cleared' ? 'Cleared' : 'Flagged');
          else log('trainer', decision === 'cleared' ? 'Integrity review cleared' : decision === 'flagged' ? 'Integrity review flagged' : 'Result withheld for committee', `${a?.examId} · ${a?.name} · ${reason}`);
        },
        publishExam: (e, draft) => {
          set((s) => ({ customExams: [e, ...s.customExams.filter((x) => x.id !== e.id)], toast: draft ? 'Exam saved as draft' : 'Exam published · candidates notified (simulated)' }));
          log(get().role === 'trainer' ? 'trainer' : 'hr', draft ? 'Exam saved as draft' : 'Exam published', `${e.title} · ${e.duration} min · pass ${e.passMark}%${e.proctored ? ' · proctored' : ''}`);
        },
        addQuestion: (q) => {
          set((s) => ({ customQuestions: [q, ...s.customQuestions], toast: 'Question added to the bank' }));
          log(get().role === 'trainer' ? 'trainer' : 'hr', 'Question added to the bank', `${q.id} · ${q.type} · ${q.topic}`);
        },
        toggleBookmark: (id) => set((s) => {
          const on = s.learn.bookmarks.includes(id);
          return { learn: { ...s.learn, bookmarks: on ? s.learn.bookmarks.filter((x) => x !== id) : [...s.learn.bookmarks, id] }, toast: on ? 'Bookmark removed' : 'Bookmarked' };
        }),
        toggleDownload: (id, title) => set((s) => {
          const on = s.learn.downloads.some((d) => d.id === id);
          return { learn: { ...s.learn, downloads: on ? s.learn.downloads.filter((d) => d.id !== id) : [...s.learn.downloads, { id, title, size: '42 MB', until: '30 Dec 2026' }] }, toast: on ? 'Removed from offline' : 'Saved for offline (simulated, encrypted on device)' };
        }),
        addGoal: (g) => {
          set((s) => ({ learn: { ...s.learn, goals: [...s.learn.goals, { ...g, id: `g${Date.now()}` }] }, toast: 'Goal added' }));
          log('employee', 'Learning goal set', `${g.title} · by ${g.target}`);
        },
        postForum: (course, text) => {
          const who = get().employeeId;
          set((s) => ({ learn: { ...s.learn, forum: [{ id: `f${Date.now()}`, course, author: nameOf(who), role: 'Employee', at: 'Just now', text, replies: [] }, ...s.learn.forum] }, toast: 'Question posted' }));
          log('employee', 'Forum question posted', `${course} · ${text.slice(0, 60)}`);
        },
        replyForum: (postId, text) => {
          const s0 = get();
          const trainer = s0.role === 'trainer';
          const author = trainer ? PERSONAS.trainer.name : nameOf(s0.employeeId);
          set((s) => ({ learn: { ...s.learn, extraPoints: s.learn.extraPoints + (trainer ? 0 : 20), forum: s.learn.forum.map((f) => (f.id === postId ? { ...f, replies: [...f.replies, { author, role: trainer ? 'Trainer' : 'Employee', at: 'Just now', text, trainer }] } : f)) }, toast: 'Reply posted' }));
          log(trainer ? 'trainer' : 'employee', 'Forum reply posted', text.slice(0, 60));
        },
        setStoryStep: (n) => set({ storyStep: n }),
      };
    },
    {
      name: 'eldp-demo-v2',
      // Bump DEMO_VERSION whenever the story's starting point or the state shape changes. Older saved progress is
      // replaced with a fresh start; only this demo's own storage key is touched.
      version: DEMO_VERSION,
      migrate: () => ({ ...initial }) as never,
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== 'function' && k !== 'undo')) as never,
    },
  ),
);

export const requestStatus = (s: FlowState): string => {
  if (!s.requestSubmitted) return s.draft.savedAt ? 'Draft saved' : 'Draft';
  if (s.completed) return 'Closed';
  if (s.scheduled) return 'Scheduled';
  if (s.reviewed) return 'Under Review';
  if (s.requestReturn) return 'Returned for information';
  if (s.requestForward) return `Forwarded · ${s.requestForward.to}`;
  return 'Pending HR Review';
};

export const trainingStatus = (s: FlowState): string => {
  if (!s.scheduled) return 'Not scheduled';
  if (s.planned.status === 'Postponed' || s.planned.status === 'Deleted') return s.planned.status;
  if (s.completed || s.attendanceSubmitted) return 'Completed';
  if (s.invitesSent) return 'Invitation Sent';
  return 'Scheduled';
};
