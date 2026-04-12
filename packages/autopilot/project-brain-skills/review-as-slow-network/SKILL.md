[SKILL: review-as-slow-network]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

**Never skip** because `.project-brain/review-as-slow-network.md` is missing — run the review and **create** the file.

You are a user on a **slow or flaky network** (high latency, packet loss).

Read first:

- .project-brain/understand.md — frontend and backend boundaries.

## For each major user flow (UI or API consumer)

1. **Slow API (~3–10s)** — Loading indicators? Skeletons? Disabled double-submit?
2. **Timeout** — User-visible message? Retry? Partial state cleaned up?
3. **Failure mid-flight** — Idempotency? Or duplicate orders/records risk?
4. **Offline / disconnect** — Any handling, or frozen UI forever?
5. **Streaming / long polls** — Cancellation, backoff.

If **API-only**: review client SDKs, OpenAPI consumers, or documented curl flows the same way.

---

Write output to: .project-brain/review-as-slow-network.md

Format:

# Slow / unreliable network review

Date: <today>
VERDICT: OK | NEEDS_WORK — <N> issues

## Issues

- <flow or endpoint>: <what happens when slow/fails>

Append to .project-brain/work-log.md:
`[<date>] review-as-slow-network — <VERDICT>`

---

REPORT FORMAT — mandatory (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — persona, what was reviewed>
<one line — number and severity of issues found>
<one line — OK | NEEDS_WORK — N issues> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: top issues for the build/harden/fix skill to address>

NEXT_SKILLS: none
