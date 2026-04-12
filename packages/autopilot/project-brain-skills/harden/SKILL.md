[SKILL: harden]

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

Write output to: .project-brain/harden.md
Format:

# Harden Log

## Fixed

- <file>: <what was added>

## Already hardened (no change needed)

- <file>

Append to: .project-brain/work-log.md
Add: `[<date>] skill:harden — <N> files hardened`
