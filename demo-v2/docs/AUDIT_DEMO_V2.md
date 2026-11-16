# demo-v2 Audit against Annexure-II

**Date:** 15 Nov 2026
**Method:** I read every routed screen in `src/` and compared it with the client workbook (`docs/annexure-ii/`), not with the demo's own Coverage page. I also ran an automated scan of every button for a click handler.
**Status labels:** the same as the gap analysis (Covered · Partial · Concept · Simulated · Missing · Added). "Partial" names exactly what is missing.

No code was changed during this audit.

---

## 1. Headline

| | Result |
|---|---|
| The story (need → request → … → insight) | Works end to end, with the correct order of nomination before scheduling |
| Requirements fully demonstrated as the workbook describes | About 25 of 250 |
| Partially demonstrated (the screen exists, but required fields or actions are missing or fixed) | About 95 |
| Concept, simulated or preview only | About 95 |
| Missing (no screen or behaviour) | About 30 |
| Not a screen (blank row 20, "Others" 7, governance 248–250) | 5 |
| **Buttons that do nothing on live screens** | **26** (§4) |
| **Wrong requirement numbers on screens** | **5** (§3.3) |
| **Coverage page** | **Broken: shows 0 requirements** (§3.1) |

The counts are approximate, from grouping requirement by requirement. The detailed tables follow.

---

## 2. Requirement-by-requirement findings

### Roles (FR 1–21)

| FR | Requirement | Status | What exists / what is missing |
|---|---|---|---|
| 1 | Employee requests withdrawal | Partial | Works with a mandatory reason, **but only Tanvir (e2) can withdraw**. Ayesha and Sadia have no withdraw option. |
| 2 | Personal training calendar | Partial | A fixed list of 3 rows on `/employee`. No month view and no filter. |
| 3 | Mark attendance | Covered | "Mark my attendance". HR sees "self-marked 09:24". |
| 4 | Feedback | Covered | Four star ratings and a comment. |
| 5 | Own record for a time frame | Partial | `/employee/record` shows the journey and records, but **no time-frame filter**. |
| 6 | Request to add a personal record | Covered | Submit → HR approves or rejects → row in the training database. The form values are fixed (CFA Level I). |
| 7 | Others | — | Undefined in the source. |
| 9 | Supervisor approves withdrawal | Covered | `/supervisor`, with a mandatory reason. |
| 10 | Add replacement with conflict alerts | Partial | **Only one fixed candidate (Sadia). No search.** The five checks animate but are scripted. |
| 11 | Team records: individual, multiple or all, for a time frame | Partial | `/supervisor/team` is a fixed table of 3 rows. No selection, no time filter. |
| 12 | Label-based reports by period | Missing | There is no supervisor report. The general Reports page has filter chips that don't work. |
| 14 | Division Head submits the request | Covered | See FR 49–64. |
| 15 | Division dashboard by department or segment, for a time frame | Partial | Fixed figures and completion by department. No time-frame control. |
| 17 | Trainer accepts or rejects with a reason | Covered | Declining requires a reason. HR reassigns. |
| 18 | Trainer calendar / to-do | Partial | A fixed list of 4 rows. |
| 19 | Trainer uploads material and HR links it | Covered | One fixed file. HR links it and chooses a protection option. |
| 20 | (blank row) | — | |
| 21 | Admin: all access and option management | Concept | `/admin/security` is a fixed table of roles. No user or role management. |

### Setup Options (FR 22–48)

| FR | Status | Finding |
|---|---|---|
| 22–27 | Partial | The values are shown as chips. **"+ Add more" does nothing.** There's no edit or archive, and no short tag (24). **The "Mode" tab lists Classroom / Webinar / e-Learning and is tagged FR 26, but FR 26 is Training Medium.** The Mode and Medium tabs are swapped. |
| 28–30, 31–33, 38–40 | Partial | The duplicate-check search works (it warns about similar titles, venues or vendors), **but "Add" never adds anything**. Competency per title (30) isn't shown. |
| 34, 41 | Missing | The document uploaders are text only. |
| 35–37 | Partial | Fixed trainer table. "Add trainer" and "Bulk upload" do nothing. There's no EID lookup. |
| 42 | Missing | No vendor email template. |
| 43–44 | Partial | Monthly counts only. No admin upload of the approved yearly calendar. |
| 45–46 | Partial | A fixed list of 4 questions with types. "+ Add New Question" does nothing. |
| 47–48 | Partial | One fixed row. "Bulk upload template" does nothing. |
| **All** | — | **The setup lists don't feed later screens.** The forms read hard-coded constants, so a change in Setup changes nothing elsewhere. |

