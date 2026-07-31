import Plan from '../../../models/Plan';
import { remove } from '../remove';

jest.mock('../../../models/Plan');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('remove', () => {
  it('destroys the plan and returns true', async () => {
    const mockInstance = { destroy: jest.fn().mockResolvedValue(undefined) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await remove(1);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when plan not found', async () => {
    (Plan.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await remove(999);

    expect(result).toBe(false);
  });

  it('propagates db errors', async () => {
    const mockInstance = { destroy: jest.fn().mockRejectedValue(new Error('db error')) };
    (Plan.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(remove(1)).rejects.toThrow('db error');
  });
});
