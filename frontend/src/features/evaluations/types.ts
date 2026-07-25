export interface Appointment {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  subscriptionId: string | null;
  subscription?: { paid: boolean } | null;
}

export interface AppointmentDraft {
  name?: string;
  phone?: string;
  clientId?: string;
  date: string;
  time: string;
}

export interface ClientSearchResult {
  id: string;
  name: string;
  phoneNumber: string;
}

export type NutritionistAppointmentStatus = 'pendiente' | 'pagado' | 'no_pagado';
