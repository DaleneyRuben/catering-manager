import User from '../../../models/User';
import { findById } from '../find-by-id';
import { ROLES } from '../../../constants/roles';

jest.mock('../../../models/User');

const mockUser = { id: 1, username: 'ada', role: ROLES.KITCHEN };

beforeEach(() => jest.clearAllMocks());

describe('findById', () => {
  it('returns user without password when found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    const result = await findById(1);

    expect(User.findByPk).toHaveBeenCalledWith(1, {
      attributes: [
        'id',
        'username',
        'role',
        'lastLoginAt',
        'lastDeviceType',
        'lastOs',
        'lastBrowser',
      ],
    });
    expect(result).toEqual(mockUser);
  });

  it('returns null when user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await findById(99);

    expect(result).toBeNull();
  });
});
