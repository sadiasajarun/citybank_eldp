# City Bank ELDP Demo v2: What We Have Built

**Date:** 16 Nov 2026
**For:** anyone who needs to understand, present or extend the demo.
**Core source:** Annexure-II functional requirements (`docs/annexure-ii/`). Every screen shows requirement numbers (FR …) where it helps.

---

## 1. What this is

An interactive tender demo of City Bank PLC's **Enterprise Learning & Development Platform (ELDP)**. It follows **one real piece of work end to end**:

- **Need:** Corporate Banking has a Credit Analysis capability gap: 18 of 20 officers are below target level 4.
- **Response:** the gap becomes the training *Advanced Credit Risk Management*.
- **Delivery:** nomination, scheduling, invitations, a course, attendance, assessment, feedback and closing.
- **Outcome:** a workforce insight that management can act on.

Every person who touches the work appears in their own role, on the same live record. All people, IDs and amounts are **fictional demonstration data**.

**Honest labels** used across the demo:

| Label | Meaning |
|---|---|
| Fictional demonstration data | People, figures and history are invented |
| Simulated | The integration or action is imitated (HRIS, Outlook, Teams, SMS, AI engine) |
| Proposed | Not in Annexure-II; our interpretation. The Management role is the main example |
| AI-assisted · Human decision required | AI suggests; a person decides |

---

## 2. Running it

- **Location:** `d:\citybank_eldp\demo-v2` (Vite + React 18 + TypeScript strict + Tailwind v4 + Zustand).
- **Start:** `npm run dev`, then open **http://localhost:5174**.
- **Checks:** type check with `npx tsc --noEmit -p tsconfig.json --noUnusedLocals`; build with `npx vite build`.
- **Saved state:** progress is saved in the browser (`localStorage`, key `eldp-demo-v2`).
  - Signing in with **Continue with City Bank SSO** starts fresh.
  - **Resume that run instead** continues the saved run.
- **Reset at any time:** ··· menu → **Reset demo**.

---

## 3. How the screen is organised

| Area | What it holds |
|---|---|
| **Header** | City Bank ELDP · **Home** (with task count) · **Modules** · **People** · **Reports** · Search · **More** (Notifications, Workflows, Platform, Coverage, Audit, settings) · Profile (switch person) |
| **Step bar** (under the header) | **Viewing as** (switch role or employee) · **Step n/24** chip (opens the Guided journey) · next-step button · **···** menu (Previous step, Overview, Guided journey, dashboard stops, Do this step for me, Reset) |
| **Side menu** (work pages) | The current role's work, in groups; each item shows live status |
| **Step note** | One line on the screen of the current step: *Step n of 24 · action · Next: …* |

The next-step button behaves in two ways:
- **Your own step:** it shows the action, for example "Review request".
- **Another role's step:** it shows **Go to {role}**, so nobody sees another role's action as their own.

**Hand-offs:** when a step finishes and the next one belongs to someone else, the demo shows "Sending to …" and opens that person's screen.

**Presenter settings** (More menu):
- **Presenter mode:** larger text, and **Do this step for me** stays visible.
- **Hand-offs open the role dashboard first.**
- **Show requirement numbers.**

---

## 4. Roles and people

| Role | Person | Home screen |
|---|---|---|
| Division Head / Learning Champion | Farzana Haque (Corporate Banking) | **Division home**: greeting, learning-need card, clickable summary, skill gaps, training-request log |
| HR Admin (L&D) | Nusrat Jahan | **HR Operations**: dynamic first action, 8 figures, operational queue, 5 sections, activity |
| Trainer | Nafis Ahmed (Risk Management) | **Trainer Workspace**: actions, calendar, sessions, materials, assessment review |
| Employee | Ayesha Rahman (e1), also Tanvir Hasan (e2) and Sadia Islam (e4) | **My Learning and Development** |
| Supervisor | Mahmud Karim | **Team Learning Overview** |
| Management *(proposed)* | Tahsin Rahman | **Workforce Learning Intelligence** |
| Finance *(proposed)* | Rezaul Karim | Finance page. The Finance step is **removed from the journey**; saving the schedule counts as budget approval |
| System Admin | Arif Mahmud | Admin and security pages |

---

