import bcrypt from 'bcrypt';
import User from '../../../models/User';
import { create } from '../create';
import { ROLES } from '../../../constants/roles';

jest.mock('../../../models/User');
jest.mock('bcrypt');

const mockUser = { id: 1, username: 'ada', role: ROLES.KITCHEN, password: '$2b$10$hashed' };

beforeEach(() => jest.clearAllMocks());

describe('create', () => {
  it('hashes password and creates user', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashed');
    (User.create as jest.Mock).mockResolvedValue(mockUser);

    await create({ username: 'ada', password: 'secret123', role: ROLES.KITCHEN });

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(User.create).toHaveBeenCalledWith({
      username: 'ada',
      password: '$2b$10$hashed',
      role: ROLES.KITCHEN,
    });
  });
});
