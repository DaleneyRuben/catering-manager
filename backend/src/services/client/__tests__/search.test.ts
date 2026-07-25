import { Op } from 'sequelize';
import Client from '../../../models/Client';
import { search } from '../search';

jest.mock('../../../models/Client');

describe('search', () => {
  beforeEach(() => jest.resetAllMocks());

  it('searches clients by name or phone number, case-insensitively, limited to 10 results', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await search('ana');

    expect(Client.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [{ name: { [Op.iLike]: '%ana%' } }, { phoneNumber: { [Op.iLike]: '%ana%' } }],
      },
      attributes: ['id', 'name', 'phoneNumber'],
      order: [['name', 'ASC']],
      limit: 10,
    });
  });
});
