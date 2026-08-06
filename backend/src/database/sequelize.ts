import pg from 'pg';
import { Sequelize } from 'sequelize-typescript';
import Appointment from '../models/Appointment';
import Client from '../models/Client';
import ClientHistory from '../models/ClientHistory';
import Expense from '../models/Expense';
import ExpenseCategory from '../models/ExpenseCategory';
import LoginEvent from '../models/LoginEvent';
import Menu from '../models/Menu';
import Payment from '../models/Payment';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import User from '../models/User';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
  dialectModule: pg,
  ...(isProduction ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: true } } } : {}),
  models: [
    Appointment,
    Client,
    ClientHistory,
    Expense,
    ExpenseCategory,
    LoginEvent,
    Menu,
    Payment,
    Plan,
    Subscription,
    User,
  ],
  logging: false,
});

export default sequelize;
