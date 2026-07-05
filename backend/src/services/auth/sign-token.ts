import jwt from 'jsonwebtoken';
import type { UserRole } from '../../models/User';
import { SESSION_DURATION_HOURS } from '../../constants/session.constants';
import { getSecret } from './_helpers';

export type TokenPayload = {
  userId: number;
  role: UserRole;
};

const JWT_EXPIRY = `${SESSION_DURATION_HOURS}h`;

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRY });
