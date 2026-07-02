import Client from '../../../models/Client';
import { findById } from '../find-by-id';

import { findMembers } from '../../delivery/find-members';

jest.mock('../../../models/Client');
jest.mock('../../../models/Subscription');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));
jest.mock('../../delivery/find-members', () => ({
  findMembers: jest.fn(),
}));

const mockClient = {
  id: 1,
  name: 'John Doe',
  pausedSince: null,
  groupToken: null,
};

describe('findById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns client when found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);

    const result = await findById(1);

    expect(result).toMatchObject({ id: 1, name: 'John Doe' });
  });

  it('returns null when not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await findById(999);

    expect(result).toBeNull();
  });

  it('includes empty groupMembers when client has no groupToken', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ ...mockClient, groupToken: null });

    const result = await findById(1);

    expect(result).toMatchObject({ groupMembers: [] });
    expect(findMembers).not.toHaveBeenCalled();
  });

  it('includes groupMembers excluding self when client has a groupToken', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({ ...mockClient, groupToken: 'tok-1' });
    (findMembers as jest.Mock).mockResolvedValue([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Ana' },
    ]);

    const result = await findById(1);

    expect(findMembers).toHaveBeenCalledWith('tok-1');
    expect(result).toMatchObject({ groupMembers: [{ id: 2, name: 'Ana' }] });
  });
});
