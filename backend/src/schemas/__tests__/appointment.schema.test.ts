import { createAppointmentSchema, updateAppointmentSchema } from '../appointment.schema';

describe('createAppointmentSchema', () => {
  it('accepts new-client mode with name and phone', () => {
    const result = createAppointmentSchema.safeParse({
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result.success).toBe(true);
  });

  it('accepts existing-client mode with only clientId', () => {
    const result = createAppointmentSchema.safeParse({
      clientId: 'abc123',
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result.success).toBe(true);
  });

  it('rejects when clientId and name/phone are both provided', () => {
    const result = createAppointmentSchema.safeParse({
      clientId: 'abc123',
      name: 'Ana Pérez',
      phone: '71234567',
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result.success).toBe(false);
  });

  it('rejects when neither clientId nor name/phone are provided', () => {
    const result = createAppointmentSchema.safeParse({
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result.success).toBe(false);
  });

  it('rejects new-client mode missing phone', () => {
    const result = createAppointmentSchema.safeParse({
      name: 'Ana Pérez',
      date: '2026-07-27',
      time: '09:00',
    });

    expect(result.success).toBe(false);
  });
});

describe('updateAppointmentSchema', () => {
  it('accepts an optional subscriptionId for stamping a renewal', () => {
    const result = updateAppointmentSchema.safeParse({ subscriptionId: 'abc123' });

    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = updateAppointmentSchema.safeParse({});

    expect(result.success).toBe(true);
  });
});
