# City Bank ELDP — Requirements Knowledge (Annexure-II)

**Read this before changing any demo-v2 screen.**

**Core source:** [`annexure-ii/Annexure-II_Functional Requirement_LMS.xlsx`](annexure-ii/) is the client's workbook, copied unchanged from *Blank Documents from City Bank*. If anything here disagrees with it, the workbook wins.

- **[`annexure-ii/ANNEXURE_II_SOURCE.md`](annexure-ii/ANNEXURE_II_SOURCE.md):** all 250 requirements, with exact wording, in workbook order.
- **[`annexure-ii/requirements.json`](annexure-ii/requirements.json):** the same 250 requirements, machine-readable (`no`, `category`, `sub`, `subsub`, `text`).
- **This file:** how the requirements fit together. It covers the role hierarchy, the operational flow, what each screen must contain, and the places where demo-v2 differs from the source.

**Rules for the demo**
1. Every screen traces to requirement numbers (the `Fr` tags).
2. Use the workbook's own field and button labels where it names them, such as "Save & Next", "Skip & Next", "Approve Withdrawal with Replacement" and "Submit & Update Training Database".
3. Don't present anything as a client requirement unless the workbook says it. Mark our additions as proposals (see §8).

---

## 1. Hierarchy (workbook structure)

The workbook has one sheet with 250 rows, numbered 1–250 with no gaps. Columns are No, Category, Sub-category, Sub-category, Requirement, and Compliance / Remarks (left blank for the bidder).

| Category | Sub-category → second-level sub-category | FR |
|---|---|---|
| **Roles** | Employee 1–7 · Supervisor 8–12 · Division Head / Learning Champion 13–15 · Trainer 16–19 · HR Admin (ADMIN (HR)) 20 *(blank row)* · Admin 21 | 1–21 |
| **Setup Options** | Competency 22 · Training Tags/Labels 23–24 · Training Category 25 · **Training Medium 26** · **Mode of Training 27** · Training Title 28–30 · Training Venue 31–34 · Trainer 35–37 · Vendor 38–42 · Training Calendar 43–44 · Feedback Setup 45–46 · External Trainee / Participant 47–48 | 22–48 |
| **Training Management System** | Training Request → Program Tab 49–57, Trainer Tab 58–62, Nominations Tab 63–64 | 49–64 |
| | Training Request Received (ADMIN (HR) Module) | 65–66 |
| | Training Nomination Request Setup → Program Tab 67–78, Trainer Tab 79–84, Nomination Tab 85–87 | 67–87 |
| | *(no sub-category)* Nomination Process | 88 |
| | Training Nomination Received | 89–91 |
| | Training Scheduling → Program Tab 92–106, Trainer Tab 107–112, Participants Tab 113–115, Notification Tab 116–118, ***119 (no sub-category)***, Notification Tab 120–121, Feedback Tab 122–125, Undertaking to Training Tab 126–131 | 92–131 |
| | Planned Training Module and Attendance Management | 132–143 |
| | Undertaking to Training → New Training Bond Setup 144–163, Training Bond Database 164–167 | 144–167 |
| | Summary of the Planned / Executed Training 168 · Add Records to Training Database 169–172 · Training Database for External Trainees 173–174 · Training Reports 175–185 · Training Needs Assessment 186–189 | 168–189 |
| **e-Learning Module** | Course Creation 190–197 · Course Administration 198–204 · Dashboards 205–209 | 190–209 |
| **Assessment / Exam Module** | — | 210–220 |
| **Feedback / Survey Module** | — | 221–226 |
| **Knowledge Corner (Virtual)** | — | 227–229 |
| **Library Management (Physical books)** | Book Entry 230–232 · Assign Book 233–238 · Reports 239–240 | 230–240 |
| **Competency & Learning Journey Management Module** | — | 241–243 |
| **Integration & API** | — | 244–246 |
| **Intra-Module Integration** | — | 247 |
| **Security & Governance** | — | 248–250 |

---

## 2. Roles and inheritance

```
Employee (1–7)
  └─ Supervisor = Employee + (9–12)
       ├─ Division Head / Learning Champion = Employee + Supervisor + (14–15)
       └─ Trainer = Employee + Supervisor + (17–19)
HR Admin — ADMIN (HR) (20: blank; duties come from the Training Management System rows)
Admin (21: all access and option management; also uploads the training calendar 43 and runs data migration 169, 173)
```

