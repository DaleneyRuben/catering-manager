import Client from '../../models/Client';
import ClientHistory from '../../models/ClientHistory';
import clientService from '../client.service';

jest.mock('../../models/Client');
jest.mock('../../models/ClientHistory');
jest.mock('../../models/Subscription');
jest.mock('../../database/sequelize', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock('../../utils/date', () => ({
  ...jest.requireActual('../../utils/date'),
  appToday: jest.fn(() => '2026-06-05'),
}));
jest.mock('../deliveryGroup.service', () => ({
  __esModule: true,
  default: { findMembers: jest.fn() },
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

  it('extends contractEndDate on the subscription when resuming', async () => {
    // startDate=Mon Jun 1, duration=10, paused Wed Jun 3
    // elapsed = differenceInBusinessDays(Jun 3, Jun 1) = 2 (Mon+Tue delivered)
    // remaining = 10 - 2 = 8
    // resume today (mocked to 2026-06-05 Fri)
    // newContractEndDate = addDeliveryDays('2026-06-05', 8) = '2026-06-17'
    const mockSub = {
      startDate: '2026-06-01',
      duration: 10,
      contractEndDate: '2026-06-12',
      update: jest.fn().mockResolvedValue({}),
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'), // Jun 3 in La Paz (UTC-4 = 11am local)
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.update(1, { pausedSince: null });

    expect(mockSub.update).toHaveBeenCalledWith({ contractEndDate: '2026-06-17' });
  });

  it('skips contractEndDate extension when subscription has no startDate', async () => {
    const mockSub = {
      startDate: null,
      duration: 10,
      contractEndDate: null,
      update: jest.fn().mockResolvedValue({}),
    };
    const mockInstance = {
      id: 1,
      pausedSince: new Date('2026-06-03T15:00:00Z'),
      subscriptions: [mockSub],
      update: jest.fn().mockResolvedValue({ ...mockClient, pausedSince: null }),
    };
    (Client.findByPk as jest.Mock).mockResolvedValue(mockInstance);
    (ClientHistory.create as jest.Mock).mockResolvedValue({});

    await clientService.update(1, { pausedSince: null });

    expect(mockSub.update).not.toHaveBeenCalled();
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
