import bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';
import User, { type UserRole } from '../../models/User';
import { withTransaction } from '../../database/with-transaction';
import { encodeId } from '../../utils/sqids';
import { record as recordLoginEvent } from '../login-event';
import { recordLogin } from '../user';
import { signToken } from './sign-token';

const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

export class InvalidCredentialsError extends Error {
  constructor() {
    super('INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export const login = async (
  username: string,
  password: string,
  userAgent?: string,
  transaction?: Transaction,
): Promise<{ token: string; user: { id: string; username: string; role: UserRole } }> => {
  // Deliberately outside the transaction below: bcrypt is slow by design, and holding a pooled
  // connection open across the comparison costs the pool without buying any atomicity.
  const user = await User.findOne({ where: { username } });
  if (!user) throw new InvalidCredentialsError();

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new InvalidCredentialsError();

  // The event and the snapshot describe the same login: the connections widget reads the snapshot
  // while the history views read the events, so a half-written pair makes the two disagree.
  await withTransaction(transaction, async (t) => {
    const device = await recordLoginEvent(user.id as number, userAgent, t);
    await recordLogin(user.id as number, device, t);
  });

  const token = signToken({ userId: user.id as number, username: user.username, role: user.role });
  return {
    token,
    user: { id: encodeId(user.id as number), username: user.username, role: user.role },
  };
};
