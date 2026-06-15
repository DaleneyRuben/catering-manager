import type { TokenPayload } from '../services/auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
