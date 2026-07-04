import { Op } from 'sequelize';
import LoginEvent from '../../../models/LoginEvent';
import { record } from '../record';

jest.mock('../../../models/LoginEvent');

const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const WINDOWS_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

beforeEach(() => {
  jest.resetAllMocks();
  (LoginEvent.create as jest.Mock).mockResolvedValue({});
  (LoginEvent.destroy as jest.Mock).mockResolvedValue(0);
});

describe('record', () => {
  it('creates an event with parsed device info and the raw user agent', async () => {
    await record(7, ANDROID_CHROME_UA);

    expect(LoginEvent.create).toHaveBeenCalledWith({
      userId: 7,
      deviceType: 'mobile',
      os: 'Android 14',
      browser: 'Chrome 126',
      userAgent: ANDROID_CHROME_UA,
    });
  });

  it('maps an undetected device type to desktop', async () => {
    await record(7, WINDOWS_CHROME_UA);

    expect(LoginEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ deviceType: 'desktop', os: 'Windows 10', browser: 'Chrome 126' }),
    );
  });

  it('stores nulls when no user agent is provided', async () => {
    await record(7, undefined);

    expect(LoginEvent.create).toHaveBeenCalledWith({
      userId: 7,
      deviceType: null,
      os: null,
      browser: null,
      userAgent: null,
    });
  });

  it('returns the parsed device info', async () => {
    const parsed = await record(7, ANDROID_CHROME_UA);

    expect(parsed).toEqual({ deviceType: 'mobile', os: 'Android 14', browser: 'Chrome 126' });
  });

  it('prunes events older than the retention window', async () => {
    await record(7, ANDROID_CHROME_UA);

    expect(LoginEvent.destroy).toHaveBeenCalledWith({
      where: { createdAt: { [Op.lt]: expect.any(Date) } },
    });
    const cutoff = (LoginEvent.destroy as jest.Mock).mock.calls[0][0].where.createdAt[Op.lt];
    const daysAgo = (Date.now() - cutoff.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysAgo)).toBe(180);
  });
});
