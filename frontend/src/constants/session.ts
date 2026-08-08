// Must match the backend's login token lifetime
// (backend/src/domains/auth/sign-token.ts) — a user with a live token is
// treated as "active" everywhere in the app.
export const SESSION_DURATION_HOURS = 8;

// Both halves of the stored session. Named here rather than written out wherever they are cleared:
// they are removed from two places — AuthContext's clearAuth and the api layer's 401 handler — and
// the two had already drifted, leaving the cached user behind on an expired session.
export const AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_USER_KEY = 'auth_user';
