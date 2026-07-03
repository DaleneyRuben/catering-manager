import { findGroups } from '../find-groups';
import { findActiveSubscriptionsForDate } from '../../subscription/find-active-for-date';

jest.mock('../../subscription/find-active-for-date', () => ({
  findActiveSubscriptionsForDate: jest.fn(),
}));

const mockAppToday = jest.fn(() => '2026-07-01'); // Wednesday → tomorrow Thursday
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

const makeSubscription = (name: string, meals: string[]) => ({
  client: { name },
  plan: { meals },
});

const mockSubscriptions = (subs: ReturnType<typeof makeSubscription>[]) =>
  (findActiveSubscriptionsForDate as jest.Mock).mockResolvedValue(subs);

describe('findGroups', () => {
  beforeEach(() => jest.clearAllMocks());

  it('queries active subscriptions for the literal calendar tomorrow', async () => {
    mockSubscriptions([]);

    const result = await findGroups();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-07-02');
    expect(result.date).toBe('2026-07-02');
    expect(result.isDeliveryDay).toBe(true);
  });

  it('classifies full plans (6+ meals) before lunchAndDinner and lunchOnly', async () => {
    mockSubscriptions([
      makeSubscription('Full Plan Client', [
        'breakfast',
        'morning_snack',
        'salad',
        'lunch',
        'afternoon_snack',
        'dinner',
      ]),
      makeSubscription('Lunch And Dinner Client', ['lunch', 'dinner', 'salad']),
      makeSubscription('Lunch Only Client', ['lunch', 'salad']),
    ]);

    const { groups } = await findGroups();

    expect(groups.full).toEqual(['Full Plan Client']);
    expect(groups.lunchAndDinner).toEqual(['Lunch And Dinner Client']);
    expect(groups.lunchOnly).toEqual(['Lunch Only Client']);
    expect(groups.juice).toEqual([]);
  });

  it('counts juice and extra toward the 6-meal full threshold', async () => {
    mockSubscriptions([
      makeSubscription('Padded Plan Client', [
        'breakfast',
        'salad',
        'lunch',
        'dinner',
        'juice',
        'extra',
      ]),
    ]);

    const { groups } = await findGroups();

    expect(groups.full).toEqual(['Padded Plan Client']);
    expect(groups.lunchAndDinner).toEqual([]);
  });

  it('adds juice clients to the juice group and exactly one other group', async () => {
    mockSubscriptions([makeSubscription('Juice And Lunch Client', ['juice', 'lunch'])]);

    const { groups } = await findGroups();

    expect(groups.juice).toEqual(['Juice And Lunch Client']);
    expect(groups.lunchOnly).toEqual(['Juice And Lunch Client']);
    expect(groups.lunchAndDinner).toEqual([]);
    expect(groups.full).toEqual([]);
  });

  it('puts a juice-plus-breakfast client only in the juice group', async () => {
    mockSubscriptions([makeSubscription('Juice Breakfast Client', ['juice', 'breakfast'])]);

    const { groups } = await findGroups();

    expect(groups.juice).toEqual(['Juice Breakfast Client']);
    expect(groups.lunchOnly).toEqual([]);
    expect(groups.lunchAndDinner).toEqual([]);
    expect(groups.full).toEqual([]);
  });

  it('excludes unclassifiable clients from all groups and from the total', async () => {
    mockSubscriptions([
      makeSubscription('Breakfast Only Client', ['breakfast']),
      makeSubscription('Lunch Client', ['lunch']),
    ]);

    const result = await findGroups();

    expect(result.total).toBe(1);
    expect(result.groups.juice).toEqual([]);
    expect(result.groups.lunchOnly).toEqual(['Lunch Client']);
    expect(result.groups.full).toEqual([]);
    expect(result.groups.lunchAndDinner).toEqual([]);
  });

  it('counts a client placed in juice and another group once in the total', async () => {
    mockSubscriptions([
      makeSubscription('Juice And Lunch Client', ['juice', 'lunch']),
      makeSubscription('Juice Breakfast Client', ['juice', 'breakfast']),
    ]);

    const result = await findGroups();

    expect(result.total).toBe(2);
  });

  it('sorts names within each group with spanish collation', async () => {
    mockSubscriptions([
      makeSubscription('Zoe Vargas', ['lunch']),
      makeSubscription('Ángela Rojas', ['lunch']),
      makeSubscription('Carlos Ríos', ['lunch']),
    ]);

    const { groups } = await findGroups();

    expect(groups.lunchOnly).toEqual(['Ángela Rojas', 'Carlos Ríos', 'Zoe Vargas']);
  });

  it('returns the empty weekend shape without querying when tomorrow is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-07-03'); // Friday → tomorrow Saturday

    const result = await findGroups();

    expect(findActiveSubscriptionsForDate).not.toHaveBeenCalled();
    expect(result).toEqual({
      date: '2026-07-04',
      isDeliveryDay: false,
      total: 0,
      groups: { juice: [], lunchOnly: [], lunchAndDinner: [], full: [] },
    });
  });

  it('queries monday as a delivery day when today is sunday', async () => {
    mockAppToday.mockReturnValueOnce('2026-07-05'); // Sunday → tomorrow Monday
    mockSubscriptions([]);

    const result = await findGroups();

    expect(findActiveSubscriptionsForDate).toHaveBeenCalledWith('2026-07-06');
    expect(result.isDeliveryDay).toBe(true);
  });
});
