import Appointment from '../../../models/Appointment';
import { clientHasAppointment } from '../client-has-appointment';

jest.mock('../../../models/Appointment');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('clientHasAppointment', () => {
  it('is true when an appointment links the client', async () => {
    (Appointment.count as jest.Mock).mockResolvedValue(1);

    expect(await clientHasAppointment(1)).toBe(true);
  });

  it('is false when no appointment links the client', async () => {
    (Appointment.count as jest.Mock).mockResolvedValue(0);

    expect(await clientHasAppointment(1)).toBe(false);
  });

  it('counts only the appointments of the given client', async () => {
    (Appointment.count as jest.Mock).mockResolvedValue(0);

    await clientHasAppointment(42);

    expect(Appointment.count).toHaveBeenCalledWith({ where: { clientId: 42 } });
  });

  it('is true for a resolved appointment too, so access survives the resolution', async () => {
    (Appointment.count as jest.Mock).mockResolvedValue(3);

    expect(await clientHasAppointment(1)).toBe(true);
  });
});
