import jwt from 'jsonwebtoken';
import type { UserRole } from '../../models/User';
import { getSecret } from './_helpers';

export type TokenPayload = {
  userId: number;
  role: UserRole;
};

const JWT_EXPIRY = '8h';

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRY });
