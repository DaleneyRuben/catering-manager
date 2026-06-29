import { downloadReport } from '@/utils/downloadReport';

const mockClick = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockCreateObjectURL = jest.fn(() => 'blob:fake-url');

beforeAll(() => {
  Object.defineProperty(document, 'createElement', {
    value: (tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    },
    writable: true,
  });
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;
});

function mockFetch(contentDisposition: string, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    headers: { get: (h: string) => (h === 'Content-Disposition' ? contentDisposition : null) },
    blob: () => Promise.resolve(new Blob(['data'])),
  });
}

beforeEach(() => jest.clearAllMocks());

describe('downloadReport', () => {
  it('uses RFC 5987 filename when present', async () => {
    mockFetch("attachment; filename*=UTF-8''Lunes%2015-06.docx");
    const a = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(a);

    await downloadReport('/api/report', 'fallback.docx');

    expect(a.download).toBe('Lunes 15-06.docx');
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
  });

  it('falls back to quoted filename when RFC 5987 is absent', async () => {
    mockFetch('attachment; filename="Viernes 19-06.docx"');
    const a = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(a);

    await downloadReport('/api/report', 'fallback.docx');

    expect(a.download).toBe('Viernes 19-06.docx');
  });

  it('uses fallback filename when Content-Disposition is empty', async () => {
    mockFetch('');
    const a = { href: '', download: '', click: mockClick } as unknown as HTMLAnchorElement;
    jest.spyOn(document, 'createElement').mockReturnValue(a);

    await downloadReport('/api/report', 'fallback.docx');

    expect(a.download).toBe('fallback.docx');
  });

  it('throws when response is not ok', async () => {
    mockFetch('', false);

    await expect(downloadReport('/api/report', 'fallback.docx')).rejects.toThrow(
      'Error al generar el archivo: 500',
    );
    expect(mockClick).not.toHaveBeenCalled();
  });

  it('sends the auth token as a Bearer header', async () => {
    localStorage.setItem('auth_token', 'fake-token');
    mockFetch('');

    await downloadReport('/api/report', 'fallback.docx');

    expect(global.fetch).toHaveBeenCalledWith('/api/report', {
      headers: { Authorization: 'Bearer fake-token' },
    });
    localStorage.removeItem('auth_token');
  });
});
