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
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await updateAppointment(1, {
      name: 'Nombre hackeado',
      phone: '99999999',
      date: '2026-08-01',
      time: '10:30',
    });

    expect(update).toHaveBeenCalledWith({ date: '2026-08-01', time: '10:30' });
  });

  it("rejects moving the date or time onto another pending appointment's slot", async () => {
    const update = jest.fn();
    (Appointment.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      date: '2026-07-29',
      time: '09:00',
      update,
    });
    (Appointment.findOne as jest.Mock).mockResolvedValue({ id: 2 });

    await expect(updateAppointment(1, { date: '2026-07-30', time: '15:00' })).rejects.toThrow(
      'Ya existe una cita pendiente en esa fecha y hora.',
    );

    expect(update).not.toHaveBeenCalled();
  });

  it('excludes itself from the collision check when the date/time is unchanged', async () => {
    const update = jest.fn().mockResolvedValue({ id: 1 });
    (Appointment.findByPk as jest.Mock).mockResolvedValue({
      id: 1,
      date: '2026-07-30',
      time: '15:00',
      update,
    });
    (Appointment.findOne as jest.Mock).mockResolvedValue(null);

    await updateAppointment(1, { name: 'Nuevo nombre' });

    expect(Appointment.findOne).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ name: 'Nuevo nombre' });
  });
});
