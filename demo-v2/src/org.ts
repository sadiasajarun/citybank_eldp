/**
 * Organisation model: fictional demonstration data standing in for City Bank HRIS.
 * Bank → Division → Department / Unit → Supervisor → Employees.
 * Every scoped view (supervisor = direct reports, division head = division, HR / management = bank) reads from here.
 */
import { NOMINEE_LIST, PERSONAS, SADIA, SUPERVISOR_OF } from './data';
import type { Employee } from './types';

export interface Person {
  id: string;
  eid: string;
  name: string;
  designation: string;
  grade: string;
  division: string;
  department: string;
  location: string;
  supervisor: string;
  gender: 'F' | 'M';
  /** Credit Analysis competency level (1–5); target for these roles is 4. */
  creditLevel: number;
}

export const DIVISIONS: { name: string; head: string; learningChampion: string; departments: string[] }[] = [
  { name: 'Corporate Banking', head: 'Farzana Haque', learningChampion: 'Farzana Haque', departments: ['Large Corporate', 'Mid Corporate', 'Structured Finance', 'Corporate Liability'] },
  { name: 'SME Banking', head: 'Kabir Ahmed', learningChampion: 'Kabir Ahmed', departments: ['SME Lending', 'Women Entrepreneurs'] },
  { name: 'Risk Management', head: 'Rafiq Uddin', learningChampion: 'Rafiq Uddin', departments: ['Credit Risk', 'Market Risk'] },
  { name: 'Credit Administration', head: 'Shaila Parveen', learningChampion: 'Shaila Parveen', departments: ['Documentation', 'Disbursement'] },
  { name: 'Retail Banking', head: 'Tamjid Hasan', learningChampion: 'Tamjid Hasan', departments: ['Branches', 'Cards'] },
];

const FEMALE = /Ayesha|Farhana|Mehnaz|Tahmina|Lamia|Nabila|Sharmin|Anika|Rubina|Moushumi|Sabrina|Joya|Naznin|Mahfuza|Tasnim|Rima|Sadia|Nusrat|Farzana|Shaila|Lutfa/;
const GRADE: Record<string, string> = { 'Relationship Manager': 'SPO', 'Credit Analyst': 'PO', 'Senior Credit Analyst': 'SPO', 'Senior Officer': 'SO', 'Officer, Credit Risk': 'Officer' };
const LOCATIONS = ['Gulshan', 'Motijheel', 'Banani', 'Agrabad'];

const fromEmployee = (e: Employee, i: number): Person => {
  const div = DIVISIONS.find((d) => d.name === e.division);
  return {
    id: e.id,
    eid: e.eid,
    name: e.name,
    designation: e.role,
    grade: GRADE[e.role] ?? 'PO',
    division: e.division,
    department: div ? div.departments[i % div.departments.length] : e.division,
    location: LOCATIONS[i % LOCATIONS.length],
    supervisor: SUPERVISOR_OF[e.division] ?? e.supervisor,
    gender: FEMALE.test(e.name) ? 'F' : 'M',
    // 27 of the 32 target officers sit below level 4 (the competency gap in the story).
    creditLevel: i % 7 === 3 ? 4 : i % 5 === 0 ? 3 : 2,
  };
};

