# deployment-config

Create deployment configuration and CI/CD pipelines for the application.

## When to run

- After core features are implemented
- Before production deployment
- When the project needs to be hosted or shared

## What to do

1. **Determine deployment target** from requirements or tech stack:
   - Container orchestration (Docker + Kubernetes/ECS)
   - Platform as a Service (Vercel, Heroku, Railway, Fly.io)
   - Cloud providers (AWS, GCP, Azure)
   - Self-hosted (VPS with nginx/pm2)
   - If not specified, choose the simplest option that fits the stack

2. **Create Docker configuration** (if applicable):
   - Multi-stage `Dockerfile` optimized for production (small image, no dev deps)
   - `.dockerignore` to exclude unnecessary files
   - `docker-compose.yml` for local development with dependencies (DB, Redis, etc.)
   - Health check endpoint configured in container

3. **Set up CI/CD pipeline**:
   - GitHub Actions / GitLab CI / equivalent workflow
   - Automated tests on every push (unit, integration, linting)
   - Build and push Docker image on main branch merge
   - Deploy to staging on PR merge, production on release tag
   - Environment variable injection from CI secrets

4. **Configure environment management**:
   - Create `.env.example` with all required variables documented
   - Set up environment-specific configs (development, staging, production)
   - Configure logging levels per environment
   - Set up error tracking (Sentry, LogRocket, or equivalent) if applicable

5. **Create deployment documentation**:
   - `docs/DEPLOYMENT.md` with step-by-step instructions
   - Required infrastructure dependencies (databases, caches, queues)
   - Scaling considerations (horizontal vs vertical)
   - Backup and disaster recovery strategy
   - Rollback procedures

6. **Add production readiness checks**:
   - Health check endpoint (`/health` or `/healthz`)
   - Readiness probe for load balancer (checks DB connection, dependencies)
   - Graceful shutdown handling (finish in-flight requests, close connections)
   - Resource limits (memory, CPU) configured
   - Log aggregation strategy (structured JSON logs)

## Output format

Write a report to `.project-brain/deployment-config.md`:

```
SUMMARY: Configured deployment for [project name] to [target platform]
- Docker: [yes/no, multi-stage]
- CI/CD: [GitHub Actions/GitLab CI/etc]
- Environments: [dev/staging/prod]

FINDINGS:
- Deployment target: [Vercel/Heroku/K8s/VPS/etc]
- Docker image size: [MB]
- CI pipeline: [steps configured]
- Health checks: [endpoint path]
- Monitoring: [Sentry/Datadog/etc or none]

STATE: COMPLETE
- Dockerfile builds successfully and runs
- docker-compose starts all services
- CI pipeline passes on push
- Environment variables documented
- Deployment instructions written and tested
- Health check endpoint responding
- Graceful shutdown verified

NEXT_SKILLS: none
```

## Rules

- Use multi-stage Docker builds to minimize production image size
- Never commit secrets or `.env` files to version control
- Configure proper signal handling for graceful shutdown (SIGTERM → cleanup → exit)
- Set resource limits (memory/CPU) to prevent runaway containers
- Use specific image tags, never `latest` in production deployments
- Document ALL environment variables required for the app to start
- Include rollback instructions in deployment docs (how to revert to previous version)
- Test the full deployment pipeline at least once before marking complete
