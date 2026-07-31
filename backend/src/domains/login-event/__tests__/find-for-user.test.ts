import { Op } from 'sequelize';
import LoginEvent from '../../../models/LoginEvent';
import { findForUser } from '../find-for-user';

jest.mock('../../../models/LoginEvent');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('findForUser', () => {
  it('queries the last 14 days of events for the user, newest first', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([]);

    await findForUser(7);

    expect(LoginEvent.findAll).toHaveBeenCalledWith({
      where: { userId: 7, createdAt: { [Op.gte]: expect.any(Date) } },
      order: [['createdAt', 'DESC']],
    });
    const since = (LoginEvent.findAll as jest.Mock).mock.calls[0][0].where.createdAt[Op.gte];
    const daysAgo = (Date.now() - since.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysAgo)).toBe(14);
  });

  it('maps events to plain entries without the raw user agent', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([
      {
        deviceType: 'mobile',
        os: 'Android 14',
        browser: 'Chrome 126',
        userAgent: 'Mozilla/5.0 (...)',
        createdAt: new Date('2026-07-03T12:30:00.000Z'),
      },
      {
        deviceType: null,
        os: null,
        browser: null,
        userAgent: null,
        createdAt: new Date('2026-07-01T08:00:00.000Z'),
      },
    ]);

    const entries = await findForUser(7);

    expect(entries).toEqual([
      {
        deviceType: 'mobile',
        os: 'Android 14',
        browser: 'Chrome 126',
        createdAt: '2026-07-03T12:30:00.000Z',
      },
      { deviceType: null, os: null, browser: null, createdAt: '2026-07-01T08:00:00.000Z' },
    ]);
  });

  it('returns an empty array when the user has no events', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([]);

    const entries = await findForUser(99);

    expect(entries).toEqual([]);
  });
});
