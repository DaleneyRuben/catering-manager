import type { Client } from '@/features/clients/types';

export interface PendingPaymentClient extends Client {
  isExistingClientRenewal: boolean;
}

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  subscriptionId: string | null;
  subscription?: { paid: boolean } | null;
  clientId: string | null;
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
