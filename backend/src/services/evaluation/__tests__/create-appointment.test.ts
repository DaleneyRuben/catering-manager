import Appointment from '../../../models/Appointment';
import Client from '../../../models/Client';
import { createAppointment } from '../create-appointment';

jest.mock('../../../models/Appointment');
jest.mock('../../../models/Client');

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

  it('derives name and phone from the linked client when clientId is given', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue({
      id: 5,
      name: 'Fernando Daleney',
      phoneNumber: '76637732',
    });
    (Appointment.create as jest.Mock).mockResolvedValue({ id: 2, clientId: 5 });

    await createAppointment({
      clientId: 5,
      date: '2026-07-27',
      time: '09:00',
    });

    expect(Client.findByPk).toHaveBeenCalledWith(5);
    expect(Appointment.create).toHaveBeenCalledWith({
      name: 'Fernando Daleney',
      phone: '76637732',
      date: '2026-07-27',
      time: '09:00',
      clientId: 5,
    });
  });

  it('returns null without creating an appointment when the linked client is not found', async () => {
    (Client.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await createAppointment({
      clientId: 999,
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result).toBeNull();
    expect(Appointment.create).not.toHaveBeenCalled();
  });

  it('rejects creating an appointment at the same date and time as an existing pending one', async () => {
    (Appointment.findOne as jest.Mock).mockResolvedValue({ id: 3 });

    await expect(
      createAppointment({
        name: 'Ana Pérez',
        phone: '71234567',
        date: '2026-07-30',
        time: '15:00',
      }),
    ).rejects.toThrow('Ya existe una cita pendiente en esa fecha y hora.');

    expect(Appointment.create).not.toHaveBeenCalled();
  });
});
