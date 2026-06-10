import { clientStatus } from './client';
import type { Client } from './client';

const today = new Date(2026, 5, 3); // Wednesday June 3
const todayIso = '2026-06-03';

const makeSub = (overrides = {}) => ({
  id: 1,
  clientId: 1,
  planId: 1,
  contractDate: '2026-05-01',
  startDate: '2026-05-01',
  contractEndDate: '2026-07-01',
  discount: 0,
  suspendedDates: [] as string[],
  plan: { id: 1, name: 'Completo', meals: [], price: 2500 },
  ...overrides,
});

const makeClient = (overrides = {}): Client => ({
  id: 1,
  name: 'Test',
  sex: 'male',
  dateOfBirth: '1990-01-01',
  phoneNumber: '123',
  address: 'Calle 1',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  isActive: true,
  subscriptions: [makeSub()],
  ...overrides,
});

describe('clientStatus', () => {
  it('returns suspended when today is in suspendedDates', () => {
    const client = makeClient({
      subscriptions: [makeSub({ suspendedDates: [todayIso] })],
    });
    expect(clientStatus(client, today)).toBe('suspended');
  });

  it('returns active when today is not in suspendedDates', () => {
    const client = makeClient({
      subscriptions: [makeSub({ suspendedDates: ['2026-06-10'] })],
    });
    expect(clientStatus(client, today)).toBe('active');
  });

  it('returns ended over suspended when contract has ended', () => {
    const client = makeClient({
      subscriptions: [makeSub({ contractEndDate: '2026-06-02', suspendedDates: [todayIso] })],
    });
    expect(clientStatus(client, today)).toBe('ended');
  });

  it('returns paused over suspended when client is not active', () => {
    const client = makeClient({
      isActive: false,
      subscriptions: [makeSub({ suspendedDates: [todayIso] })],
    });
    expect(clientStatus(client, today)).toBe('paused');
  });

  it('returns future when start date is in the future', () => {
    const client = makeClient({
      subscriptions: [makeSub({ startDate: '2099-01-01', contractEndDate: '2099-03-01' })],
    });
    expect(clientStatus(client, today)).toBe('future');
  });

  it('returns paused (not future) when client is inactive even with a future start date', () => {
    const client = makeClient({
      isActive: false,
      subscriptions: [makeSub({ startDate: '2099-01-01', contractEndDate: '2099-03-01' })],
    });
    expect(clientStatus(client, today)).toBe('paused');
  });
});
