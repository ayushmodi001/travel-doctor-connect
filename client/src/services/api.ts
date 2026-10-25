/**
 * API Services – centralised HTTP client using Axios.
 * Configure base URL and auth headers here.
 * Replace mock implementations with real endpoints in production.
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Doctor, Appointment, DoctorFilter } from '../types';
import { MOCK_DOCTORS, MOCK_APPOINTMENTS } from '../data/mockData';

// ─── Axios Client ─────────────────────────────────────────────────────────────

const API_BASE_URL = 'https://api.mediconnect.dev/v1'; // Replace with actual URL

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('@mediconnect_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message ?? error.message ?? 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ─── Doctor Service ───────────────────────────────────────────────────────────

export const DoctorService = {
  /**
   * Fetch a filtered list of doctors.
   * Replace with: return apiClient.get('/doctors', { params: filter }).then(r => r.data)
   */
  getDoctors: async (filter?: DoctorFilter): Promise<Doctor[]> => {
    await new Promise(res => setTimeout(res, 600)); // simulate latency
    let doctors = [...MOCK_DOCTORS];

    if (filter?.specialty) {
      doctors = doctors.filter(d =>
        d.specialty.toLowerCase().includes(filter.specialty!.toLowerCase())
      );
    }
    if (filter?.consultationType) {
      doctors = doctors.filter(d => d.consultationType.includes(filter.consultationType!));
    }
    if (filter?.minRating) {
      doctors = doctors.filter(d => d.rating >= filter.minRating!);
    }
    if (filter?.maxFee) {
      doctors = doctors.filter(d => d.fee <= filter.maxFee!);
    }
    if (filter?.availableNow) {
      doctors = doctors.filter(d => d.isAvailableNow);
    }
    if (filter?.sortBy === 'rating') {
      doctors.sort((a, b) => b.rating - a.rating);
    } else if (filter?.sortBy === 'fee') {
      doctors.sort((a, b) => a.fee - b.fee);
    } else if (filter?.sortBy === 'experience') {
      doctors.sort((a, b) => b.experience - a.experience);
    }

    return doctors;
  },

  /**
   * Fetch a single doctor by ID.
   */
  getDoctorById: async (id: string): Promise<Doctor | null> => {
    await new Promise(res => setTimeout(res, 400));
    return MOCK_DOCTORS.find(d => d.id === id) ?? null;
  },

  /**
   * Search doctors by keyword.
   */
  searchDoctors: async (query: string): Promise<Doctor[]> => {
    await new Promise(res => setTimeout(res, 400));
    const q = query.toLowerCase();
    return MOCK_DOCTORS.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q)
    );
  },
};

// ─── Appointment Service ──────────────────────────────────────────────────────

export const AppointmentService = {
  /**
   * Fetch all appointments for a user.
   */
  getUserAppointments: async (userId: string): Promise<Appointment[]> => {
    await new Promise(res => setTimeout(res, 700));
    return MOCK_APPOINTMENTS.filter(a => a.patientId === userId);
  },

  /**
   * Create a new appointment.
   */
  createAppointment: async (
    data: Omit<Appointment, 'id' | 'createdAt'>
  ): Promise<Appointment> => {
    await new Promise(res => setTimeout(res, 1000));
    return {
      ...data,
      id: 'a' + Date.now(),
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Cancel an existing appointment.
   */
  cancelAppointment: async (appointmentId: string): Promise<void> => {
    await new Promise(res => setTimeout(res, 500));
    // In production: await apiClient.patch(`/appointments/${appointmentId}/cancel`);
  },
};

// ─── User Service ─────────────────────────────────────────────────────────────

export const UserService = {
  /**
   * Update user profile on the server.
   */
  updateProfile: async (userId: string, data: Record<string, any>): Promise<void> => {
    await new Promise(res => setTimeout(res, 800));
    // In production: return apiClient.patch(`/users/${userId}`, data).then(r => r.data);
  },

  /**
   * Upload a profile image and return its URL.
   */
  uploadProfileImage: async (uri: string): Promise<string> => {
    await new Promise(res => setTimeout(res, 1500));
    // In production: upload to S3 / Firebase Storage and return URL
    return uri;
  },
};

export default apiClient;
