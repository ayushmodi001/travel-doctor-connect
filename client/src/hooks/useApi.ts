/**
 * Custom hooks for data fetching throughout the app.
 * Each hook encapsulates loading/error state and data fetching logic.
 */

import { useState, useEffect, useCallback } from 'react';
import { Doctor, DoctorFilter, Appointment } from '../types';
import { DoctorService, AppointmentService } from '../services/api';

// ─── useDoctors ────────────────────────────────────────────────────────────────

interface UseDoctorsReturn {
  doctors: Doctor[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDoctors(filter?: DoctorFilter): UseDoctorsReturn {
  const [doctors, setDoctors]     = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const filterKey = JSON.stringify(filter);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DoctorService.getDoctors(filter);
      setDoctors(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, isLoading, error, refetch: fetchDoctors };
}

// ─── useDoctor ─────────────────────────────────────────────────────────────────

interface UseDoctorReturn {
  doctor: Doctor | null;
  isLoading: boolean;
  error: string | null;
}

export function useDoctor(doctorId: string): UseDoctorReturn {
  const [doctor, setDoctor]       = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await DoctorService.getDoctorById(doctorId);
        if (!cancelled) setDoctor(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to load doctor');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [doctorId]);

  return { doctor, isLoading, error };
}

// ─── useUserAppointments ───────────────────────────────────────────────────────

interface UseAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserAppointments(userId: string | null): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await AppointmentService.getUserAppointments(userId);
      setAppointments(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, isLoading, error, refetch: fetchAppointments };
}

// ─── useDebounce ──────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
