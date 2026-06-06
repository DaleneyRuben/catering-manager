import pg from 'pg';
import { Sequelize } from 'sequelize-typescript';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Menu from '../models/Menu';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectModule: pg,
  ...(isProduction
    ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
    : {}),
  models: [Client, ClientHistory, Menu, Plan, Subscription],
  logging: false,
});

export default sequelize;
