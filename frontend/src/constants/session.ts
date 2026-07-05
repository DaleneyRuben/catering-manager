// Must match the backend's login token lifetime
// (backend/src/services/auth/sign-token.ts) — a user with a live token is
// treated as "active" everywhere in the app.
export const SESSION_DURATION_HOURS = 8;
