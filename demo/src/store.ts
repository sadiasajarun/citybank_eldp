import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFLICT_IDS, NOMINEE_LIST, PERSONAS, ROLE_HOME, SADIA } from './data';
import type { Attendance, AuditEvent, Notice, Participation, Role } from './types';

export const STAGES = ['Request', 'HR Review', 'Scheduling', 'Nomination', 'Invitation', 'Attendance', 'Feedback', 'Completed'] as const;

export interface RequestDraft {
  title: string;
  category: string;
  competency: string;
  mode: string;
  medium: string;
  dates: string;
  duration: string;
  venue: string;
  tags: string[];
  justification: string;
  trainer: string;
  participants: number;
}

export const DEFAULT_DRAFT: RequestDraft = {
  title: '',
  category: 'Functional',
  competency: 'Credit Analysis',
  mode: 'Classroom + Webinar',
  medium: 'Instructor-led',
  dates: '18–19 November 2026',
  duration: '2 days · 16 man-hours',
  venue: 'City Bank Learning Center',
  tags: ['Credit', 'Risk', 'Mandatory'],
  justification: '',
  trainer: 'Nafis Ahmed (Internal) + Dr. Farhan Chowdhury (External)',
  participants: 32,
};

export type WithdrawalStatus = 'none' | 'requested' | 'proposed' | 'approved' | 'rejected';

interface DemoState {
  role: Role;
  employeeId: string; // which employee persona is shown in Employee view
  clock: number;
  draft: RequestDraft;
  requestSubmitted: boolean;
  scheduleStarted: boolean;
  scheduled: boolean;
  venueConflictShown: boolean;
  room: string;
  nominationRequested: boolean;
  nominationSubmitted: boolean;
  resolutions: Record<string, 'keep' | 'remove'>;
  finalized: boolean;
  invitesSent: boolean;
  participation: Record<string, Participation>;
  withdrawal: { status: WithdrawalStatus; empId: string; reason: string; replacementId: string };
  attendance: Record<string, Attendance | undefined>;
  attendanceSubmitted: boolean;
  feedbackSubmitted: boolean;
  completed: boolean;
  // other workflows
  courseProgress: number;
  courseCompleted: boolean;
  examStatus: 'upcoming' | 'in_progress' | 'submitted' | 'reviewed';
  proctorFlag: 'Review Required' | 'Cleared' | 'Flagged';
  aiScore: { state: 'suggested' | 'accepted' | 'adjusted'; score: number };
  journeyDone: number;
  audit: AuditEvent[];
  notices: Notice[];
  toast: string | null;
  impact: { id: number; key: string } | null;
  presenter: boolean;
  storyStep: number;
  // actions
  setPresenter: (v: boolean) => void;
  setStoryStep: (n: number) => void;
  clearImpact: () => void;
  setRole: (r: Role) => string;
  setEmployee: (id: string) => void;
  setDraft: (p: Partial<RequestDraft>) => void;
  submitRequest: () => void;
  startScheduling: () => void;
  showVenueConflict: () => void;
  publishSchedule: () => void;
  sendNomination: () => void;
  submitNominations: () => void;
  resolve: (id: string, d: 'keep' | 'remove') => void;
  finalize: () => void;
  sendInvites: () => void;
  accept: (id: string) => void;
  requestWithdrawal: (reason: string) => void;
  decideWithdrawal: (d: 'approve' | 'replace' | 'reject') => void;
  hrApproveWithdrawal: () => void;
  mark: (id: string, a: Attendance) => void;
  markAll: () => void;
  syncOnline: () => void;
  submitAttendance: () => void;
  submitFeedback: () => void;
  complete: () => void;
  setCourseProgress: (n: number) => void;
  completeCourse: () => void;
  setExam: (s: DemoState['examStatus']) => void;
  setProctor: (s: DemoState['proctorFlag']) => void;
  setAi: (s: 'accepted' | 'adjusted', score: number) => void;
  setJourney: (n: number) => void;
  advance: () => void;
  reset: () => void;
  dismissToast: () => void;
}

