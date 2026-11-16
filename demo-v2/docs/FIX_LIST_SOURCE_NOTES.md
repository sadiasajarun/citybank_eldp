# demo-v2 Fix List: source notes (archived 16 Nov 2026)

> **Superseded by the unified [FIX_LIST.md](FIX_LIST.md).** This file keeps every original item (U1–U21, A1–A15, G1–G4) with its full causes and reasoning, for traceability. Work from FIX_LIST.md.

**Status:** planning only. Nothing here is applied until the user says to fix everything together.
**Sources:**
- **G:** City_Bank_ELDP_V2_Demo_Gap_Analysis.md (supplied by the user)
- **A:** [AUDIT_DEMO_V2.md](AUDIT_DEMO_V2.md) (my audit, 15 Nov 2026)
- **U:** fixes the user gives, each one with an approach plan
**Core source:** the Annexure-II workbook ([annexure-ii/](annexure-ii/)). Every change must trace to its requirement numbers, or be labelled as an addition.

## Decisions already made (15 Nov 2026)
| # | Decision |
|---|---|
| D1 | **Scope:** core lifecycle first, FR 14 and 49–167. Learning modules (FR 190–243) come in a later round. |
| D2 | **Finance step:** keep it, labelled "Proposed workflow, based on FR 135". HR still fills in the FR 135 fields. |
| D3 | **Labels:** use the workbook's exact labels and capitalisation where Annexure-II names a button or field. |
| D4 | **Timing:** collect every fix first, then apply them together. |
| D5 | **First stage:** rename it "Training Needs Assessment / Divisional Requirement" (FR 186). *Assumed from G §4.1; the user may change it.* |
| D6 | **Scheduling paths:** both are supported and explained: nomination-led, and direct from Request Received (FR 66). *Assumed from G §4.5.* |
| D7 | **Scope extension:** e-learning course preview and player (FR 190–198) pulled into this round by the user (U10). The rest of FR 199–243 stays deferred. |
| D8 | **Scope extension:** the trainer's assessment review and result (FR 210–214) pulled into this round (U13). |

---

## U · User fixes

### U1 · Home as a one-screen checkpoint for the flow
**Problem:** Home has the right content, but presenting it takes too long. It's about two screens of scrolling, and four sections repeat the same message.
**Approach:**
1. **One screen, no scrolling, even at 1366×768:**
   - **Training card:** merge the "Start here" note into it as one line, so there's one primary button. Keep the six facts.
   - **"What happens next?"** stays on the right, more compact.
   - **Stage path:** move it up and make it smaller. The current stage expands inline with owner, action and systems.
   - **People affected:** replace the tall list with one row of 8 role chips (dot, role, short status). Clicking one still switches perspective.
   - **Recent activity and enterprise numbers:** move them below the fold into "More detail".
2. **Show what just changed on every return to Home:**
   - a "Just happened" line taken from the last audit event, showing who and when;
   - the stage just completed turns green with a tick, and the next one pulses;
   - the role chip that now acts pulses.
3. **Overview drawer from the step bar:** the stage path and role chips are available on any screen, so the presenter can skip Home.
**Files:** `pages/Command.tsx`, `components/Shell.tsx` (the Overview drawer).
**Data:** reuse `STAGES_LC`, `personStatus`, `JOURNEY` and `audit`. No new business logic.
**Verify:** no vertical scrolling on Home at 1920×1080, 1440×900 and 1366×768, at the start, middle and end of the story. Each chip and stage click still opens the right view.
**Status:** planned.

### U2 · Navigation inside "My work": no getting lost
**Problem:** after opening any "Go to" link on the My work page, the user gets lost.
**Root causes (verified in code):**
1. **No way back:** the "Go to" list exists only on `/r/:role`. Target pages have no sibling menu, and the breadcrumb (`PageTitle` eyebrow) is plain text.
2. **Silent role switch:** `Shell.tsx`'s `OWNER` map sets the role on navigation. For example, Division Head → "Team training records" (`/supervisor/team`) becomes Supervisor (Mahmud Karim) with no message, and "My work" then opens the Supervisor's work page.
3. **The top-menu section jumps:** for example, HR → "Reports" moves the highlight to *Reports*, and Employee → "Mandatory course" moves it to *Learning*.
4. **One place has three names:** "Scheduling" (link) / "Training programme" (step bar) / "Training Scheduling" (breadcrumb) / the training title (heading).
5. **Dead-end empty states:** pages opened before their stage (e.g. Scheduling before finalisation) show no explanation and no way back.
6. **A flat list:** "Go to" is 10 links with no grouping, description or status.

**Approach:**
1. **A persistent side menu on every work page.**
   - "My tasks" at the top with a count.
   - Pages grouped in process order. For HR: *Requests & nominations* → *Programme* → *Delivery* → *Records* → *Setup & reports*.
   - The current page highlighted, with a live status per item (new / waiting / not started / done).
   - It folds to icons below 1440px.
