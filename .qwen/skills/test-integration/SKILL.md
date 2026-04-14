[SKILL: test-integration]

Read first:

- .project-brain/understand.md
- .project-brain/audit-backend.md

For every API endpoint and every user flow:

- Full request → response test with real DB (test database, never production)
- Auth flows: login, logout, token refresh, protected route rejection
- CRUD flows: create → read → update → delete for every entity
- Role access: each role gets 200 on its routes, 403 on others, 401 when unauth
- Error flows: missing fields, invalid IDs, DB failures

After writing each file: print ✅ INTEGRATION TEST: <filename> (<N> tests)

---

Write output to: .project-brain/test-integration.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N integration test files created/updated>
<one line — flows covered: auth, CRUD, role-access, error paths>
<one line — PASS | FAIL — N failures> (3 lines max)

FINDINGS:

- <file:line> — <flow tested> — <PASS|FAIL|MISSING>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: flows not yet covered, failures needing fixes, what test-e2e or test-fix should handle>

NEXT_SKILLS: test-e2e, test-fix

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-integration — <N> test files`
