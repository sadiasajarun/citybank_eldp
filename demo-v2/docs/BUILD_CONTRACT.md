# Build contract for screen work (read fully before writing code)

You are rebuilding screens of `demo-v2`, the City Bank ELDP tender demo: Vite, React 18, TypeScript strict, Tailwind v4, zustand and HashRouter. The foundation is done. Build screens on top of it; don't change shared files unless this contract says so.

**Read first:**
- `docs/FIX_LIST.md` (your items are named in your brief);
- `docs/REQUIREMENTS_KNOWLEDGE.md` §4 (what each screen must contain, with the workbook's exact labels);
- `docs/annexure-ii/ANNEXURE_II_SOURCE.md` (the source of truth).

## Ownership and checks
- **Files:** edit **only the files your brief assigns**. Each starts as a one-line stub that re-exports an old screen. Replace it with a full implementation, keeping the **same exported component names**.
- **Need a store action that doesn't exist?** Don't edit `store.ts`. Use `useDemo.getState().logEvent(role, action, detail)` plus local `useState`, and list what's missing in your final report.
- **Type-check:** `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "src/pages/(your folder)"`, and fix every error in your files. Other agents work in parallel, so ignore errors in files you don't own.
- **No servers:** do NOT run the dev server, `vite build`, Playwright or any browser (the machine is memory-constrained).
- **Code rules:** no `console.log`, no `any`, no commented-out code, no TODOs. Use the `~`-free relative imports already used in the repo.

## Foundation you must use
- **Store:** `src/store.ts`, `useDemo()`.
  - **Every record is here:** read state, call actions. Read the `Actions` interface; most screens already have their actions (e.g. `forwardRequest`, `resolveMany`, `markMany`, `saveBondRecord`, `setIntegrity`, `releaseResult`, `sendReminders`, `withUndo`).
  - **Helpers:** `roster(s)`, `attendanceOf(s, day)`, `attendedIds(s)`, `courseOf(s, id)`, `ptResults(s)`, `gradeOf`, `bondEndDate`, `remainingLiability`, `nowLabel`, `requestStatus`, `trainingStatus`.
  - **Undo:** wrap bulk actions in `s.withUndo('label', () => …)` and set a toast; the shell shows an Undo button.
- **Org (fictional, stands in for HRIS):** `src/org.ts`: `DIRECTORY` (Person: id, eid, name, designation, grade, division, department, location, supervisor, gender, creditLevel), `findById`, `findByEid`, `searchPeople`, `directReports(supervisorName)`, `inDivision`, `creditGap(div?)`, `DIVISIONS`, `SUPERVISORS`, `TRAINERS`, `searchTrainers`, `VENDORS`, `VENUES` (with `bookedOn` for clash checks).
- **Master lists:** `src/data.ts`: `TRAINING` (the story record), `MASTERS` (competencies, tags, categories; **`modes` = FR 27 In-house / External-local / External-foreign; `mediums` = FR 26 Classroom / Webinar / e-Learning**), `PERSONAS`, `NOMINEE_LIST`, `CONFLICT_IDS`, `REQUEST_QUEUE`.
- **Journey:** `src/lifecycle.ts`: `JOURNEY` (24 steps, each with `fr`), `journeyIndex`, `journeyAction`, `tasksFor`, `IMPACTS`, `ROLE_LABEL`. Don't change the order.
- **Navigation:** `src/nav.ts`: canonical page names (`pageName`), `WORK_NAV`. The **shell already renders**:
  - the side menu, breadcrumb context and step bar;
  - the GuidedStepNote ("What is happening now / What happens next");
  - arrival lines and the role prompt;
  - revisit and early-step banners.
  
  Don't build any of these in your page.
- **Templates:** `src/components/Templates.tsx`:
  - `PageHead({ title, meta, sub, actions, fr, tags })`: use it for every page header. It renders the clickable breadcrumb.
  - `Section`, `FactGroup` (label → value lists), `CheckList` (light context checks).
  - `DecisionLayout` + `DecisionPanel`: the decision template. Facts on the left, a sticky decision panel on the right.
  - `StepForm({ steps, current, onStep, done, footer, rail })`: the workbook tabs, with a footer bar and an optional right rail.
  - `ReasonModal`: required reasons, with optional names list and suggested text.
  - `NotYet({ title, after })`: the guided empty state, used whenever a screen is opened before its stage. Never leave a bare "nothing here".
  - `PersonBanner({ empId, reason })`: who the employee is.
- **Tables:** `src/components/DataTable.tsx` `DataTable<T>`. Search, per-column filters (give columns a `filter` fn), sortable headers (`sort` fn), `groupBy`, `selectable` + `bulk(selected, clear)` (action bar), a `footer` slot for the page primary action, and an empty state. `downloadCsv(name, header, rows)` gives a real CSV export. **Every list of people or records uses DataTable.**
- **Labels:** `src/components/Source.tsx`: `<SourceTag kind="fictional|proposed|concept|simulated|architecture" />` and `<FrRef>FR 49–64</FrRef>` (always visible, quiet).
- **UI kit:** `src/components/ui.tsx`: `Btn` (v = primary / secondary / ghost / danger / link; size; loading; disabled), `Badge`, `Alert`, `Modal`, `Drawer`, `Field`, `inputCls`, `Avatar`, `cx`, `AiLabel`, `Progress`.
- **Perspective:** `src/components/perspective.ts`: `useSwitchRole()(role, to?, emp?)` (intentional switch plus toast) and `personaFor(role, empId)`.

## Rules every screen must follow
1. **Type and layout:**
   - type: page title via PageHead (36px); section headings 22–24px; body and values 16–17px; labels ≥ 15px; badges ≥ 14px; **nothing below 14px**;
   - light surfaces only (no new dark panels); generous whitespace; fewer boxes; red only for the primary action or a real blocker; amber = needs attention; green = done.
2. **Buttons (U5):**
   - one primary per view, rightmost in its group; secondary to its left; tertiary as a link;
   - page actions in the PageHead `actions`; form and step actions in the StepForm footer / sticky bottom bar; table selection actions in the DataTable bar;
   - actions come after the information they act on; never duplicate an action on one screen; destructive actions sit apart, with a confirmation.
3. **Exact workbook labels** where Annexure-II names a button or field (D3), e.g. "Save & Next", "Skip & Next", "Save & Exit", "Save List & Next", "Load Training Profile", "Send Nomination to Organizer Now", "Set Reminder Mail", "Save & Send Invitation to Trainer(s) Now", "Send Training Invitation Now", "Approve Withdrawal", "Approve Withdrawal with Replacement", "Withdrawn Request", "Accept", "Submit & Update Training Database", "Training Bond", "Save in Training Bond Database & Print", "Input in Training Database & Exit", "View and Edit", "Details", "Mark All", "Add Participant", "Forward", "Schedule Training".
4. **No dead controls.** Every button changes state, opens something or navigates. Anything that would touch a live bank system is simulated, labelled `simulated`, and still updates the record and audit trail (via store actions or `logEvent`).
5. **Required reasons:** withdrawal (employee and supervisor "Approve Withdrawal"), trainer rejection, bulk keep / remove, adjusting a score, Return for Information.
6. **Honest labelling:**
   - `SourceTag fictional` near the record or people on key screens;
   - `proposed` on Finance, Management, the Executive Center, Return for Information and the request Review step;
   - `simulated` on integrations;
   - AI output always says "AI-suggested · a person decides".
7. **Hand-offs are automatic.** When an action completes a journey step and the next step belongs to another person, the shell jumps to that person's screen with an arrival line. **Don't navigate after such actions yourself.** For a same-role next step, the shell's completion note offers Continue. Only after a *non-journey* action, or on a finished state, add your own forward button ("Back to My work" / "Continue to …"). **No dead ends.**
8. **Requirement numbers:** add a `FrRef` (or the PageHead `fr` prop) with the correct numbers for the page, from `REQUIREMENTS_KNOWLEDGE.md`.
9. **Scoped by the org:** supervisors see their direct reports, division heads their division, HR and management the bank. Figures are computed from records (`roster`, `ptResults`, `attendance`, `DIRECTORY`, `enrollments`, `programmes`, `dbRows`, `bonds`), never hard-coded totals.
10. **Responsive:** must work at 1366×768 with no horizontal page scroll. Tables scroll inside themselves.

## Final report (keep it short)
1. **Files changed.**
2. **Fix-list items completed** (by ID).
3. **Store actions or data you needed but didn't have** (if any), with exactly what they should do.
4. **Anything you couldn't finish.**
