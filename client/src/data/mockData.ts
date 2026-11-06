/**
 * MediConnect Healthcare Platform - Strict Live Database Mode
 * NO mock data permitted: All client screens and services connect exclusively
 * to the live Neon PostgreSQL database and Gemini AI agent services.
 */

import { Doctor, Appointment, EmergencyService } from '../types';

export const MOCK_DOCTORS: Doctor[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];
export const MOCK_EMERGENCY_SERVICES: EmergencyService[] = [];
