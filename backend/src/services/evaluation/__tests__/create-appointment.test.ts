import Appointment from '../../../models/Appointment';
import { createAppointment } from '../create-appointment';

jest.mock('../../../models/Appointment');

describe('createAppointment', () => {
  beforeEach(() => jest.resetAllMocks());

  it('creates an appointment with name, phone, date, and time', async () => {
    (Appointment.create as jest.Mock).mockResolvedValue({ id: 1 });

    await createAppointment({
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-07-27',
      time: '09:00',
    });

    expect(Appointment.create).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-07-27',
      time: '09:00',
    });
  });
});
