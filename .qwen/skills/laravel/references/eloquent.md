# Eloquent ORM Patterns

Eloquent is Laravel's ORM — an ActiveRecord implementation for database interactions.

## Model Basics

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    // Table name (optional — defaults to plural snake_case: 'posts')
    protected $table = 'custom_posts';

    // Primary key (optional — defaults to 'id')
    protected $primaryKey = 'post_id';

    // Key type (optional — defaults to 'int')
    protected $keyType = 'string';

    // Auto-incrementing (optional — defaults to true)
    public $incrementing = false;

    // Timestamps (optional — defaults to true)
    public $timestamps = false;

    // Fillable attributes (mass assignment protection)
    protected $fillable = ['title', 'content', 'status'];

    // Hidden attributes (exclude from JSON/API)
    protected $hidden = ['password', 'remember_token'];

    // Cast attributes
    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'meta' => 'array',
    ];
}
```

## CRUD Operations

```php
// CREATE
$post = Post::create([
    'title' => 'My Post',
    'content' => 'Content here',
]);

$post = new Post();
$post->title = 'My Post';
$post->save();

// READ
$post = Post::find(1);                     // By primary key
$post = Post::findOrFail(1);               // Throws 404 if not found
$post = Post::where('status', 'published')->first();
$posts = Post::all();
$posts = Post::where('status', 'published')->get();
$posts = Post::latest()->paginate(15);     // Pagination

// UPDATE
$post->update(['title' => 'Updated Title']);
$post->title = 'Updated Title';
$post->save();

Post::where('status', 'draft')->update(['status' => 'published']);

// DELETE
$post->delete();
Post::destroy(1, 2, 3);
Post::where('status', 'spam')->delete();
```

## Relationships

### One-to-Many (HasMany / BelongsTo)

```php
// Post model
public function comments(): HasMany
{
    return $this->hasMany(Comment::class);
}

// Comment model
public function post(): BelongsTo
{
    return $this->belongsTo(Post::class);
}

// Usage
$post = Post::find(1);
$comments = $post->comments;               // Collection of comments
$comments = $post->comments()->where('approved', true)->get();

$comment = Comment::find(1);
$post = $comment->post;                    // Single post
```

### Many-to-Many (BelongsToMany)

```php
// User model
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class);
}

// Role model
public function users(): BelongsToMany
{
    return $this->belongsToMany(User::class);
}

// Pivot table: role_user (alphabetical, singular)
// With custom pivot table name:
return $this->belongsToMany(Role::class, 'user_roles');

// With additional pivot columns:
return $this->belongsToMany(Role::class)->withPivot('expires_at', 'assigned_by');

// Usage
$user = User::find(1);
$roles = $user->roles;

$role = Role::find(1);
$users = $role->users;

// Attach / detach
$user->roles()->attach($roleId);
$user->roles()->detach($roleId);
$user->roles()->sync([1, 2, 3]);           // Sync only these IDs
$user->roles()->toggle([1, 2, 3]);         // Toggle presence
```

### HasManyThrough

```php
// Country → Users → Posts
class Country extends Model
{
    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(Post::class, User::class);
    }
}

// Usage
$country = Country::find(1);
$posts = $country->posts;                  // All posts by users in this country
```

### Polymorphic Relationships

```php
// Comment model (can belong to Post or Video)
public function commentable(): MorphTo
{
    return $this->morphTo();
}

// Post model
public function comments(): MorphMany
{
    return $this->morphMany(Comment::class, 'commentable');
}

// Video model
public function comments(): MorphMany
{
    return $this->morphMany(Comment::class, 'commentable');
}

// Usage
$post = Post::find(1);
$comments = $post->comments;

$comment = Comment::find(1);
$commentable = $comment->commentable;      // Returns Post or Video
```

## Eager Loading (Prevent N+1)

```php
// BAD — N+1 query problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;               // Query per post!
}

// GOOD — Eager loading (2 queries total)
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name;
}

// Multiple relationships
$posts = Post::with(['author', 'comments.user', 'tags'])->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest()->take(5);
}])->get();
```

## Query Scopes

```php
// In your model
class Post extends Model
{
    // Local scope
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Global scope (always applied)
    protected static function booted()
    {
        static::addGlobalScope('published', function ($builder) {
            $builder->where('status', 'published');
        });
    }
}

// Usage
$posts = Post::published()->recent()->get();
$posts = Post::published()->recent(7)->get();  // With parameter
```

## Accessors & Mutators

```php
// Accessor (get attribute)
public function getTitleAttribute($value)
{
    return ucfirst($value);
}

// Mutator (set attribute)
public function setTitleAttribute($value)
{
    $this->attributes['title'] = strtolower($value);
}

// New style (Laravel 9+)
protected function title(): Attribute
{
    return Attribute::make(
        get: fn ($value) => ucfirst($value),
        set: fn ($value) => strtolower($value),
    );
}

// Usage
$post = Post::find(1);
echo $post->title;          // Calls accessor
$post->title = 'New Title'; // Calls mutator
```

## Aggregates

```php
$count = Post::count();
$max = Post::max('views');
$avg = Post::avg('rating');
$sum = Order::sum('total');

// Group by
$postsPerDay = Post::selectRaw('DATE(created_at) as date, COUNT(*) as count')
    ->groupBy('date')
    ->get();
```

## Common Mistakes

### ❌ Using `get()` when you want one record

```php
// Wrong — returns collection
$post = Post::where('id', 1)->get();
echo $post->title;  // Error!

// Right — returns single model
$post = Post::where('id', 1)->first();
echo $post->title;  // Works!
```

### ❌ Not using eager loading

```php
// Slow — N+1 queries
$users = User::all();
foreach ($users as $user) {
    echo $user->posts->count();
}

// Fast — 2 queries
$users = User::withCount('posts')->get();
foreach ($users as $user) {
    echo $user->posts_count;
}
```

### ❌ Mass assignment without `$fillable`

```php
// Vulnerable to mass assignment attacks
User::create($request->all());

// Safe — only allow specific fields
User::create($request->only(['name', 'email', 'password']));
// Or define $fillable in model
```

### ❌ Forgetting to handle missing records

```php
// Returns null — can cause errors
$post = Post::where('slug', $slug)->first();
echo $post->title;  // Error if $post is null!

// Safe — throws 404 automatically
$post = Post::where('slug', $slug)->firstOrFail();
echo $post->title;  // Safe, or 404
```
