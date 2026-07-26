import Appointment from '../../../models/Appointment';
import { updateAppointment } from '../update-appointment';

jest.mock('../../../models/Appointment');

describe('updateAppointment', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns null when the appointment does not exist', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await updateAppointment(99, { name: 'Nuevo nombre' });

    expect(result).toBeNull();
  });

  it('updates an existing appointment with the given fields', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1, name: 'Nuevo nombre' });
    (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 1, update });

    await updateAppointment(1, { name: 'Nuevo nombre', time: '10:30' });

    expect(update).toHaveBeenCalledWith({ name: 'Nuevo nombre', time: '10:30' });
  });

  it('strips name and phone from the update when the appointment has a linked client', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1 });
    (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 1, clientId: 5, update });

    await updateAppointment(1, {
      name: 'Nombre hackeado',
      phone: '99999999',
      date: '2026-08-01',
      time: '10:30',
    });

    expect(update).toHaveBeenCalledWith({ date: '2026-08-01', time: '10:30' });
  });
});
