export interface BookingFormConfig {
  requiresProfessional: boolean;
  requiresService: boolean;
  requiresGuestCount: boolean;
  requiresTable: boolean;
  requiresPatientDetails: boolean;
  logoUrl?: string | null;
  accentColor?: string;
  secondaryColor?: string;
  businessName?: string;
}

export interface BookingFormData {
  professionalId?: string;
  serviceId?: string;
  guestCount?: number;
  tablePreference?: string;
  patientNotes?: string;
  selectedDate?: string;
  selectedTime?: string;
}
