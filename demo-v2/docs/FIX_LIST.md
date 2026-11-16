# demo-v2 Unified Fix List (flow-wise)

**Status (16 Nov 2026): applied, including P1, P2 and P4 (post-rebuild fixes, at the end). P3 is planned.**
- **Done:** every F, J, O and C item is implemented.
- **Checked:** `tsc` (strict + unused-code checks) is clean and the production build passes.
- **Smoke test:** every route loads with no errors at the start and the end of the story, all 24 journey steps connect with correct hand-offs and arrival lines, Reset works, and there are 0 buttons without a click handler.
- **Not yet done:** full QA by clicking each screen's own buttons.

**Known limits after this round:**
- The direct scheduling path still lists the story's nominees as participants.
- These choices stay on their page and reset when you leave it: SMS/WhatsApp choice, report schedules, decisions on AI suggestions, external trainees, the uploaded calendar's file name, course notes and video position, and per-tab "Save & Next" ticks.
- The competency journey can only be completed for Ayesha. For Tanvir and Sadia it is read-only.
- Training record requests from Tanvir and Sadia are tracked through the audit trail.
- Setup Options is partially demonstrated: changes stay on the screen.
**Core source:** the Annexure-II workbook ([annexure-ii/](annexure-ii/)). The knowledge base explains its hierarchy, the gap analysis and [my audit](AUDIT_DEMO_V2.md) list the gaps, and the user's fixes set the direction.
**Detail:** every original item, with its full causes and reasoning, is kept in [FIX_LIST_SOURCE_NOTES.md](FIX_LIST_SOURCE_NOTES.md). The *Merged from* line on each item points to the originals; the map at the end goes the other way.

**How to read it:**
- **Part F:** foundations that apply everywhere.
- **Part J:** the guided journey, screen by screen, in story order.
- **Part O:** oversight and breadth.
- **Part C:** coverage and docs.
- **Part V:** verification.

---

## Decisions

| # | Decision |
|---|---|
| D1 | **Scope:** the core training lifecycle (FR 14, 49–167) **plus the extensions the user requested:** <br>• course preview (FR 190–198) <br>• assessment review (FR 210–214) <br>• attendance and assessment focus <br>• org hierarchy <br>• role dashboards <br>• day-to-day operations <br>• five-module IA <br>• the UI/UX standard <br>The scale is large; the user can trim at "fix all together". |
| D2 | **Finance approval:** keep it, labelled **"Proposed workflow, based on FR 135"**. HR still fills in the FR 135 fields. |
| D3 | **Workbook labels:** use the workbook's exact labels and capitalisation wherever Annexure-II names a button or field. |
| D4 | **Timing:** collect fixes first, then apply them together, in the phase order below. |
| D5 | **First stage name:** "Training Needs Assessment / Divisional Requirement" (FR 186, 15). *Assumed; the user can change it.* |
| D6 | **Two scheduling paths:** nomination-led (Load Training Profile = Yes) and direct from Request Received (FR 66, Load Training Profile = No). *Assumed.* |
| D7 | **Hand-offs:** every change of responsible person jumps straight to that person's screen, with an arrival line. Same-role next steps keep a completion note. |

---

## Part F · Foundations (apply everywhere)

### F1 · Fidelity to the workbook
- **Medium / Mode:** Medium = Classroom / Webinar / e-Learning (FR 26); Mode = In-house / External-local / External-foreign (FR 27). Fix them in `data.ts`, `store.ts`, the forms, the setup tabs and the sample rows.
- **Requirement numbers:** correct the wrong ones (Setup Mode / Medium tabs; Bonds 155–167 → 144–167; Training DB 144–174 → 169–174; the Coverage 144–154 mapping).
- **Labels:** the exact workbook labels on all core screens (D3).
- **Dead code:** remove it, especially `SupervisorApprovals`, which bypasses the mandatory reason.

*Merged from: A2, A3, A15, D3*

### F2 · Honest labelling
- **"Fictional demonstration data":** people, the record, IDs and amounts.
- **"Proposed workflow":** Finance approval, the Management role, the Executive Center, Return for Information, and the request Review step.
- **"Demonstration concept":** the Command Center, guided journey and Connected Bank.
- **"Simulated":** every integration.
- **One line** on Home and on Platform: the main journey is an *example* flow, and modules also work on their own (FR 247).
- **Fictional data must be consistent:** for example, BUD-APP-2026-077 vs FIN-APP-2026-0771.

*Merged from: A4, G3, G4, D2, U3 data errors*

### F3 · Design system and page templates
- **Type scale:** body 17px · labels 15px · section headings 24px · page titles 36–40px · badges ≥ 14px.
- **Four templates, every screen uses one:**
  - **Dashboard;**
  - **List:** `DataTable`;
  - **Decision:** `DecisionPage`, with a header, grouped label → value facts, a light context panel and a sticky decision panel;
  - **Step form:** `StepForm`, with workbook tabs, a footer (Previous · Skip & Next · Save & Next) and the only primary action on the final step.
- **Button rules:**
  - **Primary:** one per view, rightmost; secondary to its left; tertiary as a link.
  - **Placement:** page actions in the header; form actions in a sticky bottom bar; card actions in the card footer; selection actions in a bar on the table.
  - **Order:** actions come after the information they act on.
  - **No duplicates:** the same action never appears twice on one screen.
  - **Destructive actions:** apart, with a confirmation.
  - **Labels:** start with a verb.
- **Visuals:** light surfaces, fewer boxes and more whitespace, red only for the primary action or a real blocker, amber for "needs attention".
- **Accessibility:** WCAG 2.1 AA (contrast, keyboard use, labels, visible focus).
- **Docs:** update `DESIGN_KNOWLEDGE.md`.

*Merged from: U21, U3.8, U4.8, U5 rules, U9.5*