### Training Request (FR 49–64) · `/request/new`

| FR | Status | Finding |
|---|---|---|
| 49 | Covered | Request ID shown, "fixed when saved". |
| 50 | Covered | Title, with a duplicate hint. |
| 51 | Partial | Date and time is free text. There's a man-hour field, but **no repeat-schedule control**. |
| 52 | Covered | Suggested venue as free text. |
| 53–54 | Partial | Dropdowns exist, **but Mode and Medium are swapped**. |
| 55 | Partial | Multi-select tags, but only 18 of the 27 are shown. |
| 56 | Missing | "Upload content" is a fixed filename, not a control. |
| 57, 62 | Covered | Previous / Save & Next / Skip & Next. |
| 58–61 | Partial | Trainer rows are free-text inputs. **No name or EID search. "+ Add more" does nothing.** |
| 63 | Partial | Only a participant **count**. **"Add by EID / name" and "Bulk upload" do nothing.** |
| 64 | Missing | **There is no "Save & Exit".** The demo has a Review step and "Submit to HR" instead (Added). |
| — | Added | The "Business justification" field and the Review step aren't in the source. |

### Training Request Received (FR 65–66) · `/hr/requests`, `/hr/requests/:id`

| FR | Status | Finding |
|---|---|---|
| 65 | Partial | The columns are right, but **"From Date" and "To Date" show the same date-range text**. |
| 66 | Partial | **"Schedule Training" opens the request review page, not Training Scheduling. The direct path (Load Training Profile = No) doesn't exist.** "Forward" in the table does nothing. Forward on the review page opens a selector, but confirming changes nothing: no status change, no task, no audit entry. |
| — | Added | "Return for Information" also changes nothing, and it isn't in the source. "Create Nomination Request" is the only route that moves things forward. |

### Nomination Request Setup (FR 67–87) · `/hr/nomination-request`

| FR | Status | Finding |
|---|---|---|
| 67 | Covered | ID shown. |
| 68–77 | Partial | **Everything is read-only on one page.** There are no Program / Trainer / Nomination tabs, no title search (68), and no venue dropdown or clash check (70–71 just say "✓ no clash"). |
| 78, 84 | Missing | No Save & Next / Skip & Next / Previous. |
| 79–83 | Partial | Trainer rows are fixed. **"Remove" is plain grey text.** No Add More, no search. |
| 85 | Covered | Deadline field. It's free text, not a date and time picker. |
| 86 | Simulated | The send works and HR gets an alert saying it was sent to the divisions. |
| 87 | Partial | The template is shown but **can't be edited**. The link isn't clickable. |
| — | Added | The message, supporting documents and Learning Champion names. These are reasonable, but not in FR 67–87. |

### Nomination Process and Status (FR 88–91)

| FR | Status | Finding |
|---|---|---|
| 88 | Covered (simulated) | The Learning Champion board: select and submit. The redirect is simulated, and the deadline isn't enforced. |
| 89–90 | Covered | The status list and its columns. |
| 91 | Partial | **"Details ↓" is plain text, not a button.** HR can't edit the training summary or the nominations. HR can only keep or remove flagged nominees. |

### Training Scheduling (FR 92–131) · `/hr/schedule`

| FR | Status | Finding |
|---|---|---|
| 92 | Covered | Training ID shown, fixed on save. |
| 93–95 | Partial | **"Load Training Profile: Yes" is a fixed green banner.** There's no Yes / No control and no profile choice. |
| 96–105 | Partial | All read-only. **The "No" (manual) path doesn't exist.** |
| 98–99 | Covered | Venue dropdown and calendar clash, with a suggested free room. It's an inline alert, not a pop-up. |
| 106, 112, 115, 121 | Missing | The tab buttons the workbook names ("Save & Next", "Save List & Next", "Next") are replaced by a generic "Next: …". |
| 107–111 | Partial | Fixed trainer table. "Remove" is plain text and **"+ Add more" does nothing**. No search. |
| 113 | Partial | Nominations load into the list. **"Add by EID" and "Bulk upload" do nothing.** |
| 114 | Partial | Participants summary with an "i" marker. **"Remove" is plain text.** |
| 116 | Partial | Text only. **There's no "Send Nomination to Organizer Now" action.** |
| 117–118 | Partial | Reminder dates are fixed text, with no date picker. Supervisor CC and the PDF list are described. **One "Send invitations now" button does trainer, participant and organizer together.** Extra recipients can't be added. |
| 120 | Simulated | Email, Outlook, SMS and WhatsApp chips, labelled "simulated". |
| 122–124 | Covered | Yes / No and the template picker. |
| 125 | Missing | No "Save". |
| 126–129 | Covered | Training Bond → pop-up → Save in Training Bond Database & Print. |
| 130 | Partial | Says it prints on a Legal page, but no print view is shown. |
| 131 | Missing | No "Save & Exit". |
| — | Added | The "Review and submit" step and "Save & send budget to Finance" (proposed Finance workflow). |

