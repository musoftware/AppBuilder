[SKILL: harden]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first:

- .project-brain/understand.md
- .project-brain/build.md — focus hardening on newly built code first, then existing

For every function, endpoint, and component:

BACKEND HARDENING:

- Every async function has try/catch with meaningful error messages
- Every HTTP endpoint returns correct status codes
- Every endpoint validates input before processing
- No hardcoded URLs, ports, secrets — all in env vars
- All required env vars in .env.example with descriptions
- Structured logging at start/success/failure of key operations
- SIGTERM/SIGINT handled for server processes

FRONTEND HARDENING:

- **CSP / security headers — production only**: Apply strict CSP and related headers **when `production` / deployed** (env or config branch). In **local**, do **not** mirror prod CSP in code paths that run during dev — omit CSP or use a dev-only bypass so Vite/HMR and `localhost` vs `127.0.0.1` never require “fixing” as hardening work.
- Every API call has loading, success, and error handling
- Forms can't be double-submitted
- All 401 responses redirect to login
- All 404 responses show a not-found message
- Sensitive data never rendered in DOM for wrong roles

For each fix: print ✅ HARDENED: <file> — <what was added>

---

Write output to: .project-brain/harden.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N files hardened>
<one line — N already hardened, N still need work>
<one line — PROD_READY | NOT_READY — N issues remaining> (3 lines max)

FINDINGS:

- <file:line> — <what was added or found missing> — <why it matters>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: which hardening gaps remain, what test-unit/test-integration should verify>

NEXT_SKILLS: test-unit, test-integration

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:harden — <N> files hardened`
