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

Write output to: .project-brain/audit-roles.md

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-roles — <N> role gaps found`