2. **A clickable breadcrumb:** `My work › group › page`.
3. **One canonical name per page** (the workbook's term, e.g. "Training Scheduling"), used in the menu, breadcrumb, step bar and page header.
4. **No silent role switching.**
   - Pages the current role is entitled to (FR 8, 13, 16 inheritance) keep the role.
   - Other roles' pages show a prompt, "This page belongs to {role}. View as {name}?", with Switch / Stay. A switch shows the usual toast.
5. **Side-menu links stay in "My work":** reports and learning pages opened from it don't move the top-menu highlight.
6. **Guided empty states:** "This opens after {stage}. The training is now at Step n: {title} ({owner})", with [Open current step] and [Back to My work].
7. **The same pattern for all 8 roles,** each with its own grouped list taken from `INFO` in `Roles.tsx`.

**Files:**
- `components/Shell.tsx`: side menu, breadcrumb, replace the `OWNER` auto-switch with a prompt.
- `pages/Roles.tsx`: grouped `INFO` with statuses.
- `components/ui.tsx`: guided empty state.
- Page headers: the canonical names.

**Data:** reuse `INFO`, `tasksFor`, `journeyIndex` and `JOURNEY`. No new business logic.

**Verify:**
- For each role, open every side-menu item. The role is unchanged (or a prompt appears), the side menu and breadcrumb are visible, and the user can return to My work in one click.
- No silent role change anywhere. Check at 1920 / 1440 / 1366.

**Status:** planned.

### U3 · A clean decision page: HR request review first, then reused
**Screen:** `/hr/requests/TR-2026-00418` → `RequestReview` in `pages/Hero.tsx`.
**Problem:** the whole page feels congested. It needs a clear structure, organisation and bigger type.
**Causes:**
- **Facts:** 9 of them in a 3×3 grid, with uneven wrapping and 14px grey labels. They aren't grouped and nothing stands out.
- **Context panel:** "What ELDP already knows" is dark, with 6 items in low-contrast grey on black. It takes half the screen.
- **Decision cards:** three cards of equal weight. The main action is black, not brand red. Forward and Return change nothing (A6). Return for Information isn't in the source.
- **Data errors:** "Mode: Classroom + Webinar" (the Mode / Medium swap, A2), and the budget approval "BUD-APP-2026-077" contradicts FIN-APP-2026-0771.
- **Repetition:** the page duplicates the guided explanation note above it.

**Approach:**
1. **Header:**
   - title in 36–40px;
   - one meta line: `ID · division · requested by · received`;
   - status pill and a "Fictional demonstration data" tag.
2. **Three labelled groups**, each a two-column label → value list (values 17px, labels 15px, generous spacing):
   - **Programme:** title, business need and competency gap, audience, participants;
   - **Schedule & delivery:** dates, suggested venue, Training Mode, Training Medium (correct per FR 26–27), tags;
   - **Trainers:** name, topic and session duration.
3. **Business justification** as a highlighted quote block in 17px.
4. **"What ELDP already knows" becomes a light panel.**
   - It keeps 4 checks: competency, duplicate, trainer availability, venue availability. Each shows an icon, one line and its source, marked "simulated".
   - Budget and previous delivery go under "More context", with the budget number made consistent.
5. **Decision panel on the right that stays visible while scrolling,** per FR 66 and D6:
   - **Primary (red):** **Create Nomination Request**, plus one line saying what happens next.
   - **Secondary:** **Schedule Training**, the direct path to Scheduling with Load Training Profile = No.
   - **Secondary:** **Forward**, which opens a window to choose an HR Admin. It creates their task and an audit entry, and shows a toast.
   - **Tertiary link:** **Return for Information**, labelled "Proposed workflow".
6. **Less repetition:** the page drops wording that duplicates the GuidedStepNote; the "what happens next" line lives in the decision panel.
7. **Responsive:** the panel is 360px at 1366. Below 1200 it becomes a sticky bottom action bar.
8. **Reusable `DecisionPage` template** (header · grouped facts · light context panel · decision panel), also applied to:
   - Finance budget approval (`/finance`);
   - HR Approvals (`/hr/approvals`);
   - the Supervisor withdrawal decision (`/supervisor`);
   - the trainer invitation (`/trainer`).

**Depends on:** A2 (Mode / Medium), A4 (labels), A6 / A8 (Forward and Schedule Training made real), D6.
**Files:**
- `pages/Hero.tsx` (RequestReview, ReplacementExperience)
- `pages/Roles.tsx` (FinancePage, TrainerPage, HrApprovals)
- the new `components/DecisionPage.tsx`

**Verify:**
- No wrapped label grids, and the decision is visible without scrolling at 1920 / 1440 / 1366.
- All three FR 66 actions change state.
- Type sizes: title ≥ 36px, values 17px, labels ≥ 15px.

**Status:** planned.

### U4 · Nomination Request Setup as three clear steps (supersedes A9's layout)
**Screen:** `/hr/nomination-request` → `NominationRequestSetup` in `pages/Flow.tsx` · FR 67–87.
**Problem:** the page feels congested.
**Causes:**
- **One long page:** all three workbook tabs (Program 67–78, Trainer 79–84, Nomination 85–87) are stacked.
- **A read-only 3×3 grid** with wrapping values. Nothing is editable, despite FR 68–77, and Mode and Medium are swapped.
- **Trainer rows:** "Remove" is dead grey text, and there's no Add More.
- **The message box is tiny** with its own scrollbar, and duplicates the email template on the right.
- **Documents and divisions:** stacked document chips, and divisions as a run-on sentence of names plus a separate chip row.
- **The primary action is at the top,** while the user works at the bottom ("use … at the top").

**Approach:**
1. **Three steps (the workbook tabs), one screen each.**
   - **Footer:** Previous · Skip & Next (Trainer only) · Save & Next. The final step ends with the only primary action, **Save & Send Nomination Request** (FR 86).
   - **Header:** the nomination ID and a "Loaded from TR-2026-00418" tag.
2. **Program tab** (FR 67–78): an editable two-column form, pre-filled from the request:
   - Training Title with a setup search; Date & time with man-hours and repeat schedule;
   - Venue dropdown with an inline clash check;
   - Category, Training Mode (In-house…), Training Medium (Classroom…), Tags, PDUs, and Organized By from the vendor list.
3. **Trainer tab** (FR 79–84): a table of Trainer Details (search by name or EID) · Topic Name · Session Duration · Remove, plus **Add More**.
4. **Nomination tab** (FR 85–87):
   - **Recipients table:** a tick box, division, Learning Champion and head count per row, with "select all" and a total.
   - **Nomination Deadline:** a date and time picker.
   - **One editable email** (subject and body with fill-in fields {Training}, {Deadline}, {Nominate link}) with a live preview. The separate Message field is removed.
   - **Supporting documents:** one row with add and remove.
   - **Sending:** a summary line ("Will send to 4 Learning Champions · deadline …") followed by the primary action.
5. **Narrow panel on the right:** ID, linked request, step completion ✓, and "What happens after sending".
6. **After sending:** "Nomination request sent. Learning Champions can now nominate employees. Next: Review nomination status", with a button.
7. **Type scale:** the same as U3.
8. **Shared `StepForm` template,** also used for Training Request (A7), Training Scheduling (A11) and Bond Setup (A14).

**Depends on:** A2, A4, A5.
**Files:** `pages/Flow.tsx`, the new `components/StepForm.tsx`.
**Verify:**
- Each step fits on one screen at 1366×768.
- The primary action appears only on the final step.
- Every control works.
- The sent state routes to Nomination Status.

**Status:** planned.

### U5 · Button placement rules (whole demo), first applied to the nomination board
**Screen:** `/nominate` (`NominationBoard` mode `lc` in `pages/Hero.tsx`), plus the post-decision GuidedStepNote in `components/Shell.tsx`.
**Problem:** button positions don't follow good UI/UX practice.
**Causes:**
- **Completion note:** its buttons sit between the text and the details (People affected / System updates / Next step).
- **Duplicate next step:** "Continue: Review eligibility and conflicts" and the header's "Open HR view" go to the same place.
- **Submit button far from the table:** "Submit 35 nominations" sits in the page header, away from the selection.
- **"HR will review" in red**, which reads as an error.
- **EID wraps** ("CBL-" / "10663") because it shares a cell with the job title.

**Rules, applied app-wide:**
1. One primary per view, rightmost in its group; secondary to its left; tertiary as a text link.
2. **Placement:**
   - page-level actions in the page header, right;
   - form and step actions in a sticky bottom bar;
   - card actions in the card footer, right;
   - actions on selected rows in a bar attached to the table.
3. Actions come **after** the information they act on, never between a heading and its details.
4. The same action never appears twice on one screen.
5. Destructive actions sit apart (left) with a confirmation.
6. Labels start with a verb, using the exact workbook wording (D3).

**Applied here:**
- **Completion note:** details first, then a footer with View full impact (left) and **Continue** (primary, right). Remove "Open HR view".
- **Selection bar:** a sticky bar on the table, "35 of 35 selected · Clear selection · **Submit 35 nominations**".
- **Action required colours:** amber "HR will review", grey "None"; red only for a real blocker.
- **EID** gets its own column with no wrapping.
- **After submitting:** the tick boxes are hidden, not shown greyed out.
- **Every screen** is reviewed against these rules, including U3 and U4.

**Files:**
- `pages/Hero.tsx` (NominationBoard);
- `components/Shell.tsx` (GuidedStepNote action footer);
- page headers across `pages/*`.

**Verify:** for each core screen, one primary rightmost, no duplicated action, and the primary visible without scrolling at 1366×768.
**Status:** planned.

### U6 · Filter and sort on tables (shared `DataTable`)
**Problem:** tables have no filtering or sorting.

**Approach:** a shared `components/DataTable.tsx` driven by a column definition:
- **Search** by name or EID;
- **Filters** per column (select or multi-select chips), shown as removable chips with **Clear filters** and a result count ("Showing 4 of 35");
- **Sortable headers** with an arrow and `aria-sort`, usable by keyboard;
- **Optional grouping**, e.g. "Needs a decision" / "Eligible", that can be switched off;
- **Sticky header** with a scrolling body;
- **An empty state** ("No rows match these filters" + Clear filters).

**Applied to:**
- nomination board (LC and HR): filters for Division, Eligibility, Calendar, Leave, Action required;
- Nomination Status list;
- Training Request Received;
- Scheduling Participants Summary;
- Attendance;
- Planned Training;
- Training Bond Database;
- Training Database;
- Coverage (per A1);
- setup master tables, when built.

**Data:** filtering and sorting happen in the component only. No store changes.
**Verify:**
- Each listed table sorts on every sortable column and filters correctly.
- The count is correct, and Clear filters resets.
- Keyboard sorting works.
- No horizontal page scroll at 1366.

**Status:** planned.

### U7 · Multi-select bulk actions for HR on the nomination list (+ U6 filter and sort)
**Screen:** `/hr/nomination-status` → `NominationStatus` in `pages/Flow.tsx` + `NominationBoard` mode `hr` in `pages/Hero.tsx` · FR 89–91, 114.
**Problem:** the page needs filter and sort (covered by U6), and HR must be able to act on several nominees at once from the list.

**Approach:**
1. **Selection:**
   - a tick box per row plus a header "select all" (with an indeterminate state) that selects **only the rows visible under the current U6 filters**;
   - shift-click range selection;
   - ticking a box doesn't open the side panel; clicking the rest of the row still does.
2. **Bulk action bar** (sticky at the bottom of the table, per U5): `n selected · Keep (override) · Remove · Clear selection`.
   - **Remove:** a confirmation listing the names, with a **mandatory reason** and the consequence ("removed from the participant list · Learning Champions notified").
   - **Keep (override):** for flagged nominees only, with a mandatory reason. Eligible rows in the selection are explained, not silently ignored.
   - **Every action:**
     - sets `resolutions` per employee;
     - writes an audit event per employee, with the reason;
     - updates the counts (conflict cases, eligible, final);
     - shows a toast.
   - **Undo** for about 10 seconds.
3. **Finalize participants:**
   - moves into the action bar;
   - is enabled only when every flagged nominee has a decision. Otherwise it shows "Decide on n flagged nominees first" plus **Show only undecided** (a U6 filter preset);
   - asks for confirmation: "Lock 32 participants? Scheduling will load this list (FR 95, 113)."
4. **Same page:**
   - "HR to keep or remove" changes red → amber (U5);
   - EID gets its own column;
   - "Details ↓" becomes a real action that opens an editable summary and nominations (FR 91, A10).
5. **Same multi-select pattern reused:**
   - Scheduling Participants Summary: bulk Remove (FR 114);
   - Attendance: superseded by U12.

**Store:** a `resolveMany(ids, decision, reason)` action and `finalize` guarded by the undecided count; reuse `resolve`.
**Files:** `pages/Hero.tsx`, `pages/Flow.tsx`, `store.ts`, `components/DataTable.tsx` (U6, adding selection support).

**Verify:**
- Filter to Conflict, select all, then Remove with a reason. The counts, audit and toast update, and Undo restores.
- Finalize stays disabled until all flagged nominees are decided.
- Ticking a box doesn't open the panel.
- Works at 1366.

**Status:** planned.

### U8 · HR → Finance hand-off goes straight to the Finance page
**Flow point:** journey step 9 → 10 ("Save & send budget to Finance" on `/hr/schedule`, Review and submit).
**Problem:** after HR sends the budget, the flow should lead straight to the Finance page, with no extra page in between. Today HR stays on Scheduling with a "Decision completed" note and must click "Continue: Approve budget".

**Approach:**
1. **On click:**
   - the button shows a loading state ("Sending to Finance…", about 1 s);
   - `publishSchedule` runs;
   - then `switchRole('finance', '/finance')` runs.
   - The Scheduling completion note is not shown for this step.
2. **Context carried to the Finance page:**
   - toast: "Budget sent to Finance. You are now viewing as Finance Approver";
   - an arrival line: "Received from Nusrat Jahan, HR Admin · BDT 14,40,000 · Training 20260182 · just now", plus **View what HR sent** (the impact side panel);
   - the normal GuidedStepNote for step 10.
3. **Way back:** the breadcrumb shows "From: Training Scheduling" as a link, and HR is one click away in the role switcher.
4. **Labelling:** the Finance step keeps its "Proposed workflow, based on FR 135" label (D2).
5. **No business-logic change:** the same state, Finance task and audit entry. Only the post-action navigation changes. "Do this step for me" behaves the same.
6. **U2:** this is a user-initiated switch, so no role-switch prompt.

**Files:**
- `pages/Flow.tsx` (Scheduling, Review and submit);
- `pages/Roles.tsx` (FinancePage arrival line);
- `components/Shell.tsx` (GuidedStepNote suppression for this transition, and the "Do this step for me" navigation).

**Verify:** from Scheduling Review, one click lands on `/finance` as Rezaul Karim, with the arrival line and the step 10 note, and no intermediate screen. Reset demo still works.
**Status:** planned.

**Extended (user decision, 15 Nov 2026): this applies to ALL role hand-offs.** Whenever responsibility passes to another person, the action goes straight to that person's page:
- a short "Sending to {role}…" state;
- `switchRole` to the new role's screen;
- a toast;
- an **arrival line** built from the last audit event (who sent what, when) with **View full impact**.

No intermediate "Decision completed" screen appears.

| From → to | Lands on |
|---|---|
| Division Head submits the request → HR | `/hr/requests/TR-2026-00418` |
| HR sends the nomination request → Learning Champion | `/nominate` |
| Learning Champion submits nominations → HR | `/hr/nomination-status` |
| HR sends the budget → Finance | `/finance` |
| Finance approves → HR | `/hr/schedule?tab=Notifications` |
| Finance returns the budget → HR | `/hr/schedule` (budget-returned alert) |
| HR sends invitations → Trainer | `/trainer` |
| Trainer responds → Employee (Ayesha) | `/employee` (e1) |
| Ayesha accepts → Tanvir | `/employee` (e2), a person change within the same role |
| Tanvir requests withdrawal → Supervisor | `/supervisor` |
| Supervisor proposes a replacement → HR | `/hr/approvals` |
| HR submits attendance → Employee | `/employee/feedback` (e1) |
| Employee submits feedback → HR | `/hr/planned` |
| HR closes the training → Employee | `/employee/record` (step 19), then `/learning/course` |
| Employee completes the course → Trainer | `/assessment` |
| Trainer decides the assessment → Employee | `/journey` |
| Employee completes the milestone → Management | `/executive` |

**Rules:**
- **Same-role next steps** (e.g. HR approves the replacement → HR attendance) keep the "Decision completed" note with a Continue button. Only a change of person triggers the jump.
- **Branches:**
  - HR rejecting a withdrawal goes to the employee;
  - a trainer decline goes to HR.
- **Reduced motion:** the transition delay is skipped.
- **One reusable piece of code:** a shared `handOff(nextRole, to, emp?)` helper that runs after each store action. Do not duplicate it in each page.
- **Shared component:** a new `components/ArrivalLine.tsx`, used at the top of every hand-off screen.

### U9 · Employee "My learning" page redesign
**Screen:** `/employee` → `EmployeePage` in `pages/Roles.tsx` · FR 1–6, 119, 185.
**Problem:** messy and congested. It needs a better design, a clear structure and bigger type.

**Causes:**
- **Demo control in the page:** the Ayesha / Tanvir / Sadia switch sits in the page header and is clipped.
- **No priority:** the one required action (the invitation) has the same weight as five other boxes.
- **Cramped invitation card:** an 18px title, a small meta row, and a wrapping beige details box.
- **Right column:** three small separate cards with 14px text, and the calendar badges are clipped.
- **Mandatory course** squeezed into a thin row.

**Approach:**
1. **Header:**
   - greeting in 36–40px, and the role and division at 17px;
   - the employee switch moves into the **Viewing this record as** switcher (Employee → Ayesha / Tanvir / Sadia);
   - a "Fictional demonstration data" tag.
2. **"Action needed" panel (full width): the invitation as the hero card.**
   - **Title** in 26–28px.
   - **A fact row:** Dates · Time · Venue · Trainers (17px).
   - **Two short lines:** "Why you were invited" and "Assigned by", plus the attendance requirement.
   - **Footer:** **Withdrawn Request** (secondary, left) · **Accept** (primary, right), the exact FR 119 labels.
   - **States:**
     - Invited → the two buttons;
     - Accepted → "You're attending" + Add to calendar / View material / Mark my attendance (on the day);
     - Withdrawal requested → a mini tracker (You → Supervisor → HR Admin);
     - Withdrawn → a confirmation;
     - Attended → Give feedback.
   - **Any invited employee can withdraw** (A12).
3. **"My learning" as one list:** consistent rows (icon · title · due · status · one action) for the mandatory course with progress, the upcoming exam and planned trainings.
4. **Side column, three sections:**
   - **My calendar (FR 2):** a month view with events and a list, no clipping;
   - **My record:** hours, programmes and certificates, plus "Open my record" and a **Request to add a training record** link (FR 6);
   - **Recommended next (FR 185):** "AI-suggested · approved by L&D".
5. **Type:** card titles 22–28px, values 17px, labels 15px, badges 14px; at most 3 main surfaces, separated by whitespace.
6. **Same layout for each employee:** Tanvir sees his withdrawal state; Sadia sees "Added as a replacement for Tanvir Hasan".

**Depends on:** U2 (switcher), U5 (button rules), A4, A12.
**Files:** `pages/Roles.tsx` (EmployeePage), `components/Shell.tsx` (employee sub-choice in Viewing as).

**Verify:**
- At 1366×768, the invitation and its actions are visible without scrolling.
- No clipped badges.
- Every state renders for e1 / e2 / e4.
- Accept and Withdrawn Request work for every invited employee.

**Status:** planned.

### U10 · Richer course preview and player (pulls part of FR 190–198 into this round)
**Screen:** `/learning/course` → `CoursePlayerV2` in `pages/Hero.tsx` · FR 190–198 (e-learning was deferred under D1; **the user asked for this, so it is in scope now**).
**Problem:** the course needs more preview.

**Causes:**
- **The video is a static placeholder:** the play button and progress do nothing.
- **Locked modules show nothing.** The scenario, checkpoint, feedback and certificate can't be seen.
- **No course overview** before the player.
- **Right panel clipped:** tabs ("AI As…"), resource names and the "resumes on any de…" line.

**Approach:**
1. **Course overview page** (FR 190–192, 198):
   - thumbnail, title, course code, version, due date, mandatory target (role / division), difficulty and duration;
   - learning objectives and the module outline (type + length);
   - rules: sequential, seek locked, pass mark 80%, expiry / refresher;
   - languages (EN / বাংলা subtitles), offline availability, and the certificate;
   - primary **Start course** / **Resume (65%)**.
2. **Every content type previewable** (simulated):
   - **Video:** play / pause with a moving progress bar, speed menu, captions EN / বাংলা, seek lock, resume position (FR 193, 195);
   - **PDF:** document viewer with pages, preview-only and a watermark;
   - **H5P:** a scenario interaction with feedback;
   - **Checkpoint:** 10 questions, pass 80% (FR 196);
   - **Feedback:** activity and course rating (FR 197);
   - **Certificate:** QR verify and download (FR 198).
3. **Locked modules:** a preview of their contents plus the unlock rule.
4. **Tracking panel:** watch %, time spent, last position, and a simulated xAPI statement log (FR 195).
5. **Layout:** the right panel fits at 1366 / 1440 / 1920 with no clipping.

**Labels:** content and tracking marked "Simulated"; course data marked fictional.
**Files:** `pages/Hero.tsx` (CoursePlayerV2) → split into `pages/course/Overview.tsx` and `pages/course/Player.tsx`; `store.ts` (course progress per module).

**Verify:**
- Overview → Start, then each content type plays or opens.
- Locked modules show a preview.
- Completion still issues the certificate and moves the guided journey (step 20).
- No clipping at the three widths.

**Status:** planned.

### U11 · No dead ends: every screen has a visible way forward
**Screen that triggered it:** `/learning/course` after completion (certificate). There's no button or navigation onward; the user had to use "Do this step for me" from the hidden ··· menu.

**Root causes (verified in code):**
1. **The note is hidden by a path bug.** `Shell.tsx` hides the GuidedStepNote with `NO_NOTE.some(p => path.startsWith(p))`. Because `NO_NOTE` contains `/learning` (the hub), **every `/learning/*` page, including the course, loses its "Your next action / Open this step" note**.
2. **The completed course is a dead end:** the certificate offers only Download / View.
3. **Shared course state across employees:** course progress is one global value, and the certificate is hard-coded to Ayesha. Viewing as **Tanvir** shows **Ayesha's** certificate, and Tanvir can complete Ayesha's step 20 while the story is at step 13.

**Approach:**
1. **Fix the path match:**
   - hub pages (`/learning`, `/people`, `/reports`, `/overview`, `/workflow`, `/platform`, `/coverage`, `/connected`) suppress the note only on an **exact** match;
   - sub-pages always show it.
2. **Course completion footer** (per U5):
   - primary **Continue: {next journey action}** when the next step belongs to this user, else **Back to My learning**;
   - secondary Download / View certificate.
3. **Finished-state sweep:** every terminal state gets a clear next action. Checklist:
   - feedback "Thank you" (`FeedbackPage`);
   - course certificate;
   - assessment after the trainer's decision;
   - bond saved;
   - record request submitted;
   - Finance approved (covered by U8);
   - the final executive view → "All 23 steps complete · Back to Home".
4. **Per-employee learning state:** course progress, completion and certificate are keyed by `employeeId` (the store changes shape → bump `DEMO_VERSION`). Tanvir sees his own course; the guided step 20 stays tied to Ayesha (e1).
5. **Early-step banner:** opening a page that belongs to a later journey step shows "This is Step n in the story; the training is now at Step m ({owner}: {action})" + **Go to current step**. The page still works standalone (G3).
6. **"Do this step for me":** stays in the ··· menu, and also shows as a quiet text button beside the red step button when **Presenter mode** is on.

**Files:**
- `components/Shell.tsx` (NO_NOTE match, presenter button, early-step banner);
- `pages/Hero.tsx` (CoursePlayerV2 completion; with U10 → `pages/course/*`);
- `pages/Employee.tsx` (FeedbackPage);
- `store.ts` (per-employee course state + `DEMO_VERSION` bump);
- the finished states listed above.

**Verify:**
- On every route, in every state, there's at least one visible forward action other than the ··· menu.
- As Tanvir, the course shows Tanvir's own progress and certificate.
- Ayesha's course completion still advances step 20.
- Run the end-to-end flow with the "Do this step for me" fallback unused.

**Status:** planned.

### U12 · Controlled attendance register (supersedes the attendance parts of A13 and U7.5)
**Screen:** `/hr/attendance` → `AttendanceV2` in `pages/Hero.tsx` · FR 137–143.
**Problem:** needs more controlled operation; HR must be able to select individuals.

**Causes:**
- **Two separately scrolling lists** (physical / online), so no single view of everyone.
- **4 tiny segmented buttons per row** with no visible selected state at the start.
- **Only "Mark All Present"** for group marking.
- **Dead buttons:** "Add Participant" and "Save Draft".
- **"Submit Attendance" is disabled** with no reason given.
- **Missing columns:** Employee ID and Division / Department (FR 137).
- **One register for a 2-day training.**
- **The dark Teams card is detached** from the rows it syncs.

**Approach:**
1. **One table:**
   - columns: tick box · **Employee ID** · Name · Designation · **Division / Department** · Mode (Physical / Online);
   - **Attendance Status**, showing the source: Self-marked / Teams / HR (FR 138);
   - **Mark Attendance**, one clear per-row status control that shows the chosen value (FR 139).
2. **Day tabs:** Day 1 · 18 Nov | Day 2 · 19 Nov. Attendance is stored per day.
3. **Selection:**
   - single, select-all (filter-aware) and shift-range;
   - bulk bar: `n selected · Mark Present · Absent · Late · Excused · Clear selection`.
4. **Mark All (FR 140):** fills the unmarked rows; any row can then be changed individually.
5. **U6 filters and sort:**
   - filters: mode, status (Unmarked / Present / Absent / Late / Excused), self-marked, division;
   - sort: name, EID, status.
6. **Progress line:** "Day 1: 28 of 32 marked · 26 present · 1 absent · 1 excused · **4 unmarked**". Clicking "4 unmarked" applies that filter.
7. **Every action works:**
   - **Add Participant (FR 141):** EID lookup with an auto-fill, then the person is added;
   - **Save Draft:** persists, with a "Draft saved hh:mm" note;
   - **Submit & Update Training Database** (exact FR 142 label):
     - disabled until everyone is marked for every day, showing the reason ("Mark 4 people to submit");
     - opens a confirmation summary per day;
     - then writes the learning records, hours and cost per employee.
8. **Teams sync inline (FR 143, simulated):**
   - "12 matched by Employee ID · 2 not on the list";
   - extra attendees → **Request Admin approval** → when approved, added and marked.
9. **Undo and audit:** about 10 s Undo per bulk action; an audit entry per bulk action ("HR marked 5 Present · Day 1").
10. **Button placement (U5):**
    - **Submit & Update Training Database** as the primary, in a sticky bottom bar, right;
    - Add Participant and Save Draft as secondary, to its left;
    - the header keeps only the title and the day tabs.

**Store:**
- `attendance` becomes `{ [day]: { [empId]: status } }`, with an attendance source per entry;
- `markMany(ids, status, day)`, `addParticipant(eid)`, `saveAttendanceDraft()`, `requestExtraAttendee()`;
- bump `DEMO_VERSION`.

**Files:** `pages/Hero.tsx` (AttendanceV2 → `pages/hr/Attendance.tsx`), `store.ts`, `components/DataTable.tsx` (U6 + selection).

**Verify:**
- Mark individuals and bulk-mark per day; filters, counts and Undo all work.
- Submit stays disabled with a reason until everything is complete, and on submit the learning record, Reports and the guided journey (step 16) update.
- Add Participant works.
- Fits at 1366.

**Status:** planned.

### U13 · Decision-driven assessment review with a result page (FR 210–214, pulled into this round)
**Screen:** `/assessment` as Trainer → `ExamV2` in `pages/Hero.tsx` · journey step 21.
**Problem:** the page needs to be decision-driven, with a result page. The user had to skip with "Do this step for me" because there was no button or navigation.

**Causes:**
- **Two decisions on two tabs.** Integrity (Clear / Flag) is on *Integrity Review*, but step 21 completes only when the AI score is accepted or adjusted on the *Evaluation* tab. Nothing guides the trainer there, and Clear doesn't advance.
- **No result or outcome page.**
- **Biased buttons:** **Flag** is the red primary (implying it's recommended), and **Add Note** does nothing.
- **Noise:** the Exam Setup and Candidate tabs during review.
- **A heavy dark decision panel.**

**Approach:**
1. **Guided flow:** ① Integrity → ② Score → ③ Result, with a stepper. Exam details and the candidate view sit behind a secondary link.
2. **Integrity:**
   - evidence summary and timeline kept;
   - neutral AI wording ("AI observed 9 events · AI does not decide");
   - choice cards with consequences: **Clear** (the score stands) / **Flag for review** (result withheld → assessment committee);
   - a note that is required for Flag and optional for Clear (replaces Add Note);
   - **Confirm integrity decision** → Score.
3. **Score (FR 213):**
   - the auto-marked part ("MCQ 18 / 20");
   - the descriptive answer with its rubric, plus the AI-suggested 7 / 10 with a rationale;
   - **Accept** / **Adjust**, with a new score and a required reason;
   - **Confirm score**.
4. **Result page:**
   - **Passed · 86% · Very Good** (grade settings, FR 214);
   - breakdown (auto / descriptive / integrity), decided by + time, and an AI-involvement disclosure ("AI suggested 7 · trainer accepted");
   - **what happens next:** certificate, manager dashboard, competency journey;
   - result release **Instant / Scheduled** (FR 214);
   - primary **Release result to candidate** → U8 hand-off to Ayesha's `/journey`, with the arrival line "Result released by Nafis Ahmed · Passed 86%".
   - **Flag path:** "Withheld · under integrity review" plus a simulated committee clearance, so it's never a dead end (U11).
5. **Visual:** a light decision panel (U3 template), U5 button rules, an audit entry per decision, and a visible forward action on every step.

**Store:**
- `assessment: { integrity: 'pending' | 'cleared' | 'flagged', note, score: { auto, descriptive, final, grade }, released }`;
- step 21 completes on **release**;
- bump `DEMO_VERSION`.

**Files:** `pages/Hero.tsx` (ExamV2 → `pages/assessment/Review.tsx`), `store.ts`, `lifecycle.ts` (TOUR[17] `done`, cta "Review assessment").

**Verify:**
- As Trainer: Clear → Score → Accept → Result → Release lands on Ayesha's journey, with no ··· menu needed.
- The Flag path works.
- Audit entries appear.
- Fits at 1366.

**Status:** planned.

### Stakeholder feedback batch (16 Nov 2026) → U14–U21
The user shared stakeholder feedback:
- you can't go back mid-flow;
- training accept and withdrawal are mixed up;
- there's no focus on attendance or assessment;
- organisational hierarchy isn't understood;
- management supervision is missing.

It also listed the five high-level modules (LMS, TMS, L&D management, Enterprise workflow, AI-assisted platform) and an example scenario:
- **HR:** identify employees → organise training → nominate → check conflicts → invite → attendance → assessment → feedback → update histories → management reports;
- **a manager sees:** who completed, who failed, who still needs training, and department progress;
- **the system keeps all records.**

The user also asked for:
- more day-to-day interaction (courses, attendance);
- a dashboard per role, mainly for the supervisor;
- better UI/UX following best practice and the design guide, with bigger type, no clutter and a well-connected journey.

### U14 · Going back to earlier steps
- **Revisit finished steps** from the Guided journey drawer, the Home journey path, and a "← Previous step" link in the step bar.
  - It opens that step's screen as its original role, in the completed state.
  - A banner reads "Viewing completed step n · Back to current step".
- **Browser Back** works.
- **Presenter rewind:** "Restart from step n" restores a snapshot of `FlowState` saved at each journey index. A confirmation lists the later steps that will be undone.

**Store:** `snapshots: Record<number, FlowState>`, written when each journey step completes; `rewindTo(n)`.
**Verify:** revisit every finished step and return; rewind to steps 3, 9 and 16, then redo them.

### U15 · Separate accept and withdrawal
- **Split journey step 13 into two:**
  - **13a** "Ayesha Rahman accepts the invitation" (TOUR[9]);
  - **13b** "Tanvir Hasan requests withdrawal" (TOUR[10]).
- **Person banner** ("You are Tanvir Hasan · Credit Analyst · reports to Mahmud Karim") plus the known reason ("Client meeting 18 Nov, flagged at nomination").
- **Labels:** the exact FR 119 labels, **Accept / Withdrawn Request**.
- **HR response table:** Accepted / Withdrawal requested / No response yet, with counts and U6 filters.

**Note:** the journey grows to 24 steps; update the docs and tests.

### U16 · Focus on attendance and assessment
- **Attendance:**
  - its own clear story moment with U12: per-day registers, sources (self / Teams / HR), per-participant outcome;
  - "who missed which day".
- **A post-training assessment linked to *this* training** (FR 217 exam tagging with a scheduled training, FR 247):
  - every attendee takes it;
  - the trainer reviews it (U13);
  - a **results table** shows passed / failed / absent and the score per participant.
- **Failures lead somewhere:** a re-attempt or refresher course is assigned, and it shows on the supervisor and management dashboards (U18).
- **The AML exam stays** as the standalone-exam example (FR 247).

**Store:** `assessmentResults: Record<empId, { score, status }>` (fictional, mostly pass with 2–3 failures); bump `DEMO_VERSION`.

### U17 · Organisational hierarchy
- **Org model** (fictional, standing in for HRIS) in a new `src/org.ts`: Bank → Division → Department / Unit → Supervisor → Employees, with grade and reporting line.
- **People** becomes an org explorer: a tree or chart with each person's role, supervisor and training status.
- **Scoped views:**
  - Employee → self;
  - Supervisor → direct reports;
  - Division Head → division;
  - HR and Management → the bank.
- **Approvals follow the reporting line** (the withdrawal goes to that employee's supervisor), and the line is shown on screen.
- **Identifying employees:** HR and the Division Head see the competency-gap list ("27 officers below target") from the org and competency data. Nominations start from it (FR 63, 88, 241–243).

### U18 · Role dashboards, supervisor first
- **Supervisor (FR 11–12, 206):**
  - direct reports: upcoming trainings, attendance, assessment results (pass / fail), mandatory compliance, overdue items, approvals waiting;
  - a team calendar, period and label filters, export (CSV);
  - it must answer: **who completed · who failed · who still needs training · department progress**.
- **The other roles, on the same dashboard template:**
  - Division Head: department / segment over time (FR 15);
  - HR: operations (FR 168);
  - Employee: trainee (FR 205);
  - Trainer: sessions and evaluation queue (FR 18);
  - Finance: budget pipeline (proposed);
  - Management: bank-wide (FR 208);
  - Admin: system health.
- **Every figure drills down** to the people behind it.

**Data:** U17 org + U16 results + attendance + course progress. No hard-coded totals (computed from records).

### U19 · The five high-level modules
- **IA follows the five modules:**
  - **LMS:** FR 190–220, 227–240;
  - **TMS:** FR 49–174;
  - **L&D management:** FR 186–189, 241–243;
  - **Enterprise workflow:** FR 1–21, 175–185, 244, 248–250;
  - **AI-assisted:** FR 185, 209, 213, 226, 245.
- **Applied to:** the menu and Learning hub, the Platform map, the Coverage domains (A1), and a module tag on each screen.

### U20 · Day-to-day operations
- **Training calendar (FR 43–44, 182):** several programmes (e.g. AML Refresher, Leadership Essentials, Customer Experience), each openable with its own attendance and status.
- **Course management:** enrolments, progress, overdue learners, and **Send reminder** (FR 200–201).
- **"Today" lists** for HR and Trainer: sessions to take attendance for, evaluations due, requests waiting.
- **Every interaction writes** to the records and the audit trail.

**Scope note:** this extends past the single guided record. The main story stays the guided path.

### U21 · UI/UX standard across the whole demo
- **Type scale:** body 17px · labels 15px · section headings 24px · page titles 36–40px.
- **Four page templates:** dashboard, list (U6), decision (U3), step form (U4). Every screen uses one.
- **Rules:**
  - U5 button rules;
  - fewer boxes and more whitespace;
  - one primary action per screen;
  - WCAG 2.1 AA (contrast, keyboard use, labels, visible focus).
- **Connected journey:** U2 navigation, U8 hand-offs, U11 no dead ends, U14 back.
- **Update `DESIGN_KNOWLEDGE.md`** to the new standard.

**Verify:**
- a screenshot review of every route at 1920 / 1440 / 1366;
- an axe accessibility check on the core routes.

### Suggested order when fixing everything together
| Phase | Items | Why first |
|---|---|---|
| 1 · Foundations | A1–A4, U21 (type scale, templates, components), U6 (DataTable), U5 rules, A2 | Everything else is built on these |
| 2 · Data model | U17 org hierarchy, per-employee learning state (U11.4), U16 results, U14 snapshots, A5 dead buttons | Dashboards and journeys need real records |
| 3 · Core journey | U2, U8, U11, U14, U15, U3, U4, U7, U9, U12, U13, A6–A14, G1–G4 | The guided story, end to end |
| 4 · Oversight | U18 role dashboards (supervisor first), U1 Home checkpoint | Uses the phase 2 data |
| 5 · Breadth | U20 day-to-day, U10 course preview, U19 module IA | Showcase features |
| 6 · Verify | Full end-to-end (no ··· fallback), routes, three resolutions, accessibility, docs (pitch script, design guide, coverage) | |

**Scope impact:** U16–U20 go well beyond D1 (core lifecycle) and D7 / D8. This is a large build. The user may want to trim or phase it when they say "fix all together".

---

## A · From my audit (core lifecycle, D1)

| # | Fix | FR | Audit § |
|---|---|---|---|
| A1 | Restore the Coverage page: read `annexure-ii/requirements.json`. Use 7 statuses (Demonstrated / Partial / Simulated / Conceptual / Bank-integration dependent / Proposed interpretation / Missing). Each row shows FR, category, sub-category, short text, screen, route, status, gap note, dependency and plan. Statuses are honest, per requirement. | all | 3.1, 3.2 |
| A2 | Swap Mode and Medium back throughout: `data.ts`, `store.ts`, `DivisionHead.tsx`, setup tabs and sample rows. | 26–27, 53–54, 73–74, 101–102 | 3.4 |
| A3 | Correct the wrong requirement numbers: Setup Mode / Medium tabs, Bonds "155–167" → 144–167, Training DB "144–174" → 169–174, Coverage 144–154 mapping. | — | 3.3 |
| A4 | Labels: "Fictional demonstration data" on the record, people and values; "Proposed workflow" on Finance, Management, the Executive Center, Return for Information and the request Review step; "Demonstration concept" on the Command Center, guided journey and Connected Bank. | — | 3.5 |
| A5 | Make all 26 dead buttons work, plus the 7 controls that only look clickable (Remove ×3, Details ↓, View and Edit ↓, report filters). | various | 4 |
| A6 | Actions must change state, audit and tasks: Forward / Return, Reschedule / Postpone / Delete, Library request (or label it a concept). | 66, 136, 238 | 3.6 |
| A7 | **Training Request:** Save & Exit; participant search by EID or name and CSV bulk upload; trainer search, Add More, Remove; repeat-schedule control; content upload; all 27 tags. | 49–64 | 2 |
| A8 | **Request Received:** "Schedule Training" opens Scheduling with Load Training Profile = No, tagged to the request. Forward assigns to an HR Admin, with a task and an audit entry. Fix the From / To date columns. | 65–66, 96 | 2 |
| A9 | *(Layout superseded by U4; the behaviour stays here.)* **Nomination Request Setup:** Program / Trainer / Nomination tabs with Save & Next / Skip & Next / Previous; title search; venue dropdown and clash check; trainer Add / Remove; deadline date and time picker; editable email template with the nominate link. | 67–87 | 2 |
| A10 | **Nomination Status:** "Details" as a real action, with editable training summary and nominations. | 89–91 | 2 |
| A11 | **Scheduling:** the Load Training Profile Yes / No control and both paths; Save & Next / Save List & Next / Next / Save / Save & Exit with the exact labels; trainer and participant Add / Remove / search / bulk; Send Nomination to Organizer Now; Set Reminder Mail date pickers; Save & Send Invitation to Trainer(s) Now; Send Training Invitation Now; extra recipients. | 92–131 | 2 |
| A12 | **Withdrawal:** any invited employee can use Accept / Withdrawn Request. The supervisor sees a summary list of all active requests. Exact labels: Approve Withdrawal / Approve Withdrawal with Replacement / Reject. Replacement is searched from the employee directory, with conflict, leave, resignation and retirement alerts. Show inclusion and exclusion mail previews. | 1, 9–10, 119 | 2 |
| A13 | *(Attendance parts superseded by U12.)* **Planned training and attendance:** View and Edit as an action; mandatory FR 135 fields (000 allowed) with a working uploader; Employee ID, Designation and Division columns; tick-box Mark Attendance with Mark All and unchecking; Add Participant by EID; the button labelled "Submit & Update Training Database"; extra-attendee request to the admin. | 132–143 | 2 |
| A14 | **Bonds:** EID lookup with auto-filled fields (grade, designation, division, location, title metadata, institute, duration); man-hour; calculated end date and remaining liability; edit; Legal-page print view; Input in Training Database & Exit and Save & Exit; a saved bond adds a training database row. | 144–167, 171 | 2 |
| A15 | Remove or quarantine dead code, especially `SupervisorApprovals`, which skips the mandatory reason. | 119 | 3.7 |

---

## G · From the gap analysis (in scope under D1)
Most of G §7–§14 is already covered by A7–A14. These G items are extra:

| # | Fix | G § |
|---|---|---|
| G1 | Rename the first stage "Training Needs Assessment / Divisional Requirement" and tag it FR 186 / 15 (D5). | 4.1 |
| G2 | Explain both scheduling paths to the presenter: a note on Request Received and the Scheduling Program tab (D6). | 4.5 |
| G3 | Show that the main journey is an *example* business flow, and that modules also work on their own. One line on Home and the Platform page. | 4.4 |
| G4 | Label Management as a proposed role, based on the reporting requirements. | 4.3 |

**Deferred under D1 (later round):** G §5 role gaps outside the core (FR 2, 5, 11, 12, 15, 18, 21), G §6 setup masters (FR 22–48), G §15 database / reports / TNA (168–189), and G §16–§21 (learning modules, integrations, mobile). *The user can pull any of these into this round.*
