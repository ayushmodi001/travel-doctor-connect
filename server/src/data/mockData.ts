/**
 * MediConnect Server - Strict Live Database Mode
 * NO mock data permitted: All controllers and API services query exclusively
 * against Neon PostgreSQL tables.
 */

import { Doctor, Appointment, EmergencyService } from '../types';

export const MOCK_DOCTORS: Doctor[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];
export const MOCK_EMERGENCY_SERVICES: EmergencyService[] = [];