### F4 · Shared table, selection and bulk actions
- **`DataTable`:**
  - search by name or EID;
  - per-column filters shown as removable chips, with Clear filters and "Showing x of y";
  - sortable headers with `aria-sort`, keyboard usable;
  - optional grouping, sticky header, empty state;
  - CSV export where reports need it.
- **Selection:** a tick box per row, a filter-aware "select all" with an indeterminate state, shift-click ranges. Ticking a box never opens the row panel.
- **Bulk action bar:** "n selected · actions · Clear selection", with a required reason where the workbook requires one, an audit entry per item, a toast and about 10 s Undo.
- **Applied to:** every core table (listed in J-items), Coverage, Reports, and setup tables when they're built.

*Merged from: U6, U7.1–2, U12.3, U5 selection bar*

### F5 · Navigation and shell
1. **My work = role dashboard + side menu:**
   - "My tasks" plus pages grouped in process order, each with a live status (new / waiting / not started / done);
   - the current page highlighted; folds to icons below 1440px;
   - the same pattern for all 8 roles. *(Dashboard content: O1.)*
2. **Clickable breadcrumb** (`My work › group › page`) and **one canonical name per page**, using the workbook term (e.g. "Training Scheduling").
3. **No silent role switching:**
   - **Inherited pages keep the role:** pages the role is entitled to (FR 8, 13, 16 inheritance) don't switch.
   - **Other roles' pages:** "This page belongs to {role}. View as {name}?" with Switch / Stay.
   - **Intentional switches skip the prompt:** the step button, the "Viewing as" switcher and hand-offs switch directly.
4. **"Viewing this record as"** includes an Employee sub-choice (Ayesha / Tanvir / Sadia). The switch is removed from page headers.
5. **Links stay in My work:** side-menu links keep the "My work" highlight.
6. **Guidance note on the right pages:**
   - **Bug fix:** hub pages hide it only on an *exact* path match. The `/learning` prefix bug hides it on the course.
   - **Guided empty states:** "This opens after {stage}… [Open current step] [Back to My work]".
   - **Early-step banner:** "This is Step n; the training is now at Step m… [Go to current step]".
7. **Overview drawer** from the step bar (journey path and role chips), so Home is optional during a run.
8. **"Do this step for me":** in the ··· menu, and as a visible quiet button in Presenter mode.

*Merged from: U2, U9.1, U11.1/5/6, U1.3*

### F6 · Journey engine: hand-offs, no dead ends, going back
1. **Hand-offs (D7):** a shared `handOff(nextRole, to, emp?)` helper that runs:
   - a short "Sending to {role}…" state;
   - `switchRole` to the next screen;
   - a toast;
   - the **ArrivalLine** (who sent what, when, plus View full impact).

   **Map** (each new person lands on their screen):

   | Hand-off | Lands on |
   |---|---|
   | Division Head → HR review | `/hr/requests/TR-2026-00418` |
   | HR → Learning Champion | `/nominate` |
   | Learning Champion → HR status | `/hr/nomination-status` |
   | HR → Finance | `/finance` |
   | Finance → HR invitations | `/hr/schedule?tab=Notifications` |
   | Finance returns the budget → HR | `/hr/schedule` |
   | HR → Trainer | `/trainer` |
   | Trainer → Ayesha | `/employee` (e1) |
   | Ayesha → Tanvir | `/employee` (e2) |
   | Tanvir → Supervisor | `/supervisor` |
   | Supervisor → HR approvals | `/hr/approvals` |
   | HR attendance → Employee feedback | `/employee/feedback` |
   | Employee → HR close | `/hr/planned` |
   | HR → Employee | record → course |
   | Employee → Trainer | `/assessment` |
   | Trainer releases the result → Employee | `/journey` |
   | Employee → Management | `/executive` |

   - **Branches:** a rejected withdrawal goes to the employee; a trainer decline goes to HR.
   - **Same-role steps:** keep the completion note, with details first and actions in the footer.
2. **No dead ends:** every finished state has a forward action:
   - course certificate;
   - feedback thank-you;
   - assessment result;
   - bond saved;
   - record request;
   - the final view: "All steps complete · Back to Home".
3. **Going back:**
   - **Revisit finished steps** from the journey drawer, the Home path, and "← Previous step". The step opens in its completed state as its original role, with a "Back to current step" banner.
   - **Browser Back** works.
   - **Presenter rewind:** "Restart from step n", using per-step snapshots and a confirmation of what will be undone.
4. **Journey renumbering:**
   - the accept / withdrawal split (J11) and the assessment release (J19) change the step count to **24**;
   - update `JOURNEY`, the docs and the tests.

*Merged from: U8 (+ extension), U5 completion note, U11.2–3, U14, U15 note*

### F7 · Data model (records, not hard-coded numbers)
- **Org hierarchy** (`src/org.ts`, fictional, standing in for HRIS): Bank → Division → Department / Unit → Supervisor → Employees, with grade and reporting line. Each role's views are scoped from it.
- **Per-employee learning state:** course progress, completion and certificate per `employeeId`.
- **Attendance per day:** `{ day: { empId: { status, source } } }`.
- **Assessment:**
  - **Integrity decision, score and release:** stored for the record.
  - **Per-participant results** for the post-training assessment (fictional, mostly passes with 2–3 failures).
- **Snapshots per journey step** (for F6 rewind).
- **Reasons and audit:** every bulk or decision action stores its reason and an audit entry.
- **No hard-coded totals:** all counts and dashboard figures are computed from these records.
- **Saved progress:** bump `DEMO_VERSION` once for the new shape.

*Merged from: U17 model, U11.4, U12 store, U13 store, U16 store, U14 store, U18 data rule*

---

## Part J · The guided journey, in flow order

