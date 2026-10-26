/**
 * Global TypeScript type definitions for the MediConnect app.
 * Centralizes all data models used across the application.
 */

// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  address?: Address;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  hospital: string;
  location: Location;
  rating: number;
  reviewCount: number;
  experience: number; // years
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

export type ConsultationType = 'video' | 'chat' | 'in-person';

export interface TimeSlot {
  id: string;
  date: string; // ISO date string
  startTime: string; // HH:MM
  endTime: string;
  isBooked: boolean;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  doctorId: string;
  doctor: Doctor;
  patientId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ConsultationType;
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
  reason?: string;
  prescription?: string;
  createdAt: string;
  videoCallToken?: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'doctor' | 'bot';
  content: string;
  type: 'text' | 'image' | 'prescription' | 'symptom';
  timestamp: string;
  isRead: boolean;
  attachmentUrl?: string;
}

export interface ChatSession {
  id: string;
  participantIds: string[];
  appointmentId?: string;
  lastMessage?: ChatMessage;
  createdAt: string;
}

// ─── Emergency ───────────────────────────────────────────────────────────────

export interface EmergencyService {
  id: string;
  name: string;
  type: 'ambulance' | 'fire' | 'police' | 'hospital';
  phone: string;
  address: string;
  distance?: number; // km
  location: Location;
  available24h: boolean;
}

// ─── Triage ──────────────────────────────────────────────────────────────────

export interface TriageQuestion {
  id: string;
  question: string;
  options?: string[];
  type: 'text' | 'choice' | 'scale';
}

export interface TriageResult {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  suggestedSpecialty?: string;
  shouldCallEmergency: boolean;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

// ─── International Travel Companion ──────────────────────────────────────────

export interface DestinationCountry {
  code: string; // 'ES', 'JP', 'FR', 'GB', 'DE', 'US', 'TH', 'IN', 'IT'
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
  brandsByCountry: {
    US: string;
    UK: string;
    FR: string;
    ES: string;
    DE: string;
    JP: string;
  };
  customsRestrictions: {
    isRestricted: boolean;
    warningNote?: string;
  };
  otcAvailability: string; // e.g., 'OTC in most countries', 'Prescription required in Japan'
}

export interface TravelInsurancePolicy {
  provider: string;
  policyNumber: string;
  insuredName: string;
  coverageLimit: string;
  emergencyAssistancePhone: string;
  validUntil: string;
  claimChecklist: string[];
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  GetStarted: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TravelTab: undefined;
  MapsTab: undefined;
  AppointmentsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  SymptomTriage: undefined;
  DoctorList: { specialty?: string; consultationType?: ConsultationType };
  DoctorProfile: { doctorId: string };
  BookAppointment: { doctorId: string; slotId?: string };
  Chat: { sessionId: string; doctorId: string };
  VideoCall: { appointmentId: string; token: string };
  Emergency: undefined;
  OpenMaps: { initialCategory?: string; doctorId?: string; latitude?: number; longitude?: number } | undefined;
  TravelHub: undefined;
  MedicalTranslator: { initialCategory?: string } | undefined;
  MedicineEquivalents: undefined;
  TravelInsurance: undefined;
  AdminDoctorPanel: undefined;
};

export type TravelStackParamList = {
  TravelHub: undefined;
  MedicalTranslator: { initialCategory?: string; initialLanguage?: string } | undefined;
  MedicineEquivalents: undefined;
  TravelInsurance: undefined;
  DoctorList: { specialty?: string; consultationType?: ConsultationType };
  OpenMaps: { initialCategory?: string; doctorId?: string; latitude?: number; longitude?: number } | undefined;
};

export type MapsStackParamList = {
  MapsView: { initialCategory?: string; doctorId?: string; latitude?: number; longitude?: number } | undefined;
  DoctorProfile: { doctorId: string };
  BookAppointment: { doctorId: string; slotId?: string };
};

export type AppointmentsStackParamList = {
  Appointments: undefined;
  AppointmentDetail: { appointmentId: string };
  VideoCall: { appointmentId: string; token: string };
  DoctorProfile: { doctorId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  MedicalHistory: undefined;
  TravelInsurance: undefined;
  AdminDoctorPanel: undefined;
};

// ─── Filter ──────────────────────────────────────────────────────────────────

export interface DoctorFilter {
  specialty?: string;
  consultationType?: ConsultationType;
  minRating?: number;
  maxFee?: number;
  language?: string;
  availableNow?: boolean;
  sortBy?: 'rating' | 'fee' | 'experience' | 'distance';
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  language: string;
  notificationsEnabled: boolean;
  darkMode: boolean;
  locationEnabled: boolean;
  biometricEnabled: boolean;
}
