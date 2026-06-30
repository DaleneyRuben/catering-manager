import User from '../../../models/User';
import { findConnections } from '../find-connections';

jest.mock('../../../models/User');

describe('findConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-06-25T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns all kitchen and delivery users sorted by lastLoginAt desc', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([
      { username: 'Caro', lastLoginAt: new Date('2026-06-25T11:59:00Z') },
      { username: 'Randy', lastLoginAt: new Date('2026-06-25T11:56:00Z') },
    ]);

    const result = await findConnections();

    expect(result).toEqual([
      { username: 'Caro', lastLoginAt: '2026-06-25T11:59:00.000Z', online: true },
      { username: 'Randy', lastLoginAt: '2026-06-25T11:56:00.000Z', online: true },
    ]);
  });

  it('marks online false when the last login was over an hour ago', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([
      { username: 'Randy', lastLoginAt: new Date('2026-06-25T08:14:00Z') },
    ]);

    const result = await findConnections();

    expect(result[0].online).toBe(false);
  });

  it('returns an empty array when no kitchen or delivery user has logged in', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([]);

    const result = await findConnections();

    expect(result).toEqual([]);
  });

  it('queries only kitchen and delivery roles with a non-null lastLoginAt', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([]);

    await findConnections();

    const call = (User.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where.role).toEqual({ [Symbol.for('in')]: ['kitchen', 'delivery'] });
    expect(call.where.lastLoginAt).toEqual({ [Symbol.for('not')]: null });
  });
});
