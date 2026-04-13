# Laravel Best Practices

Patterns and architecture decisions for maintainable Laravel applications.

## 1. Fat Model, Thin Controller

Controllers should delegate to models and services — not contain business logic.

### ❌ Fat Controller

```php
class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Send welcome email
        Mail::to($user)->send(new WelcomeEmail($user));

        // Create default team
        $team = Team::create(['name' => $user->name . "'s Team", 'owner_id' => $user->id]);
        $user->teams()->attach($team->id);

        // Log activity
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'registered',
        ]);

        return response()->json($user, 201);
    }
}
```

### ✅ Service Layer

```php
// app/Services/UserRegistrationService.php
class UserRegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            Mail::to($user)->send(new WelcomeEmail($user));

            $team = Team::create([
                'name' => $user->name . "'s Team",
                'owner_id' => $user->id,
            ]);
            $user->teams()->attach($team->id);

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'registered',
            ]);

            return $user;
        });
    }
}

// Controller becomes clean
class UserController extends Controller
{
    public function store(StoreUserRequest $request, UserRegistrationService $service)
    {
        $user = $service->register($request->validated());
        return response()->json($user, 201);
    }
}
```

## 2. Use Form Requests for Validation

Move validation out of controllers into dedicated request classes.

```bash
php artisan make:request StoreUserRequest
```

```php
// app/Http/Requests/StoreUserRequest.php
class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();  // Or your authorization logic
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
```

## 3. API Resources for Response Transformation

Never return Eloquent models directly — use Resources for consistent API output.

```bash
php artisan make:resource UserResource
```

```php
// app/Http/Resources/UserResource.php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at->toIso8601String(),
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
        ];
    }
}

// Controller
return new UserResource($user);
return UserResource::collection(User::paginate(15));
```

## 4. Repository Pattern (For Complex Data Access)

When models have complex querying, use repositories to keep controllers clean.

```php
// app/Repositories/PostRepository.php
interface PostRepositoryInterface
{
    public function getPublished(int $perPage);
    public function findById(int $id);
    public function create(array $data): Post;
}

class EloquentPostRepository implements PostRepositoryInterface
{
    public function getPublished(int $perPage)
    {
        return Post::published()
            ->with(['author', 'tags'])
            ->latest()
            ->paginate($perPage);
    }

    public function findById(int $id)
    {
        return Post::with(['author', 'comments.user'])->findOrFail($id);
    }

    public function create(array $data): Post
    {
        return Post::create($data);
    }
}

// Bind in AppServiceProvider
$this->app->bind(PostRepositoryInterface::class, EloquentPostRepository::class);

// Controller
class PostController extends Controller
{
    public function __construct(
        private PostRepositoryInterface $posts
    ) {}

    public function index()
    {
        return PostResource::collection($this->posts->getPublished(15));
    }
}
```

## 5. Dependency Injection

Laravel's service container auto-resolves dependencies — use type hints.

```php
// Controller method injection
public function store(
    StoreUserRequest $request,
    UserRegistrationService $service,
    EventDispatcher $events
) {
    $user = $service->register($request->validated());
    $events->dispatch(new UserRegistered($user));
    return response()->json($user, 201);
}

// Constructor injection (for entire controller)
class UserController extends Controller
{
    public function __construct(
        private UserService $users,
        private EventDispatcher $events
    ) {}
}
```

## 6. Event-Driven Architecture

Decouple side effects using events and listeners.

```bash
php artisan make:event UserRegistered
php artisan make:listener SendWelcomeEmail --event=UserRegistered
php artisan make:listener CreateUserTeam --event=UserRegistered
```

```php
// In your service
event(new UserRegistered($user));

// Listeners handle their own logic
class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        Mail::to($event->user)->send(new WelcomeEmail($event->user));
    }
}
```

**Benefits:**

- Single responsibility — each listener does one thing
- Easy to add new behaviors without touching existing code
- Listeners can be queued for async processing

## 7. Policies for Authorization

Use policies instead of inline `@can` checks.

```bash
php artisan make:policy PostPolicy --model=Post
```

```php
// app/Policies/PostPolicy.php
class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }
}

// Controller
public function show(Post $post)
{
    $this->authorize('view', $post);
    return new PostResource($post);
}

// Blade
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan
```

## 8. Database Transactions for Multi-Step Operations

Wrap related operations in transactions to ensure consistency.

```php
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    $order = Order::create($orderData);

    foreach ($cart->items as $item) {
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $item->product_id,
            'quantity' => $item->quantity,
            'price' => $item->product->price,
        ]);

        // Decrease stock
        $item->product->decrement('stock', $item->quantity);
    }

    // Clear cart
    $cart->items()->delete();
});
```

**If any step fails, everything rolls back automatically.**

## 9. Configuration Over Hardcoding

Never hardcode values that might change — use config files and `.env`.

```php
// ❌ Bad
$apiKey = 'sk-1234567890';
$timeout = 30;

// ✅ Good
$apiKey = config('services.stripe.secret');
$timeout = config('services.stripe.timeout', 30);  // With default
```

```php
// config/services.php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'timeout' => env('STRIPE_TIMEOUT', 30),
],
```

## 10. Testing

Write tests for critical paths — don't skip testing.

```bash
php artisan make:test UserRegistrationTest
```

```php
// tests/Feature/UserRegistrationTest.php
public function test_user_can_register(): void
{
    $response = $this->postJson('/api/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['id', 'name', 'email']);

    $this->assertDatabaseHas('users', [
        'email' => 'john@example.com',
    ]);
}

public function test_duplicate_email_fails(): void
{
    User::factory()->create(['email' => 'john@example.com']);

    $response = $this->postJson('/api/register', [
        'email' => 'john@example.com',
        // ...
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
}
```

## 11. Directory Structure for Large Projects

As projects grow, organize by domain rather than by type.

```
app/
├── Http/Controllers/
│   ├── Admin/
│   ├── Api/
│   └── Web/
├── Domain/
│   ├── User/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Requests/
│   │   └── Events/
│   ├── Post/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Policies/
│   └── Billing/
│       ├── Models/
│       ├── Services/
│       └── Jobs/
└── Support/
    ├── Helpers/
    └── Traits/
```

## Quick Reference: What Goes Where

| Concern                    | Where                  |
| -------------------------- | ---------------------- |
| HTTP handling              | Controllers            |
| Validation                 | Form Request classes   |
| Business logic             | Service classes        |
| Database queries           | Models or Repositories |
| Authorization              | Policies               |
| Side effects (email, logs) | Events & Listeners     |
| Background work            | Jobs & Queues          |
| API responses              | API Resources          |
| Reusable query logic       | Query Scopes           |
| Computed attributes        | Accessors/Mutators     |
| Configuration              | config/\*.php + .env   |
