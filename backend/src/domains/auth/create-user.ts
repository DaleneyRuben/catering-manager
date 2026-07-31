import bcrypt from 'bcrypt';
import User, { type UserRole } from '../../models/User';

const SALT_ROUNDS = 10;

const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, SALT_ROUNDS);

export const createUser = async (
  username: string,
  password: string,
  role: UserRole,
): Promise<User> => {
  const hashed = await hashPassword(password);
  return User.create({ username, password: hashed, role });
};
