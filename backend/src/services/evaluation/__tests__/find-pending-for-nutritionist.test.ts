import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import { appToday } from '../../../utils/date';
import { findPendingForNutritionist } from '../find-pending-for-nutritionist';

jest.mock('../../../models/Appointment');
jest.mock('../../../utils/date');

describe('findPendingForNutritionist', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (appToday as jest.Mock).mockReturnValue('2026-07-25');
    (Appointment.destroy as jest.Mock).mockResolvedValue(0);
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);
  });

  it('prunes stale pendiente appointments before querying', async () => {
    await findPendingForNutritionist();

    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: {
        date: { [Op.lt]: '2026-07-25' },
        subscriptionId: { [Op.is]: null },
      },
    });
  });

  it('queries pending appointments dated today or later, ordered chronologically', async () => {
    await findPendingForNutritionist();

    expect(Appointment.findAll).toHaveBeenCalledWith({
      where: {
        date: { [Op.gte]: '2026-07-25' },
        subscriptionId: { [Op.is]: null },
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
    });
  });
});
