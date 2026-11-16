/** The division's training requests: the live story request plus earlier ones (fictional history). */
import { TRAINING } from '../../data';
import { findById, type Person } from '../../org';
import { attendedIds, ptResults, requestStatus, roster, trainingStatus, type DemoState } from '../../store';
import { COMPETENCIES } from '../../components/Tna';

export interface RequestRecord {
  id: string; title: string; raised: string; source: string; people: number; status: 'Not raised' | 'Ongoing' | 'Completed'; outcome: string;
  dates: string; venue: string; trainer: string; mode: string; competency: string;
  attended: number | null; passed: number | null; failed: number | null; feedback: string | null; cost: string;
  steps: { label: string; when: string | null }[];
  departments: [string, number][];
  participants?: Person[];
  live?: boolean;
}

const HISTORY: RequestRecord[] = [
  {
    id: 'TR-2026-00397', title: 'Negotiation Skills for Relationship Managers', raised: '21 Sep 2026', source: 'Development requests', people: 12, status: 'Ongoing', outcome: 'Scheduled · 3 Dec 2026',
    dates: '3 Dec 2026', venue: 'Executive Training Room', trainer: 'Ahsan Habib (External)', mode: 'External-local · Classroom', competency: 'Customer Experience',
    attended: null, passed: null, failed: null, feedback: null, cost: 'BDT 3,60,000',
    steps: [{ label: 'Request raised', when: '21 Sep' }, { label: 'HR review', when: '24 Sep' }, { label: 'Nominations', when: '6 Oct' }, { label: 'Scheduled', when: '15 Oct' }, { label: 'Training day', when: null }, { label: 'Assessment', when: null }, { label: 'Closed', when: null }],
    departments: [['Large Corporate', 5], ['Mid Corporate', 3], ['Structured Finance', 2], ['Corporate Liability', 2]],
  },
  {
    id: 'TR-2026-00381', title: 'Corporate Lending Documentation', raised: '2 Aug 2026', source: 'Survey', people: 18, status: 'Completed', outcome: '18 attended · 16 passed',
    dates: '9–10 Sep 2026', venue: 'City Bank Learning Center — Hall A', trainer: 'Sabina Yasmin (Internal)', mode: 'In-house · Classroom', competency: 'Execution Excellence',
    attended: 18, passed: 16, failed: 2, feedback: '4.4 / 5', cost: 'BDT 2,10,000',
    steps: [{ label: 'Request raised', when: '2 Aug' }, { label: 'HR review', when: '5 Aug' }, { label: 'Nominations', when: '16 Aug' }, { label: 'Scheduled', when: '22 Aug' }, { label: 'Training day', when: '9 Sep' }, { label: 'Assessment', when: '12 Sep' }, { label: 'Closed', when: '18 Sep' }],
    departments: [['Large Corporate', 6], ['Mid Corporate', 4], ['Structured Finance', 4], ['Corporate Liability', 4]],
  },
  {
    id: 'TR-2026-00356', title: 'Credit Appraisal Fundamentals', raised: '14 Jun 2026', source: 'Competency gap', people: 22, status: 'Completed', outcome: '20 attended · 17 passed',
    dates: '15–16 Jul 2026', venue: 'Head Office Auditorium', trainer: 'Nafis Ahmed (Internal)', mode: 'In-house · Classroom + Webinar', competency: 'Credit Analysis',
    attended: 20, passed: 17, failed: 3, feedback: '4.5 / 5', cost: 'BDT 4,80,000',
    steps: [{ label: 'Request raised', when: '14 Jun' }, { label: 'HR review', when: '17 Jun' }, { label: 'Nominations', when: '28 Jun' }, { label: 'Scheduled', when: '3 Jul' }, { label: 'Training day', when: '15 Jul' }, { label: 'Assessment', when: '19 Jul' }, { label: 'Closed', when: '26 Jul' }],
    departments: [['Large Corporate', 8], ['Mid Corporate', 4], ['Structured Finance', 5], ['Corporate Liability', 5]],
  },
];

/** The live request, built from the demo state. */
export function storyRequest(s: DemoState): RequestRecord {
  const ros = roster(s).map((e) => findById(e.id)).filter((p): p is Person => !!p);
  const pt = ptResults(s);
  const raised = s.requestSubmitted;
  const by = new Map<string, number>();
  const pool = s.finalized ? ros : s.draft.participantIds.map((id) => findById(id)).filter((p): p is Person => !!p);
  pool.forEach((p) => by.set(p.department, (by.get(p.department) ?? 0) + 1));
  return {
    id: TRAINING.requestId, title: TRAINING.title, raised: raised ? '12 Nov 2026' : '—',
    source: s.draft.sources.length ? s.draft.sources.join(' · ') : 'Competency and role gap',
    people: s.finalized ? ros.length : s.draft.participantIds.length || COMPETENCIES[0].below,
    status: !raised ? 'Not raised' : s.completed ? 'Completed' : 'Ongoing',
    outcome: !raised ? (s.needConfirmed ? 'Draft' : 'Ready to raise') : s.completed ? 'Closed · records updated' : `${requestStatus(s)} · ${trainingStatus(s)}`,
    dates: s.draft.dates, venue: s.scheduled ? 'City Bank Learning Center — Hall A' : s.draft.venue, trainer: s.draft.trainer, mode: `${s.draft.mode} · ${s.draft.medium}`, competency: 'Credit Analysis',
    attended: s.attendanceSubmitted ? attendedIds(s).length : null,
    passed: s.pta.released ? pt.filter((x) => x.status === 'Passed').length : null,
    failed: s.pta.released ? pt.filter((x) => x.status === 'Failed').length : null,
    feedback: s.feedbackSubmitted ? '4.6 / 5' : null, cost: 'BDT 14,40,000',
    steps: [
      { label: 'Request raised', when: raised ? '12 Nov' : null },
      { label: 'HR review', when: s.reviewed ? '12 Nov' : null },
      { label: 'Nominations', when: s.nominationSubmitted ? '13 Nov' : null },
      { label: 'Scheduled', when: s.scheduled ? '14 Nov' : null },
      { label: 'Training day', when: s.attendanceSubmitted ? '18–19 Nov' : null },
      { label: 'Assessment', when: s.pta.released ? '20 Nov' : null },
      { label: 'Closed', when: s.completed ? '21 Nov' : null },
    ],
    departments: [...by.entries()].sort((a, b) => b[1] - a[1]),
    participants: pool,
    live: true,
  };
}

export const requestLog = (s: DemoState): RequestRecord[] => [storyRequest(s), ...HISTORY];
export const findRequest = (s: DemoState, id: string) => requestLog(s).find((r) => r.id === id);
