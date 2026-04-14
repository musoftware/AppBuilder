[SKILL: audit-frontend]

Read first:

- .project-brain/understand.md — if HAS FRONTEND is No, print "No frontend found — skill skipped" and stop.
- .project-brain/audit-frontend.md — if exists, only re-check changed files

AUDIT EVERY FRONTEND FILE:

1. SCREEN INVENTORY
   For every screen/page/view:

- Route path
- Roles that should access it
- Auth guard: present | missing | wrong role
- In navigation menu: Yes | No

2. BUTTONS & ACTIONS (most critical)
   For every screen, check BOTH:

A) BUTTONS THAT EXIST:
| Button | Has handler | Calls API | Endpoint exists |
|---|---|---|---|

Dead buttons (no handler): list
Wrong wiring (calls wrong endpoint): list

B) BUTTONS THAT SHOULD EXIST FOR THIS SCREEN TYPE:
Based on what data the screen shows and what the user role needs:

- Create button: exists | MISSING
- Edit button: exists | MISSING
- Delete with confirm: exists | MISSING
- Export/Print: exists | MISSING (if applicable)
- Approve/Reject: exists | MISSING (if applicable)
- Assign: exists | MISSING (if applicable)
- Role-specific admin actions: exists | MISSING (if applicable)

3. FORMS
   For every form:

- Fields in DB/API but missing from form: list
- Fields missing from domain perspective: list
- API validation errors (422) shown to user: Yes | No — SWALLOWED
- Submit disabled during loading (prevents double-submit): Yes | No
- Required field indicators: Yes | No

4. NAVIGATION

- Menu items visible to wrong roles: list
- Menu items missing for roles that need them: list
- Missing breadcrumbs: list
- Missing back buttons: list

5. DATA DISPLAY

- Fields returned by API but never shown: list
- Dates/numbers shown without formatting: list
- Status fields with no badge/color: list
- Lists with no pagination: list

6. STATE HANDLING
   For every screen:

- Loading state: Yes | No
- Error state (friendly message): Yes | No | SHOWS RAW ERROR
- Empty state with call-to-action: Yes | No
- 404 for invalid IDs: Yes | No | CRASHES
- 401 mid-session redirect to login: Yes | No | SILENT FAIL

7. SECURITY

- Sensitive data in DOM hidden only by CSS/v-if: list
- Data fetches without role check inside component: list
- Actions hidden in UI but backend has no guard: list

---

Write output to: .project-brain/audit-frontend.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — what was audited>
<one line — number of UI gaps found>
<one line — PROD_READY | NOT_READY — N issues total> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which screens/components have critical gaps, what audit-roles or build should focus on>

NEXT_SKILLS: <comma-separated skill names, or none>

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-frontend — found <N> gaps`