| Role | Own rows | Key actions |
|---|---|---|
| Employee | 1–7 | Request withdrawal from own training (1), personal training calendar (2), mark attendance (3), give feedback (4), view own record for a time frame (5), request to add a personal training record (6, 172) |
| Supervisor | 8–12 | Approve an employee's withdrawal (9), add a replacement and get alerts on nominees' calendar conflict, leave, resignation or retirement (10), team records (11), label-based reports (12) |
| Division Head / Learning Champion | 13–15 | Submit a training request to ADMIN (HR) (14), division dashboard by department or segment for a time frame (15), nominate employees (88), approve withdrawals "as per Supervisor or Division Head / Learning Champion role" (119) |
| Trainer | 16–19 | Accept or reject facilitation **with a reason** (17), own trainer calendar or to-do list (18), upload materials and ask HR to link them (19) |
| ADMIN (HR) | 20 + TMS | Receives requests (65–66), sets up nomination requests (67–87), reviews nomination status (89–91), schedules (92–131), runs planned training and attendance (132–143), bonds (144–167), approves withdrawals and replacements (119), approves record requests (172) and library requests (238) |
| Admin | 21 | Access and option management, the approved calendar upload (43), migration uploaders (169, 173), bulk entry (172, 174), feedback templates (46) |

**There is no Finance role in the workbook.** Budget appears only as fields HR fills in on planned training: "Approval no.", "Budget approved", "Payment no.", "Actual expense" (135).

---

## 3. Operational flow (Training Management System)

```
Divisional training need .............................. TNA 186 (submission of divisional training requirement)
  ↓
Training Request — Division Head / Learning Champion .. 14, 49–64
  ↓
Training Request Received — ADMIN (HR) ................ 65–66   [Schedule Training] or [Forward → assign to an HR Admin]
  ↓                         ↘ (direct path) Schedule Training → Training Scheduling, Load Training Profile = No, tagged to the request (96)
Training Nomination Request Setup — ADMIN (HR) ........ 67–87   (email to division / function heads and Learning Champions with a nominate link, 86–87)
  ↓
Nomination Process — Division / function heads, LCs .. 88      (link → own dashboard → nomination window → nominations within the deadline go to the scheduling participant list)
  ↓
Training Nomination Received / Status — ADMIN (HR) .... 89–91   (summary list → "Details" → edit summary and nominations)
  ↓
Training Scheduling — ADMIN (HR) ...................... 92–131  Program (Load Training Profile = Yes → nominations loaded 93–95) → Trainer → Participants → Notification → Feedback → Undertaking
  ↓
Invitations ........................................... 116–118, 120  organizer, trainer and participant mail; reminders; SMS / WhatsApp
  ↓                                                       trainer accepts or rejects with a reason (17)
Training Invitation Withdrawal Process ................ 119     employee Accept / Withdrawn Request (reason) → supervisor Approve Withdrawal (reason) / Approve Withdrawal with Replacement / Reject → ADMIN (HR) approves or rejects → inclusion / exclusion mail, supervisor CC
  ↓
Planned Training & Attendance — ADMIN (HR) ............ 132–143 details, budget and expense fields, reschedule / postpone / delete, attendance (self-marked, Mark All, Teams / Zoom auto) → Submit & Update Training Database
  ↓
Training Database, Bond, Reports, Feedback ............ 164–185, 221–226
  ↓
e-Learning → Assessment → Certificate → Competency & Learning Journey ... 190–220, 241–243
```

**Two valid ways into scheduling (FR 66 and 93–96).**
- **Nomination path:** request → nomination request → nominations → status → Scheduling with **Load Training Profile = Yes**. The profile is pulled from the Nomination Request Setup (unscheduled, future-dated, multi-select), and nominations load into Participants (95, 113). This is the main story in the demo.
- **Direct path:** from Training Request Received, click **"Schedule Training"** → Scheduling with **Load Training Profile = No**. HR enters the details manually, and the training is tagged to the request (96).

The demo's ordering (nomination before scheduling) is correct for the nomination path. The direct path should stay reachable from the request inbox.

**Where FR 119 sits.** In the workbook, 119 is between 118 (participant invitation, whose mail carries "a redirect link to reject the invitation") and 120. The withdrawal process is triggered from the participant invitation. It is not a separate later module.

---

## 4. What each screen must contain (labels as the workbook gives them)

