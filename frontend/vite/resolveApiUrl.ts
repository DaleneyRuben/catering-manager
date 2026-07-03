import { withRelatedProject } from '@vercel/related-projects';

const BACKEND_PROJECT_NAME = 'la-oliva-backend';

/**
 * Build-time only (runs in vite.config.ts, reads process.env).
 * On Vercel preview builds, points the app at the backend preview deployed
 * from the same branch via Related Projects; every other build keeps
 * VITE_API_URL. Returns undefined locally so vite's own env loading applies.
 */
export function resolveApiUrl(): string | undefined {
  if (process.env.VERCEL_ENV !== 'preview') return process.env.VITE_API_URL;

  const host = withRelatedProject({
    projectName: BACKEND_PROJECT_NAME,
    defaultHost: '',
  });

  return host ? `${host}/api` : process.env.VITE_API_URL;
}
