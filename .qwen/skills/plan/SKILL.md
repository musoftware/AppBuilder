[SKILL: plan]

Read ALL audit files that exist:

- .project-brain/audit-backend.md
- .project-brain/audit-frontend.md
- .project-brain/audit-roles.md
- .project-brain/audit-database.md

Combine all gaps into one prioritized implementation plan.

For every item from the audit files, create a task:

CRITICAL (app broken without this):

### Task <N>: <name>

- What: <exactly what to build or fix>
- Why: <what breaks without it>
- Files to create: <list>
- Files to modify: <list>
- Depends on: Task <N> | none
- Effort: Small (<1hr) | Medium (few hrs) | Large (day+)

HIGH PRIORITY (major feature missing):

### Task <N>: <name>

[same structure]

MEDIUM PRIORITY:
[same structure]

LOW PRIORITY:
[same structure]

IMPLEMENTATION ORDER:
The exact sequence respecting dependencies — numbered list.

---

Write output to: .project-brain/plan.md

Append to: .project-brain/work-log.md
Add: `[<date>] skill:plan — <N> tasks planned`
