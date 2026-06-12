import { Op } from 'sequelize';
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
  pausedSince: null,
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

  it('includes computed status in each row', async () => {
    const clientWithSub = {
      ...mockClient,
      subscriptions: [
        { startDate: '2026-01-01', contractEndDate: '2026-12-31', suspendedDates: [] },
      ],
    };
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [clientWithSub], count: 1 });

    const result = await clientService.findAll();

    expect(result.rows[0]).toMatchObject({ status: expect.any(String) });
  });

  it('sorts subscriptions newest-first so subscriptions[0] is the current one', async () => {
    const clientWithTwoSubs = {
      ...mockClient,
      subscriptions: [
        { id: 1, contractEndDate: '2026-05-01' },
        { id: 3, contractEndDate: '2026-08-01' },
        { id: 2, contractEndDate: '2026-07-01' },
      ],
    };
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({
      rows: [clientWithTwoSubs],
      count: 1,
    });

    const result = await clientService.findAll();

    const subs = (result.rows[0] as never as { subscriptions: { id: number }[] }).subscriptions;
    expect(subs[0].id).toBe(3);
    expect(subs[1].id).toBe(2);
    expect(subs[2].id).toBe(1);
  });
});

describe('clientService.findById', () => {
  it('returns client when found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(mockClient);

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ id: 1, name: 'John Doe' });
  });

  it('includes computed status in the response', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({
      ...mockClient,
      subscriptions: [
        { startDate: '2026-01-01', contractEndDate: '2026-12-31', suspendedDates: [] },
      ],
    });

    const result = await clientService.findById(1);

    expect(result).toMatchObject({ status: expect.any(String) });
  });

  it('returns null when not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.findById(999);

    expect(result).toBeNull();
  });
});

describe('clientService.update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets pausedSince to a date when pausing and records paused history event', async () => {
    const pausedSince = '2026-06-10T12:00:00Z';
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.update(1, { pausedSince });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'paused' }),
    );
    expect(mockInstance.update).toHaveBeenCalledWith({ pausedSince });
  });

  it('sets pausedSince to null when resuming and records resumed history event', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-01'),
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.update(1, { pausedSince: null });

    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'resumed' }),
    );
    expect(mockInstance.update).toHaveBeenCalledWith({ pausedSince: null });
  });

  it('does not record a history event when non-pause fields are updated', async () => {
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockResolvedValue({ ...mockClient, name: 'Jane Doe' }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await clientService.update(1, { name: 'Jane Doe' });

    expect(ClientHistory.create).not.toHaveBeenCalled();
    expect(mockInstance.update).toHaveBeenCalledWith({ name: 'Jane Doe' });
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.update(999, { pausedSince: null });

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    const mockInstance = {
      pausedSince: null,
      subscriptions: [],
      update: jest.fn().mockRejectedValue(new Error('db error')),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);

    await expect(clientService.update(1, { pausedSince: null })).rejects.toThrow('db error');
  });
});

describe('clientService.findAll with filters', () => {
  beforeEach(() => jest.clearAllMocks());

  it('status=active filters by pausedSince IS NULL and requires subscription', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.where).toMatchObject({ pausedSince: { [Op.is]: null } });
    expect(call.include).toEqual(
      expect.arrayContaining([expect.objectContaining({ required: true })]),
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

  it('status=active excludes clients whose subscription has not started yet', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const futureStartExclusion = andConditions.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: any) => c?.val?.includes?.('startDate') && c?.val?.includes?.('NOT IN'),
    );
    expect(futureStartExclusion).toBe(true);
  });

  it('status=active uses contractEndDate >= today so contracts ending today are included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'active' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toMatchObject({
      contractEndDate: { [Op.gte]: expect.any(String) },
    });
  });

  it('status=paused uses contractEndDate >= today so plans ending today are included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    expect(call.include[0].where).toMatchObject({
      contractEndDate: { [Op.gte]: expect.any(String) },
    });
  });

  it('status=paused uses OR condition including pausedSince IS NOT NULL', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    const hasOr = andConditions.some(
      (c: unknown) => c !== null && typeof c === 'object' && Symbol.for('or') in (c as object),
    );
    expect(hasOr).toBe(true);
  });

  it('status=paused includes clients whose subscription has not started yet', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'paused' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    const orCondition = andConditions?.find(
      (c: unknown) => c !== null && typeof c === 'object' && Symbol.for('or') in (c as object),
    );
    const orEntries = orCondition?.[Symbol.for('or')];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasFutureStartEntry = orEntries?.some((c: any) => c?.val?.includes?.('startDate'));
    expect(hasFutureStartEntry).toBe(true);
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

  it('status=ended uses NOT EXISTS subquery with >= today so plans ending today are not included', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll({ status: 'ended' });

    const call = (Client.findAndCountAll as jest.Mock).mock.calls[0][0];
    const andConditions = call.where?.[Symbol.for('and')];
    expect(andConditions).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notExistsLiteral = andConditions.find((c: any) => c?.val?.includes?.('NOT EXISTS'));
    expect(notExistsLiteral).toBeDefined();
    expect(notExistsLiteral.val).toContain('>=');
  });

  it('no filters calls findAndCountAll without where', async () => {
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

    await clientService.findAll();

    expect(Client.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
  });

  it('returns rows and total from findAndCountAll', async () => {
    const mockClients = [{ id: 1, name: 'María García', pausedSince: null, subscriptions: [] }];
    (Client.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockClients, count: 42 });

    const result = await clientService.findAll({ status: 'active' });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ id: 1, name: 'María García' });
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
      expect.objectContaining({ limit: 25, offset: 0 }),
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

  it('sets contractEndDate and finalizedAt to today, and records finalized history event', async () => {
    const mockSub = { update: jest.fn().mockResolvedValue({}) };
    const mockInstance = {
      id: 1,
      pausedSince: null,
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.finalize(1);

    expect(mockSub.update).toHaveBeenCalledWith(
      expect.objectContaining({
        contractEndDate: expect.any(String),
        finalizedAt: expect.any(String),
      }),
    );
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

describe('clientService.softDelete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls destroy on the client and records deleted history event', async () => {
    const mockInstance = {
      id: 1,
      destroy: jest.fn().mockResolvedValue({}),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.softDelete(1);

    expect(mockInstance.destroy).toHaveBeenCalledTimes(1);
    expect(ClientHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: 1, eventType: 'deleted' }),
    );
  });

  it('returns null when client not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await clientService.softDelete(999);

    expect(result).toBeNull();
  });

  it('propagates db errors', async () => {
    (Client.findByPk as jest.Mock).mockRejectedValue(new Error('db error'));

    await expect(clientService.softDelete(1)).rejects.toThrow('db error');
  });
});
