export type Role = 'admin' | 'doctor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  specialty?: string; // For doctors
  hospital?: string;  // For doctors
  isOnboarded?: boolean;
  licenseNumber?: string;
  experience?: number;
  languages?: string[];
  phone?: string;
  about?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  hospital: string;
  location?: {
    city?: string;
    country?: string;
  };
  rating: number;
  reviewCount: number;
  experience: number;
  fee: number;
  currency: string;
  profileImage?: string;
  about?: string;
  qualifications?: string[];
  languages?: string[];
  isAvailableNow: boolean;
  consultationType?: ('video' | 'chat' | 'in-person')[];
  verified: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage?: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: 'video' | 'chat' | 'in-person';
  status: 'upcoming' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  reason?: string;
  meetingLink?: string;
  amount?: number;
  currency?: string;
}

export interface PatientDossier {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  countryOfOrigin: string;
  currentLocation: string;
  passportNumber: string;
  passportExpiry: string;
  travelDocumentStatus: string;
  vitals: {
    heartRate: string;
    bloodPressure: string;
    bloodOxygen: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    coverageLimit: string;
    status: string;
  };
}

export interface SystemStats {
  neonDbStatus: 'connected' | 'reconnecting' | 'offline';
  latencyMs: number;
  dbPoolSize: number;
  activeDoctorsCount: number;
  totalAppointments: number;
  aiQueriesCount: number;
  activeTravelersCount: number;
}
