/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/** Phase 1 — full-spectrum mapper (frontend audit). */
export const FRONTEND_AUDIT_PHASE_1_PROMPT = `[FRONTEND AUDIT 1/4 — FULL-SPECTRUM MAPPER]

You are a senior frontend engineer AND product expert combined.
Read the ENTIRE frontend codebase before writing a single word.
Do NOT make any changes yet.

Think in two modes at the same time:
MODE A — Engineer: what exists in the code right now
MODE B — Product expert: what SHOULD exist for a screen of this type

════════════════════════════════════
SECTION 1 — ROLE DEFINITIONS
════════════════════════════════════
List every role in the frontend:
- Where defined (file + constant value)
- Does the value exactly match what the backend sends? (same string, same casing)

MISSING ROLE DEFINITIONS:
- Roles the backend sends that the frontend has no constant for
- Roles referenced in guards/conditions using magic strings instead of constants

════════════════════════════════════
SECTION 2 — SCREEN INVENTORY
════════════════════════════════════
For every screen/page/view file:

### Screen: <ScreenName> — <file path>
- Route path: <URL>
- Roles that should access it: <list>
- Auth guard present: Yes | No | Partial
- Guard checks role correctly: Yes | No | Not at all
- Appears in navigation (sidebar/menu/navbar): Yes | No

════════════════════════════════════
SECTION 3 — BUTTON & ACTION AUDIT
════════════════════════════════════
This is the most critical section.
For every screen, check BOTH what EXISTS and what SHOULD EXIST.

### Screen: <ScreenName>

── BUTTONS THAT EXIST ──
For every button, link, icon-button, dropdown item, or clickable element:

| Button | Has handler | Handler calls API | Endpoint exists | Role-restricted correctly |
|---|---|---|---|---|
| <label/icon> | Yes/No | Yes/No | Yes/No/N/A | Yes/No/N/A |

DEAD BUTTONS (has no handler or handler is empty/commented):
- <button label>: <what the handler should do>

WRONG WIRING (handler exists but calls wrong endpoint or wrong method):
- <button label>: calls <wrong thing> but should call <correct thing>

MISSING API CALL (button has handler but never actually calls the backend):
- <button label>: <what it does instead, why it should hit the API>

── BUTTONS THAT SHOULD EXIST BUT DON'T ──
Based on the screen type and the data it shows, what actions are missing entirely?

Think: for a screen showing a list of <entity>, a user with role <role> would need:
- Create new <entity>? Button exists: Yes | NO — MISSING
- Edit <entity>? Button exists: Yes | NO — MISSING
- Delete <entity>? Button exists: Yes | NO — MISSING
- View detail of <entity>? Button exists: Yes | NO — MISSING
- Export / Download? Button exists: Yes | NO — MISSING (if applicable)
- Bulk select + action? Button exists: Yes | NO — MISSING (if applicable)
- Approve / Reject? Button exists: Yes | NO — MISSING (if applicable for workflow screens)
- Assign to user? Button exists: Yes | NO — MISSING (if applicable)
- Change status? Button exists: Yes | NO — MISSING (if applicable)
- Print / PDF? Button exists: Yes | NO — MISSING (if applicable)

ROLE-SPECIFIC MISSING BUTTONS:
For super admin / admin roles specifically:
- Impersonate user? Button exists: Yes | NO — MISSING (if applicable)
- Ban / suspend user? Button exists: Yes | NO — MISSING (if applicable)
- Reset password? Button exists: Yes | NO — MISSING (if applicable)
- View audit log? Button exists: Yes | NO — MISSING (if applicable)
- Force refresh / recalculate? Button exists: Yes | NO — MISSING (if applicable)
- System settings controls? Button exists: Yes | NO — MISSING (if applicable)

DISABLED BUTTONS WITH NO EXPLANATION:
- <button label>: disabled but no tooltip/message tells the user why

ICON-ONLY BUTTONS WITH NO LABEL:
- <icon description>: no aria-label, no tooltip — user cannot know what it does

════════════════════════════════════
SECTION 4 — FORM AUDIT
════════════════════════════════════
For every form (create form, edit form, filter form, search form):

### Form: <FormName> on <ScreenName>

── FIELDS THAT EXIST ──
| Field | Type | Required indicator | Validation | Sends to API |
|---|---|---|---|---|

── FIELDS THAT SHOULD EXIST BUT DON'T ──
Compare form fields against:
1. The database schema for this entity — every column should have a field
2. What the API endpoint accepts — every accepted param should have a field
3. Domain knowledge — what fields does a real <entity type> need?

FIELDS IN DB/API BUT MISSING FROM FORM:
- <field name>: exists in <schema/API> but form never collects or sends it

FIELDS MISSING FROM DOMAIN PERSPECTIVE:
- <field name>: a real <entity> must have this — e.g. invoice needs due_date, tax_rate

── FORM ERROR HANDLING ──
- API validation errors (422) displayed to user: Yes | No — SWALLOWED
- Which field the error belongs to is shown next to that field: Yes | No
- General errors (500) show friendly message: Yes | No — RAW ERROR SHOWN
- Form is disabled during submission (prevents double submit): Yes | No
- Submit button shows loading state: Yes | No

── FIELD PROBLEMS ──
- Required fields with no visual indicator (no asterisk, no label): <list>
- Dropdowns with hardcoded options instead of fetching from API: <list>
- Date fields using plain text input instead of date picker: <list>
- No character limit on text fields that have DB length constraints: <list>

════════════════════════════════════
SECTION 5 — NAVIGATION AUDIT
════════════════════════════════════

── SIDEBAR / MENU ──
For each navigation item:
| Item | Visible to roles | Should be visible to | Gap |
|---|---|---|---|

MENU ITEMS VISIBLE TO WRONG ROLES:
- <item>: visible to <role> but should not be — clicking leads to 403 or crash

MENU ITEMS MISSING FOR A ROLE:
- <role> is missing: <screen> — they have a screen but no nav link to reach it

── BREADCRUMBS ──
For each screen with a breadcrumb:
- Breadcrumb matches actual page hierarchy: Yes | No | MISSING ENTIRELY
- Breadcrumb links are all valid routes: Yes | No
- Screens with no breadcrumb that need one: <list>

── BACK NAVIGATION ──
For each detail/edit screen:
- Has back button or back link: Yes | No — MISSING
- Back button goes to correct parent screen: Yes | No — WRONG DESTINATION
- Back uses safe navigation (not browser history): Yes | No

════════════════════════════════════
SECTION 6 — DATA DISPLAY AUDIT
════════════════════════════════════
For each screen that shows data from the API:

── MISSING DATA DISPLAY ──
Fields the API returns but the screen never renders:
- <field name>: returned in API response but not shown anywhere on screen

── FORMATTING PROBLEMS ──
- Dates shown as raw ISO strings instead of human-readable format: <list>
- Numbers shown without formatting (no commas, no currency symbol): <list>
- Boolean values shown as "true"/"false" instead of readable labels: <list>
- Long text shown without truncation or expand control: <list>

── STATUS & BADGES ──
- Status fields shown as plain text with no badge/color coding: <list>
- Priority fields with no visual weight indicator: <list>

── TABLE PROBLEMS ──
- Columns that should be sortable but have no sort control: <list>
- No column that shows the most useful identifier first: <list>
- Table has no row action column (no edit/delete/view per row): <list>
- Pagination present: Yes | No — MISSING (if list can have many records)
- Page size control present: Yes | No

════════════════════════════════════
SECTION 7 — STATE HANDLING AUDIT
════════════════════════════════════
For each screen:

### Screen: <ScreenName>
- Loading state shown while data fetches: Yes | No | BLANK SCREEN
- Loading is per-section or whole-page spinner: <which>
- Error state shown if API call fails: Yes | No | CRASHES
- Error message is friendly (not raw JSON/stack trace): Yes | No
- Empty state shown when list is empty: Yes | No | NOTHING SHOWN
- Empty state has a call to action (e.g. "No invoices yet — Create one"): Yes | No
- Success feedback after create/edit/delete: Toast | Redirect | Nothing
- 404 screen shown for invalid record IDs (/entity/9999): Yes | No | CRASHES
- 403 screen shown when role has no access: Yes | No | CRASHES | BLANK

SESSION HANDLING:
- 401 response (token expired) redirects to login: Yes | No | SILENT FAIL
- Token refresh implemented: Yes | No

════════════════════════════════════
SECTION 8 — SECURITY AUDIT
════════════════════════════════════

── CLIENT-SIDE ONLY HIDING (security bug) ──
Sensitive data that is sent to the frontend but only hidden with CSS/v-if/ng-if:
- <field/section>: data is in the DOM but hidden — visible in DevTools

── DATA FETCH NOT ROLE-CHECKED ──
Screens where the route guard redirects but the data fetch inside the component
does NOT check the role — direct API calls can still leak data:
- <screen>: guard on route, but component fetches without role check

── ENUMERABLE IDs IN URLS ──
Routes using sequential integer IDs that can be incremented to access others' data:
- <route pattern>: uses /entity/:id where id is sequential integer

── ACTIONS WITHOUT BACKEND RE-VALIDATION ──
Actions where the frontend hides the button for unauthorized roles but the
backend does NOT enforce the same restriction — button can be triggered via API:
- <action>: hidden in UI for <role>, but backend endpoint has no role guard

════════════════════════════════════
SECTION 9 — ROLE → COMPLETE SCREEN MATRIX
════════════════════════════════════
For each role, a complete picture:

### Role: <RoleName>

SCREENS THEY CAN ACCESS: <list with status: COMPLETE | PARTIAL | MISSING>
SCREENS THEY CANNOT ACCESS: <list with guard status: BLOCKED | NOT BLOCKED (bug)>
MISSING SCREENS FOR THIS ROLE: <screens they need that don't exist at all>

KEY MISSING BUTTONS FOR THIS ROLE:
- On <ScreenName>: missing <button> — needed because <reason>

KEY MISSING FORM FIELDS FOR THIS ROLE:
- On <ScreenName>: missing <field> — in DB/API but not in form

════════════════════════════════════
FINAL REPORT
════════════════════════════════════
---FRONTEND AUDIT REPORT START---
ROLES FOUND: <list>
ROLES MISSING: <list>
SCREENS FOUND: <N> | COMPLETE: <N> | PARTIAL: <N> | MISSING: <N>

BUTTONS:
- Dead buttons (exist, no handler): <N>
- Missing buttons (should exist, don't): <N> — list them
- Wrong role visibility: <N>
- Icon-only with no label: <N>

FORMS:
- Fields in DB/API missing from forms: <N> — list them
- Error handling broken: <N> screens
- Double-submit not prevented: <N> forms
- Hardcoded dropdowns: <N>

NAVIGATION:
- Menu items for wrong roles: <N>
- Missing menu items per role: <N>
- Missing breadcrumbs: <N>
- Missing back buttons: <N>

DATA DISPLAY:
- Fields returned by API, never shown: <N>
- Formatting problems: <N>
- Missing status badges: <N>
- Missing sort controls: <N>

STATES:
- Missing loading states: <N>
- Raw errors shown to user: <N>
- Missing empty states: <N>
- 401 not handled: Yes | No
- 404 not handled: <N> screens

SECURITY:
- CSS-only hidden sensitive data: <N>
- Data fetches without role check: <N>
- Enumerable IDs in URLs: <N>
- Backend not enforcing what UI hides: <N>
---FRONTEND AUDIT REPORT END---`;

