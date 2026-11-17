/**
 * Fictional City Bank learning data for FY2026 (the "bank around the story").
 * Every figure here is fictional demonstration data. The story training (TR-2026-00418) is merged in live by
 * `batchesOf(s)`, so its status follows the guided journey; everything else is a stable backdrop that makes the
 * dashboards, reports and module pages look like a bank in operation.
 */
import { TRAINING } from '../data';
import type { DemoState } from '../store';

/* ------------------------------------------------------------------ */
/* Training batches (TMS)                                              */
/* ------------------------------------------------------------------ */
export type BatchStatus = 'Completed' | 'Ongoing' | 'Scheduled' | 'Draft' | 'Closed';
export interface Batch {
  id: string; title: string; venue: string; start: string; end: string; trainer: string; enrolled: number; seats: number;
  mode: string; medium: string; status: BatchStatus; budget: number; actual: number; category: string; tags: string[]; division: string; story?: boolean;
}
const B = (id: string, title: string, venue: string, start: string, end: string, trainer: string, enrolled: number, seats: number, status: BatchStatus, budget: number, actual: number, category: string, tags: string[], division: string, mode = 'In-house', medium = 'Classroom'): Batch =>
  ({ id, title, venue, start, end, trainer, enrolled, seats, mode, medium, status, budget, actual, category, tags, division });

export const BATCHES: Batch[] = [
  B('TP001', 'AML & CFT Fundamentals for Banking Professionals', 'City Bank Learning Center, Gulshan', '10 Sep 2026', '11 Sep 2026', 'Sabina Yasmin', 24, 25, 'Completed', 150000, 142500, 'Compliance & Regulatory', ['AML', 'Compliance'], 'Retail Banking'),
  B('TP002', 'City Foundation Program — Batch 12', 'City Bank Learning Center, Gulshan', '04 Aug 2026', '08 Aug 2026', 'Nusrat Jahan', 28, 30, 'Completed', 200000, 188000, 'Induction & Orientation', ['City Foundation'], 'HR & Training'),
  B('TP003', 'Credit Risk Analysis & Appraisal', 'Pan Pacific Sonargaon, Dhaka', '22 Sep 2026', '24 Sep 2026', 'Dr. Farhan Chowdhury', 18, 20, 'Completed', 320000, 331000, 'Credit & Lending', ['Credit', 'Risk'], 'Corporate Banking', 'External-local'),
  B('TP004', 'Foreign Trade Finance & LC Operations', 'City Bank Learning Center, Gulshan', '10 Nov 2026', '11 Nov 2026', 'Ahsan Habib', 17, 20, 'Ongoing', 100000, 64000, 'Trade Finance', ['Foreign Trade'], 'Corporate Banking'),
  B('TP005', 'Islamic Banking Products & Shariah Compliance', 'City Bank Learning Center, Gulshan', '25 Nov 2026', '27 Nov 2026', 'Sabina Yasmin', 19, 25, 'Scheduled', 180000, 0, 'Islamic Banking', ['Islamic Banking'], 'Retail Banking'),
  B('TP006', 'POSH — Prevention of Sexual Harassment at Workplace', 'Head Office Board Room, Dhaka', '05 Oct 2026', '05 Oct 2026', 'Nusrat Jahan', 48, 50, 'Completed', 60000, 54000, 'Compliance & Regulatory', ['POSH', 'Compliance'], 'All divisions'),
  B('TP007', 'ICT Security & Cyber Awareness for Bankers', 'City Bank IT Department, Dhaka', '20 Oct 2026', '20 Oct 2026', 'Md. Touhidul Islam', 29, 30, 'Completed', 90000, 86000, 'Technology & Digital', ['ICT', 'ISS'], 'Operations'),
  B('TP008', 'Leadership Development for Mid-Level Managers', 'BIBM Campus, Mirpur', '16 Jul 2026', '18 Jul 2026', 'Dr. Farhan Chowdhury', 22, 25, 'Completed', 435000, 446000, 'Leadership & Management', ['City Future Fit'], 'All divisions', 'External-local'),
  B('TP009', 'Treasury & Liquidity Management Basics', 'Head Office Auditorium', '14 Jun 2026', '15 Jun 2026', 'Ahsan Habib', 20, 20, 'Completed', 120000, 118500, 'Finance & Treasury', ['Risk'], 'Treasury'),
  B('TP010', 'Customer Experience Excellence in Banking', 'Chattogram Regional Training Room', '08 Oct 2026', '09 Oct 2026', 'Nusrat Jahan', 26, 30, 'Completed', 85000, 79000, 'Sales & Marketing', ['CRM'], 'Retail Banking'),
  B('TP011', 'SME Credit Assessment Clinic', 'City Bank Learning Center, Gulshan', '12 May 2026', '13 May 2026', 'Sabina Yasmin', 21, 24, 'Completed', 110000, 104000, 'Credit & Lending', ['Credit'], 'SME Banking'),
  B('TP012', 'Operational Risk Management & Basel III', 'Executive Training Room', '21 Nov 2026', '22 Nov 2026', 'Nafis Ahmed', 15, 20, 'Scheduled', 75000, 0, 'Risk Management', ['Risk'], 'Risk Management'),
  B('TP013', 'Sustainable Finance Fundamentals', 'Online · Microsoft Teams', '02 Dec 2026', '02 Dec 2026', 'Dr. Farhan Chowdhury', 0, 60, 'Draft', 40000, 0, 'Finance & Treasury', ['Sustainable Finance'], 'All divisions', 'In-house', 'Webinar'),
  B('TP014', 'Excel for Bankers — Data & Analytics', 'Online · Zoom', '18 Mar 2026', '19 Mar 2026', 'Md. Touhidul Islam', 38, 40, 'Completed', 50000, 46000, 'Technology & Digital', ['ICT'], 'All divisions', 'In-house', 'Webinar'),
  B('TP015', 'KYC & Customer Due Diligence Refresher', 'Head Office Auditorium', '11 Nov 2026', '11 Nov 2026', 'Sabina Yasmin', 44, 50, 'Ongoing', 70000, 40000, 'Compliance & Regulatory', ['AML'], 'Retail Banking'),
  B('TP016', 'Digital Banking & Fintech Innovation', 'City Bank Learning Center, Gulshan', '27 Aug 2026', '28 Aug 2026', 'Ahsan Habib', 24, 25, 'Completed', 160000, 157000, 'Technology & Digital', ['City Future Fit'], 'Retail Banking'),
  B('TP017', 'Treasury Certification — Overseas', 'Singapore (external)', '10 Jan 2026', '24 Jan 2026', 'External · SBF', 2, 2, 'Closed', 850000, 850000, 'Finance & Treasury', ['Risk'], 'Treasury', 'External-foreign'),
];

const storyStatus = (s: DemoState): BatchStatus => (s.completed ? 'Completed' : s.attendanceSubmitted ? 'Ongoing' : s.scheduled ? 'Scheduled' : 'Draft');
/** All batches with the story training merged in live. */
export function batchesOf(s: DemoState): Batch[] {
  const story: Batch = {
    id: 'TP018', title: TRAINING.title, venue: s.sched?.venue || TRAINING.venue, start: '18 Nov 2026', end: '19 Nov 2026', trainer: 'Nafis Ahmed + Dr. Farhan Chowdhury',
    enrolled: s.finalized ? 30 : s.nominationSubmitted ? s.nominatedCount || 35 : 0, seats: 32, mode: 'In-house + External-local', medium: 'Classroom', status: storyStatus(s),
    budget: 1440000, actual: s.completed ? 1386000 : 0, category: 'Credit & Lending', tags: [...TRAINING.tags], division: 'Corporate Banking', story: true,
  };
  return [...BATCHES, story];
}

