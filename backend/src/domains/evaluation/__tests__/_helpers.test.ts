import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import { ConflictError } from '../../../utils/errors';
import { assertSlotAvailable } from '../_helpers';

jest.mock('../../../models/Appointment');

describe('assertSlotAvailable', () => {
  beforeEach(() => jest.resetAllMocks());

  it('resolves when no pending appointment exists at that date and time', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await expect(assertSlotAvailable('2026-07-30', '15:00')).resolves.toBeUndefined();
  });

  it('queries only pending appointments at that exact date and time', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await assertSlotAvailable('2026-07-30', '15:00');

    expect(Appointment.findOne).toHaveBeenCalledWith({
      where: {
        date: '2026-07-30',
        time: '15:00',
        subscriptionId: { [Op.is]: null },
      },
    });
  });

  it('throws a ConflictError when a pending appointment already exists at that date and time', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue({ id: 1 });

    await expect(assertSlotAvailable('2026-07-30', '15:00')).rejects.toThrow(ConflictError);
  });

  it('excludes the given id from the collision check', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await assertSlotAvailable('2026-07-30', '15:00', 7);

    expect(Appointment.findOne).toHaveBeenCalledWith({
      where: {
        date: '2026-07-30',
        time: '15:00',
        subscriptionId: { [Op.is]: null },
        id: { [Op.ne]: 7 },
      },
    });
  });
});
