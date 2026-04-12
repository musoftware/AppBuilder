[SKILL: audit-roles]

Read first:

- .project-brain/understand.md
- .project-brain/audit-backend.md (if exists)
- .project-brain/audit-frontend.md (if exists)

For every role found in understand.md:

### Role: <RoleName>

BACKEND:

- Role constant defined: Yes | No — where
- Auth middleware exists: Yes | No
- Applied to correct routes: Yes | Partial | No
- Routes this role can access that have no guard: list
- Routes this role cannot access but guard is missing: list

FRONTEND (if HAS FRONTEND):

- Dashboard/home screen: EXISTS | MISSING
- Navigation entries for all their screens: COMPLETE | MISSING <list>
- Buttons they need but are missing: list (per screen)
- Screens they should not access but can: list

MISSING ROLES:
Based on app type from understand.md, what roles MUST exist but don't?

- <role>: needed because <reason>
  Required screens: <list>
  Required permissions: <list>

---

Write output to: .project-brain/audit-roles.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — roles audited>
<one line — role gaps found>
<one line — PROD_READY | NOT_READY — N issues total> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which roles have missing guards or screens, what build should implement first>

NEXT_SKILLS: <comma-separated skill names, or none>

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-roles — <N> role gaps found`
