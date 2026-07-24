import { deriveAppointmentStatus } from '@/features/evaluations/deriveAppointmentStatus';
import type { Appointment } from '@/features/evaluations/types';

const base: Appointment = {
  id: '1',
  name: 'Ana',
  phone: '123',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  subscription: null,
};

describe('deriveAppointmentStatus', () => {
  it('returns pendiente when not converted', () => {
    expect(deriveAppointmentStatus(base)).toBe('pendiente');
  });

  it('returns pagado when converted and paid', () => {
    expect(
      deriveAppointmentStatus({ ...base, subscriptionId: '9', subscription: { paid: true } }),
    ).toBe('pagado');
  });

  it('returns no_pagado when converted and unpaid', () => {
    expect(
      deriveAppointmentStatus({ ...base, subscriptionId: '9', subscription: { paid: false } }),
    ).toBe('no_pagado');
  });
});
