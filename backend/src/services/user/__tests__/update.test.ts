import bcrypt from 'bcrypt';
import User from '../../../models/User';
import { update } from '../update';
import { ROLES } from '../../../constants/roles';

jest.mock('../../../models/User');
jest.mock('bcrypt');

const mockUser = {
  id: 1,
  username: 'ada',
  role: ROLES.KITCHEN,
  password: '$2b$10$hashed',
  update: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('update', () => {
  it('updates username and role without rehashing when no password given', async () => {
    (User.findByPk as jest.Mock)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ ...mockUser, username: 'ada2' });

    const result = await update(1, { username: 'ada2', role: ROLES.ADMIN });

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockUser.update).toHaveBeenCalledWith({ username: 'ada2', role: ROLES.ADMIN });
    expect(result).toMatchObject({ username: 'ada2' });
  });

  it('hashes password when included in update', async () => {
    (User.findByPk as jest.Mock).mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

    await update(1, { password: 'newpass123' });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ password: '$2b$10$newhash' }),
    );
  });

  it('returns null when user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await update(99, { username: 'ghost' });

    expect(result).toBeNull();
    expect(mockUser.update).not.toHaveBeenCalled();
  });
});
