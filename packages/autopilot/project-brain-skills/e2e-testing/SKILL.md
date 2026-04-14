---
name: e2e-testing
description: Guide for running end-to-end tests of the application, including headless mode, integration testing, and API traffic inspection. Use this skill whenever you need to verify end-to-end behavior with real user flows, reproduce reported bugs, test API integrations, or inspect request/response payloads.
---

# E2E Testing Guide

How to run end-to-end tests — from building the application to inspecting API traffic. Use when unit tests aren't enough and you need to verify behavior through the full pipeline.

## Which binary to use

- **Reproducing bugs**: use the globally installed CLI command — this matches what the user ran when they filed the issue.
- **Verifying fixes**: build first, then run the local build — this tests your changes.

## Headless Mode

Run tests non-interactively with structured output:

```bash
npx playwright test --reporter=list
# or
npm run test:e2e
```

Key output types:

- `PASS` — test succeeded
- `FAIL` — test failed with error details
- `SKIP` — test was skipped (reason provided)

## Inspecting Raw API Traffic

When debugging API behavior (wrong arguments, schema issues), enable API logging:

```bash
# Configure your test harness to log requests
# Each API call produces a JSON file with request/response payloads
```

Structure of logged API logs:

```json
{
  "request": {
    "method": "GET|POST|...",
    "url": "...",
    "headers": {},
    "body": {}
  },
  "response": {
    "status": 200,
    "headers": {},
    "body": {}
  }
}
```

## Interactive Testing

Use when you need to verify UI rendering, user flows, or see what the user sees.

### Launching

```bash
# Start your application
npm run dev
# or
npm start
```

### Running E2E Tests

```bash
npx playwright test
# or with UI
npx playwright test --ui
```

### Capturing output

Review test reports generated in `playwright-report/`

## API Testing

For testing API behavior end-to-end:

```bash
# Run API tests
curl -X GET http://localhost:3000/api/endpoint
# or use your test framework
```

## Tips

- Use interactive mode when the bug involves UI rendering, user flows, or visual issues.
- Use headless mode for CI/CD pipelines and quick smoke tests.
- Always verify both happy path and error scenarios.
- Test with realistic data that matches production patterns.
