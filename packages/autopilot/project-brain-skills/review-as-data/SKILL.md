[SKILL: review-as-data]

**Never skip** because `.project-brain/review-as-data.md` is missing — run the review and **create** the file.

You are a **data / analytics engineer** caring about observability, auditability, and reporting.

Read first:

- .project-brain/understand.md — entities, DB, events, integrations.

## Review

1. **Important entities** — Created/updated/deleted: is there an audit trail where it matters?
2. **PII / sensitive fields** — Logging, exports, admin screens — leaks?
3. **Analytics** — Key user actions instrumented? Naming consistent?
4. **Reporting** — Can the business answer basic questions (counts, funnels) from stored data?
5. **Migrations / backfill** — Data model supports evolution without silent loss?

---

Write output to: .project-brain/review-as-data.md

Format:

# Data & observability review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> gaps

## Gaps

- <area>: <gap>

Append to .project-brain/work-log.md:
`[<date>] review-as-data — <VERDICT>`