Every screen uses the F3 templates, F4 tables, F5 navigation and F6 hand-offs, and every control on it works.
*A5 (the 26 dead buttons and 7 controls that only look clickable) and A6 (actions that change nothing) are resolved inside the steps below.*

### J0 · Home: a one-screen checkpoint
- **Fits one screen,** no scrolling at 1366×768:
  - the training card, with the "Start here" line merged in, one primary button and six facts;
  - a compact "What happens next?";
  - a compact stage path, with the current stage expanded inline (owner, action, systems);
  - **one row of 8 role chips** instead of the people list.
- **Below the fold:** recent activity and enterprise numbers, under "More detail".
- **On every return:** a "Just happened" line (the same component as the ArrivalLine), the completed stage turns green and the next one pulses, and the acting role's chip pulses.
- **The F2 "example flow" line** appears here.

*Merged from: U1.1–2, G3*

### J1 · Training Needs Assessment / Divisional Requirement (FR 186, 15)
- **Stage name:** "Training Needs Assessment / Divisional Requirement" (D5).
- **Identify employees:**
  - the competency-gap list ("27 officers below target in Credit Analysis") comes from the org and competency data (F7), scoped to the division;
  - it feeds the request's participants and later the nominations.

*Merged from: G1, U17 (identification)*

### J2 · Training Request: Division Head (FR 14, 49–64) · StepForm
- **Program tab:**
  - request ID fixed on save;
  - title with a duplicate check;
  - date and time with man-hours and a **repeat-schedule** control;
  - suggested venue; Training Mode and Training Medium (F1);
  - all 27 tags;
  - a real **Upload Content** control.
- **Trainer tab:** **Trainer Details** searched by name or EID · **Topic Name** · **Session Duration** · Remove, plus **Add More**. Footer: **Previous · Skip & Next · Save & Next**.
- **Nominations tab:** **Select Participant** by EID or name, with **bulk upload** (real CSV plus a template download). **Save & Exit**, which keeps a draft.
- **Review & submit** is labelled proposed (F2), then hand-off to HR (F6).

*Merged from: A7, F3 StepForm*

### J3 · Request Received and HR review (FR 65–66) · List + DecisionPage
- **Inbox list** (F4): Training Name, Venue, **From Date**, **To Date** (fixed), Proposed Pax.
- **Review page (decision template):**
  - **Header:** a meta line and the fictional-data tag.
  - **Three fact groups:** Programme; Schedule & delivery; Trainers.
  - **Business justification:** a quote block.
  - **"What ELDP already knows":** a light panel with 4 checks, each with its source (simulated); budget and previous delivery under "More context".
- **Decision panel:**
  - **Create Nomination Request** (primary);
  - **Schedule Training** (direct path → Scheduling, Load Training Profile = No, tagged to the request);
  - **Forward** (choose an HR Admin → their task, an audit entry, a toast);
  - **Return for Information** (a link, labelled proposed).
- **Presenter note** explaining the two scheduling paths.

*Merged from: U3, A8, A6 (Forward / Return), D6, G2*

### J4 · Training Nomination Request Setup (FR 67–87) · StepForm
- **Program tab (FR 67–78):** editable and pre-filled from the request:
  - title search, date and time with man-hours and repeat schedule;
  - **venue dropdown with clash check**;
  - Category, Mode, Medium, Tags, **PDUs**, **Organized By** (from the vendor list).
- **Trainer tab (FR 79–84):** search · Topic Name · Session Duration · **Remove** · **Add More**.
- **Nomination tab (FR 85–87):**
  - recipients table (division, Learning Champion, head count, select all);
  - **Nomination Deadline** date and time picker;
  - **one editable email** with fill-in fields and a live preview (the separate Message field is removed);
  - documents in one row;
  - a send summary, then **Save & Send Nomination Request**.
- **Right rail:** ID, linked request, ✓ per step, what happens after.
- **Sent state:** goes to the hand-off to the Learning Champion.

*Merged from: U4, A9*

### J5 · Learning Champion nominates (FR 88) · List
- **Table** (F4) with an EID column and filters.
- **Selection bar:** "35 of 35 selected · Clear selection · **Submit 35 nominations**".
- **"Action required" colours:** amber "HR will review", grey "None".
- **After submitting:** tick boxes hidden; hand-off to HR.

*Merged from: U5 (applied here), U6*

### J6 · Nomination Status and conflict decisions (FR 89–91, 114) · List
- **Request list:** **Details** becomes a real action that opens the editable training summary and nominations.
- **Nominee table** (F4):
  - filters: Division, Eligibility, Calendar, Leave, Action required;
  - an EID column;
  - amber action text.
- **Bulk decisions:** **Keep (override)** and **Remove**, each with a required reason, an audit entry per person, updated counts and Undo.
- **Side panel:** why attention is needed, and what HRIS, Leave and Outlook say (kept).
- **Finalize participants:**
  - sits in the action bar;
  - is enabled only when every flagged nominee is decided; otherwise it offers "Show only undecided";
  - asks for confirmation: "Lock 32 participants?".

*Merged from: U7, A10, U6*

### J7 · Training Scheduling (FR 92–131) · StepForm
- **Program tab:**
  - **Load Training Profile: Yes / No** control:
    - Yes = choose a future, unscheduled profile and everything loads;
    - No = manual entry, tagged to the request (direct path).
  - Training ID fixed on save; venue dropdown and calendar clash.
  - Footer **Save & Next**.
- **Trainer tab:** pre-filled; search · Topic Name · Session Duration · Add More · Remove; **Previous · Save & Next**.
- **Participants tab:**
  - Participants Summary with the "i" conflict marker;
  - add by EID or name and bulk upload;
  - single and **bulk Remove**;
  - **Save List & Next**.
