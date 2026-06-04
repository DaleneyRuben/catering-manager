// Sets the process timezone before any module loads.
// Must remain the first import in index.ts.
// Vercel reserves the TZ env var so this is set in code instead.
process.env.TZ = 'America/La_Paz';
