# api-design

Design and implement the API endpoints for the application.

## When to run

- After scaffold and database-design skills
- Before frontend implementation
- When the project exposes data or functionality via HTTP APIs

## What to do

1. **Analyze API requirements** from PRD.md and ARCHITECTURE.md:
   - List all operations users need to perform (CRUD + custom actions)
   - Identify resource relationships and nested routes
   - Note any real-time requirements (WebSockets, Server-Sent Events)

2. **Design the API surface**:
   - RESTful routes following consistent patterns (`GET /users`, `POST /users/:id/posts`)
   - Request/response schemas for each endpoint (use Zod, Joi, or equivalent)
   - Error response formats (consistent structure across all endpoints)
   - Pagination strategy (offset/limit or cursor-based)
   - Rate limiting rules per endpoint

3. **Implement the API**:
   - Create route handlers in organized structure (`routes/`, `controllers/`)
   - Add input validation middleware before any business logic
   - Implement error handling middleware (centralized, never leak stack traces)
   - Add request logging and timing
   - Write OpenAPI/Swagger spec if project requires API documentation

4. **Wire up to database**:
   - Use ORM or query builder for database operations
   - Implement proper transaction handling for multi-entity operations
   - Add optimistic/pessimistic locking where concurrent updates are possible

5. **Test endpoints**:
   - Verify each endpoint with valid and invalid inputs
   - Test error cases (404, 400, 401, 403, 409, 500)
   - Confirm response formats match the defined schemas

## Output format

Write a report to `.project-brain/api-design.md`:

```
SUMMARY: Designed and implemented API for [project name]
- Endpoints created: [count]
- Route structure: [describe organization]
- Validation: [describe validation approach]

FINDINGS:
- API style: [REST/GraphQL/gRPC/etc]
- Total endpoints: [count]
- Validation library: [Zod/Joi/custom/etc]
- Auth middleware: [describe if applicable]
- Rate limiting: [yes/no, strategy]

STATE: COMPLETE
- All routes defined with proper HTTP methods
- Request/response schemas validated on input
- Error handling centralized and consistent
- Database integration tested with CRUD operations
- API documentation generated (if required)

NEXT_SKILLS: auth-setup, deployment-config
```

## Rules

- Use proper HTTP methods and status codes (POST for create, 201 for created, 204 for no content)
- NEVER return database objects directly — always map to response DTOs
- Validate all inputs before processing (fail fast with clear error messages)
- Use consistent pagination format: `{ data: [], total: N, page: N, limit: N }`
- Implement idempotency keys for POST/PUT operations that modify state
- Add CORS configuration appropriate for the deployment environment
- Document any non-standard patterns or conventions used in the project
