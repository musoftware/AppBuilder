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

Write output to: .project-brain/test-unit.md
Format:

# Unit Test Log

## Files Created

- <filename>: <N> tests — covers <what>

## Coverage Estimate

- <N>% of exported functions covered

Append to: .project-brain/work-log.md
Add: `[<date>] skill:test-unit — <N> test files, <N> tests total`
