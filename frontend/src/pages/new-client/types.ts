export interface IdentityState {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit: string;
  businessName: string;
}

export interface RestrictionsState {
  underlyingDiseases: string[];
  restrictions: string[];
}

export interface PlanState {
  planId: number | null;
  startDate: string;
  discount: number;
}
