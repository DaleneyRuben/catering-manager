import { Transaction } from 'sequelize';
import User from '../../models/User';
import type { DeviceType } from '../../models/LoginEvent';

export type LoginDevice = {
  deviceType: DeviceType | null;
  os: string | null;
  browser: string | null;
};

export const recordLogin = async (
  id: number,
  device: LoginDevice,
  transaction?: Transaction,
): Promise<void> => {
  // The read joins the transaction too: it fetches the very row the update below writes.
  const user = await User.findByPk(id, { ...(transaction ? { transaction } : {}) });
  if (!user) return;

  await user.update(
    {
      lastLoginAt: new Date(),
      lastDeviceType: device.deviceType,
      lastOs: device.os,
      lastBrowser: device.browser,
    },
    { ...(transaction ? { transaction } : {}) },
  );
};
