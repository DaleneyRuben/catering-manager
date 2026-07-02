import bcrypt from 'bcrypt';
import User, { type UserRole } from '../../models/User';
import { encodeId } from '../../utils/sqids';
import { signToken } from './sign-token';

const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const login = async (
  username: string,
  password: string,
): Promise<{ token: string; user: { id: string; username: string; role: UserRole } }> => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await user.update({ lastLoginAt: new Date() });

  const token = signToken({ userId: user.id as number, role: user.role });
  return {
    token,
    user: { id: encodeId(user.id as number), username: user.username, role: user.role },
  };
};
