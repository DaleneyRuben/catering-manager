import 'dotenv/config';
import 'reflect-metadata';
import app from './app';
import sequelize from './database/sequelize';

const PORT = process.env.PORT || 4000;

sequelize
  .authenticate()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('database connected');
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((err: Error) => {
    // eslint-disable-next-line no-console
    console.error('database connection failed:', err.message);
    process.exit(1);
  });