/** Team members who were NOT nominated: they show up as "still needs training" on the supervisor dashboard. */
const NOT_NOMINATED: Employee[] = [
  { id: 'n1', eid: 'CBL-11904', name: 'Tanjila Ahmed', role: 'Credit Analyst', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
  { id: 'n2', eid: 'CBL-11937', name: 'Rakib Hasan', role: 'Relationship Manager', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
  { id: 'n3', eid: 'CBL-11958', name: 'Fariha Islam', role: 'Credit Analyst', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
  { id: 'n4', eid: 'CBL-11970', name: 'Arif Chowdhury', role: 'Senior Officer', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
  // Raised an Individual Development Plan request (FR 188). Not a target role, so the competency gap figures are unchanged.
  { id: 'n5', eid: 'CBL-11986', name: 'Nusrat Karim', role: 'Junior Officer', division: 'Corporate Banking', supervisor: 'Mahmud Karim', leave: 'Clear', calendar: 'Clear', eligibility: 'Eligible' },
];

export const DIRECTORY: Person[] = [...NOMINEE_LIST, SADIA, ...NOT_NOMINATED].map(fromEmployee);
// Keep the named story people stable.
DIRECTORY.forEach((p) => {
  if (p.id === 'e1') Object.assign(p, { department: 'Large Corporate', location: 'Gulshan', grade: 'PO', creditLevel: 2 });
  if (p.id === 'e2') Object.assign(p, { department: 'Large Corporate', location: 'Gulshan', creditLevel: 2 });
  if (p.id === 'e4') Object.assign(p, { department: 'Credit Risk', location: 'Motijheel', creditLevel: 3 });
  // Nusrat Karim's development request is about financial modelling; Credit Analysis is already at target.
  if (p.id === 'n5') Object.assign(p, { department: 'Large Corporate', creditLevel: 4 });
});

export const SUPERVISORS: { name: string; division: string; title: string }[] = [
  { name: 'Mahmud Karim', division: 'Corporate Banking', title: 'Unit Head, Corporate Banking' },
  { name: 'Nasir Uddin', division: 'SME Banking', title: 'Unit Head, SME Lending' },
  { name: 'Rafiq Uddin', division: 'Risk Management', title: 'Head of Credit Risk Review' },
  { name: 'Lutfa Begum', division: 'Credit Administration', title: 'Head of Documentation' },
];

export const findById = (id: string) => DIRECTORY.find((p) => p.id === id);
export const findByEid = (eid: string) => DIRECTORY.find((p) => p.eid.toLowerCase() === eid.trim().toLowerCase());
export const searchPeople = (q: string, limit = 8) => {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return DIRECTORY.filter((p) => p.name.toLowerCase().includes(t) || p.eid.toLowerCase().includes(t)).slice(0, limit);
};
export const directReports = (supervisor: string) => DIRECTORY.filter((p) => p.supervisor === supervisor);
export const inDivision = (division: string) => DIRECTORY.filter((p) => p.division === division);
export const supervisorOf = (id: string) => findById(id)?.supervisor ?? '';

/** Officers below the Credit Analysis target, used to identify who needs the training (FR 186, 241–243). */
export const CREDIT_TARGET = 4;
export const creditGap = (division?: string) =>
  DIRECTORY.filter((p) => (!division || p.division === division) && p.creditLevel < CREDIT_TARGET && ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'].includes(p.designation));

/** Trainer master (fictional) used by every trainer search (FR 35–37, 58, 79, 107). */
export const TRAINERS = [
  { id: 't1', eid: 'CBL-05903', name: 'Nafis Ahmed', type: 'Internal' as const, designation: 'Head of Credit Risk', institute: 'City Bank' },
  { id: 't2', eid: '', name: 'Dr. Farhan Chowdhury', type: 'External' as const, designation: 'Professor', institute: 'BIBM' },
  { id: 't3', eid: 'CBL-04120', name: 'Sabina Yasmin', type: 'Internal' as const, designation: 'Senior Manager, Credit Policy', institute: 'City Bank' },
  { id: 't4', eid: '', name: 'Ahsan Habib', type: 'External' as const, designation: 'Consultant', institute: 'ICAB Professional Training' },
];
export const searchTrainers = (q: string) => {
  const t = q.trim().toLowerCase();
  return TRAINERS.filter((x) => !t || x.name.toLowerCase().includes(t) || x.eid.toLowerCase().includes(t));
};

/** Vendors / organisers (FR 38–42, 77, 105, 152). */
export const VENDORS = ['City Bank L&D', 'City Bank L&D with BIBM', 'Bangladesh Institute of Bank Management (BIBM)', 'BRAC Business School', 'ICAB Professional Training'];
/** Venues (FR 31–34, 70, 98) with the planned-calendar bookings used by the clash check (FR 71, 99). */
export const VENUES = [
  { name: 'City Bank Learning Center — Hall A', address: 'Gulshan Avenue, Dhaka', bookedOn: [] as string[] },
  { name: 'Executive Training Room', address: 'Head Office, Gulshan', bookedOn: ['18 Nov 2026'] },
  { name: 'Head Office Auditorium', address: 'Head Office, Gulshan', bookedOn: ['24 Nov 2026'] },
  { name: 'Chattogram Regional Training Room', address: 'Agrabad, Chattogram', bookedOn: [] },
];

export const personaName = (role: keyof typeof PERSONAS) => PERSONAS[role].name;

/** The divisional requirement in figures (computed, so screens and story text always agree). */
const TARGET_ROLES = ['Relationship Manager', 'Credit Analyst', 'Senior Credit Analyst', 'Senior Officer', 'Officer, Credit Risk'];
export const CB_TARGET_COUNT = inDivision('Corporate Banking').filter((p) => TARGET_ROLES.includes(p.designation)).length;
export const CB_GAP_COUNT = creditGap('Corporate Banking').length;
/** e.g. "18 of 20" */
export const GAP_TEXT = `${CB_GAP_COUNT} of ${CB_TARGET_COUNT}`;
