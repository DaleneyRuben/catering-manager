import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import { findPendingForAdmin } from '../find-pending-for-admin';

jest.mock('../../../models/Appointment');

describe('findPendingForAdmin', () => {
  beforeEach(() => jest.resetAllMocks());

  it('queries unconverted appointments ordered chronologically', async () => {
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);

    await findPendingForAdmin();

    expect(Appointment.findAll).toHaveBeenCalledWith({
      where: { subscriptionId: { [Op.is]: null } },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
    });
  });
});
