import 'dotenv/config';

const config = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres' as const,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres' as const,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

export default config;