### Training Request (Division Head / LC) — 49–64
- **Program tab:**
  - **Fields:** automatic sequential request ID, fixed on save (49); Training Title (50); duration: date and time with man-hour per participant, with repeat-schedule options (51); Venue as free text, the requester's suggestion (52); Training Mode (53); Training Medium (54); Training Tags / Labels, multiple (55); Upload Content, optional (56).
  - **Buttons:** **Save & Next** (57).
- **Trainer tab:**
  - **Fields:** Trainer Details, searched by name or EID (58); Topic Name (59); Session Duration (60); **Add More** (61).
  - **Buttons:** **Previous**, **Save & Next**, **Skip & Next** (62).
- **Nominations tab:**
  - **Fields:** Select Participant, by individual EID or name, or bulk upload (63).
  - **Buttons:** **Save & Exit** (64).

### Training Request Received (ADMIN (HR)) — 65–66
- **Summary of all requests:** Training Name, Venue, From Date, To Date, Proposed Pax (65).
- **Beside each request:** **Schedule Training** and **Forward** (66).
  - **Forward** opens a pop-up to assign the request to a specific HR Admin.
  - **Schedule Training** continues in Training Scheduling.

### Training Nomination Request Setup (ADMIN (HR)) — 67–87
- **Program tab:**
  - **Fields:** automatic nomination request ID (67); title from Training Title setup, with keyword search (68); duration (69); venue from the venue setup (70).
  - **Venue clash pop-up:** the venue is checked against the planned calendar, and a pop-up appears when the venue and date-time combination is already booked (71).
  - **More fields:** Category (72), Mode (73), Medium (74), Tags (75), **PDUs** (76), Organized By from Vendor (77).
  - **Buttons:** **Save & Next** (78).
- **Trainer tab:** Trainer Details with search (79), Topic Name (80), Session Duration (81), **Add More** (82), **Remove** (83). Buttons: **Previous**, **Save & Next**, **Skip & Next** (84).
- **Nomination tab:**
  - **Field:** **Nomination Deadline**, date and time (85).
  - **On save:** the nomination request is emailed to the selected division / function heads and Learning Champions (86), using a customisable template with a nominate link (87).

### Nomination Process — 88
- **Link → own dashboard:** division / function heads and LCs open the link and land on their own dashboard.
- **Nomination window:** the window for that training opens, and they add participants per the DH / LC role.
- **Deadline:** nominations received within the deadline are added to the participant list in Training Scheduling.

### Training Nomination Received (ADMIN (HR)) — 89–91
- **"Training Nomination Status" dashboard:** summary list of nomination requests (89).
- **Columns:** Training Name, Training Date, Organized By, Nomination Deadline, Nominations Received (90).
- **"Details" in the right-most column:** check and edit the training summary and the nominations (91).

### Training Scheduling (ADMIN (HR)) — 92–131
- **Program tab:**
  - **Training ID:** automatic sequential, for example **20250109**, fixed on save (92).
  - **Load Training Profile = Yes / No** (93).
    - **Yes:** choose from Nomination Request Setup profiles, unscheduled and future-dated, multi-select (94). All information and nominations load (95).
    - **No:** enter manually: title, tagged to the request when scheduled from Training Request Received (96); duration (97); venue (98); venue clash pop-up (99); category, mode, medium, tags, PDUs, organized by (100–105).
  - **Buttons:** **Save & Next** (106).
- **Trainer tab:** pre-filled when Yes (107). Topic Name, Session Duration, Add More, Remove (108–111). Buttons: **Previous**, **Save & Next** (112).
- **Participants tab:**
  - **Select Participant:** EID or name, bulk upload, pre-filled from nominations, and HR can add more (113).
  - **"Participants Summary" tab:**
    - **"i" marker** for calendar conflict, leave, resignation or retirement.
    - **Remove** option for each participant (114).
  - **Buttons:** **Save List & Next** (115).
- **Notification tab:**
  - **Organizer communication:** **Send Nomination to Organizer Now**, with a template (116).
  - **Trainer communication:** **Set Reminder Mail** with a date picker, and **Save & Send Invitation to Trainer(s) Now** (117).
  - **Participant communication** (118):
    - **Set Reminder Mail**, and **Send Training Invitation Now**.
    - **Copies:** supervisors are CC'd automatically, and HR can add more recipients.
    - **Attachments and links:** the participant list is attached as a PDF, and the mail includes a link to reject the invitation.
  - **SMS and WhatsApp Notification** (120).
  - **Buttons:** **Next** (121).