/* ------------------------------------------------------------------ */
/* Money (BDT) and headline figures                                    */
/* ------------------------------------------------------------------ */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Monthly L&D spend vs FY26 budget benchmark, in lakh BDT. */
export const SPEND_ACTUAL = [9.2, 10.8, 10.1, 13.6, 9.4, 6.8, 11.9, 13.4, 18.4, 15.6, 12.1, 11.8];
export const SPEND_TARGET = [10.4, 10.6, 10.9, 12.4, 12.0, 11.4, 12.2, 13.4, 16.8, 15.9, 13.2, 12.6];
export const DIVISION_BUDGET: { division: string; budget: number; actual: number }[] = [
  { division: 'Retail Banking', budget: 31.5, actual: 29.6 },
  { division: 'Corporate Banking', budget: 23.6, actual: 22.4 },
  { division: 'HR & Training', budget: 7.4, actual: 7.0 },
  { division: 'IT', budget: 15.8, actual: 14.9 },
  { division: 'Risk Management', budget: 12.2, actual: 11.6 },
  { division: 'Operations', budget: 9.9, actual: 9.4 },
  { division: 'Finance', budget: 8.0, actual: 7.5 },
  { division: 'Islamic Banking', budget: 7.6, actual: 7.1 },
];
export const HEADLINE = { trainings: 142, trainingsGrowth: '12% vs 2025', employeesTrained: 387, investment: 12750000, avgHours: 32.4, withinBudget: '94% within budget', completion: 84.6, completionTarget: 85, mom: '3.1% MoM', bondLiability: 1020416, activeBonds: 6, withdrawals: 3 };
export const bdt = (n: number) => `৳${n.toLocaleString('en-IN')}`;
export const lakh = (n: number) => `৳${n.toFixed(1)}L`;

/* ------------------------------------------------------------------ */
/* e-Learning                                                          */
/* ------------------------------------------------------------------ */
export type Format = 'SCORM 1.2' | 'SCORM 2004' | 'xAPI' | 'cmi5' | 'H5P' | 'Video HLS';
export interface Course { id: string; title: string; category: string; format: Format; version: string; mandatory: boolean; modules: number; hours: number; level: 'Beginner' | 'Intermediate' | 'Advanced'; enrolled: number; completion: number; status: 'Published' | 'Draft' | 'Archived'; my?: number; color: string; instructor: string; updated: string }
export const COURSES: Course[] = [
  { id: 'EL001', title: 'AML/CFT Compliance — Self-Paced Module', category: 'Compliance & Regulatory', format: 'SCORM 1.2', version: 'v2.1', mandatory: true, modules: 8, hours: 4, level: 'Intermediate', enrolled: 312, completion: 87, status: 'Published', my: 65, color: '#d71920', instructor: 'Sabina Yasmin', updated: '02 Nov 2026' },
  { id: 'EL002', title: 'Banking Foundation — City Bank Essentials', category: 'Induction & Orientation', format: 'Video HLS', version: 'v3.0', mandatory: true, modules: 10, hours: 6, level: 'Beginner', enrolled: 148, completion: 95, status: 'Published', my: 100, color: '#a8121a', instructor: 'Nusrat Jahan', updated: '18 Oct 2026' },
  { id: 'EL003', title: 'Introduction to Islamic Banking', category: 'Islamic Banking', format: 'xAPI', version: 'v1.5', mandatory: false, modules: 7, hours: 5, level: 'Beginner', enrolled: 96, completion: 72, status: 'Published', my: 40, color: '#1f6b3a', instructor: 'Sabina Yasmin', updated: '30 Sep 2026' },
  { id: 'EL004', title: 'Information Security Awareness 2026', category: 'Technology & Digital', format: 'SCORM 2004', version: 'v1.4', mandatory: true, modules: 6, hours: 3, level: 'Beginner', enrolled: 420, completion: 91, status: 'Published', color: '#26324a', instructor: 'Md. Touhidul Islam', updated: '01 Nov 2026' },
  { id: 'EL005', title: 'Credit Appraisal — Fundamentals', category: 'Credit & Lending', format: 'H5P', version: 'v1.2', mandatory: false, modules: 12, hours: 8, level: 'Intermediate', enrolled: 175, completion: 68, status: 'Published', my: 35, color: '#6d3fd1', instructor: 'Nafis Ahmed', updated: '12 Oct 2026' },
  { id: 'EL006', title: 'Foreign Trade Finance — Documentary Credits', category: 'Trade Finance', format: 'cmi5', version: 'v1.0', mandatory: false, modules: 9, hours: 6, level: 'Advanced', enrolled: 88, completion: 59, status: 'Published', my: 0, color: '#0b6a8f', instructor: 'Ahsan Habib', updated: '21 Oct 2026' },
  { id: 'EL007', title: 'Excel for Bankers — Data & Analytics', category: 'Technology & Digital', format: 'Video HLS', version: 'v2.0', mandatory: false, modules: 8, hours: 5, level: 'Intermediate', enrolled: 220, completion: 76, status: 'Published', my: 100, color: '#0f7a55', instructor: 'Md. Touhidul Islam', updated: '05 Sep 2026' },
  { id: 'EL008', title: 'POSH Policy & Workplace Ethics', category: 'Compliance & Regulatory', format: 'SCORM 1.2', version: 'v2.0', mandatory: true, modules: 4, hours: 2, level: 'Beginner', enrolled: 445, completion: 98, status: 'Published', my: 100, color: '#c2570c', instructor: 'Nusrat Jahan', updated: '28 Aug 2026' },
  { id: 'EL009', title: 'Customer Service Excellence in Banking', category: 'Sales & Marketing', format: 'Video HLS', version: 'v1.1', mandatory: false, modules: 6, hours: 4, level: 'Beginner', enrolled: 260, completion: 81, status: 'Published', my: 100, color: '#b4235a', instructor: 'Nusrat Jahan', updated: '14 Aug 2026' },
  { id: 'EL010', title: 'Operational Risk & Loss Event Reporting', category: 'Risk Management', format: 'SCORM 2004', version: 'v1.0', mandatory: false, modules: 7, hours: 5, level: 'Intermediate', enrolled: 132, completion: 54, status: 'Published', my: 20, color: '#5b6474', instructor: 'Nafis Ahmed', updated: '09 Oct 2026' },
  { id: 'EL011', title: 'Anti-Bribery & Anti-Corruption — Awareness', category: 'Compliance & Regulatory', format: 'H5P', version: 'v1.0', mandatory: true, modules: 3, hours: 1.5, level: 'Beginner', enrolled: 0, completion: 0, status: 'Draft', color: '#8a1c1c', instructor: 'Sabina Yasmin', updated: '10 Nov 2026' },
  { id: 'EL012', title: 'Treasury Management & Liquidity Basics', category: 'Finance & Treasury', format: 'xAPI', version: 'v0.9', mandatory: false, modules: 6, hours: 4, level: 'Intermediate', enrolled: 64, completion: 47, status: 'Published', color: '#2f5d8a', instructor: 'Ahsan Habib', updated: '22 Sep 2026' },
];
export const LEARNING_PATHS: { title: string; desc: string; mandatory: boolean; steps: string[] }[] = [
  { title: 'City Bank Foundation & Compliance Onboarding Track', desc: 'Mandatory onboarding and annual compliance: City Bank essentials, AML/CFT, cyber security and POSH.', mandatory: true, steps: ['EL002', 'EL001', 'EL004', 'EL008'] },
  { title: 'Certified Credit & Trade Finance Specialist', desc: 'Role progression for Corporate and Retail Relationship Managers: credit appraisal and documentary credits.', mandatory: false, steps: ['EL009', 'EL005', 'EL006'] },
  { title: 'Islamic Banking & Shariah Governance Track', desc: 'Shariah principles, anti-bribery and operational risk for Islamic Banking officers.', mandatory: true, steps: ['EL003', 'EL011', 'EL010'] },
  { title: 'Digital Analytics, Risk & Leadership Track', desc: 'Data-backed decisions for supervisors, division heads, IT and risk teams.', mandatory: false, steps: ['EL007', 'EL010', 'EL012'] },
];

