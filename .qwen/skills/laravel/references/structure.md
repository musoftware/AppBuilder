# Laravel Project Structure

This document maps every Laravel folder and its purpose.

## Root Directory

```
project-root/
├── app/                  # Application code (controllers, models, services)
├── bootstrap/            # Framework bootstrapping + cache files
├── config/               # Configuration files (database, mail, auth, etc.)
├── database/             # Migrations, seeders, factories
├── lang/                 # Localization / translation files
├── public/               # Web root (index.php, assets)
├── resources/            # Views, JS, CSS (compiled to public/)
├── routes/               # Route definitions (web, api, console)
├── storage/              # Logs, compiled views, uploads, cache
├── tests/                # PHPUnit / Pest tests
├── vendor/               # Composer dependencies (DO NOT EDIT)
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Template for .env
├── composer.json         # PHP dependencies + autoloading
├── artisan               # CLI entry point
└── vite.config.js        # Vite config (Laravel 9+)
```

## `app/` — Application Code

```
app/
├── Console/
│   └── Kernel.php              # Artisan commands + scheduling
├── Exceptions/
│   └── Handler.php             # Exception handling + reporting
├── Http/
│   ├── Controllers/            # Request handlers
│   │   └── Controller.php      # Base controller
│   ├── Middleware/             # Request/response filters
│   └── Kernel.php              # Middleware registration
├── Models/                     # Eloquent models (Laravel 8+)
│   └── User.php                # Default user model
├── Providers/
│   ├── AppServiceProvider.php  # Boot + register bindings
│   ├── AuthServiceProvider.php # Policies + gates
│   ├── BroadcastServiceProvider.php
│   ├── EventServiceProvider.php # Event listeners
│   └── RouteServiceProvider.php # Route loading
├── Policies/                   # Authorization policies
├── Services/                   # Business logic (if using service layer)
├── Jobs/                       # Queueable jobs
├── Events/                     # Event classes
├── Listeners/                  # Event listeners
├── Notifications/              # User notifications
├── Mail/                       # Mailable classes
└── Rules/                      # Custom validation rules
```

## `database/` — Schema & Data

```
database/
├── migrations/                 # Schema versioning
│   ├── 2024_01_01_000000_create_users_table.php
│   └── 2024_01_01_000001_create_posts_table.php
├── seeders/                    # Database seeding
│   ├── DatabaseSeeder.php
│   └── UserSeeder.php
└── factories/                  # Model factories for testing
    └── UserFactory.php
```

## `routes/` — Route Definitions

```
routes/
├── web.php                     # Web routes (session state, CSRF, cookies)
├── api.php                     # API routes (stateless, rate limited)
├── console.php                 # Artisan commands
└── channels.php                # Broadcasting channels
```

## `config/` — Configuration

```
config/
├── app.php                     # App name, locale, timezone, providers
├── auth.php                    # Guards, providers, password reset
├── database.php                # Connections, Redis, migrations
├── queue.php                   # Queue drivers (sync, database, Redis, SQS)
├── cache.php                   # Cache drivers (file, Redis, memcached)
├── session.php                 # Session driver, lifetime, path
├── mail.php                    # Mail driver, from address
├── filesystems.php             # Storage disks (local, S3)
├── logging.php                 # Log channels (stack, single, daily)
├── view.php                    # View compilation paths
└── services.php                # Third-party service config
```

## `resources/` — Frontend Assets

```
resources/
├── views/                      # Blade templates
│   ├── layouts/
│   │   └── app.blade.php
│   ├── components/             # Blade components (Laravel 7+)
│   └── welcome.blade.php
├── js/                         # JavaScript (compiled by Vite)
│   ├── app.js
│   └── bootstrap.js
└── css/                        # CSS (compiled by Vite)
    └── app.css
```

## `storage/` — Runtime Files

```
storage/
├── app/                        # Application storage
│   └── public/                 # Public files (user uploads)
├── framework/
│   ├── cache/                  # File cache data
│   ├── sessions/               # Session files
│   └── views/                  # Compiled Blade templates
└── logs/
    └── laravel.log             # Application logs
```

## Key Files to Check First

When diagnosing a project:

1. `composer.json` — Laravel version, packages
2. `.env` — Database, queue, cache, mail config
3. `routes/web.php` + `routes/api.php` — What routes exist
4. `app/Http/Kernel.php` — Middleware stack
5. `config/app.php` → `providers` — Service providers registered
6. `storage/logs/laravel.log` — Error messages
