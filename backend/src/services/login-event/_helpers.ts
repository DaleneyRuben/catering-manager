import { UAParser } from 'ua-parser-js';
import type { DeviceType } from '../../models/LoginEvent';

export type ParsedDevice = {
  deviceType: DeviceType | null;
  os: string | null;
  browser: string | null;
};

const joinNameVersion = (name?: string, version?: string): string | null => {
  if (!name) return null;
  // major version only — "Chrome 126", not "Chrome 126.0.0.0"
  const major = version?.split('.')[0];
  return major ? `${name} ${major}` : name;
};

export const parseUserAgent = (userAgent: string | undefined): ParsedDevice => {
  if (!userAgent) return { deviceType: null, os: null, browser: null };

  const { device, os, browser } = new UAParser(userAgent).getResult();
  return {
    // desktop browsers leave device.type undefined — that absence means desktop
    deviceType: (device.type as DeviceType | undefined) ?? 'desktop',
    os: joinNameVersion(os.name, os.version),
    browser: joinNameVersion(browser.name, browser.version),
  };
};
