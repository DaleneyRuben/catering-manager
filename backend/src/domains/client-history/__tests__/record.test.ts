import type { Transaction } from 'sequelize';
import ClientHistory from '../../../models/ClientHistory';
import type { Actor } from '../../../types/actor';
import { record } from '../record';

jest.mock('../../../models/ClientHistory');

const mockedCreate = ClientHistory.create as jest.Mock;

const actor: Actor = { userId: 7, username: 'Silvia' };

describe('record', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreate.mockResolvedValue({});
  });

  it('stamps the acting user on the row', async () => {
    await record(actor, { type: 'plan_finalized', clientId: 42 });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 42,
        eventType: 'finalized',
        userId: 7,
        username: 'Silvia',
      }),
    );
  });

  it('defaults metadata to an empty object for an event that carries none', async () => {
    await record(actor, { type: 'client_deleted', clientId: 42 });

    expect(mockedCreate.mock.calls[0][0].metadata).toEqual({});
  });

  it('passes the event metadata through untouched', async () => {
    await record(actor, {
      type: 'days_suspended',
      clientId: 42,
      metadata: { dates: ['2026-08-03'] },
    });

    expect(mockedCreate.mock.calls[0][0].metadata).toEqual({ dates: ['2026-08-03'] });
  });

  it('records the moment the event occurred', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T09:30:00Z'));

    await record(actor, { type: 'plan_paused', clientId: 42 });

    expect(mockedCreate.mock.calls[0][0].occurredAt).toEqual(new Date('2026-08-01T09:30:00Z'));

    jest.useRealTimers();
  });

  it('joins the caller transaction when one is given', async () => {
    const transaction = {} as Transaction;

    await record(actor, { type: 'plan_resumed', clientId: 42 }, transaction);

    expect(mockedCreate).toHaveBeenCalledWith(expect.any(Object), { transaction });
  });

  it('writes without a transaction argument when none is given', async () => {
    await record(actor, { type: 'plan_resumed', clientId: 42 });

    expect(mockedCreate.mock.calls[0]).toHaveLength(1);
  });

  it('propagates a write failure', async () => {
    mockedCreate.mockRejectedValue(new Error('db down'));

    await expect(record(actor, { type: 'plan_finalized', clientId: 42 })).rejects.toThrow(
      'db down',
    );
  });
});
