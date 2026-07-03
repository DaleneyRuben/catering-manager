import { resolveApiUrl } from './resolveApiUrl';

const ORIGINAL_ENV = process.env;

const backendRelatedProjects = JSON.stringify([
  {
    project: { id: 'prj_123', name: 'la-oliva-backend' },
    production: { url: 'la-oliva-backend-abc123.vercel.app' },
    preview: {
      branch: 'la-oliva-backend-git-fix-x-fernando-daleney-s-projects.vercel.app',
    },
  },
]);

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_RELATED_PROJECTS;
  delete process.env.VITE_API_URL;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('resolveApiUrl', () => {
  it('points preview builds at the backend preview from the same branch', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.VITE_API_URL = 'https://catering-manager-backend.vercel.app/api';
    process.env.VERCEL_RELATED_PROJECTS = backendRelatedProjects;

    expect(resolveApiUrl()).toBe(
      'https://la-oliva-backend-git-fix-x-fernando-daleney-s-projects.vercel.app/api',
    );
  });

  it('falls back to VITE_API_URL on preview when related project data is missing', () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.VITE_API_URL = 'https://catering-manager-backend.vercel.app/api';

    expect(resolveApiUrl()).toBe('https://catering-manager-backend.vercel.app/api');
  });

  it('returns VITE_API_URL unchanged on production builds', () => {
    process.env.VERCEL_ENV = 'production';
    process.env.VITE_API_URL = 'https://catering-manager-backend.vercel.app/api';
    process.env.VERCEL_RELATED_PROJECTS = backendRelatedProjects;

    expect(resolveApiUrl()).toBe('https://catering-manager-backend.vercel.app/api');
  });

  it('returns undefined locally so vite env loading applies', () => {
    expect(resolveApiUrl()).toBeUndefined();
  });
});