- **Notification tab:**
  - **Send Nomination to Organizer Now**;
  - **Set Reminder Mail** date pickers;
  - **Save & Send Invitation to Trainer(s) Now** and **Send Training Invitation Now**;
  - automatic supervisor CC plus extra recipients; PDF list; reject link;
  - SMS / WhatsApp (simulated);
  - **Next**.
- **Feedback tab:** "Want to take feedback of this training?" Yes / No; **Load Feedback Templates**; **Save**.
- **Undertaking tab:** **Training Bond** opens the Bond Setup (J16); **Save & Exit**.
- **Review & submit** (proposed): **Save & send budget to Finance** → hand-off to Finance.

*Merged from: A11, D6, U7.5 (participants), U8*

### J8 · Finance budget approval (proposed, FR 135) · DecisionPage
- **ArrivalLine:** "Received from Nusrat Jahan…".
- **Budget breakdown** and the maker-checker note.
- **Decisions:** **Approve budget** (primary) / **Return to HR** (reason required).
- **Labelled** "Proposed workflow, based on FR 135".
- **Approval** → hand-off to HR invitations.

*Merged from: U3.8, U8, D2*

### J9 · Invitations (FR 116–121)
- The Notification-tab actions from J7 send the invitations, with a confirmation of the recipients.
- Hand-off to the Trainer.

*Merged from: A11 (notifications)*

### J10 · Trainer response and material (FR 17–19) · DecisionPage
- **Accept / Reject** (reason required).
- **Material:** upload, then HR links it with a protection option.
- **Trainer calendar** (FR 18, see O1).
- Hand-off to the Employee.

*Merged from: U3.8, existing*

### J11 · Employee response: two clear steps (FR 1, 119) · Employee page
- **Journey steps:**
  - **11a** "Ayesha Rahman accepts the invitation";
  - **11b** "Tanvir Hasan requests withdrawal".
- **Person banner:** "You are Tanvir Hasan · Credit Analyst · reports to Mahmud Karim", plus the known reason.
- **Employee page = "My learning" dashboard:**
  - header 36–40px;
  - the **invitation as the hero card** (Dates · Time · Venue · Trainers, why invited, assigned by, attendance requirement);
  - footer **Withdrawn Request** (left) · **Accept** (primary).
- **Card states:** Invited / Accepted (calendar, material, mark attendance) / Withdrawal requested (tracker: You → Supervisor → HR Admin) / Withdrawn / Attended (Give feedback).
- **Any invited employee can withdraw.**
- **Sadia's view** shows "Added as a replacement for Tanvir Hasan".
- **HR response table:** Accepted / Withdrawal requested / No response yet.

*Merged from: U15, U9, A12 (employee side)*

### J12 · Supervisor decision and replacement (FR 9–10, 119) · List + DecisionPage
- **Supervisor list:** a summary of all active requests from **their direct reports** (the org reporting line, F7).
- **Decision:** **Approve Withdrawal** · **Approve Withdrawal with Replacement** · **Reject**, with the reason required where the workbook says.
- **Replacement:** searched from the employee directory, with conflict, leave, resignation and retirement alerts, then a live eligibility check.
- Hand-off to HR approvals.

*Merged from: A12 (supervisor side), U3.8, U17 (approval routing)*

### J13 · HR approves the replacement (FR 119) · DecisionPage
- **Approve / Reject.**
- **Mail previews:** inclusion and exclusion mails, with supervisor CC.
- The roster stays at 32.

*Merged from: A12 (HR side), U3.8*

### J14 · Planned Training (FR 132–136) · List + detail
- **List** (F4), with **View and Edit** as a real action.
- **Training Details tab.**
- **Budget fields:** the FR 135 fields are **mandatory** (000 allowed), with a working **document uploader**.
- **Reschedule / Postpone / Delete:** change state, send the email (preview), and write an audit entry.
- **Save** works.
- **Feedback review tab** (AI-assisted themes, approved by L&D).

*Merged from: A13 (non-attendance parts), A6*

### J15 · Attendance (FR 137–143) · List: a controlled register
- **One table:** **Employee ID** · Name · Designation · **Division / Department** · Mode · **Attendance Status** (source: self / Teams / HR) · **Mark Attendance**.
- **Day tabs:** Day 1 · 18 Nov | Day 2 · 19 Nov.
- **Marking:**
  - single, select-all and shift-range;
  - bulk Mark Present / Absent / Late / Excused;
  - **Mark All** with individual unchecking.
- **Filters:** mode, status, self-marked, division.
- **Progress line:** "28 of 32 marked · **4 unmarked**" (click to filter).
- **Add Participant** by EID; **Save Draft**.
- **Teams sync inline:** matched people, plus people not on the list → **Request Admin approval**.
- **Submit & Update Training Database:**
  - disabled with a reason until everyone is marked on every day;
  - a confirmation per day;
  - then it writes the records, hours and cost.
- **Outcome per participant** ("who missed which day") for the dashboards.

*Merged from: U12, U16 (attendance), A13 (attendance), U7.5 (attendance)*

### J16 · Feedback, closing and records (FR 4, 142, 144–174, 221–222)
- **Employee feedback:** the thank-you page ends with a forward action (F6).
- **Close training** (HR) writes the database rows.
- **Record-update step:** the employee's record shows the training.
- **Bond Setup (FR 144–163):**
  - **Fields:** EID lookup, with auto-filled grade, designation, division and location; title metadata; institute; duration; **man-hour**; the HR fields; a **calculated end date**.
  - **Buttons:** **Print Training Bond** (Legal-page view), **Input in Training Database & Exit**, **Save & Exit**.
- **Bond Database:** summary, **edit**, **calculated remaining liability**. A saved bond **adds a training database row** (FR 171).
- **Training Database:** **Migration uploader**, **Bulk entry template**, **Single entry** and the external trainee database work as simulated uploads (CSV and template). The employee record request flow is kept.

