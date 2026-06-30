import jwt from 'jsonwebtoken';
import type { UserRole } from '../../models/User';

export type TokenPayload = {
  userId: number;
  role: UserRole;
};

const JWT_EXPIRY = '8h';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
};

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRY });

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, getSecret()) as TokenPayload;
