export interface NewClientFormValues {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  deliveryZone: string;
  delivery: string;
  nit: string;
  businessName: string;
  planId: string | null;
  contractDate: string;
  startDate: string;
  duration: number;
  discount: number;
  specialInstructions: Record<string, string>;
}

export interface RestrictionsState {
  restrictions: string[];
  underlyingDiseases: string[];
}
