import pg from 'pg';
import { Sequelize } from 'sequelize-typescript';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  models: [Client, ClientHistory, Plan, Subscription],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
