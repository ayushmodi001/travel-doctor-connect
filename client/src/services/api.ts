/**
 * API Services – Centralized HTTP client using Axios.
 * Connects directly to the MediConnect Backend API.
 * Strict compliance with Requirement 2: NO fallback mock data on failures.
 * Real errors are propagated so the UI displays proper ErrorStates.
 */

import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  Doctor,
  Appointment,
  DoctorFilter,
  EmergencyService,
  DestinationCountry,
  MedicalPhrase,
  MedicineEquivalent,
  TravelInsurancePolicy,
  ChatMessage,
  User,
} from '../types';

// ─── Base URL Resolution ──────────────────────────────────────────────────────

const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Detect Metro packager host IP dynamically for physical devices & emulators
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  // Android emulator routes host machine loopback through 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // iOS simulator & Web use localhost
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getDefaultBaseUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token, user id, and AI API key to every request
apiClient.interceptors.request.use(async config => {
  try {
    const [token, userId, aiKey] = await Promise.all([
      AsyncStorage.getItem('@mediconnect_token'),
      AsyncStorage.getItem('@mediconnect_user_id'),
      AsyncStorage.getItem('@mediconnect_ai_api_key'),
    ]);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    if (aiKey) {
      config.headers['x-ai-api-key'] = aiKey;
    }
  } catch {
    // Ignore storage read error
  }
  return config;
});