### Invitation Withdrawal Process (FR 119)

| Element | Status | Finding |
|---|---|---|
| Accept / Withdrawn Request | Partial | It works, but the labels say "Accept invitation" / "Request withdrawal". Only Tanvir can withdraw. |
| Mandatory reason (employee) | Covered | |
| Supervisor summary of **all** active requests | Partial | The screen shows a single request, not a summary list. |
| Approve Withdrawal / Approve Withdrawal with Replacement / Reject | Partial | All three work, with a mandatory reason, but the labels differ ("Approve withdrawal", "Approve with replacement"). |
| Add Replacement with conflict, leave, resignation or retirement alerts | Partial | Fixed candidate. Scripted checks. |
| HR approves or rejects | Covered | `/hr/approvals`. |
| Inclusion / exclusion mail with supervisor CC | Simulated | Described in text. No mail preview. |

### Planned Training and Attendance (FR 132–143)

| FR | Status | Finding |
|---|---|---|
| 132 | Covered | Summary list. |
| 133 | Partial | **"View and Edit ↓" is plain text.** The details always show below. |
| 134 | Covered | Training Details tab. |
| 135 | Covered (gap analysis said missing) | Approval no., Budget approved, Payment no. and Actual expense are there. **But they aren't mandatory and "000" isn't checked. "Upload" is plain text.** |
| 136 | Partial | The Reschedule / Postpone / Delete pop-ups show the email, **but confirming changes nothing: no state change, no audit entry. "Save" does nothing.** |
| 137 | Partial | The attendance list shows name and designation. **There are no Employee ID or Division / Department columns.** |
| 138 | Covered | Self-marked status. |
| 139–140 | Partial | A Present / Absent / Late / Excused control and "Mark All Present", instead of the tick-box "Mark Attendance" column with "Mark All" and unchecking. The behaviour is equivalent, but the form isn't the source's. |
| 141 | Missing | **"Add Participant" does nothing.** "Save Draft" does nothing too. |
| 142 | Covered | The database update, investment and cost per employee are calculated. **The button is labelled "Submit Attendance", not "Submit & Update Training Database".** |
| 143 | Partial | Teams sync is simulated. **There's no extra-attendee request to the admin.** |

### Undertaking / Bonds (FR 144–167) · `/hr/bonds`

| FR | Status | Finding |
|---|---|---|
| 144–153 | Partial | **The employee is fixed (Ayesha), with no EID input.** Grade, location, title dropdown, category / mode / medium / tags, institute and duration aren't shown. |
| 154 | Missing | No man-hour field. |
| 155–158, 160–161 | Covered | The six fields HR fills in. |
| 159 | Partial | The end date is fixed text, not calculated. |
| 162 | Partial | No print view. |
| 163 | Missing | No "Input in Training Database & Exit" or "Save & Exit". |
| 164 | Covered | Bond database summary. |
| 165 | Missing | Records can't be edited. |
| 166 | Partial | "Remaining liability" values are fixed, not calculated. |
| 167 | Covered | A bond saved during scheduling appears here. |
| — | Wrong FR tag | The page says **"FR 155–167"**. It should say 144–167 (bond setup and database). |

### Database, reports, TNA (FR 168–189)

| FR | Status | Finding |
|---|---|---|
| 168 | Concept | The Executive Center stands in for the L&D summary dashboard. There are no reporting-criteria controls. |
| 169, 173–174 | Missing | **"Migration uploader", "Bulk entry template" and "Single entry" do nothing.** There's no external trainee database. |
| 170 | Covered | Attendance adds rows automatically. |
| 171 | Missing | A saved bond doesn't add a row to the training database. |
| 172 | Partial | The employee request path works. There's no admin single or bulk entry. |
| — | Wrong FR tag | The training database page says **"FR 144–174"**. It should be 169–174. |
| 175–183 | Partial | Ten report types are listed, but only 4 show data. **The filter chips can't be clicked. Excel and PDF do nothing.** |
| 184 | Simulated | A fixed schedule table. |
| 185 | Concept | One AI recommendation card on the employee page. |
| 186–189 | Concept | Fixed TNA cards. No submission flow and no IDP submission. |

