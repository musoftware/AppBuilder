[SKILL: audit-database]

> **Brain root:** If env `QWEN_PROJECT_BRAIN_DIR` is set to a safe relative path, use that folder instead of `.project-brain` for every path below.

Read first:

- .project-brain/understand.md
- All schema, migration, model, and type definition files

For every entity:

### Entity: <Name>

SCHEMA:
| Field | Type | Required | In DB | In Model | In API response | In forms |
|---|---|---|---|---|---|---|

MISSING FIELDS:

- Fields the features clearly need but schema doesn't have
- Fields other entities have (like created_by, updated_at) that this one is missing

MISSING RELATIONS:

- Relations the features reference but aren't defined in the schema

MISSING ENTITIES:
Based on app type and existing features, what tables MUST exist but don't?

- <entity>: needed because <reason>

INDEX & CONSTRAINT GAPS:

- Columns used in WHERE/filter queries with no index
- Unique constraints that should exist but don't

---

Write output to: .project-brain/audit-database.md using EXACTLY this format (all four sections, in this order — report is INVALID if any section is missing):

SUMMARY:
<one line — entities audited>
<one line — schema/relation gaps found>
<one line — PROD_READY | NOT_READY — N issues total> (3 lines max)

FINDINGS:

- <file:line> — <what> — <why>
  (references only — never embed raw code blocks; next skill reads files fresh from disk)

STATE:
<1–3 sentences: which entities have critical missing fields/relations, what migrations are needed>

NEXT_SKILLS: <comma-separated skill names, or none>

Rules:

- Never embed raw code. Use file:line references only.
- VERDICT: FAIL only for unrecoverable errors.

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-database — <N> schema gaps found`
