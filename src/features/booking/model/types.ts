export interface BookingFormConfig {
  requiresProfessional: boolean;
  requiresService: boolean;
  requiresGuestCount: boolean;
  requiresTable: boolean;
  requiresPatientDetails: boolean;
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