## 5. The guided journey (24 steps)

Always starts at Step 1.

| # | Step | Who | FR |
|---|---|---|---|
| 1 | Training Needs Assessment / Divisional Requirement | Division Head | 15, 186 |
| 2 | Division Head submits a training request | Division Head | 14, 49–64 |
| 3 | HR reviews the request | HR | 65–66 |
| 4 | HR creates the nomination request | HR | 67–87 |
| 5 | Learning Champion nominates employees | Division Head / LC | 88 |
| 6 | System checks HRIS, leave and calendar conflicts | System | 10, 114, 244 |
| 7 | HR reviews nomination status (Keep / Remove) | HR | 89–91 |
| 8 | HR finalises participants | HR | 89–91, 114 |
| 9 | HR creates the training programme (Save training) | HR | 92–131 |
| 10 | HR sends invitations (Notification is the **last** scheduling tab) | HR | 116–121 |
| 11 | Trainer accepts or rejects facilitation | Trainer | 17–19 |
| 12 | Trainer sets up the course (modules, assessment, AI assistant) | Trainer | 19, 190–198, 210 |
| 13 | Tanvir Hasan requests withdrawal | Employee (e2) | 1, 119 |
| 14 | Supervisor approves withdrawal or proposes a replacement | Supervisor | 9–10, 119 |
| 15 | HR approves the replacement | HR | 119 |
| 16 | Ayesha Rahman accepts the invitation | Employee (e1) | 2, 119 |
| 17 | Ayesha takes the course (overview, modules, AI assistant) | Employee (e1) | 190–198 |
| 18 | Attendance is recorded | HR | 3, 137–143 |
| 19 | Ayesha submits the assessment | Employee (e1) | 210–212 |
| 20 | Trainer evaluates the assessment (score → result; no integrity step) | Trainer | 210–217 |
| 21 | Employees submit feedback | Employee | 4, 221–222 |
| 22 | HR closes the training (actual expense, records) | HR | 132–136, 142 |
| 23 | Employee learning records update (automatic) | System | 5, 170 |
| 24 | Management sees workforce insight | Management *(proposed)* | 168, 175–185, 208 |

**Design choices in the order:**
- Withdrawal is shown **before** acceptance, so the two never mix.
- The Finance approval step, the connected e-learning step, the competency-journey step and the old assessment-integrity step were **removed**.
- Optional **dashboard stops** (··· menu or Guided journey) show a role's dashboard without changing the record.

---

## 6. Main screens

### Division Head
- **Home**:
  - "Good morning, Farzana" and the **learning-need card** (18 of 20 below target, level 2 → 4, roles, mandatory learning, recommended training) with **Raise training request** and **See all training needs**;
  - five clickable figures (people, below target, trained, learning hours, mandatory done), each opening the people behind it;
  - **skill gaps** by competency, people at each level and department breakdown;
  - **your training requests** (live request plus history). Each opens a **request detail page** (`/division/requests/:id`) with outcome, progress timeline, details and participants.
- **Training needs (TNA)** (`/division`, white page): **three ways to raise a request**:
  1. **Competency and role gap:** a selector for six competencies (FR 22). Credit Analysis drives the story; the others offer "Save for the next cycle".
  2. **Survey or nomination:** responses and topics (FR 187).
  3. **Development requests:** tick IDPs (FR 188).

  One **Raise training request** button carries everything into the request: division, officers, gap, recommendation and sources.
- **Training request** (`/request/new`): Program, Trainer, Nominations, Review & submit. The form is full width and has no justification field.
- **Nomination** (`/nominate`): the Learning Champion picks people.

### HR Admin
- **HR Operations** (Home and `/r/hr`):
  - the first action follows the state;
  - **eight figures**: new requests, nominations open, needing review, to schedule, budgets awaiting, upcoming, attendance pending, record requests;
  - the **operational queue** (11 tasks, Done / Now / Later);
  - sections for Requests, Nomination, Scheduling, Planned training and Records.
- **Side menu:**
  - **Work queue:** Training requests, Nomination request, Nomination status, Approvals.
  - **Training operations:** Scheduling, Planned training, Attendance, Training bonds, Training database.
  - **Setup and reporting:** Setup masters, Reports, Feedback setup, Training calendar.
  - **System:** Integrations, Audit, Security.
