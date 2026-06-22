import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import authService from '../auth.service';
import { encodeId } from '../../utils/sqids';
import { ROLES } from '../../constants/roles';

jest.mock('../../models/User');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
});

afterAll(() => {
  process.env = OLD_ENV;
});

const mockUser = {
  id: 1,
  username: 'ada',
  password: '$2b$10$hashedpassword',
  role: ROLES.ADMIN,
};

describe('authService.login', () => {
  it('returns token and user on valid credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    const result = await authService.login('ada', 'correct-password');

    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual({ id: encodeId(1), username: 'ada', role: ROLES.ADMIN });
    expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', mockUser.password);
  });

  it('throws INVALID_CREDENTIALS when user not found', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(authService.login('unknown', 'any')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('throws INVALID_CREDENTIALS when password is wrong', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(authService.login('ada', 'wrong-password')).rejects.toThrow('INVALID_CREDENTIALS');
  });
});

describe('authService.createUser', () => {
  it('hashes password and creates user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
    (User.create as jest.Mock).mockResolvedValue({ ...mockUser, password: '$2b$10$hashed' });

    await authService.createUser('ada', 'plain-pass', ROLES.ADMIN);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-pass', 10);
    expect(User.create).toHaveBeenCalledWith({
      username: 'ada',
      password: '$2b$10$hashed',
      role: ROLES.ADMIN,
    });
  });
});

describe('authService.verifyToken', () => {
  it('returns payload for valid token', () => {
    const payload = { userId: 1, role: ROLES.KITCHEN };
    (jwt.verify as jest.Mock).mockReturnValue(payload);

    const result = authService.verifyToken('valid-token');

    expect(result).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
  });

  it('throws when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    expect(() => authService.verifyToken('bad-token')).toThrow('invalid signature');
  });

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => authService.verifyToken('any-token')).toThrow('JWT_SECRET is not set');
  });
});
