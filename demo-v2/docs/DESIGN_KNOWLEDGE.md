# City Bank ELDP — Design Knowledge

How the v2 prototype (`demo-v2/`) looks, behaves and is built. Read this before changing any screen.
Companion files: `REQUIREMENTS_KNOWLEDGE.md` (requirement hierarchy, flow and gaps; the Annexure-II workbook in `annexure-ii/` is the core source), `V2_PLAN.md` (why v2 exists), `PITCH_SCRIPT.md` (how it is presented).

---

---

## 0. Standard v3 (16 Nov 2026): read this first

This section overrides anything older below. See `FIX_LIST.md` (F1–F7) and `BUILD_CONTRACT.md`.

### Page templates (every screen uses one)
| Template | Component | Use |
|---|---|---|
| Dashboard | role home `/r/:role` | My tasks, then figures that drill down to people |
| List | `DataTable` | Search, filter chips, sortable headers, grouping, selection with a bulk-action bar, empty state, CSV export |
| Decision | `DecisionLayout` + `DecisionPanel` | Grouped facts on the left (`FactGroup`, `CheckList`); a sticky decision panel on the right |
| Step form | `StepForm` | The workbook tabs, a footer (Previous · Skip & Next · Save & Next), the only primary action on the final step |

Every page header is `PageHead`: a clickable breadcrumb (`My work › group › page`), the canonical page name from `nav.ts`, and a quiet `FrRef`.

### Type scale
Body 17px · values 17px · labels 15px · section headings 22–24px · page titles 36px · nothing below 14px. Presenter mode is 18px.

### Buttons
- **Primary:** one per view, rightmost; secondary to its left; tertiary as a link.
- **Placement:**
  - page actions in the header;
  - form actions in a sticky footer;
  - selection actions in the table bar.
- **Order and duplicates:** actions come after the information they act on, and never twice on one screen.
- **Destructive actions:** apart, with a confirmation.
- **Labels:** the exact workbook labels where Annexure-II names a control.

### Honest labelling (`SourceTag`)
`Fictional demonstration data` · `Proposed workflow` (Finance, Management, Executive Center, Return for Information, request Review step) · `Demonstration concept` (Home, guided journey, Connected Bank) · `Simulated integration` · `Proposed architecture`.

### Navigation and walkthrough
- **Getting around:**
  - **Side menu** on every work page: My tasks, then the role's pages in process order, each with a live status (`nav.ts` `WORK_NAV`).
  - **No silent role switching:** a page belonging to another role shows "View as …? Switch / Stay". Inherited pages (FR 8, 13, 16) keep the role.
- **Moving between people:**
  - **Hand-offs:** when the next journey step belongs to another person, the shell shows "Sending to …", switches to that person's screen and shows an **arrival line** (who sent what, when · View full impact).
  - **Same-role next steps:** keep the completion note (details first, actions in the footer).
- **Going back:**
  - **Revisit:** reopen any finished step (journey drawer, "← Previous step") with a "Viewing completed step n · Back to current step" banner.
  - **Restart from here:** rewinds to a saved per-step snapshot.
- **Orientation:**
  - **Early-step banner** when a later step's page is opened. **Guided empty states** (`NotYet`) instead of dead ends. **Overview drawer** from the step bar.
- **Presenter aids:**
  - **Undo** on bulk actions (about 10 s); **Do this step for me** in the ··· menu, and visible in Presenter mode.

### Records (`store.ts`, `org.ts`)
- **Organisation:** the hierarchy (Bank → Division → Department → Supervisor → Employee) scopes every view.
- **Records:**
  - **Attendance** per day, with its source.
  - **Post-training assessment results** per participant.
  - **Course progress** per employee.
  - **Bonds** with calculated end date and remaining liability.
  - **Training database rows**, plus the programme calendar and course enrolments.
- **Rule:** figures are computed from these records, never hard-coded.

---

## 1. The one idea

ELDP is not "a dashboard with LMS modules". It is **one training record moving across people, departments and systems** until it becomes measurable capability.

- **The record:** `TR-2026-00418 · Advanced Credit Risk Management · Corporate Banking · 32 participants`.
- **Every screen answers six questions:** which record, which stage, who acts now, who else is affected, which systems are involved, and what changed.
- **Role switching changes perspective, not product.** The same record is shown from another desk, and nothing resets.