*Merged from: A14, A5 (database buttons), U11.3*

### J17 · Connected e-learning: course preview and player (FR 190–198)
- **Course overview:**
  - code, version, due date, mandatory target, objectives, module outline;
  - rules (sequential, seek lock, pass 80%, expiry), languages (EN / বাংলা), offline, certificate;
  - **Start / Resume**.
- **Every content type works** (simulated):
  - **video:** play, progress, speed, captions, seek lock, resume;
  - **PDF:** viewer with a watermark;
  - **H5P:** scenario;
  - **checkpoint, feedback, and certificate** with QR.
- **Locked modules:** a preview of the contents and the unlock rule.
- **Tracking panel:** watch %, time spent, xAPI log.
- **Completion footer** with **Continue** / **Back to My learning**.
- **Each employee sees their own progress** (F7).
- **No clipping** at 1366–1920.

*Merged from: U10, U11.2/4*

### J18 · Post-training assessment for *this* training (FR 210–217, 247)
- **The assessment is linked to Advanced Credit Risk Management** (FR 217 exam tagging) and **taken by every attendee**.
- **Trainer review, one guided flow:**
  - **① Integrity:** evidence and timeline; neutral AI wording; choice cards **Clear** / **Flag for review**, with the consequence shown; a note required for Flag.
  - **② Score:** auto-marked part, plus the descriptive answer with a rubric and the AI-suggested score; **Accept** / **Adjust** (reason required).
  - **③ Result:** **Passed · 86% · Very Good**; breakdown; decided by and when; AI disclosure; what happens next; release **Instant / Scheduled**.
- **Results table** for all participants: passed / failed / absent and score, with filters. Failures get a re-attempt or refresher assigned.
- **Release result to candidate** hands off to the Employee journey.
- **The Flag path** never dead-ends: a simulated committee clears it.
- **The AML exam stays** as the standalone-exam example in the LMS.

*Merged from: U13, U16 (assessment), D8*

### J19 · Competency journey and recommendations (FR 185, 241–243)
- **Milestone completion** moves the competency forward.
- **Recommended next step:** "AI-suggested · approved by L&D".
- Hand-off to Management.

*Merged from: existing + F6*

---

## Part O · Oversight and breadth

### O1 · Role dashboards: My work per role, supervisor first
**Supervisor (FR 11–12, 206):**
- direct reports;
- upcoming trainings, **attendance**, **assessment results (pass / fail)**;
- mandatory compliance, overdue items, approvals waiting;
- team calendar, period and label filters, CSV export.

It must answer:
- **who completed;**
- **who failed;**
- **who still needs training;**
- **department progress.**

**Other roles:**

| Role | Dashboard |
|---|---|
| Division Head | Department / segment over time (FR 15) |
| HR | Operations (FR 168) + **Today** list (sessions to take attendance for, requests waiting) |
| Employee | The J11 "My learning" page (FR 205), with calendar (FR 2), record with a time filter (FR 5), and a **Request to add a training record** (FR 6) |
| Trainer | Sessions calendar (FR 18) + **Today** (evaluations due) |
| Finance | Budget pipeline (proposed) |
| Management | Bank-wide (FR 208) |
| Admin | System health + access overview (FR 21, concept) |

- **Every figure drills down to people,** computed from F7 records, scoped by the org hierarchy.

*Merged from: U18, U2 (role home), U20 "Today" lists, G role gaps FR 2 / 5 / 11 / 12 / 15 / 18*

### O2 · Day-to-day operations
- **Training calendar (FR 43–44, 182):** several programmes, each openable with its own status and attendance.
- **Course management:** enrolments, progress, overdue learners, **Send reminder** (FR 200–201).
- **Records and audit:** every interaction writes to them.

*Merged from: U20*

### O3 · Five-module structure
- **The five modules:**
  - **LMS:** FR 190–220, 227–240;
  - **TMS:** FR 49–174;
  - **L&D management:** FR 186–189, 241–243;
  - **Enterprise workflow:** FR 1–21, 175–185, 244, 248–250;
  - **AI-assisted:** FR 185, 209, 213, 226, 245.
- **Applied to:**
  - the menu and Learning hub;
  - the Platform map;
  - the Coverage domains;
  - a module tag on each screen.
- **People becomes the org explorer** (tree / chart with role, supervisor and status).

*Merged from: U19, U17 (People explorer)*

### O4 · Reports page
- The filters work, through `DataTable`.
- Excel / PDF export works (CSV + print view).
- Report types show real computed data.
- A supervisor label report for a chosen period (FR 12).

*Merged from: A5 (Reports buttons), U18*

---

## Part C · Coverage and documentation

### C1 · Coverage page (honest)
- **Read** from `annexure-ii/requirements.json`. It's currently broken: 0 rows.
- **Seven statuses:** Demonstrated / Partial / Simulated / Conceptual / Bank-integration dependent / Proposed interpretation / Missing.
- **Each row:** FR · category · sub-category · short text · screen · route · status · gap note · dependency · plan.
- **Grouped** by the five modules (O3), with a `DataTable`.
- **Status rule:** "Demonstrated" only when the field, action or behaviour is visible and usable after this round.

*Merged from: A1, U6 (Coverage)*

### C2 · Documentation
- **Update:**
  - `PITCH_SCRIPT.md` (24 steps, hand-offs, dashboards);
  - `DESIGN_KNOWLEDGE.md` (F3);
  - `REQUIREMENTS_KNOWLEDGE.md` §8 (gaps closed);
  - `AUDIT_DEMO_V2.md` (re-audit).
- **Memory notes:** update.

---

## Part V · Verification (after everything)

1. **Build:** `tsc` and the production build are clean.
2. **Fresh start:** Step 1, Farzana, Training Needs Assessment.
3. **The whole guided journey (24 steps), end to end, without using "Do this step for me".**
   - Each hand-off lands on the right person with an ArrivalLine.
   - Every finished state has a forward action.
