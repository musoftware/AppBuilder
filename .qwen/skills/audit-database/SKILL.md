[SKILL: audit-database]

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

Write output to: .project-brain/audit-database.md

Append to: .project-brain/work-log.md
Add: `[<date>] skill:audit-database — <N> schema gaps found`
