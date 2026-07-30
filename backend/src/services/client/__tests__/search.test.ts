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

  it('escapes %, _, and \\ in the query so they are matched literally, not as wildcards', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await search('50%_off\\x');

    expect(Client.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: '%50\\%\\_off\\\\x%' } },
            { phoneNumber: { [Op.iLike]: '%50\\%\\_off\\\\x%' } },
          ],
        },
      }),
    );
  });
});
