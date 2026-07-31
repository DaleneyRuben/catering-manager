import Client from '../../../models/Client';
import { findMembers } from '../find-members';

jest.mock('../../../models/Client');

const makeClient = (overrides: object = {}) => ({
  id: 1,
  name: 'Ana',
  groupToken: null,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('findMembers', () => {
  it('returns id and name of all clients sharing the token', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      makeClient({ id: 1, name: 'Ana' }),
      makeClient({ id: 2, name: 'Luis' }),
    ]);

    const members = await findMembers('some-token');

    expect(Client.findAll).toHaveBeenCalledWith({
      where: { groupToken: 'some-token' },
      attributes: ['id', 'name'],
    });
    expect(members).toEqual([
      { id: 1, name: 'Ana' },
      { id: 2, name: 'Luis' },
    ]);
  });

  it('returns empty array when no clients share the token', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    const members = await findMembers('ghost-token');

    expect(members).toEqual([]);
  });
});
