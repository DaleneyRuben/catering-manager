import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import { login } from '../login';
import { record } from '../../login-event';
import { encodeId } from '../../../utils/sqids';
import { ROLES } from '../../../constants/roles';

jest.mock('../../../models/User');
jest.mock('../../login-event');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  (record as jest.Mock).mockResolvedValue({ deviceType: null, os: null, browser: null });
});

afterAll(() => {
  process.env = OLD_ENV;
});

const mockUser = {
  id: 1,
  username: 'ada',
  password: '$2b$10$hashedpassword',
  role: ROLES.ADMIN,
  update: jest.fn(),
};

describe('login', () => {
  it('returns token and user on valid credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    const result = await login('ada', 'correct-password');

    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual({ id: encodeId(1), username: 'ada', role: ROLES.ADMIN });
    expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', mockUser.password);
  });

  it('updates lastLoginAt and the device snapshot on successful login', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');
    (record as jest.Mock).mockResolvedValue({
      deviceType: 'mobile',
      os: 'Android 14',
      browser: 'Chrome 126',
    });

    await login('ada', 'correct-password', ANDROID_CHROME_UA);

    expect(mockUser.update).toHaveBeenCalledWith({
      lastLoginAt: expect.any(Date),
      lastDeviceType: 'mobile',
      lastOs: 'Android 14',
      lastBrowser: 'Chrome 126',
    });
  });

  it('records a login event with the user agent', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');
    (record as jest.Mock).mockResolvedValue({ deviceType: null, os: null, browser: null });

    await login('ada', 'correct-password', ANDROID_CHROME_UA);

    expect(record).toHaveBeenCalledWith(1, ANDROID_CHROME_UA);
  });

  it('does not record a login event when credentials are invalid', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login('ada', 'wrong-password', ANDROID_CHROME_UA)).rejects.toThrow(
      'INVALID_CREDENTIALS',
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('throws INVALID_CREDENTIALS when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(login('unknown', 'any')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login('ada', 'wrong-password')).rejects.toThrow('INVALID_CREDENTIALS');
  });
});
