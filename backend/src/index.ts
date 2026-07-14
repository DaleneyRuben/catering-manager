import 'dotenv/config';
import 'reflect-metadata';
import app from './app';
import sequelize from './database/sequelize';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;

// Process-level crash handlers belong only in this local entry — the Vercel
// serverless entry (api/index.ts) must not register them, since listeners
// would leak across warm invocations.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  process.exit(1);
});

sequelize
  .authenticate()
  .then(() => {
    logger.info('database connected');
    app.listen(PORT, () => {
      logger.info(`server running on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    logger.fatal({ err }, 'database connection failed');
    process.exit(1);
  });
