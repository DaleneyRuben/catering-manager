import bcrypt from 'bcrypt';
import User from '../../models/User';
import type { CreateUserDto } from '../../schemas/user.schema';
import { SALT_ROUNDS } from './_helpers';

export const create = async (dto: CreateUserDto): Promise<User> => {
  const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
  return User.create({ username: dto.username, password: hashed, role: dto.role });
};
