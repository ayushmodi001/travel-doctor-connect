/**
 * AppointmentContext – global state for appointments.
 * Manages fetching, booking, cancelling, and refreshing appointments.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { MOCK_APPOINTMENTS } from '../data/mockData';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
}

type AppointmentAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Appointment[] }
  | { type: 'FETCH_FAILURE'; payload: string }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: AppointmentStatus } }
  | { type: 'CANCEL_APPOINTMENT'; payload: string };

const initialState: AppointmentState = {
  appointments: [],
  isLoading: false,
  error: null,
};

function appointmentReducer(
  state: AppointmentState,
  action: AppointmentAction
): AppointmentState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };

    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, appointments: action.payload };

    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.payload };

    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [action.payload, ...state.appointments] };

    case 'UPDATE_STATUS':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload.id ? { ...a, status: action.payload.status } : a
        ),
      };

    case 'CANCEL_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload ? { ...a, status: 'cancelled' as AppointmentStatus } : a
        ),
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppointmentContextType extends AppointmentState {
  fetchAppointments: (userId: string) => Promise<void>;
  bookAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appointmentReducer, initialState);

  const fetchAppointments = useCallback(async (userId: string) => {
    dispatch({ type: 'FETCH_START' });
    try {
      // Simulate network delay
      await new Promise(res => setTimeout(res, 800));
      // Filter mock data for the user
      const userAppointments = MOCK_APPOINTMENTS.filter(a => a.patientId === userId);
      dispatch({ type: 'FETCH_SUCCESS', payload: userAppointments });
    } catch (error: any) {
      dispatch({ type: 'FETCH_FAILURE', payload: error.message ?? 'Failed to fetch appointments' });
    }
  }, []);

  const bookAppointment = useCallback(
    async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
      await new Promise(res => setTimeout(res, 1000));
      const newAppointment: Appointment = {
        ...appointmentData,
        id: 'a' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_APPOINTMENT', payload: newAppointment });
      return newAppointment;
    },
    []
  );

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    await new Promise(res => setTimeout(res, 500));
    dispatch({ type: 'CANCEL_APPOINTMENT', payload: appointmentId });
  }, []);

  const updateAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status } });
  }, []);

  return (
    <AppointmentContext.Provider
      value={{
        ...state,
        fetchAppointments,
        bookAppointment,
        cancelAppointment,
        updateAppointmentStatus,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) throw new Error('useAppointments must be used inside <AppointmentProvider>');
  return ctx;
}
