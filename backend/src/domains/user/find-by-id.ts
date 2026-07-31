import User from '../../models/User';
import { USER_ATTRIBUTES } from './_helpers';

export const findById = (id: number) => User.findByPk(id, { attributes: USER_ATTRIBUTES });
