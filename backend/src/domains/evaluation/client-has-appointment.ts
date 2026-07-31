import Appointment from '../../models/Appointment';

// A Nutricionista reaches a client only through an appointment linking her to them (see ADR-006).
// Resolved appointments still count — access must survive the resolution that created the plan.
export const clientHasAppointment = async (clientId: number): Promise<boolean> =>
  (await Appointment.count({ where: { clientId } })) > 0;
