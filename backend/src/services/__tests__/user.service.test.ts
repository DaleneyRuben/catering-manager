import bcrypt from 'bcrypt';
import User from '../../models/User';
import userService from '../user.service';
import { ROLES } from '../../constants/roles';

jest.mock('../../models/User');
jest.mock('bcrypt');

const mockUser = {
  id: 1,
  username: 'ada',
  role: ROLES.KITCHEN,
  password: '$2b$10$hashed',
  update: jest.fn(),
  destroy: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('userService.findAll', () => {
  it('returns users without passwords', async () => {
    (User.findAll as jest.Mock).mockResolvedValue([mockUser]);

    const result = await userService.findAll();

    expect(User.findAll).toHaveBeenCalledWith({
      attributes: ['id', 'username', 'role', 'lastLoginAt', 'deletedAt'],
      order: [['username', 'ASC']],
      paranoid: false,
    });
    expect(result).toEqual([mockUser]);
  });
});

describe('userService.findById', () => {
  it('returns user without password when found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    const result = await userService.findById(1);

    expect(User.findByPk).toHaveBeenCalledWith(1, {
      attributes: ['id', 'username', 'role', 'lastLoginAt', 'deletedAt'],
      paranoid: false,
    });
    expect(result).toEqual(mockUser);
  });

  it('returns null when user does not exist', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await userService.findById(99);

    expect(result).toBeNull();
  });
});

describe('userService.create', () => {
  it('hashes password and creates user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    await userService.create({ username: 'ada', password: 'secret123', role: ROLES.KITCHEN });

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(User.create).toHaveBeenCalledWith({
      username: 'ada',
      password: '$2b$10$hashed',
      role: ROLES.KITCHEN,
    });
  });
});

describe('userService.update', () => {
  it('updates username and role without rehashing when no password given', async () => {
    (User.findByPk as jest.Mock)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce({ ...mockUser, username: 'ada2' });

    const result = await userService.update(1, { username: 'ada2', role: ROLES.ADMIN });

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(mockUser.update).toHaveBeenCalledWith({ username: 'ada2', role: ROLES.ADMIN });
    expect(result).toMatchObject({ username: 'ada2' });
  });

  it('hashes password when included in update', async () => {
    (User.findByPk as jest.Mock).mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

    await userService.update(1, { password: 'newpass123' });

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass123', 10);
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({ password: '$2b$10$newhash' }),
    );
  });

  it('returns null when user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await userService.update(99, { username: 'ghost' });

    expect(result).toBeNull();
    expect(mockUser.update).not.toHaveBeenCalled();
  });
});

describe('userService.remove', () => {
  it('destroys user and returns true', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

    const result = await userService.remove(1);

    expect(mockUser.destroy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('returns false when user not found', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await userService.remove(99);

    expect(result).toBe(false);
    expect(mockUser.destroy).not.toHaveBeenCalled();
  });
});
