export interface NewClientFormValues {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit: string;
  businessName: string;
  planId: number | null;
  startDate: string;
  discount: number;
}

export interface RestrictionsState {
  restrictions: string[];
  underlyingDiseases: string[];
}
