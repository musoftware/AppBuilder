---
name: laravel
description: Diagnose, fix, and improve Laravel applications. Use when the user mentions Laravel, artisan commands, Eloquent errors, migration issues, service providers, middleware, routes, controllers, models, policies, queues, or any Laravel-specific error (500 errors, SQLSTATE, 419 CSRF, TokenMismatch, Class not found). Also use when the user asks to generate Laravel boilerplate (models, controllers, migrations, seeders, policies), refactor code to follow Laravel best practices, debug artisan command failures, understand Laravel project structure, or work with Laravel packages like Livewire, Filament, Inertia, Sanctum, Breeze, Jetstream, or Horizon. Make sure to use this skill whenever the user mentions "laravel", "artisan", "eloquent", "php artisan", "migrate", "middleware", "service provider", "blade", "livewire", "filament", or any Laravel-related error or task, even if they don't explicitly say "use the Laravel skill".
---

# Laravel Expert

Diagnose, fix, and improve Laravel applications — from quick error fixes to architectural refactoring.

## When to Use This Skill

- **Error diagnosis**: 500 errors, SQLSTATE failures, 419 CSRF, Class not found, migration errors
- **Structure questions**: "What does this folder do?", "Where should I put X?"
- **Boilerplate generation**: Models, controllers, migrations, seeders, policies, Form Requests
- **Refactoring**: Fat controllers → service layer, repositories, DI, Resource classes
- **Debugging**: Artisan command failures, queue issues, auth problems, middleware loops
- **Package guidance**: Livewire, Filament, Inertia, Sanctum, Breeze, Jetstream, Horizon

## Project Analysis

Before making any changes, understand the project structure:

1. **Read `composer.json`** — Laravel version, installed packages, autoloading
2. **Check `.env`** — Database driver, queue connection, cache driver, app key, debug mode
3. **Scan `app/`** — What exists (Http/Controllers, Models, Providers, Services, Policies, Jobs)
4. **Check `routes/`** — web.php, api.php, console.php — what's defined
5. **Review `database/`** — migrations, seeders, factories — what schema exists
6. **Check `config/`** — Key config files (app.php, database.php, auth.php, queue.php)
7. **Look for packages** — Livewire components, Filament resources, Inertia controllers

**Red flags to watch for:**

- Business logic in routes files
- Database queries in controllers (should be models or services)
- No service providers for complex packages
- Hardcoded config values (should use `config()`)
- Missing CSRF protection on POST routes
- N+1 query problems (no eager loading)

## Diagnosis Workflow

When debugging an error, follow this order:

### 1. Check the Error Log

```bash
# Laravel logs (if logging is configured)
tail -n 50 storage/logs/laravel.log

# Or check the browser/HTTP response
curl -v http://your-app.test/problematic-route
```

### 2. Verify .env and Config

```bash
php artisan config:clear
php artisan cache:clear
php artisan env
```

### 3. Check Routes

```bash
php artisan route:list          # All registered routes
php artisan route:list --path=api  # Filter by prefix
```

### 4. Check Middleware

```bash
php artisan route:list --middleware=web  # See which routes use which middleware
```

### 5. Check Migrations

```bash
php artisan migrate:status        # Which migrations ran
php artisan migrate:fresh --seed  # Reset and seed (dev only!)
```

### 6. Check Queues (if applicable)

```bash
php artisan queue:failed          # Failed jobs
php artisan queue:work --tries=3  # Process with retries
```

### 7. Check Auth

```bash
php artisan make:auth             # If auth is missing (Laravel 8+)
# Or check config/auth.php for guards and providers
```

## Fix Execution

When applying fixes:

1. **Read existing code first** — Don't assume patterns; check how the project already does things
2. **Follow Laravel conventions** — Class names, file names, namespaces, directory structure
3. **Use artisan generators** — `php artisan make:model -mfs` (model + migration + factory + seeder)
4. **Test after changes** — Run migrations, clear caches, verify the fix
5. **Document breaking changes** — If the fix changes behavior, note it clearly

### Safe Patterns

**For database changes:**

```bash
# Always create new migrations, don't edit old ones
php artisan make:migration add_column_to_table

# Rollback and retry only if on dev
php artisan migrate:rollback
php artisan migrate:refresh
```

**For class generation:**

```bash
# Use artisan to create boilerplate, then customize
php artisan make:controller UserController --resource --model=User
php artisan make:policy PostPolicy --model=Post
php artisan make:request StoreBlogPostRequest
```

**For error diagnosis:**

```bash
# Get the actual error message and stack trace
php artisan tinker
>>> \App\Models\User::first();  # Test if model works

# Check if a class exists
php artisan tinker
>>> class_exists('App\Models\User');
```

## Reference Files

Load these as needed based on the task:

- **`references/structure.md`** — Laravel folder/file conventions (when user asks about project structure)
- **`references/common-errors.md`** — Known error patterns + fixes (when debugging errors)
- **`references/artisan.md`** — Artisan command reference (when using or debugging artisan)
- **`references/eloquent.md`** — ORM patterns, relationships, scopes (when working with models/queries)
- **`references/best-practices.md`** — Service layer, repositories, DI (when refactoring or architecting)

## Output Format

When providing fixes:

1. **For quick fixes** — Inline code patches with clear file paths
2. **For structural changes** — Step-by-step commands + file contents
3. **For refactoring** — Before/after comparison with explanations
4. **For debugging** — Root cause first, then fix, then verification steps

Always explain the **why** behind the fix — Laravel has strong conventions and understanding them helps the user avoid the same mistake next time.
