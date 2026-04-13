# Artisan Command Reference

Essential Artisan commands organized by task.

## Application Info

```bash
# Show all registered routes
php artisan route:list
php artisan route:list --path=api    # Filter by path
php artisan route:list --method=POST # Filter by method

# Show all registered commands
php artisan list

# Show environment and config
php artisan env
php artisan config:show               # Show all config
php artisan config:show database      # Show specific config group

# Show application info (Laravel 11+)
php artisan about
```

## Database

```bash
# Migrations
php artisan make:migration create_users_table
php artisan make:migration add_phone_to_users --table=users
php artisan migrate                    # Run pending migrations
php artisan migrate --force            # Run in production (required flag)
php artisan migrate:rollback           # Rollback last batch
php artisan migrate:rollback --step=3  # Rollback 3 batches
php artisan migrate:fresh              # Drop all tables and rerun
php artisan migrate:fresh --seed       # Fresh + seed
php artisan migrate:status             # Show migration status
php artisan migrate:reset              # Rollback all migrations

# Seeders
php artisan make:seeder UserSeeder
php artisan db:seed                    # Run all seeders
php artisan db:seed --class=UserSeeder # Run specific seeder
php artisan db:seed --force            # Run in production

# Tinker (interactive REPL)
php artisan tinker
>>> User::all();
>>> User::find(1);
>>> User::create(['name' => 'Test', 'email' => 'test@example.com']);
```

## Code Generation

```bash
# Controllers
php artisan make:controller UserController
php artisan make:controller UserController --resource  # CRUD methods
php artisan make:controller UserController --api       # API methods (no create/edit)
php artisan make:controller UserController --model=User --resource

# Models
php artisan make:model User
php artisan make:model User -mfs  # Model + Migration + Factory + Seeder
php artisan make:model User -a    # Model + all related files

# Middleware
php artisan make:middleware EnsureEmailIsVerified
php artisan make:middleware CheckRole

# Requests (Form Validation)
php artisan make:request StoreUserRequest
php artisan make:request UpdateUserRequest

# Policies (Authorization)
php artisan make:policy PostPolicy
php artisan make:policy PostPolicy --model=Post

# Jobs (Queue)
php artisan make:job ProcessPodcast
php artisan make:job SendEmail --queued

# Events & Listeners
php artisan make:event PodcastProcessed
php artisan make:listener SendPodcastNotification --event=PodcastProcessed

# Notifications
php artisan make:notification InvoicePaid

# Mailables
php artisan make:mail OrderShipped
php artisan make:mail OrderShipped --markdown=emails.orders.shipped

# Rules (Custom Validation)
php artisan make:rule Uppercase
php artisan make:rule Lowercase

# Resources (API Transformations)
php artisan make:resource UserResource
php artisan make:resource UserResourceCollection

# Tests
php artisan make:test UserTest
php artisan make:test UserTest --unit

# Providers
php artisan make:provider RiakServiceProvider
```

## Cache

```bash
php artisan cache:clear              # Clear application cache
php artisan config:clear             # Clear config cache
php artisan route:clear              # Clear route cache
php artisan view:clear               # Clear compiled views

# Clear all at once
php artisan optimize:clear

# Cache routes and config (production optimization)
php artisan route:cache
php artisan config:cache
php artisan optimize                 # Cache routes + config + views
```

## Queues

```bash
# Workers
php artisan queue:work               # Start worker
php artisan queue:work --tries=3     # Retry failed jobs 3 times
php artisan queue:work --timeout=300 # Timeout in seconds
php artisan queue:work --memory=512  # Memory limit in MB
php artisan queue:listen             # Auto-restart worker (dev)

# Failed jobs
php artisan queue:failed             # List failed jobs
php artisan queue:retry all          # Retry all failed jobs
php artisan queue:retry 1 2 3        # Retry specific IDs
php artisan queue:flush              # Delete all failed jobs
php artisan queue:forget 1           # Delete specific failed job

# Table setup
php artisan queue:table              # Create failed jobs table migration
php artisan queue:batches-table      # Create batches table migration
```

## Auth

```bash
# Laravel Breeze (simple auth scaffolding)
composer require laravel/breeze --dev
php artisan breeze:install
php artisan breeze:install blade
php artisan breeze:install vue
php artisan breeze:install react

# Laravel Jetstream (full-featured auth)
composer require laravel/jetstream
php artisan jetstream:install livewire
php artisan jetstream:install inertia

# Sanctum (API auth)
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## Scheduling

```bash
# Run scheduled tasks (usually via cron)
php artisan schedule:run

# List scheduled tasks
php artisan schedule:list

# Test a scheduled command
php artisan schedule:test

# Add to crontab (Linux)
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

## Storage & Links

```bash
# Create symbolic link for storage
php artisan storage:link

# Publish vendor files
php artisan vendor:publish
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan vendor:publish --tag=laravel-mail  # Publish specific tag
```

## Maintenance Mode

```bash
php artisan down                     # Enable maintenance mode
php artisan down --render="errors::maintenance"  # Custom view
php artisan down --secret=xyz        # Bypass with /xyz
php artisan up                       # Disable maintenance mode
```

## Serve (Development Only)

```bash
php artisan serve                    # http://localhost:8000
php artisan serve --port=8080        # Custom port
php artisan serve --host=0.0.0.0     # Access from network
```

## Useful Flags

```bash
--force      # Required for production operations
--seed       # Seed after migration
--ansi       # Force ANSI output
--no-ansi    # Disable ANSI output
--verbose    # Increase verbosity (-v, -vv, -vvv)
--help       # Show command help
--quiet      # Suppress output
```
