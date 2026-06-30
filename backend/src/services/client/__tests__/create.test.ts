import Client from '../../../models/Client';
import { create } from '../create';

jest.mock('../../../models/Client');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
};

const validPayload = {
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
} as const;

describe('create', () => {
  it('creates a client with valid data', async () => {
    (Client.create as jest.Mock).mockResolvedValue(mockClient);

    const result = await create(validPayload as never);

    expect(Client.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'John Doe', deliveryZone: 'Centro' });
  });

  it('propagates db errors', async () => {
    (Client.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(create(validPayload as never)).rejects.toThrow('db error');
  });
});
