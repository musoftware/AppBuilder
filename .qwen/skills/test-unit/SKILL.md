[SKILL: test-unit]

Read first:

- .project-brain/understand.md — get test framework and backend stack
- .project-brain/build.md — focus on newly built code first
- If no backend (HAS BACKEND: No) → print "No backend — skill skipped" and stop

Use the existing test framework. Follow existing test file naming conventions.

For every exported backend function and class method:

- Happy path test: correct inputs → correct output
- Edge case tests: null, empty, boundary values
- Error case tests: invalid inputs → correct error thrown/returned
- Mock all external dependencies

After writing each file: print ✅ TEST FILE: <filename> (<N> tests)

---

Write output to: .project-brain/test-unit.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — N test files created/updated>
<one line — N tests total, estimated coverage %>
<one line — PASS | FAIL — N failures> (3 lines max)

FINDINGS:

- <file:line> — <test file: what it covers> — <PASS|FAIL|MISSING>
  (references only — never embed raw code blocks)

STATE:
<1–3 sentences: coverage gaps, functions not yet tested, what test-fix should address>

NEXT_SKILLS: test-integration, test-fix

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-unit — <N> test files, <N> tests total`
