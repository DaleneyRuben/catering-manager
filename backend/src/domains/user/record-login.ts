import User from '../../models/User';
import type { DeviceType } from '../../models/LoginEvent';

export type LoginDevice = {
  deviceType: DeviceType | null;
  os: string | null;
  browser: string | null;
};

export const recordLogin = async (id: number, device: LoginDevice): Promise<void> => {
  const user = await User.findByPk(id);
  if (!user) return;

  await user.update({
    lastLoginAt: new Date(),
    lastDeviceType: device.deviceType,
    lastOs: device.os,
    lastBrowser: device.browser,
  });
};
