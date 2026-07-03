import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './routes';
import errorHandler from './middleware/error-handler';

const app = express();

const allowedOrigins: (string | RegExp)[] = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  // [a-z0-9-] covers both random-hash and git-branch alias preview URLs
  /^https:\/\/la-oliva-frontend-[a-z0-9-]+-fernando-daleney-s-projects\.vercel\.app$/,
];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ['Content-Disposition'],
  }),
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', router);

app.use(errorHandler);

export default app;
