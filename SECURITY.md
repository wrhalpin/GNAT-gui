# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email the maintainer directly or use GitHub's private vulnerability reporting:
https://github.com/wrhalpin/GNAT-gui/security/advisories/new

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive acknowledgement within 48 hours and a resolution timeline within 7 days.

## Security design

- Passwords hashed with argon2 (argon2-cffi)
- Session tokens: cryptographically random, stored server-side, httpOnly + Secure + SameSite=Lax cookies
- CSRF protection on all state-changing routes (starlette-csrf)
- Rate limiting on `/api/auth/login` (slowapi)
- RBAC enforced at the facade layer — not just the router
- Audit log is append-only; read access restricted to admin role
- All config via environment variables; no secrets in source
