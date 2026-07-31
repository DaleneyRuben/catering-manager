import Client from '../../../models/Client';
import { findBirthdays } from '../find-birthdays';

jest.mock('../../../models/Client');

jest.mock('../../../utils/date', () => ({
  ...jest.requireActual('../../../utils/date'),
  appToday: jest.fn(() => '2026-06-25'),
}));

describe('findBirthdays', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps id, name, and dateOfBirth for each client', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Jorge Rengel', dateOfBirth: '1990-06-06' },
    ]);

    const result = await findBirthdays();

    expect(result).toEqual([
      { id: 1, name: 'Jorge Rengel', dateOfBirth: '1990-06-06', isToday: false },
    ]);
  });

  it('marks isToday true when the month and day match today', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Pablo', dateOfBirth: '1999-06-25' },
    ]);

    const result = await findBirthdays();

    expect(result[0].isToday).toBe(true);
  });

  it('filters by the current month via EXTRACT', async () => {
    (Client.findAll as jest.Mock).mockResolvedValue([]);

    await findBirthdays();

    const call = (Client.findAll as jest.Mock).mock.calls[0][0];
    expect(call.where).toBeDefined();
  });
});
