# scaffold

Create the initial project structure for a greenfield application.

## When to run

- First skill in a new project build from an idea
- Before any code implementation begins

## What to do

1. **Read the project specification** from PRD.md, ARCHITECTURE.md, and ENV.md if they exist
2. **Create the directory structure** based on the architecture:
   - Standard layouts: `src/`, `tests/`, `docs/`, `scripts/`, `public/` (if web)
   - Framework-specific: follow conventions (e.g., `app/` for Next.js, `src/components/` for React)
3. **Initialize package manager** and core dependencies:
   - Run `npm init -y` or equivalent for the language
   - Install core frameworks/libraries specified in the tech stack
   - Configure package.json scripts (start, build, test, lint)
4. **Create configuration files**:
   - TypeScript: `tsconfig.json` with strict mode
   - Linting: `.eslintrc`, `.prettierrc` (or project equivalents)
   - Environment: `.env.example` with required variables
   - Git: `.gitignore` appropriate for the stack
5. **Set up entry points**:
   - Main application entry (`src/index.ts`, `src/main.ts`, etc.)
   - Basic hello world / health check endpoint to verify setup
6. **Create initial documentation**:
   - `README.md` with setup instructions
   - `CONTRIBUTING.md` if project will have multiple contributors

## Output format

Write a report to `.project-brain/scaffold.md`:

```
SUMMARY: Created initial project structure for [project name]
- Directory layout: [describe structure]
- Dependencies installed: [list key packages]
- Config files: [list created configs]
- Entry point: [main file created]

FINDINGS:
- Tech stack requirements: [list from spec]
- Package manager: [npm/yarn/pip/etc]
- Framework: [React/Express/Django/etc]
- Testing framework: [Jest/Pytest/etc]

STATE: COMPLETE
- All core directories created
- Package manager initialized
- Core dependencies installed
- Configuration files in place
- Basic entry point functional
- README.md created with setup guide

NEXT_SKILLS: database-design, api-design, auth-setup
```

## Rules

- Follow established conventions for the chosen tech stack
- Do NOT over-engineer — create minimal viable structure
- Ensure the project builds/runs after scaffolding (verify with a test command)
- Create `.env.example` but NEVER `.env` with actual secrets
- Use consistent naming conventions (kebab-case for files, camelCase/PascalCase for code)
- If the idea specifies a particular structure, follow it exactly
