import jwt from 'jsonwebtoken';
import { signToken } from '../sign-token';
import { ROLES } from '../../../constants/roles';

jest.mock('jsonwebtoken');

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('signToken', () => {
  it('returns a signed JWT string', () => {
    (jwt.sign as jest.Mock).mockReturnValue('signed-token');

    const result = signToken({ userId: 1, role: ROLES.ADMIN });

    expect(result).toBe('signed-token');
    expect(jwt.sign).toHaveBeenCalledWith({ userId: 1, role: ROLES.ADMIN }, 'test-secret', {
      expiresIn: '8h',
    });
  });

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => signToken({ userId: 1, role: ROLES.ADMIN })).toThrow('JWT_SECRET is not set');
  });
});
