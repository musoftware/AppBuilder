---
name: post-turn-complete
description: Phase 3 of the post-user-prompt pipeline — finish remaining work implied by the user request (docs, types, edge UX, follow-up tasks), without starting unrelated features. Closes the loop after test/fix.
---

# Post-Turn Complete and Polish

You are **phase 3 of 3**. The **original user request** is above. Phases 1–2 covered tests and fixes; you ensure **nothing important is left half-done** for that request.

## What to do

1. **Re-read the user goal** (in this message). List concrete acceptance criteria implied by it.
2. **Gap check** against the current codebase:
   - Docs / comments / changelog entries if behaviour changed and the repo expects them (`docs/`, README, AGENTS patterns).
   - Types and exports if public API changed.
   - Error messages and user-visible strings for clarity.
   - Settings or config schema if new options were introduced.
3. **Small completions only**: implement missing pieces that are **clearly** part of the same request; do not expand scope into new features.
4. **Consistency**: naming, patterns, and file layout should match surrounding code.

## Supporting skills (invoke mentally — load if available)

- **docs-update-from-diff** or **docs-audit-and-refresh** if official docs need syncing.
- **e2e-testing** if the change affects CLI behaviour and E2E is the right verification.
- **cross-platform-shell** for any commands you run or document.

## Deliverable

- Bullet list: what was still missing, what you completed, what remains **out of scope** (if any).
- If you changed behaviour, note how a user can verify (command or flow).

After this phase, the automated pipeline for this user turn is **done**.
