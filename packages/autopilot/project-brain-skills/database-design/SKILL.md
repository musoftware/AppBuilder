# database-design

Design and implement the database schema for the application.

## When to run

- After scaffold skill
- When the project requires data persistence
- Before API implementation begins

## What to do

1. **Analyze data requirements** from PRD.md and ARCHITECTURE.md:
   - Identify all entities mentioned in the requirements
   - Determine relationships between entities
   - Note any special data types or constraints

2. **Design the schema**:
   - Create entity/table definitions with proper naming conventions
   - Define primary keys, foreign keys, and indexes
   - Add constraints (NOT NULL, UNIQUE, CHECK) where appropriate
   - Consider normalization (3NF minimum) but allow denormalization for performance if justified

3. **Implement the schema**:
   - For SQL databases: Create migration files in `migrations/` or `prisma/migrations/`
   - For ORMs (Prisma, TypeORM, Drizzle): Update schema definition files
   - For NoSQL: Create collection definitions and validation rules
   - Include both UP and DOWN migrations

4. **Create seed data** (if applicable):
   - Basic lookup tables (roles, categories, statuses)
   - Test data for development environment
   - Admin/superuser account if authentication is required

5. **Document the schema**:
   - Add comments to complex fields or relationships
   - Create `docs/DATABASE.md` with entity relationship description
   - Note any assumptions or design decisions

## Output format

Write a report to `.project-brain/database-design.md`:

```
SUMMARY: Designed and implemented database schema for [project name]
- Entities created: [count and list]
- Relationships: [describe key relationships]
- Migration files: [count and location]

FINDINGS:
- Database type: [PostgreSQL/MySQL/MongoDB/etc]
- ORM/Framework: [Prisma/TypeORM/raw SQL/etc]
- Total entities: [count]
- Total relationships: [count]
- Indexes added: [count and purpose]

STATE: COMPLETE
- All entities defined with proper types and constraints
- Relationships established with referential integrity
- Migration files created and tested
- Seed data provided for initial setup
- Schema documented in docs/DATABASE.md

NEXT_SKILLS: api-design, auth-setup
```

## Rules

- Use singular names for models, plural for tables/collections (e.g., `User` model → `users` table)
- Always include `created_at` and `updated_at` timestamps unless explicitly not needed
- Index foreign keys and frequently queried fields
- Use UUIDs for primary keys unless sequential integers are specifically required
- Never store plaintext passwords — always hash with bcrypt/argon2
- Add database-level constraints in addition to application-level validation
- Test migrations can be applied cleanly on a fresh database
