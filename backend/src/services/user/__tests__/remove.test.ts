import User from '../../../models/User';
import { remove } from '../remove';
import { ROLES } from '../../../constants/roles.constants';

jest.mock('../../../models/User');

const mockUser = {
  id: 1,
  username: 'ada',
  role: ROLES.KITCHEN,
  destroy: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('remove', () => {
  it('destroys user and returns true', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    const result = await remove(1);

    expect(mockUser.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns false when user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await remove(99);

    expect(result).toBe(false);
    expect(mockUser.destroy).not.toHaveBeenCalled();
  });
});
