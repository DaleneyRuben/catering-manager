import Appointment from '../../../models/Appointment';
import Subscription from '../../../models/Subscription';
import { findForNutritionist } from '../find-for-nutritionist';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Subscription');

describe('findForNutritionist', () => {
  beforeEach(() => jest.resetAllMocks());

  it('queries all appointments, including subscription paid status, ordered chronologically', async () => {
    (Appointment.findAll as jest.Mock).mockResolvedValue([]);

    await findForNutritionist();

    expect(Appointment.findAll).toHaveBeenCalledWith({
      include: [{ model: Subscription, attributes: ['paid'] }],
      order: [
        ['date', 'ASC'],
        ['time', 'ASC'],
      ],
    });
  });
});