- **Request review:** one compact summary plus decisions: Create Nomination Request, Schedule Training, Forward, Return for Information.
- **Scheduling:** tabs Program → Trainer → Participants → Feedback → Undertaking → Review & save → **Notification**.
  - Notification covers organizer, trainer and participant communication, each with an **editable email template**.
  - It also has reminder dates, supervisor CC, extra recipients, the PDF participant list and the accept / withdraw link.
- **Also:** attendance, planned training (close with expense), approvals (replacement, material link, record validation), bonds, training database, calendar and setup.

### Trainer
**Trainer Workspace** (`/trainer`, `/r/trainer`):
- header with a contextual primary action and a summary strip;
- **Your actions**;
- **My calendar** (filters: sessions, assessments, materials);
- **My sessions** (details drawer with participants);
- **Training materials**: upload, then **Request HR link**; HR links it (FR 19);
- **Assessment review** ("AI-assisted · Trainer decides").

Related screens:
- **Course setup** (`/trainer/course-setup`).
- **Evaluate the assessment** (`/assessment/review`): score, then result.

### Employee
- **My Learning and Development** (`/employee`): compact header, then:
  - the training **invitation** (Accept / Withdrawn Request with a reason);
  - the **course card**;
  - **calendar** and **my learning**;
  - **training record** (filters, plus a request to add a previous record → HR);
  - the **development journey**.
- **Course** (`/learning/training`): overview → modules with video and notes → AI course assistant chat.
- **Assessment** (`/learning/training/assessment`): objective and descriptive questions, then submit.
- **Also:** feedback, mandatory e-learning course, certificates, AML exam.

### Supervisor
**Team Learning Overview** (`/supervisor/team`):
- profile header and a four-figure decision strip;
- **Needs your action**, with a team progress bar;
- approvals and upcoming team training;
- tabs for Direct reports, Training records (FR 11–12, CSV and print) and Departments.

**Withdrawal requests** (`/supervisor`): Approve, Approve with replacement (with conflict checks), Reject.

### Management *(proposed)*: Workforce Learning Intelligence (`/executive`)
- **View as:** Management, Supervisor or Division Head.
- **Filters:** period, division, department, designation and status, plus mandatory, competency, training, category and label, with Reset.
- **Six clickable figures per view.** Each opens a drawer: what happened, why, data used, people, status, next action.
- **Live learning tracking:** risk is computed from progress, overdue status, failed assessments and absence. Each row has a recommended action; some actions are simulated.
- **Management sections:** priority risks, management actions, a sortable division comparison, competency gaps, trends.
- **Supervisor sections:** pending decisions (operational only when signed in as the supervisor), team calendar, team table.
- **Division Head sections:** need card, AI recommendation, survey signals, development requests, division progress.

### Everyone
- **Modules** (`/learning`): six core modules, each with a focused view (figures, tabs, tables, filters, drawers, one next action):
  - **LMS:** library, builder, paths, enrollments, learner progress, certificates.
  - **TMS:** planned, calendar, trainers and venues, attendance, costs and bonds, database, ten report types.
  - **L&D:** needs, frameworks, IDPs, journeys, division.
  - **AI:** recommendations, compliance risk, feedback intelligence, a controlled assistant.
  - **Competency:** gaps, assessment, journey, frameworks.
  - **Planned Training & Assessment.**

  Secondary modules are linked below.
- **People** (`/people`):
  - an organisation tree (City Bank → Division → Department → Team → Employee) with counts;
  - six figures;
  - filters and sorting;
  - an employee table with statuses and actions.
- **Employee learning record** (`/people/:id`): tabs for Overview, Current Learning, Training Record (with record-add request), Calendar, Competencies, Assessments, Feedback, Certificates, Development Requests.
- **Reports**, **Coverage** (all 250 requirements with an honest status), **Workflow Explorer**, **Platform**, **Knowledge**, **Library**, **Mobile preview**, **Admin** pages.

---

## 7. Data and state (for developers)

