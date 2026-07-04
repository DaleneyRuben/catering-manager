import LoginEvent from '../../models/LoginEvent';

export type LoginEventEntry = {
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  createdAt: string;
};

const MAX_ENTRIES = 20;

export const findForUser = async (userId: number): Promise<LoginEventEntry[]> => {
  const events = await LoginEvent.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: MAX_ENTRIES,
  });

  return events.map((event) => ({
    deviceType: event.deviceType,
    os: event.os,
    browser: event.browser,
    createdAt: (event.createdAt as Date).toISOString(),
  }));
};
