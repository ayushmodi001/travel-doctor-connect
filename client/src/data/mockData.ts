/**
 * Mock data for the MediConnect app.
 * Replace these with real API calls in production.
 */

import { Doctor, Appointment, EmergencyService } from '../types';

// ─── Mock Doctors ─────────────────────────────────────────────────────────────

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Cardiologist',
    subSpecialty: 'Interventional Cardiology',
    hospital: 'City Heart Institute',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      address: '450 Sutter St',
      city: 'San Francisco',
      country: 'USA',
    },
    rating: 4.9,
    reviewCount: 312,
    experience: 14,
    fee: 150,
    currency: 'USD',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    about:
      'Board-certified cardiologist with over 14 years of clinical experience specialising in preventive cardiology and interventional procedures.',
    qualifications: ['MD – Harvard Medical School', 'FACC', 'Board Certified Cardiologist'],
    languages: ['English', 'Spanish'],
    isAvailableNow: true,
    consultationType: ['video', 'chat', 'in-person'],
    verified: true,
    availableSlots: [
      { id: 's1', date: '2026-10-25', startTime: '09:00', endTime: '09:30', isBooked: false },
      { id: 's2', date: '2026-10-25', startTime: '10:00', endTime: '10:30', isBooked: false },
      { id: 's3', date: '2026-10-26', startTime: '14:00', endTime: '14:30', isBooked: true },
    ],
  },
  {
    id: 'd2',
    name: 'Dr. James Okafor',
    specialty: 'General Practitioner',
    hospital: 'Metro Medical Center',
    location: {
      latitude: 37.7849,
      longitude: -122.4094,
      address: '1201 Mission St',
      city: 'San Francisco',
      country: 'USA',
    },
    rating: 4.7,
    reviewCount: 528,
    experience: 9,
    fee: 80,
    currency: 'USD',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    about:
      'Compassionate GP with a focus on family medicine, preventive care, and chronic disease management.',
    qualifications: ['MBBS – University of Lagos', 'MRCGP'],
    languages: ['English', 'Yoruba'],
    isAvailableNow: true,
    consultationType: ['video', 'chat'],
    verified: true,
    availableSlots: [
      { id: 's4', date: '2026-10-25', startTime: '11:00', endTime: '11:30', isBooked: false },
      { id: 's5', date: '2026-10-25', startTime: '15:00', endTime: '15:30', isBooked: false },
    ],
  },
  {
    id: 'd3',
    name: 'Dr. Priya Sharma',
    specialty: 'Dermatologist',
    hospital: 'SkinHealth Clinic',
    location: {
      latitude: 37.7649,
      longitude: -122.4294,
      address: '800 Market St',
      city: 'San Francisco',
      country: 'USA',
    },
    rating: 4.8,
    reviewCount: 201,
    experience: 11,
    fee: 120,
    currency: 'USD',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    about:
      'Specialising in medical and cosmetic dermatology with expertise in acne, eczema, and skin cancer screening.',
    qualifications: ['MD – AIIMS New Delhi', 'DNB Dermatology', 'FAAD'],
    languages: ['English', 'Hindi', 'Spanish'],
    isAvailableNow: false,
    consultationType: ['video', 'in-person'],
    verified: true,
    availableSlots: [
      { id: 's6', date: '2026-10-27', startTime: '10:00', endTime: '10:30', isBooked: false },
    ],
  },
  {
    id: 'd4',
    name: 'Dr. Chen Wei',
    specialty: 'Neurologist',
    subSpecialty: 'Headache & Migraine',
    hospital: 'NeuroScience Institute',
    location: {
      latitude: 37.7549,
      longitude: -122.4094,
      address: '2330 Post St',
      city: 'San Francisco',
      country: 'USA',
    },
    rating: 4.6,
    reviewCount: 145,
    experience: 17,
    fee: 180,
    currency: 'USD',
    profileImage: 'https://randomuser.me/api/portraits/men/77.jpg',
    about:
      'Neurologist with two decades of experience treating complex neurological disorders including epilepsy, multiple sclerosis, and headache disorders.',
    qualifications: ['MD – Stanford University', 'PhD Neuroscience', 'FAAN'],
    languages: ['English', 'Mandarin'],
    isAvailableNow: false,
    consultationType: ['video', 'in-person'],
    verified: true,
    availableSlots: [
      { id: 's7', date: '2026-10-28', startTime: '09:00', endTime: '09:45', isBooked: false },
    ],
  },
  {
    id: 'd5',
    name: 'Dr. Amara Diallo',
    specialty: 'Psychiatrist',
    hospital: 'MindWell Clinic',
    location: {
      latitude: 37.7749,
      longitude: -122.4394,
      address: '1 Embarcadero Center',
      city: 'San Francisco',
      country: 'USA',
    },
    rating: 4.9,
    reviewCount: 389,
    experience: 12,
    fee: 160,
    currency: 'USD',
    profileImage: 'https://randomuser.me/api/portraits/women/56.jpg',
    about:
      'Psychiatrist specialising in anxiety, depression, PTSD, and cognitive-behavioural therapy. Warm, evidence-based approach.',
    qualifications: ['MD – Johns Hopkins University', 'Board Certified Psychiatrist'],
    languages: ['English', 'French'],
    isAvailableNow: true,
    consultationType: ['video', 'chat'],
    verified: true,
    availableSlots: [
      { id: 's8', date: '2026-10-25', startTime: '13:00', endTime: '13:50', isBooked: false },
      { id: 's9', date: '2026-10-26', startTime: '16:00', endTime: '16:50', isBooked: false },
    ],
  },
];

