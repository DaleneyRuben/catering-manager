import type { TokenPayload } from '../services/auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
