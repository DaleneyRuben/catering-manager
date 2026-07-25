import { Op } from 'sequelize';
import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { appToday } from '../../../utils/date';
import { findForNutritionist } from '../find-for-nutritionist';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');
jest.mock('../../../utils/date');

describe('findForNutritionist', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (appToday as jest.Mock).mockReturnValue('2026-07-25');
    (Appointment.destroy as jest.Mock).mockResolvedValue(0);
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);
  });

  it('prunes stale pendiente appointments before querying', async () => {
    await findForNutritionist();

    expect(Appointment.destroy).toHaveBeenCalledWith({
      where: {
        date: { [Op.lt]: '2026-07-25' },
        subscriptionId: { [Op.is]: null },
      },
    });
  });

  it('queries appointments dated today or later, including subscription paid status, ordered chronologically', async () => {
    await findForNutritionist();

    expect(Appointment.findAll).toHaveBeenCalledWith({
      where: { date: { [Op.gte]: '2026-07-25' } },
      include: [{ model: Subscription, attributes: ['paid'] }],
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
    });
  });
});
