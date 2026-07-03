import bcrypt from 'bcrypt';
import User, { type UserRole } from '../../models/User';
import { encodeId } from '../../utils/sqids';
import { record as recordLoginEvent } from '../login-event';
import { signToken } from './sign-token';

const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export const login = async (
  username: string,
  password: string,
  userAgent?: string,
): Promise<{ token: string; user: { id: string; username: string; role: UserRole } }> => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const device = await recordLoginEvent(user.id as number, userAgent);
  await user.update({
    lastLoginAt: new Date(),
    lastDeviceType: device.deviceType,
    lastOs: device.os,
    lastBrowser: device.browser,
  });

  const token = signToken({ userId: user.id as number, role: user.role });
  return {
    token,
    user: { id: encodeId(user.id as number), username: user.username, role: user.role },
  };
};