### Learning modules (FR 190–243) · deferred to a later round, by your decision

| FR | Status | Finding |
|---|---|---|
| 190–197 | Partial / Concept | The course player has sequential modules, a checkpoint and a certificate, with subtitle and offline text. **There's no course authoring or configuration.** |
| 198 | Covered | Certificate with QR. |
| 199–204 | Concept / Missing | No path builder, enrolment, notifications, versioning, search or deep links. |
| 205–209 | Partial / Concept | The development journey and executive screens exist. AI risk is a concept. |
| 210–220 | Partial | Exam setup values are read-only. Candidate view, integrity review with a human decision, and AI-assisted essay marking (accept or adjust) all work. **No question bank management and no plagiarism check.** |
| 221–226 | Partial | Training feedback form and AI themes. No builder, distribution or analysis. |
| 227–229 | Concept | Search and folder filter work. **"Open" does nothing.** No upload, permissions or sharing. |
| 230–240 | Partial | Available books can be requested, but the request only changes local state, with no HR approval. **No book entry, assignment or reports.** |
| 241–243 | Partial / Concept | Capability profile and journey milestones. No framework setup. |

### Platform (FR 244–250)

| FR | Status | Finding |
|---|---|---|
| 244 | Simulated | Integrations page and Connected Bank, labelled simulated. |
| 245 | Concept | AI Assistant tab in the course player. |
| 246 | Concept | Mobile preview. **"Accept" and "Request Withdrawal" in the phone do nothing.** |
| 247 | Concept | Platform map only. Standalone versus linked exam and feedback isn't demonstrated. |
| 248–250 | — | Governance. Not a screen. |

---

## 3. Problems across the whole demo

### 3.1 The Coverage page is broken (my regression)
`pages/Admin.tsx` imports `docs/req-functional.md?raw` and reads lines like `1. …`. I replaced that file with a pointer note in the previous round, so **`/coverage` now lists 0 requirements**.
**Fix:** read `docs/annexure-ii/requirements.json` instead.

### 3.2 The Coverage page overclaims, even when it worked
- **Whole ranges are marked "Demonstrated":** 49–64, 65–66, 67–87, 92–118, 132–143, 190–204 and 210–220. Many rows in them have do-nothing controls or are missing (§2).
- **Wrong mapping:** 144–154 are labelled "Training Database fields", but in the workbook they are New Training Bond Setup fields.
- **It has no "Partial" or "Missing" status at all.** Its five statuses are Demonstrated / Simulated / Integration dependent / Clarification required / Not applicable.

### 3.3 Wrong requirement numbers on screens
1. Setup "Mode" tab → FR 26, and "Medium" tab → FR 27. The values and numbers are both swapped.
2. Bonds page → "FR 155–167". It should be 144–167.
3. Training database page → "FR 144–174". It should be 169–174.
4. Coverage map 144–154 → "Training Database fields". It should be "New Training Bond Setup".
5. The Request Received button "Schedule Training" carries FR 66's meaning, but it opens the review page.

### 3.4 Mode and Medium are swapped throughout
- **Setup lists:** `data.ts` `MASTERS.modes` and `mediums`.
- **Sample record:** `TRAINING.mode` ('Classroom + Webinar') and `TRAINING.medium` ('In-house + External-local').
- **Draft defaults:** `store.ts`.
- **Request form:** the labels in `DivisionHead.tsx`.
- **Screens that show them:** the "Category · Mode · Medium" column in the training database, and the Mode / Medium fields on the nomination, scheduling and planned training screens.

### 3.5 Nothing is labelled as proposed or fictional
- No screen says "Fictional demonstration data" or "Proposed workflow" (searched; zero hits).
- **Unlabelled additions:**
  - **Proposed steps and options:** Finance approval, Return for Information, the request Review step and the Business-need step.
  - **Proposed roles:** the Management role and the Executive Center.
  - **Demonstration concepts:** the Command Center, guided journey and Connected Bank.
- "Simulated" is used correctly for integrations (24 places).