If a new screen doesn't help answer those questions, it doesn't belong in the main story.

---

## 2. The story (single source of truth)

**Starting point.** A fresh demo always opens at Step 1: the business need, owned by Farzana Haque (Division Head / Learning Champion). Sign-in signs in as Farzana. Saved progress lives in localStorage key `eldp-demo-v2` with a `version` (`DEMO_VERSION` in `store.ts`). Older saves are replaced with the fresh start by `migrate`; no other key is touched. Bump `DEMO_VERSION` whenever the starting point or state shape changes.

All stage, people and system data lives in `src/lifecycle.ts`. Never duplicate it in JSX.

| # | Stage | Owner | Systems |
|---|---|---|---|
| 1 | Need | Division Head | Training Database, Power BI |
| 2 | Request | Division Head | HRIS, Notification Engine, Audit / SIEM |
| 3 | HR Review | HR / L&D | Training Database, Audit / SIEM |
| 4 | Nomination | HR, then Learning Champion | Notification Engine, HRIS |
| 5 | Validation | HR / L&D | HRIS, Leave, Outlook, Training Database |
| 6 | Scheduling | HR / L&D | Meeting Room, Outlook, Training Database |
| 7 | Budget | Finance (maker-checker) | Finance, Audit / SIEM |
| 8 | Invitation | HR / L&D | Outlook, Notification Engine |
| 9 | Response | Trainer, Employee, Supervisor, HR | HRIS, Leave, Outlook, Notification Engine |
| 10 | Attendance | HR / L&D | Teams / Zoom, HRIS, Training Database |
| 11 | Feedback | Employee | Notification Engine |
| 12 | Record | HR / L&D | Training Database, HRIS, Power BI |
| 13 | Capability | Employee and Trainer | Training Database, Audit / SIEM |
| 14 | Insight | Management | Power BI, Training Database |

**Key exports**

| Export | Use |
|---|---|
| `STAGES_LC` | The 14 stages: `owner(s)`, `affected`, `systems`, `impacts` (audit keys), `detail(s)`, `route` |
| `activeStage(s)` | Index of the current stage |
| `stagePeople(stage, s, idx, current)` | Person states for one stage (active, complete, affected, waiting, idle) |
| `personStatus(pid, s)` | One-line status per person for the whole record |
| `TOUR` / `tourIndex(s)` | The 20 underlying screen actions, each with a `cta` label |
| `JOURNEY` / `journeyIndex(s)` | The 24 plain-language guided steps (accept and withdrawal are separate steps; step 22 is the post-training assessment) shown to people (title, explanation, result, owner). Most map onto `TOUR` actions; four have no screen action of their own (business need, system conflict check, nomination status review, record update) and use `customDone` + `route` + `cta` |
| `journeyAction(j, s)` | The next action for a journey step: role, route, employee and button label |
| `journeyEvent(j, s)` | The audit event that completed a step (who, when), used by completion notes |
| `tasksFor(role, s)` | Each role's inbox, derived from state and never stored |
| `IMPACTS` | The "What changed" content per audit action |

**Flow order follows Annexure-II:** request, then nomination request, then nomination, then nomination status, then scheduling (Load Training Profile = Yes). Scheduling never comes before nomination.

**Real identifiers:**
- Training ID `20260182`.
- Nomination ID `NR-2026-00057`.
- Training **Medium** = Classroom / Webinar / e-Learning (FR 26). **Mode** of Training = In-house / External-local / External-foreign (FR 27). The code currently has these swapped; see `REQUIREMENTS_KNOWLEDGE.md` §8.
- Tags and competencies come from `MASTERS` in `data.ts` and match FR 22–27 exactly.

---

## 3. People

| Pid | Label | Persona | Department |
|---|---|---|---|
| dh | Division Head | Farzana Haque | Corporate Banking |
| lc | Learning Champion | Farzana Haque (same role, `/nominate`) | Corporate Banking |
| hr | HR / L&D | Nusrat Jahan | Human Resources |
| fin | Finance | Rezaul Karim | Finance & Accounts |
| tr | Trainer | Nafis Ahmed | Risk Management |
| emp | Employee | Ayesha Rahman (also Tanvir Hasan, Sadia Islam) | Corporate Banking / Risk |
| sup | Supervisor | Mahmud Karim | Corporate Banking |
| mgmt | Management | Tahsin Rahman | Executive Committee |
| — | System Admin | Arif Mahmud | IT Division |