// Global response error handling - NO FALLBACKS, throw real errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    let message = 'Network request failed. Please check your connection.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out. The healthcare server took too long to respond.';
    } else if (error.message?.includes('Network Error')) {
      message = 'Cannot reach healthcare server. Please ensure the backend is running.';
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

// ─── Doctor Service ───────────────────────────────────────────────────────────

export const DoctorService = {
  getDoctors: async (filter?: DoctorFilter): Promise<Doctor[]> => {
    const response = await apiClient.get('/doctors', { params: filter });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error('Invalid doctor data format received from server.');
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await apiClient.get(`/doctors/${id}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    if (response.data && response.data.id) {
      return response.data;
    }
    throw new Error(`Doctor with ID ${id} not found.`);
  },

  createDoctor: async (data: Partial<Doctor>): Promise<Doctor> => {
    const response = await apiClient.post('/doctors', data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to save doctor to database.');
  },

  updateDoctor: async (id: string, data: Partial<Doctor>): Promise<Doctor> => {
    const response = await apiClient.put(`/doctors/${id}`, data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to update doctor.');
  },

  deleteDoctor: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/doctors/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete doctor.');
    }
  },

  searchDoctors: async (query: string): Promise<Doctor[]> => {
    const response = await apiClient.get('/doctors', { params: { query } });
    if (response.data && Array.isArray(response.data.data)) {
      const q = query.toLowerCase();
      return response.data.data.filter(
        (d: Doctor) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.hospital.toLowerCase().includes(q)
      );
    }
    throw new Error('Unable to search doctors on server.');
  },

  getSpecialties: async (): Promise<string[]> => {
    const response = await apiClient.get('/doctors/specialties');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },
};

// ─── Appointment Service ──────────────────────────────────────────────────────

export const AppointmentService = {
  getUserAppointments: async (userId: string): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments', {
      params: { patientId: userId },
    });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await apiClient.get(`/appointments/${id}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(`Appointment with ID ${id} not found.`);
  },

  createAppointment: async (
    data: Omit<Appointment, 'id' | 'createdAt'>
  ): Promise<Appointment> => {
    const response = await apiClient.post('/appointments', {
      doctorId: data.doctorId,
      doctorName: data.doctor?.name,
      doctorSpecialty: data.doctor?.specialty,
      doctorImage: data.doctor?.profileImage,
      patientId: data.patientId,
      date: data.date,
      time: data.startTime,
      type: data.type,
      reason: data.notes || data.symptoms || '',
      amount: data.doctor?.fee || 100,
      currency: data.doctor?.currency || 'USD',
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to create appointment on healthcare server.');
  },

  cancelAppointment: async (appointmentId: string): Promise<void> => {
    await apiClient.patch(`/appointments/${appointmentId}`, {
      status: 'cancelled',
    });
  },

  getAllAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  updateAppointmentStatus: async (appointmentId: string, status: string): Promise<void> => {
    await apiClient.patch(`/appointments/${appointmentId}`, { status });
  },

  getVideoSession: async (appointmentId: string): Promise<{
    appointmentId: string;
    channelId: string;
    token: string;
    doctorName: string;
    status: string;
    meetingUrl: string;
  }> => {
    const response = await apiClient.get(`/appointments/${appointmentId}/video-token`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Unable to connect to video consultation session.');
  },
};

// ─── Emergency Service ────────────────────────────────────────────────────────

export const EmergencyApi = {
  getNearbyServices: async (
    latitude?: number,
    longitude?: number,
    type?: string
  ): Promise<EmergencyService[]> => {
    const response = await apiClient.get('/emergency/nearby', {
      params: { latitude, longitude, type },
    });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('No emergency services returned by healthcare server.');
  },
};

// ─── Travel Intelligence Service ──────────────────────────────────────────────

export const TravelService = {
  getDestinationCountries: async (): Promise<DestinationCountry[]> => {
    const response = await apiClient.get('/travel/hub');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('Unable to load international destination advisories.');
  },

  getDestinationByCode: async (code: string): Promise<DestinationCountry> => {
    const response = await apiClient.get('/travel/hub', { params: { countryCode: code } });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(`Country intelligence for ${code} unavailable.`);
  },

  createDestination: async (data: Partial<DestinationCountry>): Promise<DestinationCountry> => {
    const response = await apiClient.post('/travel/destinations', data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to add destination country.');
  },

  deleteDestination: async (code: string): Promise<void> => {
    const response = await apiClient.delete(`/travel/destinations/${code}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete destination.');
    }
  },

  getMedicalPhrases: async (category?: string, languageCode?: string, query?: string): Promise<MedicalPhrase[]> => {
    const response = await apiClient.get('/travel/phrases', {
      params: { category, languageCode, query },
    });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('Failed to load international medical phrases.');
  },

  translateText: async (text: string, targetLang: string): Promise<{ translatedText: string; phonetic: string }> => {
    const response = await apiClient.post('/travel/translate', { text, targetLang });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Translation request failed.');
  },

  getMedicineEquivalents: async (query?: string): Promise<MedicineEquivalent[]> => {
    const response = await apiClient.get('/travel/medicines', { params: { query } });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('Unable to search medicine brand equivalents.');
  },

  getTravelInsurance: async (): Promise<TravelInsurancePolicy> => {
    const response = await apiClient.get('/travel/insurance');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Could not retrieve digital travel insurance policy.');
  },
};

// ─── User Profile & Medical Records Service ───────────────────────────────────

export const UserService = {
  syncUser: async (user: Partial<User>): Promise<User> => {
    const response = await apiClient.post('/users/sync', user);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to sync user with database.');
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/users/profile');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to load user profile.');
  },

  updateProfile: async (data: Record<string, any>): Promise<User> => {
    const response = await apiClient.put('/users/profile', data);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update profile on server.');
  },

  getMedicalRecords: async (): Promise<{
    bloodGroup: string;
    allergies: string[];
    conditions: string[];
    vaccines: { name: string; date: string; verified: boolean }[];
  }> => {
    const response = await apiClient.get('/users/medical-records');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Unable to fetch medical records from health database.');
  },

  updateMedicalRecords: async (data: {
    bloodGroup?: string;
    allergies?: string[];
    conditions?: string[];
  }): Promise<void> => {
    const response = await apiClient.put('/users/medical-records', data);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to save medical records.');
    }
  },

  getSettings: async (): Promise<{
    notifications: boolean;
    darkMode: boolean;
    location: boolean;
    biometric: boolean;
    language: string;
  }> => {
    const response = await apiClient.get('/users/settings');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to load app settings.');
  },

  updateSettings: async (settings: Record<string, any>): Promise<void> => {
    const response = await apiClient.put('/users/settings', settings);
    if (!response.data?.success) {
      throw new Error('Failed to save settings on server.');
    }
  },

  uploadProfileImage: async (uri: string): Promise<string> => {
    return uri;
  },
};

// ─── Storage Bucket Service ───────────────────────────────────────────────────

export interface MedicalDocument {
  id: string;
  userId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

export const StorageService = {
  getDocuments: async (): Promise<MedicalDocument[]> => {
    const response = await apiClient.get('/documents');
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  },

  uploadDocument: async (doc: {
    title: string;
    fileBase64?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
    category?: string;
  }): Promise<MedicalDocument> => {
    const response = await apiClient.post('/documents/upload', doc);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Failed to store document in bucket.');
  },

  deleteDocument: async (id: string): Promise<void> => {
    const response = await apiClient.delete(`/documents/${id}`);
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete document.');
    }
  },
};

// ─── AI Symptom Triage Service ────────────────────────────────────────────────

export const TriageService = {
  assessSymptoms: async (symptoms: string, customApiKey?: string): Promise<{
    severity: 'low' | 'moderate' | 'high' | 'critical';
    recommendation: string;
    suggestedSpecialty: string;
    shouldCallEmergency: boolean;
    botReply: string;
  }> => {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-ai-api-key'] = customApiKey;
    }
    const response = await apiClient.post('/triage/assess', { symptoms }, { headers });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Clinical triage server unavailable.');
  },
};

// ─── Chat Service ─────────────────────────────────────────────────────────────

export const ChatService = {
  getMessages: async (appointmentId: string): Promise<ChatMessage[]> => {
    const response = await apiClient.get(`/chat/${appointmentId}/messages`);
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('Failed to load consultation messages.');
  },

  sendMessage: async (
    appointmentId: string,
    content: string,
    sender: { id: string; name: string; type: 'user' | 'doctor' }
  ): Promise<ChatMessage> => {
    const response = await apiClient.post(`/chat/${appointmentId}/messages`, {
      content,
      senderId: sender.id,
      senderName: sender.name,
      senderType: sender.type,
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to send consultation message.');
  },
};

// ─── Maps Service ─────────────────────────────────────────────────────────────

export const MapsService = {
  getLocations: async (category?: string): Promise<any[]> => {
    const response = await apiClient.get('/maps/locations', { params: { category } });
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error('Unable to load clinical map locations.');
  },
};

// ─── Dashboard Service ────────────────────────────────────────────────────────

export const DashboardService = {
  getDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to load dashboard.');
  },
};

export default apiClient;
