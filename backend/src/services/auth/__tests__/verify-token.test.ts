import jwt from 'jsonwebtoken';
import { verifyToken } from '../verify-token';
import { ROLES } from '../../../constants/roles.constants';

jest.mock('jsonwebtoken');

const OLD_ENV = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...OLD_ENV, JWT_SECRET: 'test-secret' };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('verifyToken', () => {
  it('returns payload for valid token', () => {
    const payload = { userId: 1, role: ROLES.KITCHEN };
    (jwt.verify as jest.Mock).mockReturnValue(payload);

    const result = verifyToken('valid-token');

    expect(result).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
  });

  it('throws when token is invalid', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid signature');
    });

    expect(() => verifyToken('bad-token')).toThrow('invalid signature');
  });

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;

    expect(() => verifyToken('any-token')).toThrow('JWT_SECRET is not set');
  });
});
