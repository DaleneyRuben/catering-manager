import Appointment from '../../../models/Appointment';
import sequelize from '../../../database/sequelize';
import { create as createClient } from '../../client';
import { create as createSubscription } from '../../subscription';
import { convertAppointment } from '../convert-appointment';

jest.mock('../../../models/Appointment');
jest.mock('../../../database/sequelize', () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));
jest.mock('../../client');
jest.mock('../../subscription');

const clientData = {
  name: 'Ana',
  sex: 'F',
  dateOfBirth: '1990-01-01',
  phoneNumber: '123',
  address: 'Calle 1',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  underlyingDiseases: [],
  restrictions: [],
} as never;

const subscriptionData = {
  planId: 2,
  contractDate: '2026-07-24',
  duration: 20,
  paid: true,
} as never;

const actor = { userId: 9, username: 'ada' };
const transaction = { id: 'txn-1' };

describe('convertAppointment', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (sequelize.transaction as jest.Mock).mockImplementation((cb) => cb(transaction));
  });

  it('returns null when the appointment does not exist', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

    const result = await convertAppointment(99, clientData, subscriptionData, actor);

    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('refuses to convert an already-converted appointment', async () => {
    (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 1, subscriptionId: 5 });

    const result = await convertAppointment(1, clientData, subscriptionData, actor);

    expect(result).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('creates the client and subscription and links the appointment inside a transaction', async () => {
    const appointment = { id: 1, subscriptionId: null, update: jest.fn().mockResolvedValue({}) };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);
    (createClient as jest.Mock).mockResolvedValue({ id: 7 });
    (createSubscription as jest.Mock).mockResolvedValue({ id: 3, clientId: 7 });

    const result = await convertAppointment(1, clientData, subscriptionData, actor);

    expect(sequelize.transaction).toHaveBeenCalled();
    expect(createClient).toHaveBeenCalledWith(clientData, transaction);
    expect(appointment.update).toHaveBeenCalledWith({ subscriptionId: 3 }, { transaction });
    expect(result).toMatchObject({ client: { id: 7 }, subscription: { id: 3, clientId: 7 } });
  });

  it('passes the appointment id through to the subscription so provenance is recorded', async () => {
    const appointment = { id: 1, subscriptionId: null, update: jest.fn().mockResolvedValue({}) };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);
    (createClient as jest.Mock).mockResolvedValue({ id: 7 });
    (createSubscription as jest.Mock).mockResolvedValue({ id: 3, clientId: 7 });

    await convertAppointment(1, clientData, subscriptionData, actor);

    expect(createSubscription).toHaveBeenCalledWith(
      7,
      { ...(subscriptionData as object), appointmentId: 1 },
      actor,
      transaction,
    );
  });

  it('does not stamp the appointment when subscription creation fails inside the transaction', async () => {
    const appointment = { id: 1, subscriptionId: null, update: jest.fn().mockResolvedValue({}) };
    (Appointment.findByPk as jest.Mock).mockResolvedValue(appointment);
    (createClient as jest.Mock).mockResolvedValue({ id: 7 });
    (createSubscription as jest.Mock).mockResolvedValue(null);

    const result = await convertAppointment(1, clientData, subscriptionData, actor);

    expect(appointment.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
