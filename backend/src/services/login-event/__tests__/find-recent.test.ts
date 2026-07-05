import { Op } from 'sequelize';
import LoginEvent from '../../../models/LoginEvent';
import User from '../../../models/User';
import { findRecent } from '../find-recent';

jest.mock('../../../models/LoginEvent');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('findRecent', () => {
  it('queries the last 14 days of events across all users, newest first', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([]);

    await findRecent();

    expect(LoginEvent.findAll).toHaveBeenCalledWith({
      where: { createdAt: { [Op.gte]: expect.any(Date) } },
      include: [{ model: User, attributes: ['username', 'role'] }],
      order: [['createdAt', 'DESC']],
    });
    const since = (LoginEvent.findAll as jest.Mock).mock.calls[0][0].where.createdAt[Op.gte];
    const daysAgo = (Date.now() - since.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysAgo)).toBe(14);
  });

  it('maps events to plain entries with the user name and role', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([
      {
        user: { username: 'merlyn', role: 'kitchen' },
        deviceType: 'mobile',
        os: 'Android',
        browser: 'Chrome 149',
        userAgent: 'Mozilla/5.0 (...)',
        createdAt: new Date('2026-07-04T10:29:00.000Z'),
      },
      {
        user: { username: 'daleney', role: 'super_admin' },
        deviceType: null,
        os: null,
        browser: null,
        userAgent: null,
        createdAt: new Date('2026-07-03T07:58:00.000Z'),
      },
    ]);

    const entries = await findRecent();

    expect(entries).toEqual([
      {
        username: 'merlyn',
        role: 'kitchen',
        deviceType: 'mobile',
        os: 'Android',
        browser: 'Chrome 149',
        createdAt: '2026-07-04T10:29:00.000Z',
      },
      {
        username: 'daleney',
        role: 'super_admin',
        deviceType: null,
        os: null,
        browser: null,
        createdAt: '2026-07-03T07:58:00.000Z',
      },
    ]);
  });

  it('returns an empty array when there are no events', async () => {
    (LoginEvent.findAll as jest.Mock).mockResolvedValue([]);

    const entries = await findRecent();

    expect(entries).toEqual([]);
  });
});
