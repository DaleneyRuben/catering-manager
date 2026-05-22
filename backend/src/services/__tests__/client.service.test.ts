import Client from '../../models/Client';
import clientService from '../client.service';

jest.mock('../../models/Client');

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Zone A',
  underlyingDiseases: ['diabetes'],
  allergies: ['gluten'],
};

describe('clientService.create', () => {
  it('creates a client with valid data', async () => {
    (Client.create as jest.Mock).mockResolvedValue(mockClient);

    const result = await clientService.create({
      name: 'John Doe',
      sex: 'male',
      dateOfBirth: '1990-05-15',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      deliveryZone: 'Zone A',
      underlyingDiseases: ['diabetes'],
      allergies: ['gluten'],
    });

    expect(Client.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'John Doe', sex: 'male' });
  });

  it('propagates db errors', async () => {
    (Client.create as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(
      clientService.create({
        name: 'John Doe',
        sex: 'male',
        dateOfBirth: '1990-05-15',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        deliveryZone: 'Zone A',
        underlyingDiseases: [],
        allergies: [],
      }),
    ).rejects.toThrow('db error');
  });
});

describe('clientService.findAll', () => {
  it('returns all clients', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([mockClient]);

    const result = await clientService.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'John Doe' });
  });
});

describe('clientService.findById', () => {
  it('returns client when found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ id: 1, name: 'John Doe' });
  });

  it('returns null when not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.findById(999);

    expect(result).toBeNull();
  });
});
