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

Write output to: .project-brain/test-integration.md
Format:

# Integration Test Log

## Files Created

- <filename>: <N> tests

## Flows Covered

- <flow name>: covered

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-integration — <N> test files`
