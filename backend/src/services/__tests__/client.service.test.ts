import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import sequelize from '../../database/sequelize';
import clientService from '../client.service';

jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');
jest.mock('../../models/Subscription');
jest.mock('../../database/sequelize', () => ({
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
  nit: null,
  businessName: null,
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
  isActive: true,
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
      deliveryZone: 'Centro',
      delivery: 'La Oliva',
      underlyingDiseases: ['diabetes'],
      restrictions: ['gluten'],
    });

    expect(Client.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ name: 'John Doe', deliveryZone: 'Centro' });
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
        deliveryZone: 'Centro',
        delivery: 'La Oliva',
        underlyingDiseases: [],
        restrictions: [],
      }),
    ).rejects.toThrow('db error');
  });
});

describe('clientService.findAll', () => {
  it('returns rows and total', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockClient], count: 1 });

    const result = await clientService.findAll();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ name: 'John Doe' });
    expect(result.total).toBe(1);
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

describe('clientService.update', () => {
  it('updates a client and returns the updated instance', async () => {
    const mockInstance = {
      isActive: true,
      update: jest.fn().mockResolvedValue({ ...mockClient, isActive: false }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    const result = await clientService.update(1, { isActive: false });

    expect(mockInstance.update).toHaveBeenCalledWith({ isActive: false });
    expect(result).toMatchObject({ isActive: false });
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.update(999, { isActive: false });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = {
      isActive: true,
      update: jest.fn().mockRejectedValue(new Error('db error')),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(clientService.update(1, { isActive: false })).rejects.toThrow('db error');
  });
});

describe('clientService.findAll with filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('status=active passes isActive:true and required subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
        include: expect.arrayContaining([expect.objectContaining({ required: true })]),
      }),
    );
  });

  it('status=active excludes today-suspended clients via Op.and literal', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(andConditions.some((c: any) => c?.val?.includes?.('NOT IN'))).toBe(true);
  });

  it('status=paused uses OR condition for paused and suspended-today clients', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where?.isActive).toBeUndefined();
    expect(call.include[0].required).toBe(true);
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const hasOr = andConditions.some(
      (c: unknown) => c !== null && typeof c === 'object' && Symbol.for('or') in (c as object),
    );
    expect(hasOr).toBe(true);
  });

  it('status=ended uses left join (required:false)', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'ended' });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([expect.objectContaining({ required: false })]),
      }),
    );
  });

  it('status=ended uses NOT EXISTS subquery to avoid missing JOIN in count query', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'ended' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(andConditions.some((c: any) => c?.val?.includes?.('NOT EXISTS'))).toBe(true);
  });

  it('no filters calls findAndCountAll without where', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it('returns rows and total from findAndCountAll', async () => {
    const mockClients = [{ id: 1, name: 'María García' }];
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockClients, count: 42 });

    const result = await clientService.findAll({ status: 'active' });

    expect(result.rows).toBe(mockClients);
    expect(result.total).toBe(42);
  });

  it('applies limit and offset from page and limit params', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ page: 3, limit: 10 });

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 20 }),
    );
  });

  it('defaults to page 1 and limit 20 when not provided', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });
});

describe('clientService.getCounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns counts as numbers from string DB values', async () => {
    (sequelize.query as jest.Mock).mockResolvedValue([
      { active: '10', expiring: '5', paused: '3', ended: '2', total: '20' },
    ]);

    const result = await clientService.getCounts();

    expect(result).toEqual({ active: 10, expiring: 5, paused: 3, ended: 2, total: 20 });
  });

  it('propagates db errors', async () => {
    (sequelize.query as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(clientService.getCounts()).rejects.toThrow('db error');
  });
});

describe('clientService.finalize', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets contractEndDate to today, deactivates client, and records history', async () => {
    const mockSub = { update: jest.fn().mockResolvedValue({}) };
    const mockInstance = {
      id: 1,
      isActive: true,
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.finalize(1);

    expect(mockSub.update).toHaveBeenCalledWith(
      expect.objectContaining({ contractEndDate: expect.any(String) }),
    );
    expect(mockInstance.update).toHaveBeenCalledWith({ isActive: false });
    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'finalized' }),
    );
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.finalize(999);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(clientService.finalize(1)).rejects.toThrow('db error');
  });
});
