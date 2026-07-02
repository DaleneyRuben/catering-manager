import Subscription from '../../../models/Subscription';
import { findContractEnding } from '../find-contract-ending';

jest.mock('../../../models/Client');
jest.mock('../../../models/Plan');
jest.mock('../../../models/Subscription');

const mockAppToday = jest.fn(() => '2026-06-25');
jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: () => mockAppToday(),
}));

const makeContractEndingSub = (overrides: Partial<Record<string, unknown>> = {}) => ({
  contractEndDate: '2026-06-25',
  client: { id: 1, name: 'Ana López' },
  plan: { name: 'Reductor' },
  ...overrides,
});

describe('findContractEnding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps name, plan, and date for clients ending today', async () => {
    (Subscription.findAll as jest.Mock).mockImplementation(({ where }) =>
      where.contractEndDate === '2026-06-25'
        ? Promise.resolve([makeContractEndingSub()])
        : Promise.resolve([]),
    );

    const result = await findContractEnding();

    expect(result.today).toEqual([
      { id: 1, name: 'Ana López', plan: 'Reductor', date: '2026-06-25' },
    ]);
    expect(result.tomorrow).toEqual([]);
  });

  it('queries with finalizedAt IS NULL', async () => {
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findContractEnding();

    const call = (Subscription.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where.finalizedAt).toEqual({ [Symbol.for('is')]: null });
  });

  it('sorts results alphabetically by name', async () => {
    (Subscription.findAll as jest.Mock).mockImplementation(({ where }) =>
      where.contractEndDate === '2026-06-25'
        ? Promise.resolve([
            makeContractEndingSub({ client: { id: 1, name: 'Zara Gomez' } }),
            makeContractEndingSub({ client: { id: 2, name: 'Ana López' } }),
          ])
        : Promise.resolve([]),
    );

    const result = await findContractEnding();

    expect(result.today.map((p) => p.name)).toEqual(['Ana López', 'Zara Gomez']);
  });

  it('queries monday and tuesday when today is saturday', async () => {
    mockAppToday.mockReturnValueOnce('2026-06-27');
    (Subscription.findAll as jest.Mock).mockResolvedValue([]);

    await findContractEnding();

    const dates = (Subscription.findAll as jest.Mock).mock.calls.map(
      (call) => call[0].where.contractEndDate,
    );
    expect(dates).toContain('2026-06-29');
    expect(dates).toContain('2026-06-30');
  });
});
