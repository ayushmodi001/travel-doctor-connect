import {
  DestinationCountry,
  MedicalPhrase,
  MedicineEquivalent,
  TravelInsurancePolicy,
} from '../types';

// All travel intelligence is generated live from Google Gemini AI and retrieved from Neon DB.
// No hardcoded mock data.
export const DESTINATION_COUNTRIES: DestinationCountry[] = [];
export const MEDICAL_PHRASES: MedicalPhrase[] = [];
export const MEDICINE_EQUIVALENTS: MedicineEquivalent[] = [];
export const DEFAULT_TRAVEL_INSURANCE: Partial<TravelInsurancePolicy> = {};