// ─── Mock Appointments ────────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    doctorId: 'd1',
    doctor: MOCK_DOCTORS[0],
    patientId: 'u1',
    date: '2026-10-25',
    startTime: '09:00',
    endTime: '09:30',
    type: 'video',
    status: 'confirmed',
    symptoms: 'Chest tightness and occasional shortness of breath during exercise',
    createdAt: '2026-10-20T10:00:00Z',
    videoCallToken: 'mock-video-token-123',
  },
  {
    id: 'a2',
    doctorId: 'd2',
    doctor: MOCK_DOCTORS[1],
    patientId: 'u1',
    date: '2026-10-15',
    startTime: '11:00',
    endTime: '11:30',
    type: 'chat',
    status: 'completed',
    symptoms: 'Routine check-up and prescription renewal',
    notes: 'Continue existing medication. Follow up in 3 months.',
    createdAt: '2026-10-10T09:00:00Z',
  },
];

// ─── Mock Emergency Services ──────────────────────────────────────────────────

export const MOCK_EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: 'e1',
    name: 'City Ambulance Services',
    type: 'ambulance',
    phone: '911',
    address: '101 Emergency Blvd, San Francisco',
    distance: 1.2,
    location: { latitude: 37.7850, longitude: -122.4100 },
    available24h: true,
  },
  {
    id: 'e2',
    name: 'SF General Hospital ER',
    type: 'hospital',
    phone: '+1-415-206-8000',
    address: '1001 Potrero Ave, San Francisco, CA',
    distance: 2.4,
    location: { latitude: 37.7555, longitude: -122.4057 },
    available24h: true,
  },
  {
    id: 'e3',
    name: 'UCSF Medical Center',
    type: 'hospital',
    phone: '+1-415-476-1000',
    address: '500 Parnassus Ave, San Francisco, CA',
    distance: 3.8,
    location: { latitude: 37.7631, longitude: -122.4586 },
    available24h: true,
  },
];

// ─── Specialties ──────────────────────────────────────────────────────────────

export const MEDICAL_SPECIALTIES = [
  'General Practitioner',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Psychiatrist',
  'Orthopedist',
  'Gynecologist',
  'Pediatrician',
  'Ophthalmologist',
  'ENT Specialist',
  'Gastroenterologist',
  'Endocrinologist',
  'Pulmonologist',
  'Urologist',
  'Oncologist',
];

// ─── Triage Messages ──────────────────────────────────────────────────────────

export const TRIAGE_BOT_RESPONSES = [
  {
    trigger: ['fever', 'temperature', 'hot'],
    response:
      'I understand you have a fever. How high is your temperature, and how long have you had it? Any other symptoms like chills or body aches?',
  },
  {
    trigger: ['chest pain', 'chest tightness', 'heart'],
    response:
      '⚠️ Chest pain can be serious. Are you experiencing shortness of breath, sweating, or pain radiating to your arm or jaw? If yes, please call 911 immediately.',
  },
  {
    trigger: ['headache', 'head pain', 'migraine'],
    response:
      'How severe is your headache on a scale of 1–10? Is it sudden and extremely severe ("thunderclap")? Any vision changes or neck stiffness?',
  },
  {
    trigger: ['cold', 'cough', 'flu', 'sneezing', 'runny nose'],
    response:
      'These sound like cold/flu symptoms. How long have you been experiencing them? Do you have a fever or difficulty breathing?',
  },
];
