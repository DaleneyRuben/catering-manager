import User from '../../../models/User';
import { recordLogin } from '../record-login';

jest.mock('../../../models/User');

const mockUser = { id: 1, username: 'ada', update: jest.fn() };
const transaction = { id: 'caller' } as never;

beforeEach(() => jest.clearAllMocks());

describe('recordLogin', () => {
  it('stamps the login time and the device snapshot', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await recordLogin(1, { deviceType: 'mobile', os: 'Android 14', browser: 'Chrome 126' });

    expect(User.findByPk).toHaveBeenCalledWith(1, {});
    expect(mockUser.update).toHaveBeenCalledWith(
      {
        lastLoginAt: expect.any(Date),
        lastDeviceType: 'mobile',
        lastOs: 'Android 14',
        lastBrowser: 'Chrome 126',
      },
      {},
    );
  });

  it('stores null device fields when the request had no user agent', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await recordLogin(1, { deviceType: null, os: null, browser: null });

    expect(mockUser.update).toHaveBeenCalledWith(
      {
        lastLoginAt: expect.any(Date),
        lastDeviceType: null,
        lastOs: null,
        lastBrowser: null,
      },
      {},
    );
  });

  it('does nothing when the user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    await recordLogin(99, { deviceType: null, os: null, browser: null });

    expect(mockUser.update).not.toHaveBeenCalled();
  });

  // The row is read to be updated, so the read has to see the caller's uncommitted state too —
  // otherwise the update is applied to a stale copy or misses a user the same workflow created.
  it("reads and updates the user on the caller's transaction when given one", async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    await recordLogin(1, { deviceType: null, os: null, browser: null }, transaction);

    expect(User.findByPk).toHaveBeenCalledWith(1, { transaction });
    expect(mockUser.update).toHaveBeenCalledWith(expect.anything(), { transaction });
  });
});