Finance as a maker-checker step is **our addition**. Annexure-II only lists budget fields (FR 135). Present it as a proposal.

---

## 4. Visual language

**Character:** calm, light and welcoming banking software. Warm white surfaces, charcoal text, and City Bank red only where someone needs to act. It should read like a well-organised bank service, not a control room.

### Colour tokens (`src/index.css`)

| Token | Value | Use |
|---|---|---|
| `brand` | `#d71920` | City Bank red: **only** primary actions, the current step and alerts |
| `brand-dark` | `#a8121a` | Primary hover |
| `brand-soft` | `#fcebeb` | Conflict and "needs a decision" backgrounds |
| `ink` / `ink-2` / `ink-3` | `#16181d` / `#4a515d` / `#7c8492` | Text: primary, secondary, metadata |
| `line` | `#e8e9ed` | Hairlines and borders |
| `canvas` | warm off-white | Page background |
| Warm panels | `#fbf8f4`, `#faf7f3`, `#fdf8f7` | Welcome screen, explanation notes, detail boxes, "What happens next?" |
| `ok`, `warn`, `info` (+ `-soft`) | green / amber / blue | Status only: completed, needs attention, information |
| `graphite` | `#121419` | Rare emphasis only (toasts, a few calculation and intelligence panels). Don't add new dark surfaces |

**Rules**
- **Red is a signal, not decoration.** Have one red filled button per area.
- **Light first.** The header, welcome screen, Home and Workflows are all light. Dark surfaces are the exception.
- **Green means done.** Completed steps get a green tick, a timestamp and who completed them.
- **Gradients:** only the soft glow on the welcome screen and the progress line.

### Type

Inter (with a Segoe UI fallback). Base size is **17px**, line-height 1.55. Presenter mode raises it to 18px.

| Role | Size |
|---|---|
| Page heading | 36–52px, `font-extrabold`, `tracking-tight` |
| Section heading | 22–30px bold |
| Key metric | 30–64px, `.num` (tabular, tight) |
| Body | 17px (values 17px, supporting text 16px) |
| Supporting text | 14–15.5px |
| Labels, table headers (`.th`), eyebrow | 14px, sentence case |
| Buttons | 14px minimum (15–16px for primary) |

**Sentence case everywhere.** No tiny uppercase labels and no letter-spaced capitals. Page titles get a quiet breadcrumb above them (for example "HR Admin / Training Scheduling").

### Shape and spacing
- **Radius:** 8px for buttons and inputs, 12px for panels and tables, 16px for larger cards.
- **Separators:** prefer hairlines and whitespace to stacked bordered cards. Don't place rounded cards inside rounded cards.
- **Content width:** pages use a max width of 1320px. Full-bleed pages (Home, Workflows, Platform, Executive, course player) are wider.
- **Hierarchy:** one primary action per screen. Large numbers carry the hierarchy, and labels stay quiet.

### Motion

Use motion only to explain state.

| Class | Meaning |
|---|---|
| `anim-pulse` | The one stage or person acting now |
| `anim-up` / `anim-slide` | Explanation notes, completion notes, panel entry |
| `anim-grow` | Progress bars on first paint |
| `anim-out` / `anim-in-right` | Tanvir leaves, Sadia joins (replacement) |
| Progress line | Width animates to the current step |

`prefers-reduced-motion` turns all of these off. Don't add floating or decorative loops.

---

## 5. App shell (`components/Shell.tsx`)

