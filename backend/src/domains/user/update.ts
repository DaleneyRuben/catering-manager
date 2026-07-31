import bcrypt from 'bcrypt';
import User from '../../models/User';
import type { UpdateUserDto } from '../../schemas/user.schema';
import { SALT_ROUNDS, USER_ATTRIBUTES } from './_helpers';

export const update = async (id: number, dto: UpdateUserDto): Promise<User | null> => {
  const user = await User.findByPk(id);
  if (!user) return null;

  const payload = dto.password
    ? { ...dto, password: await bcrypt.hash(dto.password, SALT_ROUNDS) }
    : dto;

  await user.update(payload);
  return User.findByPk(id, { attributes: USER_ATTRIBUTES });
};
