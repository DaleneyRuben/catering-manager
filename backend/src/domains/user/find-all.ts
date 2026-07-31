import User from '../../models/User';
import { USER_ATTRIBUTES } from './_helpers';

export const findAll = () =>
  User.findAll({ attributes: USER_ATTRIBUTES, order: [['username', 'ASC']] });
