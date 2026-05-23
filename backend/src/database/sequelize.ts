import { Sequelize } from 'sequelize-typescript';
import Client from '../models/Client';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  models: [Client, Plan, Subscription],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
