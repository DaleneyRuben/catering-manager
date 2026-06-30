import type { TokenPayload } from '../services/auth/token.service';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
