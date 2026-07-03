import pg from 'pg';
import { Sequelize } from 'sequelize-typescript';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import LoginEvent from '../models/LoginEvent';
import Menu from '../models/Menu';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import User from '../models/User';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectModule: pg,
  ...(isProduction ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: true } } } : {}),
  models: [Client, ClientHistory, LoginEvent, Menu, Plan, Subscription, User],
  logging: false,
});

export default sequelize;
