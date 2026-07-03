import User from '../../../models/User';
import { findAll } from '../find-all';
import { ROLES } from '../../../constants/roles';

jest.mock('../../../models/User');

const mockUser = { id: 1, username: 'ada', role: ROLES.KITCHEN };

beforeEach(() => jest.clearAllMocks());

describe('findAll', () => {
  it('returns users without passwords', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([mockUser]);

    const result = await findAll();

    expect(User.findAll).toHaveBeenCalledWith({
      attributes: [
        'id',
        'username',
        'role',
        'lastLoginAt',
        'lastDeviceType',
        'lastOs',
        'lastBrowser',
      ],
      order: [['username', 'ASC']],
    });
    expect(result).toEqual([mockUser]);
  });
});
