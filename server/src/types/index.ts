export type ConsultationType = 'video' | 'chat' | 'in-person';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  hospital: string;
  location: Location;
  rating: number;
  reviewCount: number;
  experience: number;
  fee: number;
  currency: string;
  profileImage: string;
  about: string;
  qualifications: string[];
  languages: string[];
  availableSlots: TimeSlot[];
  isAvailableNow: boolean;
  consultationType: ConsultationType[];
  verified: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: ConsultationType;
  status: 'upcoming' | 'completed' | 'cancelled';
  reason: string;
  meetingLink?: string;
  amount: number;
  currency: string;
  createdAt?: string;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: 'ambulance' | 'fire' | 'police' | 'hospital' | 'clinic' | 'pharmacy';
  phone: string;
  address: string;
  distance?: number;
  location: Location;
  available24h: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'admin';
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  profileImage?: string;
}

export interface DestinationCountry {
  code: string;
  name: string;
  flag: string;
  capital: string;
  currency: string;
  currencySymbol: string;
  primaryLanguage: string;
  emergencyNumbers: {
    general: string;
    ambulance: string;
    police: string;
    fire: string;
  };
  embassySupport: {
    title: string;
    phone: string;
    address: string;
  };
  healthAdvisories: {
    waterSafety: 'safe' | 'bottled_recommended' | 'boil_required';
    malariaRisk: 'none' | 'low' | 'moderate' | 'high';
    requiredVaccines: string[];
    recommendedVaccines: string[];
    currentAlert?: string;
  };
}

export interface MedicalPhrase {
  id: string;
  category: 'emergency' | 'symptoms' | 'pharmacy' | 'allergies' | 'doctor';
  english: string;
  translation: string;
  phonetic: string;
  language: string;
  languageCode: string;
  flag: string;
}

export interface MedicineEquivalent {
  id: string;
  genericName: string;
  primaryUse: string;
  commonHomeBrands: string[];
  brandsByCountry: Record<string, string>;
  customsRestrictions?: {
    isRestricted: boolean;
    bannedInCountries?: string[];
    warningNote?: string;
  };
  prescriptionNeededAbroad?: boolean;
}

export interface TravelInsurancePolicy {
  policyNumber: string;
  provider: string;
  planName: string;
  status: 'active' | 'expired' | 'pending';
  validFrom: string;
  validTo: string;
  emergencyAssistancePhone: string;
  claimsEmail: string;
  coverageLimit: string;
  deductible: string;
  emergencyEvacuationLimit: string;
  coveredCountries: string[];
  checklistSteps: {
    title: string;
    desc: string;
    required: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'doctor' | 'bot';
  content: string;
  type: 'text' | 'image' | 'prescription';
  timestamp: string;
  isRead: boolean;
}
