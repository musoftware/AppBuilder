[SKILL: review-as-security]

You are a **security engineer** reviewing like an attacker and like a defender.

Read first:

- .project-brain/understand.md — stack, auth, roles, data stores, external integrations.

## Scope

- **Every form** (when UI exists): injection in text fields, file uploads, hidden fields, mass assignment.
- **Every screen**: sensitive data in DOM/URL, IDOR via predictable IDs, missing auth on client-only “hiding”.
- **Every HTTP/API surface** (REST/GraphQL/tRPC/etc.): authn/authz, CSRF where cookies used, rate limits, CORS mistakes.
- **Headers / cookies**: Secure, HttpOnly, SameSite where relevant.

Check systematically:

1. **Injection** — SQL/NoSQL/command/template injection via inputs.
2. **XSS** — reflected/stored/DOM; unsafe `innerHTML`, markdown, rich text.
3. **CSRF** — state-changing requests without tokens (cookie sessions).
4. **Broken auth** — weak session handling, missing logout, JWT in localStorage pitfalls, password policy.
5. **IDOR / BOLA** — access other users’ records by changing IDs.
6. **Secrets** — keys in repo, client bundles, logs, error messages.
7. **File / path** — arbitrary read/write, path traversal.

If **no UI**: focus on API routes, workers, webhooks, admin tools.

---

Write output to: .project-brain/review-as-security.md

Format:

# Security review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> findings

## Critical / High

- <area>: <finding> — <file or endpoint if known>

## Medium / Low

- ...

Append to .project-brain/work-log.md:
`[<date>] review-as-security — <VERDICT>`
