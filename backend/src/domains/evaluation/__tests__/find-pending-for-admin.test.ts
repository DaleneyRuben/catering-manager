import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import { appToday } from '../../../utils/date';
import { findPendingForAdmin } from '../find-pending-for-admin';

jest.mock('../../../models/Appointment');
jest.mock('../../../utils/date');

describe('findPendingForAdmin', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (appToday as jest.Mock).mockReturnValue('2026-07-25');
    (Appointment.destroy as jest.Mock).mockResolvedValue(0);
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);
  });

  it('prunes stale pendiente appointments before querying', async () => {
    await findPendingForAdmin();

    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: {
        date: { [Op.lt]: '2026-07-25' },
        subscriptionId: { [Op.is]: null },
      },
    });
  });

  it('queries unconverted appointments dated today or later, ordered chronologically', async () => {
    await findPendingForAdmin();

    expect(Appointment.findAll).toHaveBeenCalledWith({
      where: {
        subscriptionId: { [Op.is]: null },
        date: { [Op.gte]: '2026-07-25' },
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
    });
  });
});
