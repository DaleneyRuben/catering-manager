import bcrypt from 'bcrypt';
import User from '../../../models/User';
import { createUser } from '../create-user';
import { ROLES } from '../../../constants/roles.constants';

jest.mock('../../../models/User');
jest.mock('bcrypt');

beforeEach(() => {
  jest.resetAllMocks();
});

const mockUser = {
  id: 1,
  username: 'ada',
  password: '$2b$10$hashedpassword',
  role: ROLES.ADMIN,
};

describe('createUser', () => {
  it('hashes password and creates user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
    (User.create as jest.Mock).mockResolvedValue({ ...mockUser, password: '$2b$10$hashed' });

    await createUser('ada', 'plain-pass', ROLES.ADMIN);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain-pass', 10);
    expect(User.create).toHaveBeenCalledWith({
      username: 'ada',
      password: '$2b$10$hashed',
      role: ROLES.ADMIN,
    });
  });
});
