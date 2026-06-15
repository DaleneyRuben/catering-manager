import api from './api';

function mockFetch(overrides: object) {
  global.fetch = jest.fn().mockResolvedValue(overrides) as jest.Mock;
}

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('get', () => {
    it('returns the data field from a successful response', async () => {
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: { id: 1 } }) });
      const result = await api.get('/test');
      expect(result).toEqual({ id: 1 });
    });

    it('sends Authorization header when token is in localStorage', async () => {
      localStorage.setItem('auth_token', 'my-token');
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: 'ok' }) });
      await api.get('/secure');
      const {headers} = (fetch as jest.Mock).mock.calls[0][1];
      expect(headers.Authorization).toBe('Bearer my-token');
    });

    it('omits Authorization header when no token is stored', async () => {
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: 'ok' }) });
      await api.get('/public');
      const {headers} = (fetch as jest.Mock).mock.calls[0][1];
      expect(headers.Authorization).toBeUndefined();
    });

    it('returns undefined for 204 No Content', async () => {
      mockFetch({ ok: true, status: 204, json: jest.fn() });
      const result = await api.get('/empty');
      expect(result).toBeUndefined();
    });

    it('throws with the server error message field', async () => {
      mockFetch({
        ok: false,
        status: 400,
        clone: () => ({ json: () => Promise.resolve({ error: 'Bad request' }) }),
      });
      await expect(api.get('/fail')).rejects.toThrow('Bad request');
    });

    it('throws with the server message field when error is absent', async () => {
      mockFetch({
        ok: false,
        status: 422,
        clone: () => ({ json: () => Promise.resolve({ message: 'Validation failed' }) }),
      });
      await expect(api.get('/fail')).rejects.toThrow('Validation failed');
    });

    it('falls back to status code message when body cannot be parsed', async () => {
      mockFetch({
        ok: false,
        status: 503,
        clone: () => ({ json: () => Promise.reject(new Error('parse error')) }),
      });
      await expect(api.get('/fail')).rejects.toThrow('Error 503');
    });

    it('falls back to status code when body has no message or error', async () => {
      mockFetch({
        ok: false,
        status: 500,
        clone: () => ({ json: () => Promise.resolve({}) }),
      });
      await expect(api.get('/fail')).rejects.toThrow('Error 500');
    });
  });

  describe('post', () => {
    it('sends POST with a JSON body', async () => {
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: { id: 2 } }) });
      await api.post('/items', { name: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'test' }) }),
      );
    });
  });

  describe('put', () => {
    it('sends PUT with a JSON body', async () => {
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: null }) });
      await api.put('/items/1', { name: 'updated' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('patch', () => {
    it('sends PATCH with a JSON body', async () => {
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve({ data: null }) });
      await api.patch('/items/1', { active: false });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE and returns undefined', async () => {
      mockFetch({ ok: true, status: 204, json: jest.fn() });
      const result = await api.delete('/items/1');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/items/1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getPaginated', () => {
    it('returns the full paginated response body', async () => {
      const payload = { data: [1, 2], total: 2, page: 1, limit: 10 };
      mockFetch({ ok: true, status: 200, json: () => Promise.resolve(payload) });
      const result = await api.getPaginated('/items');
      expect(result).toEqual(payload);
    });

    it('throws when getPaginated response is not ok', async () => {
      mockFetch({ ok: false, status: 404 });
      await expect(api.getPaginated('/missing')).rejects.toThrow();
    });
  });
});