- **Feedback tab:** "Want to take feedback of this training?", Yes / No (122–123). If Yes: **Load Feedback Templates** (124). Buttons: **Save** (125).
- **Undertaking to Training tab:**
  - **Training Bond** button (126) opens the "New Training Bond Setup" pop-up (127).
  - **HR inputs:** Bond Signing Date, Bond Period, Bond Period in Word, Bond Start Date, Bond Amount, Bond Amount in Word (128). Everything else is pulled from the Program tab and the Employee Database.
  - **Buttons:** **Save in Training Bond Database & Print** (129); printing uses a Legal-page template, with some fields still to be shared by the bank (130); **Save & Exit** (131).

### Training Invitation Withdrawal Process — 119
- **Employee:** opens the invitation link → **Accept** / **Withdrawn Request**. Rejecting requires a **reason pop-up**.
- **After an employee rejects:** an email goes to the supervisor with an approve / reject link.
- **Supervisor:** sees a window of all active requests, with **Approve Withdrawal**, **Approve Withdrawal with Replacement** and **Reject** for each.
  - **Approve Withdrawal:** requires a **reason pop-up**.
  - **With Replacement:** **Add Replacement**, with alerts for conflict, leave, resignation or retirement.
- **ADMIN (HR):** approves or rejects the withdrawal or replacement in the dashboard.
- **Inclusion / exclusion mails:** sent to the added and removed participants, CC'ing their supervisors.

### Planned Training & Attendance (ADMIN (HR)) — 132–143
- **Overview:** summary list with Training Name, Venue, From, To and Organized By (132), with **View and Edit** (133), plus a **Training Details** tab (134).
- **Mandatory fields** (000 allowed): **Approval no.**, **Budget approved**, **Payment no.**, **Actual expense**, plus a document uploader (135).
- **Actions:** **Reschedule**, **Delete**, **Postpone** and **Save**. The first three send templated mail to participants, CC'ing line managers (136).
- **Attendance tab:**
  - **Columns:** Employee ID, Name, Designation, Division / Department (137), and **Attendance Status** for self-marked attendance (138).
  - **Marking:** **Mark Attendance** tick-boxes (139); **Mark All**, where single rows can be unchecked (140).
  - **Add Participant:** by EID, with an auto-fill (141).
  - **Submit & Update Training Database:** writes to the database automatically and calculates investment and cost per employee for dashboards and profiles (142).
- **Online sessions:** Teams / Zoom attendance is marked automatically from login. Extra attendees go through a request to the admin (143).

### Bonds, database, reports, TNA — 144–189
- **New Training Bond Setup** (144–163):
  - **HR enters:** Employee ID, man-hour, signing date, period (and in words), start date, amount (and in words).
  - **Pulled automatically:** Name, Grade, Designation, Division and Location from the Employee Database. Title comes from the Training Title setup, which also supplies category, mode, medium and tags. Institute comes from the Vendor setup, and duration from the training module.
  - **Calculated:** Bond End Date.
  - **Buttons:** Print Training Bond, **Input in Training Database & Exit**, **Save & Exit**.
- **Bond Database:** summary, edit, **Remaining Liability** calculation; fed from setup or scheduling (164–167).
- **Summary dashboard:** live L&D performance dashboard (168).
- **Records** (169–174):
  - **Admin:** migration uploader; single and bulk entry.
  - **Automatic:** attendance and bond entries.
  - **Employee:** single-entry request, validated or approved by the admin.
  - **External trainees:** separate database.
- **Reports** (175–185):
  - **By grouping:** employee, division / department / function, tag (single or multiple), period, gender, group, feedback, calendar, multi-criteria.
  - **Scheduled template reports:** sent automatically.
  - **AI:** training suggestions from skill gap, role requirement and the role's mandatory courses (185).
- **TNA** (186–189): divisional requirement submission; programme TNA through nomination or survey; Individual Development Plan; the module may change over time.

### Learning modules — 190–243
- **e-Learning** (190–209):
  - **Course configuration:** including Bangla / English subtitles (190).
  - **Course structure:** module → lesson → feedback → assessment → certification (191).
  - **Learning rules:** sequential access, pass mark, expiry, refresher (192).
  - **Content:** content types with protection, offline and low-bandwidth playback (193); content controls and xAPI / cmi5 tracking (195).
  - **Embedded assessment and feedback:** (196–197).
  - **Certificates:** QR codes, digital signatures (198).
  - **Paths, enrolment and notifications:** learning paths (199), enrolment (200), notifications (201), version control (202), search (203), deep links (204).
  - **Dashboards:** trainee and manager (205–206), reports (207), separate analytics (208).
  - **AI:** at-risk compliance and division skill-gap forecasting (209).
- **Assessment** (210–220):
  - **Question types and configuration:** deep links (210); question types (211); configuration, including proctoring (webcam, face match against the EID photo, tab switch, copy-paste, gaze) (212).
  - **Evaluation:** automatic, manual or **AI-assisted** for descriptive answers, with trainer assignment and plagiarism checks (213).
  - **Results and question banks:** results (214), question pull (215), question bank (216).
  - **Dashboard and recognition:** dashboard (217), notifications (218), star and gallery (219), averaging across multiple exams (220).
- **Feedback / Survey** (221–226): deep links; standalone or attached; content, trainer and logistics feedback; Likert, star and text questions; channels including QR; analysis; **AI sentiment and themes** (226).
- **Knowledge Corner** (227–229): files with protection options, folders, sharing, tags and search.
- **Library** (230–240): book entry with a unique number and bulk upload; search, availability, assign by EID, return date and Submit; employee requests that HR approves (with a return date) or rejects; filtered reports, assigned books and overdue reports.
- **Competency & Learning Journey** (241–243): framework setup; competency assessment linked to feedback; learning journey with assignments per competency level and progress at admin, manager and trainee level.

### Platform — 244–250
- **Integrations** (244): HR-IS, leave portal, customer service portal, attendance system, meeting room booking, performance tracking, MS Teams / Zoom, Outlook (mail and calendar), SMS gateway, WhatsApp, Power BI.
- **AI chatbot / virtual learning assistant** (245).
- **Availability** (246): web (intranet and internet), plus a mobile app for Android and iOS.
- **Modules** (247): each module works standalone and linked, for example a standalone exam that can also be attached to a training.
- **Governance** (248–250): IT Division requirements, City Bank security protocol, and agile / modular design. These don't define a user screen.

---

## 5. Setup data (master lists reused later)

| Setup | Values in the workbook | Used by |
|---|---|---|
| Competency (22) | Functional, Innovation, Collaboration, Customer Experience, Leadership, Execution Excellence, plus more | Training Title (30), competency module |
| Training Tags / Labels (23–24) | City Foundation, Banking Foundation, AML, ICT, CRM, Risk, Islamic Banking, ISS, IGN, FRA, City Future Fit, MT Development, Credit, GB, POSH, Foreign Trade, Anti-Bribery & Corruption, Values, Speak Up, Sustainable Finance, Clearing, BACH, Fraud Risk, ICC, ESRM, SME, Fire Drill, plus more; fields are tag name and short tag | 55, 75, 103, 151, reports 177 |
| Training Category (25) | General, Functional, Soft-skill, Mandatory, plus more | 72, 100, 151 |
| **Training Medium (26)** | **Classroom, Webinar, e-Learning**, plus more | 54, 74, 102, 151 |
| **Mode of Training (27)** | **In-house, External-local, External-foreign**, plus more | 53, 73, 101, 151 |
| Training Title (28–30) | Search, a duplicate check on the name, Competency | 50, 68, 96, 150 |
| Venue (31–34) | Search, name / address / short name, a duplicate check on the address, documents | 70, 98 |
| Trainer (35–37) | Internal / External; EID pulls details for internal trainers; bulk upload | 58, 79, 107 |
| Vendor (38–42) | Search, name / contact / email / phone / TIN / BIN, duplicate check, documents, sharing template | Organized By (77, 105), Institute (152) |
| Training Calendar (43–44) | Admin uploads the approved yearly calendar; schedules accumulate here | Venue clash checks (71, 99), report 182 |
| Feedback Setup (45–46) | Add New Question; MCQ / Text box / Tick-box | 124 |
| External Trainee (47–48) | Company Name, Company Employee ID, Name, Designation / Role, Contact No.; bulk template | 173–174 |

---

## 6. Cross-module links (stated in the source)

