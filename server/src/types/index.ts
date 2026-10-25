export type ConsultationType = 'video' | 'chat' | 'in-person';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}