4. **Both scheduling paths:** Load Training Profile = Yes and = No.
5. **Branches:**
   - Finance return → resubmit;
   - trainer decline;
   - supervisor Reject / Approve Withdrawal / Approve with Replacement;
   - assessment Flag.
6. **Bulk actions:** nomination Keep / Remove, participant Remove, attendance marking — each with reason, audit and Undo.
7. **Back:** revisit any finished step; rewind to steps 3, 9 and 16, then redo.
8. **Navigation:** no silent role switch; side menu and breadcrumb on every work page; one name per page.
9. **Dashboards:** the supervisor answers completed / failed / needs training / progress, and drill-downs match the records.
10. **Every core table:** sort, filter, count and empty state.
11. **No dead buttons:** the automated scan reports **0** on live screens.
12. **Coverage:** shows 250 rows, with statuses consistent with the screens.
13. **Layout:** screenshots of every route at 1920×1080, 1440×900, 1366×768, and spot checks at tablet width. No clipping, no horizontal scroll.
14. **Accessibility:** axe on the core routes; keyboard-only run of J2–J7.
15. **Reset:** Reset demo and re-sign-in return to Step 1.

---

## Phase order (when "fix all together" is given)

| Phase | Items |
|---|---|
| 1 · Foundations | F1, F2, F3, F4 |
| 2 · Data and engine | F7, F6, F5 |
| 3 · Journey | J1–J19 (in order) |
| 4 · Oversight | O1, J0, O4 |
| 5 · Breadth | O2, O3, C1 |
| 6 · Verify and docs | V1–V15, C2 |

**Deferred (not in this round unless the user pulls them in):**
- Setup Options masters CRUD (FR 22–48);
- course authoring and administration (FR 199–204);
- exam engine and question bank (FR 215–220);
- survey builder (FR 222–226);
- Knowledge Corner and Library management (FR 227–240);
- competency framework setup (FR 241–242);
- mobile journeys (FR 246);
- live integrations.

---

## Traceability map (original → unified)

| Original | Now in |
|---|---|
| U1 | J0, F5.7 |
| U2 | F5, O1 |
| U3 | F3 (DecisionPage), J3, J8, J10, J12, J13, F2 |
| U4 | F3 (StepForm), J4 |
| U5 | F3 (rules), F4, F6.1, J5 |
| U6 | F4, C1 |
| U7 | F4, J6, J7 |
| U8 | F6.1, J7, J8 |
| U9 | F5.4, J11, O1 |
| U10 | J17 |
| U11 | F5.6–8, F6.2, F7, J16, J17 |
| U12 | J15, F7 |
| U13 | J18, F7 |
| U14 | F6.3, F7 |
| U15 | J11, F6.4 |
| U16 | J15, J18, F7 |
| U17 | F7, J1, J12, O1, O3 |
| U18 | O1, O4 |
| U19 | O3, C1 |
| U20 | O1, O2 |
| U21 | F3, C2 |
| A1 | C1 |
| A2 | F1 |
| A3 | F1 |
| A4 | F2 |
| A5 | J-items, O4, V11 |
| A6 | J3, J14 |
| A7 | J2 |
| A8 | J3 |
| A9 | J4 |
| A10 | J6 |
| A11 | J7, J9 |
| A12 | J11, J12, J13 |
| A13 | J14, J15 |
| A14 | J16 |
| A15 | F1 |
| G1 | J1 |
| G2 | J3 |
| G3 | F2, J0 |
| G4 | F2 |
| D5 | J1 |
| D6 | J3, J7 |
| D7 / D8 | J17, J18 |

---

## Post-rebuild fixes (after 16 Nov 2026)

