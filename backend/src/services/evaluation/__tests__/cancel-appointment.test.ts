import Appointment from '../../../models/Appointment';
import { cancelAppointment } from '../cancel-appointment';

jest.mock('../../../models/Appointment');

describe('cancelAppointment', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns null when the appointment does not exist', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await cancelAppointment(99);

    expect(result).toBeNull();
  });

  it('destroys an unconverted appointment', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    const appointment = { id: 1, subscriptionId: null, destroy };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);

    const result = await cancelAppointment(1);

    expect(destroy).toHaveBeenCalled();
    expect(result).toBe(appointment);
  });

  it('refuses to cancel an already-converted appointment', async () => {
    const destroy = jest.fn();
    const appointment = { id: 1, subscriptionId: 5, destroy };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);

    const result = await cancelAppointment(1);

    expect(destroy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
