import type { DeviceType } from '../../models/LoginEvent';

export type LoginDevice = {
  deviceType: DeviceType | null;
  os: string | null;
  browser: string | null;
};

export const recordLogin = async (_id: number, _device: LoginDevice): Promise<void> =>
  Promise.resolve();