### P1 · Simplify the step bar (context bar)
**Problem:** the bar under the menu is congested. It holds seven elements (page label + record, Viewing as, Previous step, Overview, two-line step text, red button, ··· menu), and it repeats the page name (breadcrumb) and the step count (the header's "Guided journey 2/24").

**Approach (one line, three zones, `components/Shell.tsx` ContextBar):**
1. **Left:** `Viewing as: {role} ▾` on one line (the main control).
2. **Middle:** the record on one line, `TR-2026-00418 · Advanced Credit Risk Management` (or `New request · …` before submission). Clicking it opens Home. Remove the "{page} · working on" label.
3. **Right:**
   - **Step chip:** one line, `● Step n/24 · {step title}`. A green dot means "you are here". Clicking the chip opens the Guided journey drawer.
   - **Red next-step button:** only when you're not on the step.
   - **One ··· menu:** Previous step, Overview, Do this step for me, Reset demo. The separate Previous step and Overview buttons are removed.
4. **Header:** remove the duplicate "Guided journey n/24" button (the step chip opens the drawer).
5. **Sizing:** height about 52px. Long titles are cut off with "…" and the full title shows on hover. Presenter mode keeps the visible "Do this step for me".

**Verify:** one line at 1920 / 1440 / 1366; every function is still reachable (Previous step, Overview, Do this step for me, Reset, journey drawer).
**Status:** applied (16 Nov 2026). Bar measured at 53px; the header "Guided journey" button is gone; the ··· menu also lists Guided journey and any dashboard stops. Escape now closes the side drawers.

### P2 · Dashboards as part of the walkthrough
**Problem:** the walkthrough jumps straight to task screens, so the role dashboards (division, supervisor, HR, finance, trainer) never appear during a presentation.

**Approach:**
1. **Dashboard stops** are optional, change no records, and are defined in `lifecycle.ts` as a `showcase?: { role, to, label, why }[]` per `JOURNEY` step:

   | When | Dashboard | Shows |
   |---|---|---|
   | Step 1 | Division dashboard `/division` | The competency gap. **Step 1's screen becomes `/division`**, and "Raise training request" opens `/request/new` |
   | Step 3 | HR operations dashboard `/r/hr` | The new request in Today |
   | Step 10 | Finance dashboard `/r/finance` (proposed) | The budget in the queue |
   | Step 12 | Trainer dashboard `/r/trainer` | Sessions, invitation, evaluations due |
   | Step 15 | Supervisor team dashboard `/supervisor/team` | Approvals waiting |
   | After step 17 | Supervisor team dashboard | Attendance per person and per day |
   | After step 22 | Supervisor team dashboard + Division dashboard | Pass / fail and department progress |
   | Step 24 | Executive insight (already the step) | Bank-wide insight |

   Employee steps already land on My Learning, the employee dashboard.
2. **Where the stops appear:**
   - **Journey drawer:** "◇ Show: {dashboard}" under the step.
   - **GuidedStepNote:** a secondary "Show {name}'s dashboard" link in "What happens next?".
   - **Step bar ··· menu:** "Show the dashboard for this step".
   - **Dashboards opened from a stop:** a "Back to the current step" button.
3. **Presenter setting** (More): **Hand-offs land on: Task screen (default) / Role dashboard first**. In dashboard mode, the hand-off opens the next person's dashboard with their task highlighted at the top; one click opens the task. The shell's hand-off engine reads the setting (store: `handoffTarget: 'task' | 'dashboard'`).
4. **Pitch script:** dashboard cues at these moments.

**Verify:**
- Each stop opens the right dashboard as the right person, then returns to the current step.
- Both hand-off modes complete the 24 steps.
- Dashboard figures reflect the state at that moment.

**Status:** applied (16 Nov 2026).
- Step 1 opens the Division dashboard; **Raise training request for these officers** continues to the form.
- Stops appear in the step note, the ··· menu and the journey drawer (7 stops). A link to the page you're already on is hidden.
- A stop shows a blue "Dashboard stop … changes nothing" banner with **Back to the current step**; it clears when you leave the page.
- More → **Hand-offs open the role dashboard first**: checked on all 10 role changes in the 24 steps, each landing on the right dashboard with the arrival line. The task opens from My tasks or the red button.
- Pitch script updated with the dashboard cues.
- Checks: light smoke test 134/134, P1/P2 check 10/10, dashboard-first walk 10/10.

### P3 · Log out in the Switch profile menu
**Problem:** the profile menu (top right) lists the eight people but has no way to sign out, so the presenter can't return to the welcome screen without the More menu or the URL.

**Approach (`components/Shell.tsx`, profile menu):**
1. **Footer row** under the people list, separated by a line: **Log out** (log-out icon), text "Signed in as {name}", full-width row with the same 15px text as the list.
2. **Action:** close the menu and open the welcome screen (`/login`). Progress is kept: the welcome screen already shows **Resume that run instead**, and **Continue with City Bank SSO** starts fresh, as today.
3. **Keyboard:** reachable with Tab after the last person; Escape closes the menu (already works).

**Verify:** Log out → welcome screen; Resume returns to the same step; SSO starts at step 1.
**Status:** planned.

### P4 · Home and Training Needs Assessment redesign (FR 15, 22, 185–188, 209)
**Status:** applied (16 Nov 2026).
- **Header:** the notification bell is removed. Notifications are under More (with a count); tasks stay on My work.
- **Home** (`pages/Command.tsx`):
  - greeting;
  - learning need panel (18 of 20, gap scale, roles, mandatory learning, recommendation, one red **Raise training request**);
  - AI recommendation (factors, "Human decision required", Review / Why panel);
  - three-step What happens next, which becomes Latest update after the request;
  - ten-stage journey with owners and a people drawer;
  - Recent activity (clickable, with division signals) and Enterprise pulse.
  - The step bar button is an outline on Home.
- **TNA page** (`pages/oversight/Tna.tsx`, routes `/division` and `/tna`):
  - how TNA works;
  - path 1: competency gap with the AI-suggested training;
  - path 2: survey output (select the need, use as evidence, create the requirement);
  - path 3: development requests (open, select, combine);
  - requirement summary with source toggles and one **Raise training request**;
  - then the FR 15 division summary.
  - Open Team Dashboard is removed, and the old `/tna` placeholder is replaced.
- **State:** `store.tna` plus `prepareRequest()` fill the existing request: title, justification, participants and `draft.sources`. The sources show on the request and in HR's review. `DEMO_VERSION` is 7.
- **Data:** Nusrat Karim was added for the third development request. The 18 of 20 figures are unchanged.
- **Coverage:** FR 185 and FR 209 simulated; FR 186 demonstrated; FR 187 and FR 188 partially demonstrated.
- **Checks:** tsc and build clean; `pw/p4.mjs` 34 of 34; smoke and P1/P2 re-run.
- **Also fixed:** pages now open at the top.

### P5 · Home: activity and pulse redesign, journey removed
**Status:** applied (16 Nov 2026).
- **Training journey:** the strip (with its people and stage drawers) is removed from Home. The step bar still shows the step and opens the guided journey.
- **What happens next:** one full-width band of three steps.
- **Recent activity:** a white card with icon chips, worded for the Division Head (for example "Credit Analysis gap found in your division", "A training was recommended for your officers", "3 development requests are waiting for you"). Each entry opens its details.
- **Enterprise pulse:** "Your division at a glance": six tinted tiles with large figures and short lines, the same height as the activity card.
- **Width:** the page is wider (1760px) to use less empty space.
- **Checks:** tsc and build clean; p4 33 of 33; smoke 134 of 134.

### P6 · TNA page simplified; Home trimmed
**Status:** applied (16 Nov 2026).
- **TNA page** (white, Division Head view only):
  - three large "Way" cards: competency and role gap, survey or nomination, development requests; each opens its own small workspace;
  - way 1 has a competency selector covering the FR 22 categories (Credit Analysis plus five others, each with its own gap, priority and AI suggestion; "Save for the next cycle" for the others);
  - the AI suggestion is one title and one line;
  - a sticky "Your training request" bar shows the chosen sources (removable chips), the employee count and one **Raise training request**, and shows the request status after submission.
  - The presenter step note is hidden on this page.
  - The FR 15 division summary sits behind a quiet link.
- **Home:**
  - Recent activity and Enterprise pulse are removed.
  - New **See all training needs** button.
  - Short AI panel.
  - Lighter type (semibold and medium instead of bold and extrabold).
- **Data:** `store.tna.later` added. `DEMO_VERSION` is 8.
- **Checks:** tsc and build clean; `pw/p6.mjs` 10 of 10; smoke 134 of 134.

### P7 · Division Head home = division view; My work and AI panel removed
**Status:** applied (16 Nov 2026).
- **Header:** "My work" removed. Home carries the task count and stays active on work pages.
- **Step bar:** the record label ("New request · ...") is removed.
- **Division Head home** (`pages/oversight/DivisionHome.tsx`) is shown on both Home and `/r/division_head`. It has:
  - a time frame selector and **Open training needs (TNA)**;
  - five figures: people, below target, trained, learning hours, mandatory done;
  - My tasks, shown only when there are tasks;
  - **Skill gaps:** pick a competency to see each department with people, below target and average level against target; a department opens its people with their levels;
  - **Your training requests:** the live request plus earlier ones (fictional), with All / Ongoing / Completed tabs.
- **Other roles:** Home shows the training status and their own task list. The AI panel is removed from Home.
- **Checks:** tsc and build clean; smoke 134 of 134; `pw/p6.mjs` 10 of 10.

### P8 · Division Head home: greeting and gap card back, clickable summary, richer skill gaps, request pages
**Status:** applied (16 Nov 2026).
- **Division Head home:**
  - "Good morning, Farzana" and the Credit Analysis gap card are back; only the AI panel stays removed;
  - each summary figure opens the people behind it, with CSV download;
  - skill gaps: per competency, below target, average level, target and most affected department, a people-at-each-level chart and a department breakdown (each department opens its people);
  - each request row opens `/division/requests/:id`: outcome figures, progress timeline with dates, details, people by department, and the participant table for the live request.
- **Removed:**
  - the "Your next action ... Open this step" note;
  - the TNA request bar, now only the **Raise training request** button.
- **Checks:** tsc and build clean; `pw/p8.mjs` 12 of 12; smoke 134 of 134.

### P9 · Cleaner work screens, Finance step removed, withdrawal before acceptance
**Status:** applied (16 Nov 2026).
- **Step note:** one short line on every screen ("Step n of 23 · action · Next: ..."). The note is off on the training request. "Received from" lines and "View full impact" buttons are removed, as is the "Your next action ... Open this step" note.
- **Page width:** the content area is wider (1680px). Request, HR review, nomination and scheduling pages sit on white.
- **Training request:** the business justification field and the side panel are removed.
- **HR review:** one compact Request summary plus the decision panel (Create Nomination Request, Schedule Training, Forward, Return for Information).
- **Nominations:** conflict actions are Keep / Remove.
- **Finance approval removed:** saving the schedule records the budget, and invitations follow. The journey has 23 steps.
- **Journey order:** Tanvir withdraws → supervisor approves with replacement → HR approves, then Ayesha accepts. Invitations offer Accept and Withdrawn Request only.
- **Notifications (FR 116–118):** organizer, trainer and participant communication each have an editable email template (subject and message). The participant template has the accept / withdraw link, the PDF list and supervisor CC.
- **Breadcrumbs:** start at Home.
- **Checks:** tsc and build clean; smoke 133 of 133; `pw/p8.mjs` 12 of 12.

### P10 · Trainer Workspace (FR 16–19, 210–220)
**Status:** applied (16 Nov 2026). Trainer part of the brief only; the Employee part of the paste was cut off.
- **Where:** one compact screen on `/trainer` and the trainer's Home (`/r/trainer`).
- **Header:** name, "Trainer · Risk Management Division" and one primary action that follows the state (Respond to invitation → Upload material → Open today's session → Review assessment).
- **Summary strip:** sessions this week, upcoming session, participants assigned, assessments awaiting review, material awaiting HR link.
- **Left column:** the invitation (Accept / Reject with reason); my sessions (click for details and participants with attendance); assessments (post-training and AML, with progress and status).
- **Right column:** materials (upload or sample, then waiting for or linked by HR); calendar with the to-do list.
- **Checks:** tsc and build clean; smoke 133 of 133; action changes checked through invitation → upload → training day.

### P11 · Supervisor: Team Learning Overview (FR 8–12); Management label
**Status:** applied (16 Nov 2026). Supervisor part of the brief only; the paste was cut off before the Management / Executive details.
- **Where:** `/supervisor/team` and the supervisor's Home.
- **Header:** compact profile (name, Supervisor · Corporate Banking, direct reports, title); a line with needing action, next team training and pending approvals; **Download team report** and a contextual primary (Review approvals, or View training records).
- **Strip:** direct reports, below competency target, mandatory learning overdue, actions requiring approval; each opens its people or the approvals.
- **Needs your action:** withdrawals, failed with no follow-up, overdue mandatory, still need training; plus a team progress bar (completed, in training, failed, still need training).
- **Approvals** and **Upcoming team training** cards.
- **Tabs:** Direct reports (select, CSV), Training records by period, label and category (CSV, print; FR 11–12), Departments.
- **Management label:** "Management role and Executive Center are proposed based on reporting and analytics requirements." on the Executive page and the management Home.
- **Checks:** tsc and build clean; smoke 133 of 133.
