import jwt from 'jsonwebtoken';
import { getSecret } from './_helpers';
import type { TokenPayload } from './sign-token';

export type { TokenPayload };

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, getSecret()) as TokenPayload;