- **Setup data is reused** by Request, Nomination Request, Scheduling and Bond.
- **Nominations flow into scheduling:** they are added to the scheduling participant list (88, 95, 113).
- **Scheduling loads profiles:** it can load a Nomination Request profile (93–95), or tag a training to a request (96).
- **Participant data** comes from the Employee Database.
- **Attendance and bonds update the training database:** attendance (142, 170); bonds (129, 167, 171).
- **Invitations open the withdrawal process:** the participant invitation link starts 119.
- **Reports and dashboards** use records created by the operational modules.
- **Exams are standalone or linked:** they can be linked to trainings and e-learning (247), and tagged to scheduled trainings (217).

---

## 7. Source quirks to keep in mind

- **FR 20 is blank:** the HR Admin role row has no text.
- **FR 88 and 119 have no sub-category.** The pasted knowledge base calls them "General", but that label is not in the workbook.
- **FR 119 is placed between 118 and 120:** see §3.
- **FR 7 "Others" and 189** leave room for additions. **248–250** are governance rows, not screens.
- **The scheduling Training ID example is "20250109":** an 8-digit sequential format. The demo uses 20260182.
- **Supervisor actions also belong to DH / LC:** withdrawal approvals are by "Supervisor **or** Division Head / Learning Champion role" (119).
- **Corrections to the pasted knowledge base:**
  - **FR 209** is AI for at-risk compliance and division skill-gap forecasting. The pasted paraphrase ("connect with the named external system") is wrong.
  - **FR 10** is a capability (add a replacement with alerts), not just a field.

---

## 8. Demo-v2 against the source

**Update, 16 Nov 2026:** the rebuild fixed the items in the table below:
- Mode and Medium are corrected.
- The exact workbook labels are used.
- Save & Exit and Save List & Next are in place, and the organizer, reminder and trainer sends are real controls.
- The FR 119 labels are exact.
- Topic Name, Session Duration and Add More are in place.
- The Finance step is labelled as a proposal.
- Step 1 is tagged FR 15 / 186.
- The direct scheduling path (FR 66, 96) is available.

The live status of every requirement is on the **Requirements coverage** page (`src/coverage.ts`). The table below is kept as the original 15 Nov finding.

### Original finding (15 Nov 2026)

| Item | Source | demo-v2 now | Action |
|---|---|---|---|
| Medium vs Mode | Medium = Classroom / Webinar / e-Learning (26); Mode = In-house / External-local / External-foreign (27) | **Swapped** in `src/data.ts` (`MASTERS.modes` / `mediums`, `TRAINING.mode` / `medium`), the `src/store.ts` draft defaults, the request form labels in `pages/DivisionHead.tsx`, and the sample rows in `pages/Flow.tsx`, `Hero.tsx` and `Employee.tsx` | Fix: swap the lists and labels back to the source |
| Save & Exit (64, 131, 163) | Named buttons | Not present | Add to the request Nominations tab, the scheduling Undertaking tab and Bond Setup |
| Save List & Next (115) | Named button | Not present | Participants tab footer |
| Send Nomination to Organizer Now (116), Set Reminder Mail (117–118), Save & Send Invitation to Trainer(s) Now (117) | Named controls | Organizer and reminder sections exist with different labels | Use the exact labels |
| Approve Withdrawal / Approve Withdrawal with Replacement / Reject (119) | Exact labels | "Approve withdrawal", "Approve with replacement", "Reject" | Use the exact labels |
| Accept / Withdrawn Request (119) | Exact labels | "Accept invitation" / "Request withdrawal" | Use the source labels, or keep ours with the source term visible |
| Topic Name (59, 80, 108) | Field beside Trainer Details | Shown as "topic" text in places | Check the trainer tabs show **Topic Name** + **Session Duration** + **Add More** |
| Finance approval step | **Not in the source.** Only the budget fields (135) | A separate Finance role with maker-checker | Keep, but label it as our proposal; HR still fills in 135 |
| Business-need step | TNA 186 (divisional requirement submission) | Journey step 1, "Division Head identifies a learning need" | Tag it FR 186 / 15 |
| Direct scheduling path (66, 96) | "Schedule Training" from Request Received, Load Training Profile = No | The demo story uses the nomination path | Keep "Schedule Training" and "Forward" working on the request inbox |

The previous digest, `req-functional.md`, matches the workbook's wording. It has been replaced by the `annexure-ii/` extract.
