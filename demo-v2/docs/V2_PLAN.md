# City Bank ELDP — Prototype v2 Plan

Source of truth: the client workbook `docs/annexure-ii/Annexure-II_Functional Requirement_LMS.xlsx` (250 lines), extracted to `docs/annexure-ii/ANNEXURE_II_SOURCE.md`; read `docs/REQUIREMENTS_KNOWLEDGE.md` first.
v1 stays untouched in `../demo` (port 5173). v2 lives here (port 5174).

## 1. Why v2

v1 impresses but overloads: top nav + people ribbon + two side rails + impact card + presenter bar
all compete. Evaluators need to answer five questions at a glance:
**Who am I? What do I need to do? What happens next? Who else is affected? Which requirement is this?**

v1 also contradicts Annexure-II in places (see §3). v2 fixes both.

## 2. Core idea — "Every role has an inbox; the record moves between inboxes"

- One shared record (the training) flows through role **task inboxes**.
- Each role home = **My Tasks** (what needs me now) + **My Area** (things only this role sees).
- Completing a task creates the next task in another role's inbox → the badge on that role lights up.
  This one mechanic explains the whole cross-role workflow with no diagrams.
- A single **Guided Tour bar** (top, one line): `Step 6 of 14 · Supervisor · Approve Tanvir's withdrawal → [Do it] [Next]`.
  Nothing else floats on screen. Impact ("what changed") appears inline as a toast-sized summary, expandable.
- Each screen shows small **requirement tags** (e.g. `FR 119`) → a **Requirements Coverage** page maps all 250 lines to screens.

## 3. Corrections from Annexure-II (v1 → v2)

| Topic | v1 | Annexure-II (v2) | FR |
|---|---|---|---|
| Order | Request → Schedule → Nominate | Request → **Nomination Request Setup** (HR, deadline, email link) → Nomination (DH/LC) → **Nomination Status** dashboard → **Scheduling with "Load Training Profile = Yes"** | 65–96 |
| Training ID | TRN-2026-00182 | sequential date-style e.g. **20260182** | 92 |
| Mode vs Medium | swapped | Mode = Classroom/Webinar/e-Learning; Medium = In-house/External-local/External-foreign | 26–27 |
| Master data | invented | Real City Bank tags: City Foundation, AML, ICT, Credit, Risk, Islamic Banking, Sustainable Finance, POSH, Anti-Bribery… Competencies: Functional, Innovation, Collaboration, Customer Experience, Leadership, Execution Excellence | 22–25 |
| Withdrawal | reason optional | Employee reason **mandatory**; supervisor reason mandatory on Approve Withdrawal; replacement with conflict notice; HR approves; inclusion/exclusion email CC supervisor | 119 |
| Trainer | passive | **Accept/Reject invitation to facilitate (with reason)**, trainer calendar, **upload material → request HR to link** | 17–19 |
| Employee | accept only | also **self-mark attendance**, own calendar, own record by period, **request to add a personal training record** (HR approves) | 1–6, 138, 172 |
| Planned training | missing | Approval no., Budget approved, Payment no., Actual expense (mandatory, 000 allowed) + documents; Reschedule/Postpone/Delete with emails | 132–136 |
| Notifications tab | channel list | Organizer / Trainer / Participant sections, reminder dates, supervisor CC, PDF participant list, reject link | 116–118, 120 |
| Bond | note only | Bond setup fields, Legal-page print, Bond database with **remaining liability** | 126–130, 155–167 |
| Online attendance | Teams sync | login via LMS; extra attendees by **request to admin** | 143 |
| Reports | dashboard | the 10 named reports + scheduled distribution | 175–184 |

## 4. Roles (every role vital — each has real tasks)

| Role | Tasks in the hero flow | Own area |
|---|---|---|
| Division Head / Learning Champion | Submit request; nominate | Division dashboard (FR 15) |
| HR Admin (L&D) | Review request; nomination request; check status; schedule; notify; approve replacement; planned training & budget; attendance; bond | Setup masters, reports, training DB |
| Trainer (internal/external) | Accept/reject facilitation; upload material; evaluate exam | Trainer calendar |
| Employee | Accept / request withdrawal; self-mark attendance; feedback; course; exam | My record, add-record request, library |
| Supervisor | Approve withdrawal / with replacement | Team records, label reports (FR 11–12) |
| Finance (budget approver) | Approve budget (maker-checker) | — *department link, demo-only role* |
| System Admin (IT Division) | — | Integrations, audit, roles, security (FR 248–249) |
| Management (read-only) | — | Executive dashboard |

## 5. Departments & systems (the "integrated bank" story)

One **Connected Bank** page + small source chips on every relevant field:
HR Division (HRIS — employee master), IT Division (IAM/SSO, security, integrations), Finance (budget/payment),
Administration/Facilities (meeting-room booking), Business Divisions (requests, nominations),
Compliance (mandatory learning), Internal Audit (audit trail), Corporate Comms (email/SMS/WhatsApp).
Systems per FR 244: HRIS, leave portal, customer service portal, attendance system, meeting room, performance modules,
Teams/Zoom, Outlook, SMS, WhatsApp, Power BI. All labelled *simulated*.

## 6. Guided tour (14 steps, ~12 min)

1 DH submits request → 2 HR reviews → 3 HR nomination request (deadline) → 4 DH/LC nominates (conflicts flagged) →
5 HR nomination status → 6 HR schedules (load profile, venue clash) → 7 Finance approves budget →
8 HR sends invitations (trainer + participants) → 9 Trainer accepts facilitation → 10 Employee accepts / Tanvir requests withdrawal →
11 Supervisor approves with replacement → 12 HR approves, roster updates → 13 Attendance (self-mark + HR + Teams) → submit, DB + cost update →
14 Feedback & record → then short loops: e-learning, exam, competency, executive view.

## 7. Build phases (token-efficient)

1. **Model** — rewrite `store.ts` around tasks; fix master data, IDs, order. Keep zustand + persistence.
2. **Shell** — one top bar (logo · role switcher with task badges · search · tour toggle), no side rails.
3. **Role homes** — 8 homes from one `RoleHome` template (tasks + area).
4. **Hero flow screens** — reuse v1 Hero components where they fit (nomination board, replacement, attendance); restyle to light, simpler layout.
5. **Secondary modules** — setup masters, bond DB, reports, library, knowledge, TNA (compact, one template).
6. **Coverage page + Connected Bank page.**
7. **Guided tour + reset + screenshot QA** at 1920×1080 and 1366×768.

Reuse: `ui.tsx`, `Hero.tsx` pieces, `data.ts` names, logo assets, Playwright flow script (scratchpad).
