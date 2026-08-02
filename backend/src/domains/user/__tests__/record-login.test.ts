import User from '../../../models/User';
import { recordLogin } from '../record-login';

jest.mock('../../../models/User');

const mockUser = { id: 1, username: 'ada', update: jest.fn() };

beforeEach(() => jest.clearAllMocks());

describe('recordLogin', () => {
  it('stamps the login time and the device snapshot', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await recordLogin(1, { deviceType: 'mobile', os: 'Android 14', browser: 'Chrome 126' });

    expect(User.findByPk).toHaveBeenCalledWith(1);
    expect(mockUser.update).toHaveBeenCalledWith({
      lastLoginAt: expect.any(Date),
      lastDeviceType: 'mobile',
      lastOs: 'Android 14',
      lastBrowser: 'Chrome 126',
    });
  });

  it('stores null device fields when the request had no user agent', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await recordLogin(1, { deviceType: null, os: null, browser: null });

    expect(mockUser.update).toHaveBeenCalledWith({
      lastLoginAt: expect.any(Date),
      lastDeviceType: null,
      lastOs: null,
      lastBrowser: null,
    });
  });

  it('does nothing when the user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    await recordLogin(99, { deviceType: null, os: null, browser: null });

    expect(mockUser.update).not.toHaveBeenCalled();
  });
});
