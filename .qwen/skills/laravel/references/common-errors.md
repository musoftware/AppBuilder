# Common Laravel Errors — Root Causes & Fixes

Top errors organized by category, with root causes and step-by-step fixes.

## 1. SQLSTATE Errors

### "SQLSTATE[42S02]: Base table or view not found"

**Root cause**: Migration hasn't run yet, or table name is wrong.

**Fix:**

```bash
php artisan migrate:status  # Check if migration ran
php artisan migrate         # Run pending migrations
```

If migration exists but didn't run:

```bash
php artisan migrate:fresh   # Reset everything (dev only)
```

Check model table name:

```php
// If table name doesn't follow conventions
protected $table = 'custom_table_name';
```

### "SQLSTATE[HY000]: General error: 1364 Field doesn't have a default value"

**Root cause**: Inserting without providing required field, or `$fillable` is missing the field.

**Fix:**

```php
// In your model
protected $fillable = ['name', 'email', 'password'];

// Or in controller, ensure all fields are passed
User::create([
    'name' => $request->name,
    'email' => $request->email,
    // Don't forget required fields!
]);
```

### "SQLSTATE[23000]: Integrity constraint violation: 1048 Column cannot be null"

**Root cause**: Trying to insert NULL into a non-nullable column.

**Fix:**

```php
// Ensure the value exists before saving
$user = new User();
$user->name = $request->input('name'); // Not null
$user->save();

// Or make column nullable in migration
$table->string('phone')->nullable();
```

### Foreign key constraint fails

**Root cause**: Referencing a record that doesn't exist, or migration order is wrong.

**Fix:**

```php
// In migration, ensure proper order
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
});

// Or if referencing an existing table
$table->foreignId('category_id')->constrained('categories');
```

## 2. Class Not Found Errors

### "Class 'App\Models\User' not found"

**Root cause**: Autoloader is stale, or class is in wrong namespace/path.

**Fix:**

```bash
composer dump-autoload  # Refresh autoloader
```

Check file exists at `app/Models/User.php`:

```php
namespace App\Models;

class User extends Model
```

### "Class 'Database\Seeders\UserSeeder' not found"

**Root cause**: Seeder class doesn't exist, or not called in DatabaseSeeder.

**Fix:**

```bash
php artisan make:seeder UserSeeder
```

In `DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call([
        UserSeeder::class,
    ]);
}
```

## 3. 419 CSRF / TokenMismatch

### "CSRF token mismatch" or "419 PAGE EXPIRED"

**Root cause**: POST/PUT/DELETE request missing CSRF token, or token expired.

**Fix for Blade forms:**

```blade
<form method="POST" action="/submit">
    @csrf
    <!-- form fields -->
</form>
```

**Fix for AJAX:**

```javascript
// Include the token in headers
$.ajaxSetup({
  headers: {
    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
  },
});
```

**For API routes (should NOT use CSRF):**

```php
// routes/api.php — no CSRF middleware by default
Route::post('/webhook', [WebhookController::class, 'handle']);
```

**If session is expiring too fast:**

```php
// config/session.php
'lifetime' => 120, // Minutes (increase if needed)
```

## 4. Route Not Found (404)

**Root cause**: Route doesn't exist, wrong HTTP method, or middleware blocking.

**Fix:**

```bash
php artisan route:list              # See all routes
php artisan route:list --path=users # Filter by path
```

Check HTTP method:

```php
// Route expects POST but you're using GET
Route::post('/users', [UserController::class, 'store']);

// Fix: match the method
<form method="POST">
```

Check route is in correct file:

```php
// Web routes (session, CSRF)
routes/web.php

// API routes (stateless, no CSRF)
routes/api.php
```

## 5. Queue / Job Failures

### "Queue worker not processing jobs"

**Root cause**: Queue driver is `sync` (default), or worker not running.

**Fix:**

```bash
# Check queue driver
php artisan config:show queue.default

# Start worker (in production, use supervisor)
php artisan queue:work --tries=3

# For development (auto-restart)
php artisan queue:listen
```

### "Failed job: Class 'App\Jobs\ProcessPodcast' not found"

**Root cause**: Job class doesn't exist, or deleted after job was queued.

**Fix:**

```bash
php artisan queue:failed    # See failed jobs
php artisan queue:retry all # Retry all
php artisan queue:flush     # Clear failed jobs
```

### Jobs running but not completing

**Root cause**: Missing dependencies, timeout, or memory limit.

**Fix:**

```bash
# Increase memory and timeout
php artisan queue:work --memory=512 --timeout=300

# Check logs for the actual error
tail -f storage/logs/laravel.log
```

## 6. Eloquent Relationship Errors

### "Call to undefined relationship [author] on model [App\Models\Post]"

**Root cause**: Relationship method doesn't exist, or wrong name.

**Fix:**

```php
// In Post model
public function author()
{
    return $this->belongsTo(User::class, 'author_id');
}

// If foreign key doesn't follow convention (user_id)
public function author()
{
    return $this->belongsTo(User::class, 'custom_foreign_key');
}
```

### N+1 Query Problem

**Root cause**: Loading relationships in a loop without eager loading.

**Fix:**

```php
// Bad — N+1 queries
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;  // Query per post!
}

// Good — 2 queries total
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name;
}
```

## 7. Auth / Guard Errors

### "Unauthorized" or "Unauthenticated"

**Root cause**: Not logged in, wrong guard, or expired token.

**Fix:**

```php
// Check if user is authenticated
auth()->check();      // true/false
auth()->id();         // User ID or null
auth()->user();       // User model or null

// For API auth with Sanctum
Route::middleware('auth:sanctum')->get('/user', function () {
    return auth()->user();
});
```

### "Route [login] not defined"

**Root cause**: Using `auth` middleware but no login route exists.

**Fix:**

```php
// Install auth scaffolding (Laravel 11+)
php artisan make:auth

// Or define login route manually
Route::get('/login', [LoginController::class, 'show'])->name('login');
```

## 8. Migration Errors

### "Nothing to migrate" but tables are missing

**Root cause**: Migration already ran (recorded in `migrations` table), or file is new but not recognized.

**Fix:**

```bash
php artisan migrate:status  # See which ran
php artisan migrate:fresh   # Reset and rerun (dev only)

# If specific migration didn't run
php artisan migrate         # Run pending only
```

### "Cannot drop table / rename column"

**Root cause**: Database driver doesn't support the operation, or Doctrine DBAL is missing.

**Fix for column changes:**

```bash
composer require doctrine/dbal  # Required for column modifications
```

```php
// In migration
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('old_name', 'new_name');
});
```

## 9. View / Blade Errors

### "View [dashboard] not found"

**Root cause**: Blade file doesn't exist, or wrong path.

**Fix:**

```php
// Check the view path
return view('dashboard');  // Looks for resources/views/dashboard.blade.php
return view('admin.dashboard');  // resources/views/admin/dashboard.blade.php
```

### "Undefined variable $user" in Blade

**Root cause**: Variable not passed to view.

**Fix:**

```php
// Controller must pass the variable
return view('profile', compact('user'));
// Or
return view('profile')->with('user', $user);
```

## 10. Config / Cache Issues

### "Config changes not taking effect"

**Root cause**: Config is cached.

**Fix:**

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Or all at once
php artisan optimize:clear
```

### "Environment variable not being read"

**Root cause**: `.env` has syntax error, or config is cached with old values.

**Fix:**

```bash
# Check .env syntax (no spaces around =)
DB_HOST=localhost  # Correct
DB_HOST = localhost  # Wrong!

# Clear config cache
php artisan config:clear

# Access via config() helper
config('database.connections.mysql.host')
```
