import { UAParser } from 'ua-parser-js';
import type { DeviceType } from '../../models/LoginEvent';

// per-user and global history views share the same window
export const WINDOW_DAYS = 14;

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

const OS_NAME_OVERRIDES: Record<string, string> = { 'Mac OS': 'macOS' };

// OS version is intentionally dropped: browsers freeze it in the User-Agent for
// privacy (every Mac reports 10.15.7, Windows 11 reports as 10), so it would
// display permanently stale values. Browser versions are real and kept.
const normalizeOsName = (name?: string): string | null => {
  if (!name) return null;
  return OS_NAME_OVERRIDES[name] ?? name;
};

export const parseUserAgent = (userAgent: string | undefined): ParsedDevice => {
  if (!userAgent) return { deviceType: null, os: null, browser: null };

  const { device, os, browser } = new UAParser(userAgent).getResult();
  return {
    // desktop browsers leave device.type undefined — that absence means desktop
    deviceType: (device.type as DeviceType | undefined) ?? 'desktop',
    os: normalizeOsName(os.name),
    browser: joinNameVersion(browser.name, browser.version),
  };
};
