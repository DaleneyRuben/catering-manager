import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { type UserRole } from '../models/User';
import { encodeId } from '../utils/sqids';

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '8h';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
};

export type TokenPayload = {
  userId: number;
  role: UserRole;
};

const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRY });

const verifyToken = (token: string): TokenPayload => jwt.verify(token, getSecret()) as TokenPayload;

const login = async (
  username: string,
  password: string,
): Promise<{ token: string; user: { id: string; username: string; role: UserRole } }> => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const token = signToken({ userId: user.id as number, role: user.role });
  return {
    token,
    user: { id: encodeId(user.id as number), username: user.username, role: user.role },
  };
};

const createUser = async (username: string, password: string, role: UserRole): Promise<User> => {
  const hashed = await hashPassword(password);
  return User.create({ username, password: hashed, role });
};

export default { login, createUser, verifyToken };