/* ------------------------------------------------------------------ */
/* Assessments and exams                                               */
/* ------------------------------------------------------------------ */
export interface Exam { id: string; title: string; linked: string; date: string; status: 'Live' | 'Upcoming' | 'Completed' | 'Draft'; candidates: number; avg: number | null; pass: number | null; duration: number; passMark: number; proctored: boolean; scripts: number }
export const EXAMS: Exam[] = [
  { id: 'EX001', title: 'AML & CFT Post-Training Assessment', linked: 'AML & CFT Fundamentals for Banking Professionals', date: '11 Sep 2026', status: 'Completed', candidates: 24, avg: 76.5, pass: 90, duration: 60, passMark: 70, proctored: true, scripts: 10 },
  { id: 'EX002', title: 'City Foundation — Final Knowledge Test', linked: 'City Foundation Program — Batch 12', date: '08 Aug 2026', status: 'Completed', candidates: 28, avg: 82.3, pass: 100, duration: 45, passMark: 60, proctored: false, scripts: 5 },
  { id: 'EX003', title: 'Credit Risk Analysis — Final Exam', linked: 'Credit Risk Analysis & Appraisal', date: '24 Sep 2026', status: 'Completed', candidates: 18, avg: 78.1, pass: 87.5, duration: 90, passMark: 70, proctored: true, scripts: 8 },
  { id: 'EX004', title: 'Islamic Banking Shariah Compliance MCQ', linked: 'Islamic Banking Products & Shariah Compliance', date: '27 Nov 2026', status: 'Upcoming', candidates: 19, avg: null, pass: null, duration: 60, passMark: 70, proctored: true, scripts: 6 },
  { id: 'EX005', title: 'POSH Awareness — Online Quiz', linked: 'POSH — Prevention of Sexual Harassment', date: '06 Oct 2026', status: 'Completed', candidates: 48, avg: 91.2, pass: 100, duration: 20, passMark: 60, proctored: false, scripts: 12 },
  { id: 'EX006', title: 'Cybersecurity Awareness — Assessment', linked: 'ICT Security & Cyber Awareness', date: '20 Oct 2026', status: 'Completed', candidates: 29, avg: 83.4, pass: 90, duration: 45, passMark: 70, proctored: true, scripts: 10 },
  { id: 'EX007', title: 'AML Annual Certification Assessment', linked: 'Mandatory · bank-wide', date: '30 Nov 2026', status: 'Upcoming', candidates: 420, avg: null, pass: null, duration: 60, passMark: 70, proctored: true, scripts: 0 },
  { id: 'EX008', title: 'Trade Finance — UCP 600 Check', linked: 'Foreign Trade Finance & LC Operations', date: '11 Nov 2026', status: 'Live', candidates: 17, avg: null, pass: null, duration: 40, passMark: 70, proctored: true, scripts: 4 },
  { id: 'EX009', title: 'Leadership Case Study Evaluation', linked: 'Leadership Development for Mid-Level Managers', date: '18 Jul 2026', status: 'Completed', candidates: 22, avg: 80.6, pass: 95, duration: 120, passMark: 65, proctored: false, scripts: 22 },
  { id: 'EX010', title: 'Basel III Quick Check', linked: 'Operational Risk Management & Basel III', date: '22 Nov 2026', status: 'Draft', candidates: 0, avg: null, pass: null, duration: 30, passMark: 70, proctored: false, scripts: 0 },
];
export const QTYPES = ['MCQ', 'True / False', 'Fill in blank', 'Short answer', 'Essay', 'Image MCQ', 'Case study', 'Matching', 'Drag & drop'] as const;
export interface Question { id: string; text: string; type: (typeof QTYPES)[number]; topic: string; level: 'Easy' | 'Medium' | 'Hard'; marks: number; usedIn: number; minutes: number; options?: string[]; answer?: number }
export const QUESTIONS: Question[] = [
  { id: 'QB001', text: 'Under BFIU guidelines, within how many working days must a Suspicious Transaction Report (STR) be submitted once suspicion is confirmed?', type: 'MCQ', topic: 'AML & CFT', level: 'Easy', marks: 2, usedIn: 14, minutes: 2, options: ['Immediately without delay (within 24–48 hours)', 'Within 15 calendar days', 'At the end of the fiscal quarter', 'Only during annual audit'], answer: 0 },
  { id: 'QB002', text: 'Which threshold applies to Cash Transaction Reporting (CTR) per customer account in a single day under Bangladesh Bank BFIU regulations?', type: 'MCQ', topic: 'AML & CFT', level: 'Medium', marks: 2, usedIn: 19, minutes: 2, options: ['BDT 5 lakh', 'BDT 10 lakh', 'BDT 25 lakh', 'BDT 1 crore'], answer: 1 },
  { id: 'QB003', text: 'What does UCP 600 govern in international banking operations?', type: 'MCQ', topic: 'Foreign Trade', level: 'Easy', marks: 2, usedIn: 11, minutes: 2, options: ['Documentary credits', 'Interbank lending rates', 'Card payments', 'Capital adequacy'], answer: 0 },
  { id: 'QB004', text: 'Enhanced Due Diligence (EDD) is mandatory for Politically Exposed Persons (PEPs) and high-risk corporate customers.', type: 'True / False', topic: 'AML & CFT', level: 'Easy', marks: 1, usedIn: 22, minutes: 1, options: ['True', 'False'], answer: 0 },
  { id: 'QB005', text: 'Tipping off a customer that a Suspicious Transaction Report (STR) has been filed against them is permissible if approved by the branch manager.', type: 'True / False', topic: 'AML & CFT', level: 'Easy', marks: 1, usedIn: 18, minutes: 1, options: ['True', 'False'], answer: 1 },
  { id: 'QB006', text: 'Under Basel III, the minimum Capital to Risk-weighted Assets Ratio (CRAR) including Capital Conservation Buffer mandated by Bangladesh Bank is ____ percent.', type: 'Fill in blank', topic: 'Risk Management', level: 'Medium', marks: 2, usedIn: 8, minutes: 2 },
  { id: 'QB007', text: 'In Islamic banking, the cost-plus-profit sale contract commonly used for trade and working capital financing is called ____.', type: 'Fill in blank', topic: 'Islamic Banking', level: 'Easy', marks: 2, usedIn: 10, minutes: 2 },
  { id: 'QB008', text: 'Briefly explain the three lines of defense model in operational risk governance for a commercial bank.', type: 'Short answer', topic: 'Risk Management', level: 'Medium', marks: 5, usedIn: 6, minutes: 5 },
  { id: 'QB009', text: 'Analyse how City Bank should balance rapid SME credit growth with early-warning delinquency controls across regional branches.', type: 'Essay', topic: 'Credit & Lending', level: 'Hard', marks: 15, usedIn: 4, minutes: 15 },
  { id: 'QB010', text: 'Identify the red flag in this trade invoice image.', type: 'Image MCQ', topic: 'Foreign Trade', level: 'Medium', marks: 2, usedIn: 3, minutes: 2, options: ['Over-invoicing', 'Missing HS code', 'Wrong currency', 'None'], answer: 0 },
  { id: 'QB011', text: 'Case: a corporate client requests a short-term loan restructuring after two missed instalments. Recommend the next three steps.', type: 'Case study', topic: 'Credit & Lending', level: 'Hard', marks: 10, usedIn: 5, minutes: 10 },
  { id: 'QB012', text: 'Match each Islamic finance contract to its use.', type: 'Matching', topic: 'Islamic Banking', level: 'Medium', marks: 4, usedIn: 4, minutes: 3 },
  { id: 'QB013', text: 'Order the steps of the KYC onboarding process.', type: 'Drag & drop', topic: 'AML & CFT', level: 'Easy', marks: 3, usedIn: 7, minutes: 2 },
  { id: 'QB014', text: 'Which document confirms that goods were shipped on board under a letter of credit?', type: 'MCQ', topic: 'Foreign Trade', level: 'Medium', marks: 2, usedIn: 9, minutes: 2, options: ['Bill of lading', 'Proforma invoice', 'Packing list', 'Insurance certificate'], answer: 0 },
  { id: 'QB015', text: 'A phishing email asks you to verify your password through a link. What is the correct response?', type: 'MCQ', topic: 'Cyber Security', level: 'Easy', marks: 2, usedIn: 16, minutes: 1, options: ['Report it to IT security and delete', 'Click and verify quickly', 'Forward to colleagues', 'Reply asking for details'], answer: 0 },
  { id: 'QB016', text: 'Describe the role of the Internal Complaints Committee (ICC) under City Bank POSH policy.', type: 'Short answer', topic: 'Compliance & POSH', level: 'Medium', marks: 5, usedIn: 3, minutes: 5 },
  { id: 'QB017', text: 'Debt Service Coverage Ratio (DSCR) below 1.0 indicates the borrower can comfortably service debt.', type: 'True / False', topic: 'Credit & Lending', level: 'Easy', marks: 1, usedIn: 12, minutes: 1, options: ['True', 'False'], answer: 1 },
  { id: 'QB018', text: 'Which control best prevents unauthorised changes to a customer limit in the core banking system?', type: 'MCQ', topic: 'Risk Management', level: 'Medium', marks: 2, usedIn: 7, minutes: 2, options: ['Maker-checker dual control', 'Password expiry', 'Branch CCTV', 'Monthly reconciliation'], answer: 0 },
];
export const GRADING: { exam: string; examId: string; scripts: number; date: string }[] = [
  { exam: 'AML & CFT Post-Training Assessment', examId: 'EX001', scripts: 10, date: '11 Sep 2026' },
  { exam: 'City Foundation — Final Knowledge Test', examId: 'EX002', scripts: 5, date: '08 Aug 2026' },
  { exam: 'Credit Risk Analysis — Final Exam', examId: 'EX003', scripts: 8, date: '24 Sep 2026' },
  { exam: 'Islamic Banking Shariah Compliance MCQ', examId: 'EX004', scripts: 6, date: '27 Nov 2026' },
  { exam: 'POSH Awareness — Online Quiz', examId: 'EX005', scripts: 12, date: '06 Oct 2026' },
  { exam: 'Cybersecurity Awareness — Assessment', examId: 'EX006', scripts: 10, date: '20 Oct 2026' },
  { exam: 'Leadership Case Study Evaluation', examId: 'EX009', scripts: 22, date: '18 Jul 2026' },
];
export interface Submission { id: string; name: string; eid: string; role: string; objective: string; status: 'Pending' | 'Graded'; answer: string; question: string; ai: number; max: number; confidence: number; similarity: number; rationale: string }
export const SUBMISSIONS: Submission[] = [
  { id: 's1', name: 'Rahim Uddin', eid: 'CBL-11003', role: 'Officer, Corporate Credit', objective: '66 / 75', status: 'Pending', question: QUESTIONS[8].text, answer: 'City Bank can balance SME portfolio expansion with disciplined underwriting by enforcing minimum 1.25x DSCR stress testing at +200 bps interest sensitivity, mandatory clean Bangladesh Bank CIB checks for all directors, and quarterly post-disbursement cash-flow tracking via relationship managers.', ai: 13.5, max: 15, confidence: 88, similarity: 4, rationale: 'Strong coverage of DSCR stress testing, CIB verification and post-disbursement monitoring; minor deduction (−1.5) for omitting the collateral perfection timeline.' },
  { id: 's2', name: 'Sumaiya Rahman Mitu', eid: 'CBL-11456', role: 'Officer, Trade Finance', objective: '59 / 75', status: 'Pending', question: QUESTIONS[8].text, answer: 'Growth should be tied to sector limits and an early-warning dashboard: overdue days, overdraft utilisation and stock reports. Regional credit committees should review any account with two warnings.', ai: 11, max: 15, confidence: 81, similarity: 9, rationale: 'Good early-warning indicators and governance; lacks quantitative thresholds and CIB verification.' },
  { id: 's3', name: 'Md. Rezaul Karim', eid: 'CBL-11678', role: 'Executive, Central Operations', objective: '70 / 75', status: 'Graded', question: QUESTIONS[8].text, answer: 'Use risk-based pricing, CIB screening, DSCR ≥ 1.25x, collateral perfection within 30 days and monthly portfolio review.', ai: 14, max: 15, confidence: 92, similarity: 3, rationale: 'Complete and concise; all key controls named.' },
];