### 3.6 Actions that look finished but change nothing
These have click handlers, so the scan doesn't catch them, but they don't change the training record, task or audit trail:
- **Forward / Return** on the request review.
- **Reschedule / Postpone / Delete** confirm buttons.
- **Library "Request Book"** (local state only).

### 3.7 Dead code
These components aren't used by any route: `EmployeeDashboard`, `LearningHistory`, `SupervisorApprovals`, `TrainerDashboard` (`Employee.tsx`); `CoursePlayer`, `ExamPage`, `Competencies` (`Learning.tsx`); older views in `Home.tsx`.
- `SupervisorApprovals` lets the supervisor approve or reject **without a reason**, which would break FR 119 if it were ever routed again.

---

## 4. Buttons that do nothing on live screens (26)

| Screen | Buttons |
|---|---|
| Setup masters `/hr/setup` | Add (duplicate check), + Add more, Bulk upload, Add trainer, + Add New Question, Bulk upload template |
| Reports `/reports` | Excel, PDF |
| Training request `/request/new` | + Add more (trainer), Add by EID / name, Bulk upload |
| Request inbox `/hr/requests` | Forward |
| Scheduling `/hr/schedule` | + Add more (trainer), Add by EID, Bulk upload |
| Planned training `/hr/planned` | Save |
| Training database `/hr/training-db` | Migration uploader, Bulk entry template, Single entry |
| Attendance `/hr/attendance` | Add Participant, Save Draft |
| Course player `/learning/course` | Download |
| Assessment `/assessment` | Add Note |
| Knowledge Corner `/knowledge` | Open |
| Mobile `/mobile` | Accept, Request Withdrawal |

There are also controls styled to look clickable that aren't buttons at all: "Remove" (×3 screens), "Details ↓", "View and Edit ↓", and the report filter chips ("FY2026 ▾" …).

---

## 5. Where I disagree with the gap analysis

| Gap analysis says | I found |
|---|---|
| FR 135 fields missing (§13) | **Present:** Approval no., Budget approved, Payment no. and Actual expense. They aren't validated, and the uploader doesn't work. |
| Reschedule / Delete / Postpone missing (§13) | **Present.** The email pop-up shows, but confirming changes nothing. |
| PDU field not clearly shown (§9) | **Shown** (read-only) on nomination setup and scheduling. |
| Topic / session duration conceptual (§7, §11) | **Present as fields** on the request (free text) and in the scheduling table. "Add more" and "Remove" don't work. |
| Feedback Yes / No and template loading missing (§11) | **Present and working** (FR 122–124). Only "Save" is missing. |
| Load Training Profile not implemented (§11) | **Shown, but stuck on "Yes"**. There's no No path. |
| The gap analysis doesn't mention it | **The Coverage page is currently broken**, and 5 requirement numbers on screens are wrong. |
| The gap analysis doesn't mention it | **26 buttons do nothing**. FR 1 withdrawal is limited to one employee. FR 66 "Schedule Training" goes to the wrong screen. |

---

## 6. Suggested fix order (matches your decisions: core lifecycle first, exact labels, Finance kept as proposed)

1. **Restore the Coverage page:** read it from `requirements.json`, and use the 7 statuses with honest, per-requirement values.
2. **Fix Mode and Medium**, and correct the 5 wrong requirement numbers.
3. **Add labels:** "Fictional demonstration data" for the record, people and values, and "Proposed workflow" for the Finance step, Management, Return for Information and the Review step.
4. **Make every one of the 26 dead buttons and the 7 clickable-looking controls work** in the core lifecycle screens.
5. **Fill in the core gaps:**
   - **Request (49–64):** Save & Exit, participant search and bulk upload, trainer search.
   - **Request Received (65–66):** working Forward, and "Schedule Training" opening Scheduling.
   - **Nomination setup (67–87):** tabs, editable template, trainer Add / Remove.
   - **Nomination status (89–91):** Details editing.
   - **Scheduling (92–131):** the Load Training Profile Yes / No control and both paths, trainer and participant Add / Remove, organizer, trainer and participant sends, Save, Save & Exit.
   - **Withdrawal (119):** any invited employee can withdraw, the supervisor sees a list, replacement search.
   - **Planned training and attendance (132–143):** Employee ID and Division columns, Add Participant, extra-attendee request, actions that change state.
   - **Bonds (144–167):** EID lookup with auto-filled fields, man-hour, calculated end date and remaining liability, edit, print view, Save & Exit, and a database row.
6. **Use the workbook's exact labels throughout steps 4–5.**
