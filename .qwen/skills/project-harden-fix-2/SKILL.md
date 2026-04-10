---
name: project-harden-fix-2
description: Project hardening block B step 2 of 3 — identify critical missing features or integrations implied by user focus and product surface (not a wishlist).
---

# Fix & gaps — Step 2: Critical missing features

You are **step 2 of 3** in the **Fix & gaps** block.

## Goals

- From the user focus + inventory/architecture, list **missing** pieces that are **critical** for correctness, security, or core UX — not nice-to-haves.
- Examples: unhandled error paths, missing validation, absent auth check, incomplete CLI flag, missing migration for a breaking change.
- Each item: **why critical**, **who is affected**, **rough effort**.

## Rules

- Stay **evidence-based** (code paths, TODOs, failing scenarios).
- Do **not** implement yet — planning for step 3.

## Output

- Ranked list (P0/P1) with file/symbol hints.
- Items explicitly **out of scope** for this hardening run (one line each).

Next phase implements fixes and missing P0/P1 items.
