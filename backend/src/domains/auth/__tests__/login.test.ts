import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import sequelize from '../../../database/sequelize';
import { login, InvalidCredentialsError } from '../login';
import { record } from '../../login-event';
import { recordLogin } from '../../user';
import { encodeId } from '../../../utils/sqids';
import { ROLES } from '../../../constants/roles.constants';

jest.mock('../../../models/User');
jest.mock('../../login-event');
jest.mock('../../user');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

const OLD_ENV = process.env;
const transaction = { id: 'own' };
const callerTransaction = { id: 'caller' } as never;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
  (record as jest.Mock).mockResolvedValue({ deviceType: null, os: null, browser: null });
  (sequelize.transaction as jest.Mock).mockImplementation((work) => work(transaction));
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

  it('signs the token with the username alongside userId and role', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    await login('ada', 'correct-password');

    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: 1, username: 'ada', role: ROLES.ADMIN },
      expect.any(String),
      expect.any(Object),
    );
  });

  it('hands the device snapshot to the user domain on successful login', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');
    (record as jest.Mock).mockResolvedValue({
      deviceType: 'mobile',
      os: 'Android 14',
      browser: 'Chrome 126',
    });

    await login('ada', 'correct-password', ANDROID_CHROME_UA);

    expect(recordLogin).toHaveBeenCalledWith(
      1,
      {
        deviceType: 'mobile',
        os: 'Android 14',
        browser: 'Chrome 126',
      },
      transaction,
    );
    expect(mockUser.update).not.toHaveBeenCalled();
  });

  it('records a login event with the user agent', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');
    (record as jest.Mock).mockResolvedValue({ deviceType: null, os: null, browser: null });

    await login('ada', 'correct-password', ANDROID_CHROME_UA);

    expect(record).toHaveBeenCalledWith(1, ANDROID_CHROME_UA, transaction);
  });

  it('does not record a login event when credentials are invalid', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login('ada', 'wrong-password', ANDROID_CHROME_UA)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
    expect(record).not.toHaveBeenCalled();
  });

  // The connections widget reads the snapshot and the history views read the events. Written
  // apart, a failure between them leaves the two describing different logins.
  it('writes the login event and the device snapshot in one transaction', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    await login('ada', 'correct-password', ANDROID_CHROME_UA);

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
  });

  it("joins the caller's transaction rather than opening its own", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    await login('ada', 'correct-password', ANDROID_CHROME_UA, callerTransaction);

    expect(sequelize.transaction).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(1, ANDROID_CHROME_UA, callerTransaction);
    expect(recordLogin).toHaveBeenCalledWith(1, expect.anything(), callerTransaction);
  });

  it('opens no transaction when the credentials are rejected', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login('ada', 'wrong-password')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('issues no token when the device snapshot cannot be written', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (recordLogin as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(login('ada', 'correct-password', ANDROID_CHROME_UA)).rejects.toThrow('db error');
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(login('unknown', 'any')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError when password is wrong', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(login('ada', 'wrong-password')).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
