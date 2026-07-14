import 'dotenv/config';
import 'reflect-metadata';
import { initSentry } from '../src/utils/sentry';
import '../src/database/sequelize';
import app from '../src/app';

// no-op outside production or without SENTRY_DSN
initSentry();

export default app;
