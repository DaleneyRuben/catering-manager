import Appointment from '../../../models/Appointment';
import { findById } from '../find-by-id';

jest.mock('../../../models/Appointment');

describe('findById', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns null when the appointment does not exist', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await findById(99);

    expect(result).toBeNull();
  });

  it('returns the appointment when it exists', async () => {
    const appointment = { id: 1, clientId: 7, name: 'Ana', phone: '123' };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);

    const result = await findById(1);

    expect(Appointment.findByPk).toHaveBeenCalledWith(1);
    expect(result).toBe(appointment);
  });
});
