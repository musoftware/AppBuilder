# auth-setup

Set up authentication and authorization for the application.

## When to run

- After api-design skill (or alongside if API not needed)
- When the project requires user accounts, login, or access control
- Before implementing any user-specific features

## What to do

1. **Determine authentication method** from requirements:
   - Email/password with verification
   - OAuth/Social login (Google, GitHub, etc.)
   - API keys for service-to-service auth
   - JWT tokens for stateless auth
   - Session-based auth
   - Note: If not specified, default to email/password + JWT for APIs

2. **Implement authentication**:
   - User model/schema with proper password hashing (bcrypt/argon2, minimum 10 rounds)
   - Registration endpoint with input validation
   - Login endpoint with rate limiting (max 5 attempts per 15 minutes)
   - Token generation and refresh token rotation
   - Password reset flow with time-limited tokens (1 hour expiry)
   - Email verification if required

3. **Implement authorization**:
   - Role-based access control (RBAC) if multiple user types exist
   - Middleware/guards to protect routes requiring authentication
   - Resource-level ownership checks (users can only modify their own data)
   - Admin-only endpoints with proper authorization checks

4. **Security hardening**:
   - Implement CORS with specific allowed origins (never `*` in production)
   - Add CSRF protection for session-based auth
   - Set secure cookie flags (httpOnly, secure, sameSite)
   - Implement brute force protection on login endpoints
   - Add audit logging for auth events (login, logout, password change, role change)

5. **Test authentication flows**:
   - Register → Verify email → Login → Access protected route → Logout
   - Attempt to access protected route without token (should 401)
   - Attempt to use expired/invalid token (should 401)
   - Test password reset flow end-to-end
   - Verify rate limiting on login endpoint

## Output format

Write a report to `.project-brain/auth-setup.md`:

```
SUMMARY: Set up authentication for [project name]
- Auth method: [email-password/OAuth/JWT/etc]
- Protected routes: [count]
- Roles defined: [list if applicable]

FINDINGS:
- Auth type: [session/JWT/OAuth/etc]
- Password hashing: [bcrypt/argon2, rounds]
- Token expiry: [duration]
- Refresh tokens: [yes/no, rotation strategy]
- Rate limiting: [requests per window]

STATE: COMPLETE
- User registration working with validation
- Login returns proper tokens/session
- Password reset flow functional
- Protected routes require valid auth
- Authorization checks prevent unauthorized access
- Audit logging captures auth events

NEXT_SKILLS: deployment-config
```

## Rules

- NEVER store plaintext passwords — always hash with salt (bcrypt/argon2 minimum)
- NEVER log sensitive data (tokens, passwords, SSNs, credit cards)
- Always use HTTPS in production — redirect HTTP → HTTPS
- Implement token blacklisting or short expiry for logout security
- Use the principle of least privilege for default roles
- Add rate limiting to ALL auth endpoints (login, register, password reset)
- Test both happy path and failure cases for every auth flow
- Document the auth flow in README or docs/AUTH.md
