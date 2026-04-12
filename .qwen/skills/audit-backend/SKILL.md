[SKILL: audit-backend]

Read first:

- .project-brain/understand.md — know the stack and what exists
- .project-brain/audit-backend.md — if exists, only check what changed since last run

AUDIT EVERY BACKEND FILE:

1. ENDPOINT COMPLETENESS
   For every entity in the system, check CRUD:

- GET /entities (list) — EXISTS | MISSING
- GET /entities/:id (show) — EXISTS | MISSING
- POST /entities (create) — EXISTS | MISSING
- PUT /entities/:id (update) — EXISTS | MISSING
- DELETE /entities/:id (delete) — EXISTS | MISSING
  For each existing endpoint:
- Auth guard applied: Yes | No — MISSING GUARD
- Role check applied: Yes | No — MISSING ROLE CHECK
- Input validation: Yes | No | Partial
- Error handling: Yes | No | Partial
- Returns correct HTTP status codes: Yes | No

2. BUSINESS LOGIC GAPS
   Based on the app type (from understand.md), what endpoints MUST exist
   for a professional app of this type that are completely missing?

- <missing endpoint>: needed because <reason>

3. VALIDATION GAPS

- Endpoints that accept input but have no validation
- Endpoints that validate some fields but miss required ones

4. SECURITY GAPS

- Endpoints accessible without auth that should require it
- Endpoints with auth but no role check
- Endpoints that don't check record ownership (user can edit other's data)
- Sensitive data returned that should be hidden for certain roles

5. MISSING BACKEND FOR FRONTEND
   Read understand.md — if frontend exists, check every API call the frontend makes.
   List every call that has no matching backend endpoint.

---

Write output to: .project-brain/audit-backend.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — what was audited>
<one line — number of gaps found by category>
<one line — PROD_READY | NOT_READY — N issues total> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which endpoint categories are complete vs missing, what the plan/build skills should prioritize>

NEXT_SKILLS: <comma-separated skill names, or none>

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL (not NOT_READY) only for unrecoverable errors (e.g. cannot read source files).

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-backend — found <N> gaps`