const initial = {
  role: 'hr' as Role,
  employeeId: 'e1',
  clock: 0,
  draft: DEFAULT_DRAFT,
  requestSubmitted: false,
  scheduleStarted: false,
  scheduled: false,
  venueConflictShown: false,
  room: 'City Bank Learning Center — Hall A',
  nominationRequested: false,
  nominationSubmitted: false,
  resolutions: {} as Record<string, 'keep' | 'remove'>,
  finalized: false,
  invitesSent: false,
  participation: {} as Record<string, Participation>,
  withdrawal: { status: 'none' as WithdrawalStatus, empId: 'e2', reason: '', replacementId: '' },
  attendance: {} as Record<string, Attendance | undefined>,
  attendanceSubmitted: false,
  feedbackSubmitted: false,
  completed: false,
  courseProgress: 65,
  courseCompleted: false,
  examStatus: 'upcoming' as DemoState['examStatus'],
  proctorFlag: 'Review Required' as DemoState['proctorFlag'],
  aiScore: { state: 'suggested' as const, score: 7 },
  journeyDone: 2,
  audit: [] as AuditEvent[],
  notices: [] as Notice[],
  toast: null as string | null,
  impact: null as { id: number; key: string } | null,
  presenter: false,
  storyStep: 0,
};

const fmt = (n: number) => {
  const m = 40 + n;
  return `12 Nov 2026 ${String(11 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      const log = (
        actorRole: Role,
        action: string,
        detail: string,
        extra: Partial<AuditEvent> = {},
        notice?: { title: string; to: Role | 'all' },
      ) => {
        const s = get();
        const at = fmt(s.clock);
        const ev: AuditEvent = {
          id: s.audit.length + 1,
          at,
          actor: PERSONAS[actorRole].name,
          actorRole: PERSONAS[actorRole].label,
          action,
          detail,
          ...extra,
        };
        set({
          clock: s.clock + 1,
          audit: [ev, ...s.audit],
          notices: notice ? [{ id: s.notices.length + 1, at, ...notice }, ...s.notices] : s.notices,
          toast: notice ? notice.title : s.toast,
          impact: { id: ev.id, key: action },
        });
      };

      return {
        ...initial,
        setRole: (r) => {
          set({ role: r });
          return ROLE_HOME[r];
        },
        setEmployee: (id) => set({ employeeId: id }),
        setDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),

        submitRequest: () => {
          const s = get();
          if (s.requestSubmitted) return;
          set({
            requestSubmitted: true,
            draft: { ...s.draft, title: s.draft.title || 'Advanced Credit Risk Management' },
          });
          log('division_head', 'Training request submitted', 'TR-2026-00418 · Advanced Credit Risk Management', { next: 'Pending HR Review' }, {
            title: 'Request TR-2026-00418 submitted successfully',
            to: 'hr',
          });
        },
        startScheduling: () => {
          if (get().scheduleStarted) return;
          set({ scheduleStarted: true });
          log('hr', 'Request opened for scheduling', 'TR-2026-00418 → TRN-2026-00182', { previous: 'Pending HR Review', next: 'Under Review' });
        },
        showVenueConflict: () => set({ venueConflictShown: true }),
        publishSchedule: () => {
          if (get().scheduled) return;
          set({ scheduled: true, scheduleStarted: true });
          log('hr', 'Training scheduled', 'TRN-2026-00182 · 18–19 Nov 2026 · City Bank Learning Center', { previous: 'Under Review', next: 'Scheduled' }, {
            title: 'Training TRN-2026-00182 scheduled',
            to: 'division_head',
          });
        },
        sendNomination: () => {
          if (get().nominationRequested) return;
          set({ nominationRequested: true });
          log('hr', 'Nomination requested', 'Corporate Banking, SME, Risk, Credit Administration · deadline 14 Nov 2026', {}, {
            title: 'Nomination required: Advanced Credit Risk Management',
            to: 'division_head',
          });
        },
        submitNominations: () => {
          if (get().nominationSubmitted) return;
          set({ nominationSubmitted: true });
          log('division_head', 'Nominations submitted', '35 employees nominated', {}, { title: '35 nominations received', to: 'hr' });
        },
        resolve: (id, d) => {
          set((s) => ({ resolutions: { ...s.resolutions, [id]: d } }));
          const e = NOMINEE_LIST.find((x) => x.id === id);
          log('hr', d === 'keep' ? 'Conflict overridden' : 'Nominee removed', `${e?.name} · ${e?.issue ?? ''}`);
        },
        finalize: () => {
          const s = get();
          if (s.finalized) return;
          const removed = NOMINEE_LIST.filter((e) => s.resolutions[e.id] === 'remove' || (CONFLICT_IDS.includes(e.id) && !s.resolutions[e.id] && e.id !== 'e2')).map((e) => e.id);
          const res = { ...s.resolutions };
          NOMINEE_LIST.forEach((e) => {
            if (CONFLICT_IDS.includes(e.id) && !res[e.id]) res[e.id] = e.id === 'e2' ? 'keep' : 'remove';
          });
          set({ finalized: true, resolutions: res });
          log('hr', 'Participants finalized', `Requested 35 · Eligible 31 · Conflicts 4 · Final 32 (${removed.length} removed)`, { previous: '35 nominees', next: '32 participants' });
        },
        sendInvites: () => {
          const s = get();
          if (s.invitesSent) return;
          const p: Record<string, Participation> = {};
          NOMINEE_LIST.forEach((e) => {
            if (s.resolutions[e.id] !== 'remove') p[e.id] = 'Invited';
          });
          set({ invitesSent: true, participation: p });
          log('hr', 'Invitations queued', '32 participants · 2 trainers · calendar events created (simulated)', {}, {
            title: 'Invitation: Advanced Credit Risk Management · 18–19 Nov 2026',
            to: 'employee',
          });
        },
        accept: (id) => {
          set((s) => ({ participation: { ...s.participation, [id]: 'Accepted' } }));
          const e = [...NOMINEE_LIST, SADIA].find((x) => x.id === id);
          log('employee', 'Invitation accepted', `${e?.name} · TRN-2026-00182`);
        },
        requestWithdrawal: (reason) => {
          set((s) => ({
            participation: { ...s.participation, e2: 'Withdrawal Requested' },
            withdrawal: { status: 'requested', empId: 'e2', reason, replacementId: '' },
          }));
          log('employee', 'Withdrawal requested', `Tanvir Hasan · ${reason}`, {}, { title: 'Withdrawal request: Tanvir Hasan', to: 'supervisor' });
        },
        decideWithdrawal: (d) => {
          if (d === 'reject') {
            set((s) => ({ participation: { ...s.participation, e2: 'Invited' }, withdrawal: { ...s.withdrawal, status: 'rejected' } }));
            log('supervisor', 'Withdrawal rejected', 'Tanvir Hasan remains a participant');
            return;
          }
          if (d === 'approve') {
            set((s) => ({ participation: { ...s.participation, e2: 'Approved' }, withdrawal: { ...s.withdrawal, status: 'proposed', replacementId: '' } }));
            log('supervisor', 'Withdrawal approved', 'Awaiting HR Admin approval', {}, { title: 'Withdrawal awaiting HR approval', to: 'hr' });
            return;
          }
          set((s) => ({
            participation: { ...s.participation, e2: 'Replacement Proposed' },
            withdrawal: { ...s.withdrawal, status: 'proposed', replacementId: 'e4' },
          }));
          log('supervisor', 'Replacement proposed', 'Tanvir Hasan → Sadia Islam (leave, calendar, training overlap, eligibility: all clear)', { previous: 'Tanvir Hasan', next: 'Sadia Islam' }, {
            title: 'Replacement proposed: Sadia Islam',
            to: 'hr',
          });
        },
        hrApproveWithdrawal: () => {
          const s = get();
          const rep = s.withdrawal.replacementId === 'e4';
          set({
            participation: { ...s.participation, e2: 'Withdrawn', ...(rep ? { e4: 'Invited' as Participation } : {}) },
            withdrawal: { ...s.withdrawal, status: 'approved' },
          });
          log(
            'hr',
            rep ? 'Participant replaced' : 'Participant withdrawn',
            rep ? 'Roster updated · replacement invitation issued' : 'Roster updated',
            { previous: 'Tanvir Hasan', next: rep ? 'Sadia Islam' : '—', approvedBy: 'Shahana Parvin, Senior HR Admin (maker-checker)' },
            rep ? { title: 'Invitation: Advanced Credit Risk Management (replacement)', to: 'employee' } : undefined,
          );
        },
        mark: (id, a) => set((s) => ({ attendance: { ...s.attendance, [id]: a } })),
        markAll: () => {
          const a: Record<string, Attendance> = {};
          const ids = roster(get()).map((e) => e.id);
          ids.forEach((id) => (a[id] = 'Present'));
          // Bank systems inform two exceptions: no check-in (attendance system) and approved sick leave (leave system)
          if (ids.length > 2) { a[ids[ids.length - 1]] = 'Absent'; a[ids[ids.length - 2]] = 'Excused'; }
          set({ attendance: a, toast: 'Marked present · Attendance system: 1 no check-in · Leave: 1 approved sick leave' });
        },
        syncOnline: () => {
          const ids = Object.keys(get().participation).filter((id) => get().participation[id] !== 'Withdrawn').slice(0, 12);
          set((s) => {
            const a = { ...s.attendance };
            ids.forEach((id) => (a[id] = 'Present'));
            return { attendance: a };
          });
          log('hr', 'Online attendance synced', '12 online attendees matched from Teams report (simulated)');
        },
        submitAttendance: () => {
          const s = get();
          const next: Record<string, Participation> = { ...s.participation };
          Object.keys(next).forEach((id) => {
            if (next[id] === 'Withdrawn') return;
            const a = s.attendance[id];
            next[id] = a === 'Absent' ? 'Absent' : 'Attended';
          });
          set({ attendanceSubmitted: true, participation: next });
          log('hr', 'Attendance submitted', 'Training database, learning history, investment and cost-per-employee updated', {}, {
            title: 'Employee learning records updated',
            to: 'all',
          });
        },
        submitFeedback: () => {
          set({ feedbackSubmitted: true });
          log('employee', 'Feedback submitted', 'Advanced Credit Risk Management · 4.6/5');
        },
        complete: () => {
          set({ completed: true });
          log('hr', 'Training completed', 'TRN-2026-00182 closed · request TR-2026-00418 Closed', { previous: 'Scheduled', next: 'Completed' });
        },
        setCourseProgress: (n) => set({ courseProgress: n }),
        completeCourse: () => {
          set({ courseCompleted: true, courseProgress: 100 });
          log('employee', 'Course completed', 'Annual Information Security Awareness 2026 · certificate issued');
        },
        setExam: (s) => set({ examStatus: s }),
        setProctor: (p) => {
          set({ proctorFlag: p });
          log('trainer', `Proctoring ${p === 'Cleared' ? 'cleared' : 'flagged'}`, 'AML Annual Certification Assessment · human review');
        },
        setAi: (state, score) => {
          set({ aiScore: { state, score } });
          log('trainer', state === 'accepted' ? 'AI-suggested score accepted' : 'AI-suggested score adjusted', `Essay Q9 · final ${score}/10 · override logged with justification`);
        },
        setJourney: (n) => set({ journeyDone: n }),
        advance: () => {
          const s = get();
          if (!s.requestSubmitted) return get().submitRequest();
          if (!s.scheduled) return get().publishSchedule();
          if (!s.nominationRequested) return get().sendNomination();
          if (!s.nominationSubmitted) return get().submitNominations();
          if (!s.finalized) return get().finalize();
          if (!s.invitesSent) return get().sendInvites();
          if (s.withdrawal.status === 'none') {
            get().accept('e1');
            return get().requestWithdrawal('Client meeting scheduled during training.');
          }
          if (s.withdrawal.status === 'requested') return get().decideWithdrawal('replace');
          if (s.withdrawal.status === 'proposed') return get().hrApproveWithdrawal();
          if (!s.attendanceSubmitted) {
            get().markAll();
            return get().submitAttendance();
          }
          if (!s.feedbackSubmitted) return get().submitFeedback();
          if (!s.completed) return get().complete();
        },
        reset: () => set({ ...initial, role: get().role, presenter: get().presenter, toast: 'Scenario reset to original demo state' }),
        dismissToast: () => set({ toast: null }),
        setPresenter: (v) => set({ presenter: v }),
        setStoryStep: (n) => set({ storyStep: n }),
        clearImpact: () => set({ impact: null }),
      };
    },
    {
      name: 'eldp-demo-v1',
      partialize: (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')) as never,
    },
  ),
);

export const roster = (s: Pick<DemoState, 'resolutions' | 'participation'>) => {
  const base = NOMINEE_LIST.filter((e) => s.resolutions[e.id] !== 'remove');
  const withSadia = s.participation['e4'] ? [...base, SADIA] : base;
  return withSadia.filter((e) => s.participation[e.id] !== 'Withdrawn');
};

export const stageIndex = (s: DemoState): number => {
  if (!s.requestSubmitted) return 0;
  if (s.completed) return 8;
  if (s.feedbackSubmitted) return 7;
  if (s.attendanceSubmitted) return 6;
  if (s.invitesSent) return 5;
  if (s.finalized) return 4;
  if (s.scheduled) return 3;
  if (s.scheduleStarted) return 2;
  return 1;
};

export const requestStatus = (s: DemoState): string => {
  if (!s.requestSubmitted) return 'Draft';
  if (s.completed) return 'Closed';
  if (s.scheduled) return 'Scheduled';
  if (s.scheduleStarted) return 'Under Review';
  return 'Pending HR Review';
};

export const trainingStatus = (s: DemoState): string => {
  if (!s.scheduled) return '—';
  if (s.completed) return 'Completed';
  if (s.attendanceSubmitted) return 'Completed';
  if (s.invitesSent) return 'Invitation Sent';
  return 'Scheduled';
};
