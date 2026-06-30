import sequelize from '../../../database/sequelize';
import { getClientCounts } from '../get-client-counts';

jest.mock('../../../models/Plan');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('getClientCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a planId → count map as numbers', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      { planId: 1, count: '5' },
      { planId: 2, count: '3' },
    ]);

    const result = await getClientCounts();

    expect(result).toEqual({ 1: 5, 2: 3 });
  });

  it('returns an empty object when no active clients exist', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    const result = await getClientCounts();

    expect(result).toEqual({});
  });

  it('excludes finalized subscriptions from the count query', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([]);

    await getClientCounts();

    const sql: string = (sequelize.query as jest.Mock).mock.calls[0][0];
    expect(sql).toContain('"finalizedAt" IS NULL');
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(getClientCounts()).rejects.toThrow('db error');
  });
});