```
┌ White header ─────────────────────────────────────────────────────────────────────────────┐
│ [mark] City Bank ELDP   Home · My work (n) · Learning · People · Reports                     │
│                         Search  Notifications  [Guided journey 9/24]  More  [person ▾]       │
├ Context bar (warm white) ─────────────────────────────────────────────────────────────────┤
│ Page · working on TR-2026-00418 …        Step 9 of 24 · HR Admin  [Next action →]  ···       │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Main nav:** Home, My work (the role's inbox, with a task count), Learning, People, Reports.
- **Guided journey:** opens a drawer with all 24 steps. Done steps show a green tick, the result, who did them and when. The current step shows its explanation and an action button. Future steps are faded.
- **More:** Workflows, Platform, Connected Bank, Requirements coverage, Training database, Audit trail, Security & roles, Integrations, Show requirement numbers, Presenter mode (larger text), Reset demo.
- **Profile menu:** shows name, role and department, and lists every profile under **Switch profile**. Below 1420px wide only the avatar shows.
- **Context bar:** the record (labelled "New learning need" until the request is submitted), **Viewing this record as** (8 perspectives on the same record; on shared pages such as Home it keeps you on the page), "Step n of 24", the owner and a red button labelled with the next action (from `journeyAction`). When you're already on that step it says "you are on this step" instead. Its ··· menu has **Do this step for me** and **Reset demo**.
- **`GuidedStepNote`** (top of each task screen):
  - **On the current step:** "What is happening now?", the step title and explanation, "Your action" and "What happens next?".
  - **Right after a decision:** "Decision completed", who did it and when, the result, People affected / System updates / Next step, plus **View full impact** and **Continue: next action**.
  - **Elsewhere:** "Your next action" or "This training is now with {role}", with **Open this step**.
- **Toasts:** perspective changes say "You are now viewing this workflow as HR Admin." or "You are now viewing Ayesha Rahman's learning record."
- **Role switching:** use `useSwitchRole()` from `components/perspective.ts`. It sets the role and employee, navigates and shows the toast.

---

## 6. Component kit (`components/ui.tsx`)

### Buttons (`Btn`)

| Variant | When | Look |
|---|---|---|
| `primary` | The **one** current business action (Approve budget, Send invitations, Submit attendance) | Red fill |
| `secondary` | Navigation or supporting actions (View workflow, Return to HR) | White, hairline border |
| `link` | Tertiary actions (View history, Open screen →) | Red text, underlined on hover |
| `ghost` | Quiet actions (Back, Cancel) | Text only |
| `danger` | Reject or remove | Red outline |

- **Sizes:** `sm` (36px), `md` (44px), `lg` (48px).
- **States:** focus ring and `loading` (spinner, `aria-busy`) are built in.
- **Placement:**
  - Page-level actions go in the page header, right side.
  - Card or form actions go in a footer with a top hairline, right-aligned, primary **last**.
  - Modals use the same footer order: Cancel, then the primary action.
- **Disabled buttons say why** in text beside them, for example "Add a reason to continue" or "Available after Finance approval".

### Other parts
- **`Badge`:** status pills. Tone comes automatically from the status text (`statusTone`).
- **`Table` / `Td`:** 15px rows with 14px sentence-case headers. Use tables for lists of people and records.
- **`Tabs`, `Stepper`, `Field`, `inputCls`:** split long forms into sections with Previous / Next, ending in a **Review and submit** step that holds the one primary action.
- **`Alert` (ok / warn / brand / info):** inline conditions. Use the `action` slot for the fix.
- **`Modal` and `Drawer`:** both labelled dialogs. Drawers are for context, such as stage details, impact, audit and module previews.
- **`AiLabel`:** every AI output carries "AI-assisted" and states that a human decides.
- **`SimTag` and the "simulated" text:** every integration is labelled as simulated.
- **`Fr`** (in `pages/Roles.tsx`): requirement-number tags. Hidden by default and shown via More → Show requirement numbers.

---

## 7. Page patterns

| Page | Route | Pattern |
|---|---|---|
| **Welcome** | `/login` | Warm ivory screen: logo, demo label, "Welcome to City Bank ELDP", **Continue with City Bank SSO** (with a loading state), **Explore the demonstration**, IAM note, external trainer / trainee link, growth illustration |
| **Home** | `/overview` | Greeting + "You are viewing as" → training focus card (current step, owner, next action, participants, attention, systems, progress, **Continue this workflow**) beside **What happens next?** → 14-stage journey (Completed / Current / Needs attention / Waiting / Upcoming) → people affected → enterprise pulse → recent activity |
| **Learning** | `/learning` | One list of learning areas, each with a status pill and **Open** |
| **People** | `/people` | Everyone in the training with their status and **Open view**, plus each employee's learning record |
| **Workflows** | `/workflow` | Summary groups → current-stage panel, people affected and integrations → full swimlanes (collapsed) |
| **Platform** | `/platform` | Tiered ecosystem around the **Unified Learning Record** |
| **Requirements** | `/coverage` | Evidence strip → domain cards → searchable table |
| **Role home** | `/r/:role` | Name header → **My tasks** → role widget → "Go to" links |
| **Task screens** | `/hr/*`, `/finance`, `/trainer`, `/employee`, `/supervisor` | `GuidedStepNote` → breadcrumb title → work area with one primary action → explanation side panel where useful |
| **Nomination status** | `/hr/nomination-status` | Six numbers (divisions invited, received, eligible, conflict cases, pending divisions, finalisation) → table with an **Action required** column → side panel: why attention is needed, what HRIS / leave / Outlook say, what HR can do |
| **Scheduling** | `/hr/schedule` | Sections: Program, Trainer, Participants, Notifications, Feedback, Undertaking, **Review and submit** |
| **Employee** | `/employee`, `/journey` | Invitation with why invited, assigned by, trainers, venue and attendance → **My Development Journey** with a recommended next step |
| **Executive** | `/executive` | Headline numbers → heatmap, risks, trends, effectiveness |

**Layouts at a glance**
- **1920×1080:** Home shows the focus card, What happens next and the journey without scrolling.
- **1440×900 and 1366×768:** the header stays on one line. The Notifications and More labels hide below 2xl, and the profile text hides below 1420px.
- **Tablet and mobile:** grids collapse to one column and the journey scrolls horizontally. Desktop is the priority.

---

## 8. Interaction rules

1. **Every button does something real.** Use store actions, `useSwitchRole`, or navigation. Don't add placeholder buttons.
2. **No dead ends.** Every tour step stays reachable from any state: Tanvir can withdraw after accepting, a trainer who declines doesn't block attendance, and returned budgets can be resubmitted.
3. **Reasons are mandatory** where Annexure-II says so: employee withdrawal, the supervisor's decision, trainer decline (FR 17, 119).
4. **Conflicts flag, they don't block.** HR decides, and an override is logged.
5. **AI suggests and people decide.** Show the "why", let people override, and log the override. Proctoring never fails anyone automatically.
6. **Every important action:**
   - writes an audit event (`log()` in `store.ts`),
   - has an `IMPACTS` entry so the completion note and **View full impact** can explain it,
   - moves the guided journey forward, and
   - creates the next role's task.
7. **Be honest about integrations.** Say "simulated" anywhere a live bank system would be involved.

---

## 9. Accessibility checklist

- Text is at least 14px, and body text is 17px. Labels use sentence case, except the exact workbook labels on buttons and fields.
- Every icon-only button has an `aria-label` and a `title`.
- Header controls have clear labels ("Open the guided journey", "Signed in as …. Switch profile"), and the current nav item uses `aria-current`.
- Dialogs use `role="dialog"`, `aria-modal` and a label. Escape closes menus and the search palette.
- A visible focus ring (`:focus-visible`, City Bank red).
- Status is never conveyed by colour alone: every dot has a text label.

---

## 10. Adding or changing a screen

1. Find the stage, roles and systems it belongs to in `lifecycle.ts`. Add data there, not in the page.
2. Use `PageTitle` (breadcrumb + title + header actions), `Btn` variants, `Table` for lists, and `Alert` for conditions.
3. Wire actions to the store. If the action matters, add an `IMPACTS` entry and a task in `tasksFor`.
4. Add the route in `App.tsx`. If a role owns it, add it to `OWNER` in `Shell.tsx`.
5. Map its requirements in the `MAP` and `DOMAINS` lists in `pages/Admin.tsx` so the evidence map stays complete.
6. Verify it:
   - `npx tsc -b`
   - `npx vite build`
   - the route renders at the start and the end of the story
   - the 24-step guided journey still completes, and a fresh browser opens at Step 1 (business need, Farzana Haque)

---

## 11. Brand assets

- `public/brand/citybank-logo.png`: the full lockup. Used on the welcome screen and certificates.
- `public/brand/citybank-mark.png`: the kite mark, in the header tile.
- `public/brand/favicon.png`.
- These are cut from a 412px PNG. Replace them with the bank's SVG before any large-screen use.