/** Phase 2 — frontend fixer (frontend audit). */
export const FRONTEND_AUDIT_PHASE_2_PROMPT = `[FRONTEND AUDIT 2/4 — FRONTEND FIXER]

Using the FRONTEND AUDIT REPORT from Phase 1, fix everything.
Work through each category in this exact order. Do not skip any section.

════════════════════════════════════
ORDER 1 — FIX ROLE DEFINITIONS
════════════════════════════════════
For each missing role constant:
- Add to the roles definition file following the existing pattern
- Replace any magic strings in guards/conditions with the constant
- Print: ✅ ROLE DEFINED: <RoleName> = "<value>" in <file>

════════════════════════════════════
ORDER 2 — FIX MISSING AND WRONG GUARDS
════════════════════════════════════
For each screen with no guard or wrong guard:
- Add/fix using the existing guard pattern (PrivateRoute, middleware, beforeEnter, etc.)
- Guard must check: (a) authenticated, (b) correct role
- Also add the role check inside the component's data fetch — not just on the route
- Print: ✅ GUARD FIXED: <screen> — roles: <list>

For each menu item visible to wrong role:
- Add role condition to the nav item render
- Print: ✅ NAV HIDDEN: <item> hidden from <role>

════════════════════════════════════
ORDER 3 — ADD MISSING BUTTONS
════════════════════════════════════
For each button in "MISSING BUTTONS" list from Section 3:
- Add the button in the correct position on the screen
- Wire it to the correct API call using the existing service/hook pattern
- Add role condition if it should only show for certain roles
- If API endpoint does not exist: create it in the backend too
- Print: ✅ BUTTON ADDED: <screen> → <button label> — calls <endpoint>

For each dead button:
- Wire the onClick to the correct action
- Print: ✅ BUTTON WIRED: <screen> → <button label> — now calls <action>

For each icon-only button:
- Add aria-label and tooltip
- Print: ✅ LABEL ADDED: <screen> → <icon> — label: "<text>"

For disabled buttons with no explanation:
- Add tooltip that explains why it is disabled and what the user must do
- Print: ✅ DISABLED REASON ADDED: <screen> → <button> — tooltip: "<text>"

════════════════════════════════════
ORDER 4 — FIX FORMS
════════════════════════════════════
For each field in DB/API missing from a form:
- Add the field using the existing form field component pattern
- Connect to the existing form state management (useState, formik, react-hook-form, etc.)
- Make sure it is included in the form submit payload
- Print: ✅ FIELD ADDED: <form> → <field name> (<type>)

For each form with swallowed API errors:
- Add error handling that maps 422 validation errors to the correct field
- Add a general error display for 500 errors (friendly message, not raw JSON)
- Print: ✅ ERROR HANDLING ADDED: <form>

For each form without double-submit protection:
- Disable the submit button after first click
- Re-enable only after response (success or error)
- Print: ✅ DOUBLE-SUBMIT FIXED: <form>

For each hardcoded dropdown that should fetch from API:
- Replace hardcoded options with an API fetch on component mount
- Add loading state while options load
- Print: ✅ DROPDOWN DYNAMIC: <form> → <field> — now fetches from <endpoint>

For each required field with no indicator:
- Add asterisk or "(required)" label following the existing convention
- Print: ✅ REQUIRED INDICATOR: <form> → <field>

════════════════════════════════════
ORDER 5 — FIX NAVIGATION
════════════════════════════════════
For each role missing a nav entry to a screen they have:
- Add the nav item to the correct menu/sidebar section
- Apply the correct role condition so only that role sees it
- Print: ✅ NAV ADDED: <item> visible to <role>

For each missing breadcrumb:
- Add breadcrumb following the existing breadcrumb component/pattern
- Make sure each crumb is a valid link to the correct parent route
- Print: ✅ BREADCRUMB ADDED: <screen>

For each missing or wrong back button:
- Add back button that navigates to the correct parent screen
- Use router.push('<route>') not browser history
- Print: ✅ BACK BUTTON FIXED: <screen> → goes to <route>

════════════════════════════════════
ORDER 6 — FIX DATA DISPLAY
════════════════════════════════════
For each field returned by API but never shown:
- Add it to the screen in the appropriate location
- Print: ✅ FIELD DISPLAYED: <screen> → shows <field>

For each formatting problem:
- Wrap dates with the existing date formatter or add one (e.g. dayjs, date-fns)
- Wrap currency/numbers with Intl.NumberFormat or existing formatter
- Replace true/false with readable labels
- Print: ✅ FORMATTING FIXED: <screen> → <field>

For each status field with no badge:
- Add a badge component using the existing badge/pill pattern
- Map each status value to a color (success/warning/danger/info)
- Print: ✅ BADGE ADDED: <screen> → <field>

For each column that should be sortable:
- Add sort control following existing table sort pattern
- Print: ✅ SORT ADDED: <screen> → <column>

For each list missing pagination:
- Add pagination component following the existing pattern
- Connect to the API pagination params (page, per_page)
- Print: ✅ PAGINATION ADDED: <screen>

════════════════════════════════════
ORDER 7 — FIX STATE HANDLING
════════════════════════════════════
For each screen missing a loading state:
- Add skeleton or spinner while data fetches
- Print: ✅ LOADING STATE ADDED: <screen>

For each screen showing raw errors:
- Catch API errors and show a friendly message
- Never show stack traces or raw JSON to the user
- Print: ✅ ERROR STATE FIXED: <screen>

For each screen missing an empty state:
- Add an empty state component with a call to action
- Example: "No invoices yet — Create your first invoice" with a create button
- Print: ✅ EMPTY STATE ADDED: <screen>

For each screen missing 404 handling:
- Add a check: if record not found (API returns 404), show a not-found message with a back link
- Print: ✅ 404 HANDLED: <screen>

Add global 401 handler if missing:
- Intercept all API calls — if response is 401, clear auth state and redirect to login
- Print: ✅ 401 HANDLER ADDED: in <API client file>

════════════════════════════════════
ORDER 8 — FIX SECURITY GAPS
════════════════════════════════════
For each case of CSS-only hidden sensitive data:
- Remove the data from the API response for unauthorized roles (fix in backend)
- OR: do not request it in the first place (remove from the API call)
- Print: ✅ SENSITIVE DATA REMOVED FROM DOM: <screen> → <field>

For each data fetch without role check:
- Add role check inside the component before making the API call
- If role is insufficient, render a 403 message instead of fetching
- Print: ✅ ROLE CHECK ADDED TO FETCH: <screen>

For each backend action not enforcing what UI hides:
- Add the role guard middleware to the backend endpoint
- Print: ✅ BACKEND GUARD ADDED: <METHOD> <path> — requires role <role>

════════════════════════════════════
ORDER 9 — BUILD MISSING SCREENS
════════════════════════════════════
For each completely missing screen:
- Create the full screen component following the existing file structure
- Include: layout, data fetch with loading/error/empty states, all required actions
- Add route to router
- Add nav entry for the correct role
- Add correct role guard
- Print: ✅ SCREEN BUILT: <ScreenName> for <role> — <files created>

End with:
---FRONTEND FIX SUMMARY START---
ROLE DEFINITIONS FIXED: <list>
GUARDS FIXED: <list>
BUTTONS ADDED: <N> — <list>
BUTTONS WIRED: <N> — <list>
FORM FIELDS ADDED: <N> — <list>
FORM ERROR HANDLING FIXED: <N>
NAV ITEMS FIXED: <N>
BREADCRUMBS ADDED: <N>
DATA DISPLAY FIXED: <N>
STATE HANDLING FIXED: <N>
SECURITY GAPS FIXED: <N>
SCREENS BUILT: <list>
STILL BROKEN (needs human decision): <list with reason>
---FRONTEND FIX SUMMARY END---`;