/* ------------------------------------------------------------------ */
/* Feedback, bonds, competency                                         */
/* ------------------------------------------------------------------ */
export const FEEDBACK_PROGRAMS: { program: string; responses: number; content: number; trainer: number; overall: number; positive: number; trainerName: string }[] = [
  { program: 'AML & CFT Fundamentals for Banking Professionals', responses: 10, content: 4.4, trainer: 4.6, overall: 4.5, positive: 88, trainerName: 'Sabina Yasmin' },
  { program: 'Credit Risk Analysis & Appraisal', responses: 8, content: 4.7, trainer: 4.8, overall: 4.7, positive: 93, trainerName: 'Dr. Farhan Chowdhury' },
  { program: 'POSH — Prevention of Sexual Harassment at Workplace', responses: 12, content: 4.2, trainer: 4.5, overall: 4.2, positive: 82, trainerName: 'Nusrat Jahan' },
  { program: 'Leadership Development for Mid-Level Managers', responses: 7, content: 4.8, trainer: 4.9, overall: 4.9, positive: 97, trainerName: 'Dr. Farhan Chowdhury' },
  { program: 'Digital Banking & Fintech Innovation', responses: 10, content: 4.1, trainer: 4.3, overall: 4.1, positive: 79, trainerName: 'Ahsan Habib' },
  { program: 'ICT Security & Cyber Awareness for Bankers', responses: 9, content: 4.3, trainer: 4.4, overall: 4.3, positive: 84, trainerName: 'Md. Touhidul Islam' },
  { program: 'Customer Experience Excellence in Banking', responses: 11, content: 4.5, trainer: 4.6, overall: 4.6, positive: 90, trainerName: 'Nusrat Jahan' },
];
export const FEEDBACK_TREND = [4.1, 4.2, 4.2, 4.3, 4.3, 4.4, 4.5, 4.4, 4.5, 4.6, 4.5, 4.6];
export const FEEDBACK_THEMES: { theme: string; share: number; tone: 'positive' | 'negative' | 'neutral' }[] = [
  { theme: 'Practical case studies', share: 34, tone: 'positive' },
  { theme: 'Trainer expertise', share: 27, tone: 'positive' },
  { theme: 'Session too long on day 1', share: 14, tone: 'negative' },
  { theme: 'Venue air-conditioning', share: 9, tone: 'negative' },
  { theme: 'More Bangla examples', share: 16, tone: 'neutral' },
];
export interface Bond { employee: string; eid: string; program: string; period: string; amount: number; remaining: number; status: 'Active' | 'Completed' | 'Waiver requested' }
export const BONDS: Bond[] = [
  { employee: 'Rahim Uddin', eid: 'CBL-11003', program: 'Credit Risk Analysis & Appraisal', period: '24 Sep 2026 – 24 Sep 2027', amount: 310000, remaining: 258333, status: 'Active' },
  { employee: 'Abdullah Al Mamun', eid: 'CBL-11234', program: 'Leadership Development for Mid-Level Managers', period: '16 Jul 2026 – 16 Jul 2028', amount: 435000, remaining: 362500, status: 'Active' },
  { employee: 'Tahmina Jahan Liza', eid: 'CBL-09008', program: 'Treasury Management — External (BIBM)', period: '01 Jun 2025 – 01 Jun 2026', amount: 60000, remaining: 0, status: 'Completed' },
  { employee: 'Kamrul Islam Bhuiyan', eid: 'CBL-08009', program: 'Digital Banking Transformation Program — Singapore', period: '10 Jan 2025 – 10 Jan 2027', amount: 850000, remaining: 106250, status: 'Active' },
  { employee: 'Sharmin Akter Shorna', eid: 'CBL-10012', program: 'Operational Risk Management & Basel III', period: '21 Nov 2026 – 21 May 2027', amount: 75000, remaining: 75000, status: 'Active' },
  { employee: 'Shahriar Hossain', eid: 'CBL-10789', program: 'Treasury Certification — Overseas', period: '24 Jan 2026 – 24 Jan 2028', amount: 425000, remaining: 42500, status: 'Waiver requested' },
  { employee: 'Nadia Rahman', eid: 'CBL-07002', program: 'Leadership Development for Mid-Level Managers', period: '16 Jul 2026 – 16 Jul 2027', amount: 220000, remaining: 175833, status: 'Active' },
  { employee: 'Farhana Kabir', eid: 'CBL-09341', program: 'Credit Risk Analysis & Appraisal', period: '24 Sep 2026 – 24 Sep 2027', amount: 310000, remaining: 0, status: 'Completed' },
];
export const PILLARS = ['Functional', 'Innovation', 'Collaboration', 'Customer Experience', 'Leadership', 'Execution Excellence'] as const;
export interface PillarScore { pillar: (typeof PILLARS)[number]; current: number; target: number; focus: string[]; course: string }
export const PILLAR_PROFILES: Record<string, { name: string; role: string; division: string; scores: PillarScore[] }> = {
  e1: { name: 'Ayesha Rahman', role: 'Relationship Manager', division: 'Corporate Banking', scores: [
    { pillar: 'Functional', current: 2.6, target: 3.5, focus: ['Credit analysis & appraisal', 'AML, KYC & regulatory compliance'], course: 'Advanced Credit Risk Management' },
    { pillar: 'Innovation', current: 3.0, target: 3.0, focus: ['Data-driven decision making', 'Process simplification'], course: 'Excel for Bankers — Data & Analytics' },
    { pillar: 'Collaboration', current: 4.0, target: 3.0, focus: ['Stakeholder communication', 'Constructive alignment'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Customer Experience', current: 4.0, target: 3.5, focus: ['Service turnaround & empathy', 'Relationship retention'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Leadership', current: 2.8, target: 3.0, focus: ['People coaching', 'Decisiveness under pressure'], course: 'Leadership Development for Mid-Level Managers' },
    { pillar: 'Execution Excellence', current: 4.3, target: 3.7, focus: ['SOP discipline & accuracy', 'Deadline ownership'], course: 'Banking Foundation — City Bank Essentials' },
  ] },
  e2: { name: 'Tanvir Hasan', role: 'Credit Analyst', division: 'Corporate Banking', scores: [
    { pillar: 'Functional', current: 2.4, target: 3.5, focus: ['Financial statement analysis', 'Cash-flow modelling'], course: 'Credit Appraisal — Fundamentals' },
    { pillar: 'Innovation', current: 3.2, target: 3.0, focus: ['Automation of credit memos'], course: 'Excel for Bankers — Data & Analytics' },
    { pillar: 'Collaboration', current: 3.4, target: 3.0, focus: ['Cross-team reviews'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Customer Experience', current: 3.0, target: 3.0, focus: ['Client query handling'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Leadership', current: 2.5, target: 2.5, focus: ['Ownership'], course: 'Leadership Development for Mid-Level Managers' },
    { pillar: 'Execution Excellence', current: 3.9, target: 3.7, focus: ['Turnaround time'], course: 'Banking Foundation — City Bank Essentials' },
  ] },
  e4: { name: 'Sadia Islam', role: 'Senior Officer, Credit Risk', division: 'Risk Management', scores: [
    { pillar: 'Functional', current: 3.3, target: 3.3, focus: ['Credit risk grading', 'Basel III'], course: 'Operational Risk & Loss Event Reporting' },
    { pillar: 'Innovation', current: 3.0, target: 3.0, focus: ['Early-warning analytics'], course: 'Excel for Bankers — Data & Analytics' },
    { pillar: 'Collaboration', current: 4.0, target: 3.0, focus: ['Committee coordination'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Customer Experience', current: 3.5, target: 3.0, focus: ['Internal client service'], course: 'Customer Service Excellence in Banking' },
    { pillar: 'Leadership', current: 3.0, target: 2.5, focus: ['Mentoring juniors'], course: 'Leadership Development for Mid-Level Managers' },
    { pillar: 'Execution Excellence', current: 4.5, target: 3.7, focus: ['Review accuracy'], course: 'Banking Foundation — City Bank Essentials' },
  ] },
};
export const JOURNEY_STAGES: { title: string; level: string; state: 'Completed' | 'Active' | 'Unlocked' | 'Locked'; pct: number; courses: [string, number][] }[] = [
  { title: 'Core Banking & Compliance Foundation', level: 'Level 3 · Competent', state: 'Completed', pct: 100, courses: [['Banking Foundation — City Bank Essentials', 100], ['POSH Policy & Workplace Ethics', 100]] },
  { title: 'Credit, Trade & Digital Transformation', level: 'Level 4 · Proficient', state: 'Active', pct: 55, courses: [['AML/CFT Compliance — Self-Paced Module', 65], ['Information Security Awareness 2026', 80], ['Credit Appraisal — Fundamentals', 35]] },
  { title: 'Customer Experience & Team Collaboration', level: 'Level 4 · Proficient', state: 'Unlocked', pct: 15, courses: [['Customer Service Excellence in Banking', 15]] },
  { title: 'Executive & Management Readiness', level: 'Level 5 · Expert', state: 'Locked', pct: 0, courses: [['Leadership Development for Mid-Level Managers', 0]] },
];

/* ------------------------------------------------------------------ */
/* AI suggestions and compliance risk (AI-assisted, human decision)    */
/* ------------------------------------------------------------------ */
export const AI_SUGGESTIONS: { kind: 'Skill gap' | 'Deadline risk' | 'Role transition'; division: string; title: string; why: string; tone: 'warn' | 'brand' | 'info' }[] = [
  { kind: 'Skill gap', division: 'Credit & Risk', title: 'Credit Appraisal & Early Warning Signals', why: '7 Credit Risk officers scored below 3.5 in the Functional pillar', tone: 'warn' },
  { kind: 'Deadline risk', division: 'Retail Banking', title: 'BFIU Annual AML / CFT Sanctions Refresher', why: '12 Retail Banking staff due within 14 days of the mandatory deadline', tone: 'brand' },
  { kind: 'Role transition', division: 'Corporate Banking', title: 'Treasury FX & LC Trade Documentation Workshop', why: '4 internal role transfers to the Corporate Trade Desk', tone: 'info' },
];

/* ------------------------------------------------------------------ */
/* Gamification, goals, forum (FR 205, 219)                            */
/* ------------------------------------------------------------------ */
export const BADGES: { id: string; name: string; desc: string; earned: boolean }[] = [
  { id: 'b1', name: 'Compliance Champion', desc: 'All mandatory courses done on time', earned: true },
  { id: 'b2', name: 'Fast Starter', desc: 'Started a course within a day of enrolment', earned: true },
  { id: 'b3', name: 'Credit Specialist', desc: 'Pass the Advanced Credit Risk assessment', earned: false },
  { id: 'b4', name: 'Top Scorer', desc: 'Highest mark in an exam this month (FR 219)', earned: false },
  { id: 'b5', name: 'Knowledge Sharer', desc: 'Five helpful forum answers', earned: false },
  { id: 'b6', name: '30-Hour Learner', desc: '30 learning hours this year', earned: true },
];
export const POINT_RULES: [string, number][] = [['Complete a course', 100], ['Pass an exam', 150], ['Top scorer of the month', 250], ['Forum answer marked helpful', 20], ['Submit training feedback', 15]];
export const LEADERBOARD: { name: string; division: string; points: number; badges: number; me?: boolean }[] = [
  { name: 'Sadia Islam', division: 'Risk Management', points: 2480, badges: 7 },
  { name: 'Rahim Uddin', division: 'Corporate Banking', points: 2310, badges: 6 },
  { name: 'Ayesha Rahman', division: 'Corporate Banking', points: 2045, badges: 4, me: true },
  { name: 'Nusrat Karim', division: 'Corporate Banking', points: 1980, badges: 5 },
  { name: 'Shahriar Hossain', division: 'Retail Banking', points: 1765, badges: 4 },
  { name: 'Farhana Kabir', division: 'SME Banking', points: 1690, badges: 3 },
  { name: 'Tanvir Hasan', division: 'Corporate Banking', points: 1420, badges: 3 },
];
export const TOP_SCORERS: { exam: string; name: string; score: number; division: string }[] = [
  { exam: 'Credit Risk Analysis — Final Exam', name: 'Sadia Islam', score: 96, division: 'Risk Management' },
  { exam: 'Cybersecurity Awareness — Assessment', name: 'Rahim Uddin', score: 98, division: 'Corporate Banking' },
  { exam: 'AML & CFT Post-Training Assessment', name: 'Shahriar Hossain', score: 94, division: 'Retail Banking' },
];
export interface Goal { id: string; title: string; target: string; progress: number; kind: 'Course' | 'Competency' | 'Hours' }
export const GOALS: Goal[] = [
  { id: 'g1', title: 'Reach Credit Analysis level 4', target: '31 Dec 2026', progress: 50, kind: 'Competency' },
  { id: 'g2', title: 'Complete all mandatory courses', target: '20 Nov 2026', progress: 75, kind: 'Course' },
  { id: 'g3', title: '40 learning hours this year', target: '31 Dec 2026', progress: 81, kind: 'Hours' },
];
export interface ForumPost { id: string; course: string; author: string; role: string; at: string; text: string; replies: { author: string; role: string; at: string; text: string; trainer?: boolean }[] }
export const FORUM: ForumPost[] = [
  { id: 'f1', course: 'AML/CFT Compliance — Self-Paced Module', author: 'Rahim Uddin', role: 'Officer, Corporate Credit', at: '12 Nov, 10:20', text: 'For a walk-in customer depositing BDT 9.5 lakh twice in a day, do we file one CTR or two?', replies: [{ author: 'Sabina Yasmin', role: 'Trainer', at: '12 Nov, 11:05', text: 'CTR is per account per day, so the two deposits are aggregated into one report.', trainer: true }] },
  { id: 'f2', course: 'Credit Appraisal — Fundamentals', author: 'Ayesha Rahman', role: 'Relationship Manager', at: '10 Nov, 16:42', text: 'Is DSCR stress-tested at +200 bps the bank standard for SME loans as well?', replies: [{ author: 'Nafis Ahmed', role: 'Trainer', at: '11 Nov, 09:10', text: 'Yes for exposures above BDT 50 lakh; below that the branch credit policy applies.', trainer: true }, { author: 'Tanvir Hasan', role: 'Credit Analyst', at: '11 Nov, 09:30', text: 'Thanks, this helped me with a file today.' }] },
  { id: 'f3', course: 'Introduction to Islamic Banking', author: 'Shahriar Hossain', role: 'Officer, Retail', at: '08 Nov, 13:15', text: 'Any good reading on Bai-Muajjal vs Murabaha differences?', replies: [] },
];
export const BOOKMARKS_SEED = ['EL005', 'EL006'];
export const DOWNLOADS_SEED: { id: string; title: string; size: string; until: string }[] = [
  { id: 'EL001', title: 'AML/CFT Compliance — module 4 video', size: '84 MB', until: '30 Nov 2026' },
  { id: 'EL003', title: 'Introduction to Islamic Banking — reading pack', size: '6 MB', until: '15 Dec 2026' },
];

/* ------------------------------------------------------------------ */
/* Administration (FR 21, 244; maker-checker and settings are proposed, FR 248–249) */
/* ------------------------------------------------------------------ */
export const ADMIN_ROLES = ['Employee', 'Supervisor', 'Division Head', 'Trainer', 'HR Admin', 'Finance', 'Management', 'System Admin'] as const;
export const ADMIN_MODULES = ['New request', 'Nominations & withdrawals', 'Batches & attendance', 'Courses & exams', 'Reports & Excel', 'Master setup', 'Admin & users'] as const;
export const PERMISSIONS: Record<(typeof ADMIN_ROLES)[number], boolean[]> = {
  Employee: [false, false, false, false, false, false, false],
  Supervisor: [false, true, true, false, true, false, false],
  'Division Head': [true, true, true, false, true, false, false],
  Trainer: [false, false, true, true, false, false, false],
  'HR Admin': [true, true, true, true, true, true, false],
  Finance: [false, false, false, false, true, false, false],
  Management: [false, false, false, false, true, false, false],
  'System Admin': [true, true, true, true, true, true, true],
};
export const ROLE_ACCOUNTS: Record<(typeof ADMIN_ROLES)[number], number> = { Employee: 13, Supervisor: 4, 'Division Head': 4, Trainer: 3, 'HR Admin': 3, Finance: 1, Management: 1, 'System Admin': 2 };
export interface UserRow { eid: string; name: string; email: string; designation: string; grade: string; division: string; branch: string; role: (typeof ADMIN_ROLES)[number]; status: 'Active' | 'Inactive' | 'Locked' }
const U = (eid: string, name: string, designation: string, grade: string, division: string, branch: string, role: UserRow['role'], status: UserRow['status'] = 'Active'): UserRow =>
  ({ eid, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@thecitybank.com`, designation, grade, division, branch, role, status });
export const USERS: UserRow[] = [
  U('CBL-06610', 'Arif Mahmud', 'System Administrator', 'SVP', 'IT', 'Head Office, Dhaka', 'System Admin'),
  U('CBL-06611', 'Mohammad Al-Amin', 'Senior Vice President, IT Security', 'SVP', 'IT', 'Head Office, Dhaka', 'System Admin'),
  U('CBL-08236', 'Nusrat Jahan', 'HR Admin, Learning & Development', 'Manager', 'HR & Training', 'Head Office, Dhaka', 'HR Admin'),
  U('CBL-08240', 'Rahela Khatun', 'Senior Manager, L&D Operations', 'Manager', 'HR & Training', 'Head Office, Dhaka', 'HR Admin'),
  U('CBL-08241', 'Shahana Parvin', 'Manager, HR Operations', 'Manager', 'HR & Training', 'Head Office, Dhaka', 'HR Admin'),
  U('CBL-04417', 'Farzana Haque', 'Head of Corporate Banking', 'SVP', 'Corporate Banking', 'Head Office, Dhaka', 'Division Head'),
  U('CBL-04501', 'Kabir Ahmed', 'Head of SME Banking', 'SVP', 'SME Banking', 'Head Office, Dhaka', 'Division Head'),
  U('CBL-04502', 'Rafiq Uddin', 'Head of Risk Management', 'SVP', 'Risk Management', 'Head Office, Dhaka', 'Division Head'),
  U('CBL-04503', 'Tamjid Hasan', 'Head of Retail Banking', 'SVP', 'Retail Banking', 'Head Office, Dhaka', 'Division Head'),
  U('CBL-07120', 'Mahmud Karim', 'Unit Head, Corporate Banking', 'VP', 'Corporate Banking', 'Gulshan, Dhaka', 'Supervisor'),
  U('CBL-07121', 'Nasir Uddin', 'Unit Head, SME Lending', 'VP', 'SME Banking', 'Motijheel, Dhaka', 'Supervisor'),
  U('CBL-07122', 'Lutfa Begum', 'Head of Documentation', 'VP', 'Credit Administration', 'Head Office, Dhaka', 'Supervisor'),
  U('CBL-07002', 'Nadia Rahman', 'Manager, Retail Banking', 'Manager', 'Retail Banking', 'Gulshan, Dhaka', 'Supervisor'),
  U('CBL-05903', 'Nafis Ahmed', 'Head of Credit Risk · Internal Trainer', 'VP', 'Risk Management', 'Head Office, Dhaka', 'Trainer'),
  U('CBL-04120', 'Sabina Yasmin', 'Senior Manager, Credit Policy · Trainer', 'Manager', 'Risk Management', 'Head Office, Dhaka', 'Trainer'),
  U('CBL-04121', 'Md. Touhidul Islam', 'Manager, IT Security · Trainer', 'Manager', 'IT', 'Head Office, Dhaka', 'Trainer'),
  U('CBL-05518', 'Rezaul Karim', 'Senior Manager, Financial Control', 'Manager', 'Finance', 'Head Office, Dhaka', 'Finance'),
  U('CBL-01022', 'Tahsin Rahman', 'Deputy Managing Director', 'DMD', 'Executive Committee', 'Head Office, Dhaka', 'Management'),
  U('CBL-10482', 'Ayesha Rahman', 'Relationship Manager', 'PO', 'Corporate Banking', 'Gulshan, Dhaka', 'Employee'),
  U('CBL-10483', 'Tanvir Hasan', 'Credit Analyst', 'SO', 'Corporate Banking', 'Gulshan, Dhaka', 'Employee'),
  U('CBL-10484', 'Sadia Islam', 'Senior Officer, Credit Risk', 'SO', 'Risk Management', 'Motijheel, Dhaka', 'Employee'),
  U('CBL-11003', 'Rahim Uddin', 'Officer, Corporate Credit', 'Officer', 'Corporate Banking', 'Motijheel, Dhaka', 'Employee'),
  U('CBL-11456', 'Sumaiya Rahman Mitu', 'Officer, Trade Finance', 'Officer', 'Corporate Banking', 'Motijheel, Dhaka', 'Employee'),
  U('CBL-10789', 'Shahriar Hossain', 'Officer, Retail', 'Officer', 'Retail Banking', 'Dhanmondi, Dhaka', 'Employee'),
  U('CBL-09341', 'Farhana Kabir', 'Senior Officer, SME', 'SO', 'SME Banking', 'Agrabad, Chattogram', 'Employee'),
  U('CBL-11234', 'Abdullah Al Mamun', 'Officer, Corporate Banking', 'Officer', 'Corporate Banking', 'Gulshan, Dhaka', 'Employee'),
  U('CBL-10234', 'Mohammad Rafiqul Islam', 'Officer, Retail', 'Officer', 'Retail Banking', 'Uttara, Dhaka', 'Employee'),
  U('CBL-10456', 'Fatema Begum Chowdhury', 'Officer, Retail', 'Officer', 'Retail Banking', 'Mirpur, Dhaka', 'Employee', 'Inactive'),
  U('CBL-11023', 'Nasrin Sultana Akter', 'Officer, HR', 'Officer', 'HR & Training', 'Head Office, Dhaka', 'Employee'),
  U('CBL-09008', 'Tahmina Jahan Liza', 'Senior Officer, Treasury', 'SO', 'Treasury', 'Head Office, Dhaka', 'Employee', 'Locked'),
  U('CBL-08009', 'Kamrul Islam Bhuiyan', 'Manager, Digital Banking', 'Manager', 'Retail Banking', 'Head Office, Dhaka', 'Employee'),
];
export interface MakerCheck { id: string; type: string; maker: string; summary: string; status: 'Pending' | 'Approved' | 'Rejected'; checker?: string; apply?: { kind: 'perm' | 'role'; role?: string; index?: number; eid?: string } }
export const MAKER_CHECKER: MakerCheck[] = [
  { id: 'mc1', type: 'Training bond waiver', maker: 'Rahela Khatun (HR Admin)', summary: 'Pro-rata waiver of BDT 42,500 remaining liability for CBL-10789 due to internal transfer', status: 'Pending' },
  { id: 'mc2', type: 'Role escalation → HR Admin', maker: 'Shahana Parvin (HR Admin)', summary: 'CBL-10234 Mohammad Rafiqul Islam: Employee → HR Admin (temporary L&D audit scope)', status: 'Pending' },
  { id: 'mc3', type: 'Competency target update', maker: 'Rahela Khatun (HR Admin)', summary: 'Increase Functional AML target from 3.5 to 4.0 for Officer and AVP grades', status: 'Pending' },
  { id: 'mc4', type: 'External bulk import (45 users)', maker: 'Arif Mahmud (System Admin)', summary: 'Bulk import 45 Bangladesh Bank and BIBM external workshop participants from validated Excel', status: 'Pending' },
  { id: 'mc5', type: 'Budget override > ৳5L', maker: 'Nusrat Jahan (HR Admin)', summary: 'Approve BDT 6,40,000 overseas regulatory summit budget for Risk Division leadership', status: 'Approved', checker: 'Mohammad Al-Amin' },
];
export interface Integration { system: string; category: string; detail: string; status: 'Online' | 'Degraded' | 'Offline'; lastSync: string }
export const INTEGRATIONS_16: Integration[] = [
  { system: 'HRIS (Employee master)', category: 'Core bank & HR', detail: '1,542 staff synced · grade, division and supervisor verified', status: 'Online', lastSync: '2 mins ago' },
  { system: 'Leave management system', category: 'Core bank & HR', detail: 'Conflict API ready · 14 active leave calendars checked', status: 'Online', lastSync: '1 min ago' },
  { system: 'Attendance system', category: 'Core bank & HR', detail: '1,498 biometric and branch logs reconciled', status: 'Online', lastSync: '15 mins ago' },
  { system: 'Meeting room booking', category: 'Core bank & HR', detail: '18 training halls and conference rooms mapped', status: 'Online', lastSync: '5 mins ago' },
  { system: 'Performance tracking (KPI)', category: 'Core bank & HR', detail: 'Quarterly KPI scores imported for competency', status: 'Online', lastSync: '1 hour ago' },
  { system: 'Microsoft Teams', category: 'Virtual & calendar', detail: 'Auto-attendance webhook on · recording sync active', status: 'Online', lastSync: '4 mins ago' },
  { system: 'Zoom', category: 'Virtual & calendar', detail: 'Meeting creation and participant report API', status: 'Online', lastSync: '9 mins ago' },
  { system: 'Outlook mail & calendar', category: 'Virtual & calendar', detail: 'Invitations and calendar holds via Exchange', status: 'Online', lastSync: '3 mins ago' },
  { system: 'SMS gateway', category: 'Notifications', detail: 'Bulk SMS delivery receipts', status: 'Online', lastSync: '6 mins ago' },
  { system: 'WhatsApp Business API', category: 'Notifications', detail: 'Template messages · 2 templates pending Meta review', status: 'Degraded', lastSync: '42 mins ago' },
  { system: 'Push notifications (mobile app)', category: 'Notifications', detail: 'Android and iOS tokens registered', status: 'Online', lastSync: '8 mins ago' },
  { system: 'Power BI', category: 'Analytics', detail: 'Training mart refreshed nightly', status: 'Online', lastSync: '6 hours ago' },
  { system: 'IAM / SSO (Active Directory)', category: 'Security', detail: 'OIDC and SAML 2.0 · MFA policy inherited', status: 'Online', lastSync: 'Live' },
  { system: 'SIEM / SOC', category: 'Security', detail: 'Audit events forwarded over Syslog CEF', status: 'Online', lastSync: 'Live' },
  { system: 'Anti-malware scanner (ICAP)', category: 'Security', detail: 'Uploads scanned before storage', status: 'Online', lastSync: 'Live' },
  { system: 'Core banking (read-only)', category: 'Core bank & HR', detail: 'Branch and cost-centre master only', status: 'Online', lastSync: '1 day ago' },
];
export const NOTIFICATION_TEMPLATES: { name: string; code: string; subject: string; channels: string[] }[] = [
  { name: 'Training nomination confirmed', code: 'TRAINING_NOMINATION', subject: '[City Bank LMS] You have been nominated for {{trainingTitle}}', channels: ['Email', 'SMS', 'WhatsApp', 'Push'] },
  { name: 'Training reminder (1 day before)', code: 'TRAINING_REMINDER_24H', subject: '[Reminder] {{trainingTitle}} starts tomorrow', channels: ['Email', 'SMS', 'WhatsApp', 'Push'] },
  { name: 'Assessment & exam scheduled', code: 'EXAM_SCHEDULED', subject: '[City Bank LMS] Exam scheduled: {{examTitle}}', channels: ['Email', 'SMS', 'Push'] },
  { name: 'Withdrawal approved / rejected', code: 'WITHDRAWAL_DECISION', subject: '[City Bank LMS] Withdrawal request update — {{trainingTitle}}', channels: ['Email', 'WhatsApp', 'Push'] },
  { name: 'Certificate issued', code: 'CERTIFICATE_ISSUED', subject: '[City Bank LMS] Your certificate for {{courseTitle}}', channels: ['Email', 'Push'] },
];
export const FEEDBACK_TEMPLATES: { name: string; questions: number; scope: string; mode: 'Automatic' | 'Manual' }[] = [
  { name: 'Post-training feedback (default)', questions: 4, scope: 'All categories', mode: 'Automatic' },
  { name: 'e-Learning module evaluation', questions: 3, scope: 'e-Learning', mode: 'Automatic' },
  { name: 'Annual TNA & competency survey', questions: 2, scope: 'TNA & surveys', mode: 'Manual' },
];
export const EXTERNAL_PARTICIPANTS: { id: string; name: string; org: string; last: string; status: 'Active' | 'Inactive' }[] = [
  { id: 'EXT-01', name: 'Kabir Hossain', org: 'Bangladesh Bank · Joint Director & Bank Examiner', last: '15 Oct 2026', status: 'Active' },
  { id: 'EXT-02', name: 'Sultana Razia', org: 'Dutch-Bangla Bank PLC · Senior Manager, Compliance', last: '20 Sep 2026', status: 'Active' },
  { id: 'EXT-03', name: 'Md. Faruk Islam', org: 'BIBM · Research Fellow', last: '05 Aug 2026', status: 'Active' },
  { id: 'EXT-04', name: 'Nusrat Ara Begum', org: 'BFIU · Deputy Director', last: '28 Oct 2026', status: 'Active' },
  { id: 'EXT-05', name: 'Ashraful Alam', org: 'Eastern Bank PLC · AVP, Trade Operations', last: '10 Sep 2026', status: 'Active' },
];