- **Store** (`src/store.ts`): one Zustand store, persisted, versioned by `DEMO_VERSION` (currently 11).
  - The story's flags include `requestSubmitted`, `reviewed`, `nominationRequested`, `nominationSubmitted`, `finalized`, `scheduled`, `budgetApproved`, `invitesSent`, `trainerResponse`, `courseSetup`, `tcourse`, `withdrawal`, `attendanceSubmitted`, `ptaSubmitted`, `pta`, `feedbackSubmitted`, `completed` and `execViewed`.
  - It also holds `tna` (chosen evidence), `draft.sources`, `materialLinkRequested`, `recordRequest` and the `audit` log.
- **Journey** (`src/lifecycle.ts`):
  - `JOURNEY` (24 steps), `TOUR` actions and `tasksFor(role)`;
  - `IMPACTS` (what changed per event);
  - `STAGES_LC`, `ROLE_DASHBOARD` and `showcasesNow`.
  - `advance()` in the store is **Do this step for me**.
- **Organisation** (`src/org.ts`):
  - `DIRECTORY` (people), `DIVISIONS` and `creditGap()`;
  - Credit Analysis levels;
  - trainers and venues;
  - `GAP_TEXT` ("18 of 20").
- **TNA pieces:**
  - `src/components/Tna.tsx`: gap facts, AI factors, survey data, competency list (`COMPETENCIES`) and the gap scale.
  - `src/tnaData.ts`: development requests.
- **Requests log** (`pages/oversight/requests.ts`): the live request plus three historical requests.
- **Navigation** (`src/nav.ts`): `WORK_NAV` per role; section links (`/page?s=name`) scroll to a section.

**Key page files:**

| Page | File |
|---|---|
| Home router | `pages/Command.tsx` |
| Division home | `pages/oversight/DivisionHome.tsx` |
| TNA | `pages/oversight/Tna.tsx` |
| HR Operations | `pages/oversight/HrOps.tsx` |
| Trainer | `pages/decisions/Trainer.tsx` |
| Course setup | `pages/decisions/CourseSetup.tsx` |
| Course and assessment | `pages/learning/TrainingCourse.tsx` |
| Employee | `pages/employee/MyLearning.tsx` |
| Supervisor | `pages/oversight/Dashboards.tsx` |
| Intelligence | `pages/oversight/Intelligence.tsx` |
| Modules | `pages/Modules.tsx` |
| People | `pages/PeopleDirectory.tsx` |
| Shell (header, step bar, side menu) | `components/Shell.tsx` |

---

## 8. What is fictional, simulated or proposed

- **Fictional:**
  - all people, IDs and amounts;
  - competency levels for competencies other than Credit Analysis;
  - historical requests and certificates;
  - survey responses;
  - "last activity" dates;
  - training investment;
  - some HR Operations counts (other requests, pending divisions, deadlines).
- **Simulated:**
  - HRIS, leave, Outlook, Teams, SMS and WhatsApp;
  - the AI engine (transparent rules stand in for it);
  - reminders where no enrolment exists;
  - the course video;
  - the AI assistant's answers (fixed answers to known questions).
- **Proposed:**
  - the Management role and Workforce Learning Intelligence;
  - the Finance role (its step is no longer in the journey);
  - the review step in the training request.
- **Partly demonstrated:**
  - survey-based TNA (the survey module that collects responses isn't built);
  - employee-side IDP submission (it only logs an event);
  - Setup Options changes, which stay on screen.

---

## 9. Checks and their status

- **Clean:** the type check (strict, with unused-code checks) and the production build.
- **Browser tests:** scripts in the session scratchpad (`pw/*.mjs`). The full journey walk (`smoke.mjs`) last passed **140 of 140**, before these later changes:
  - the course step now completes only after all modules;
  - the Workforce Learning Intelligence dashboard;
  - the Modules page;
  - the People page and HR Operations.
- **Feature checks:** most new pages had their own browser checks.
  - Workforce Learning Intelligence: all checks passed except the supervisor Reject click, which the test couldn't reach.
  - Modules: 16 of 16.
- **Not yet checked in the browser:** the **People page** and **HR Operations** (testing was stopped). Re-run before the demo.
- **Fix history:** `docs/FIX_LIST.md` (P1–P11 and later).
- **Presenter script:** `docs/PITCH_SCRIPT.md`, partly out of date after the latest changes to the journey order and screens.
