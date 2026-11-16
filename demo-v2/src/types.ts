export type Role = 'division_head' | 'hr' | 'finance' | 'trainer' | 'employee' | 'supervisor' | 'admin' | 'management';

export type Attendance = 'Present' | 'Absent' | 'Late' | 'Excused';

export type Participation =
  | 'Invited'
  | 'Accepted'
  | 'Withdrawal Requested'
  | 'Replacement Proposed'
  | 'Approved'
  | 'Attended'
  | 'Absent'
  | 'Withdrawn';

export type Eligibility = 'Eligible' | 'Attention' | 'Conflict';

export interface Employee {
  id: string;
  eid: string;
  name: string;
  role: string;
  division: string;
  supervisor: string;
  leave: string;
  calendar: string;
  eligibility: Eligibility;
  issue?: string;
}

export interface AuditEvent {
  id: number;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  detail: string;
  previous?: string;
  next?: string;
  approvedBy?: string;
}

export interface Notice {
  id: number;
  at: string;
  title: string;
  to: Role | 'all';
}
