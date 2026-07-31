import type { TokenPayload } from '../domains/auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
