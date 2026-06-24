import bcrypt from 'bcrypt';
import User from '../models/User';
import type { CreateUserDto, UpdateUserDto } from '../schemas/user.schema';

const SALT_ROUNDS = 10;

const USER_ATTRIBUTES = ['id', 'username', 'role', 'lastLoginAt'];

const findAll = () => User.findAll({ attributes: USER_ATTRIBUTES, order: [['username', 'ASC']] });

const findById = (id: number) => User.findByPk(id, { attributes: USER_ATTRIBUTES });

const create = async (dto: CreateUserDto): Promise<User> => {
  const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
  return User.create({ username: dto.username, password: hashed, role: dto.role });
};

const update = async (id: number, dto: UpdateUserDto): Promise<User | null> => {
  const user = await User.findByPk(id);
  if (!user) return null;

  const payload = dto.password
    ? { ...dto, password: await bcrypt.hash(dto.password, SALT_ROUNDS) }
    : dto;

  await user.update(payload);
  return User.findByPk(id, { attributes: USER_ATTRIBUTES });
};

const remove = async (id: number): Promise<boolean> => {
  const user = await User.findByPk(id);
  if (!user) return false;
  await user.destroy();
  return true;
};

export default { findAll, findById, create, update, remove };
