/**
 * AppointmentContext – Global appointment state management.
 * Connects directly to AppointmentService without mock data fallbacks.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { Appointment, AppointmentStatus } from '../types';
import { AppointmentService } from '../services/api';

// ─── State & Actions ──────────────────────────────────────────────────────────

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
  | { type: 'CANCEL_APPOINTMENT'; payload: string }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: AppointmentStatus } };

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
      return { ...state, isLoading: false, appointments: action.payload, error: null };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'ADD_APPOINTMENT':
      return {
        ...state,
        appointments: [action.payload, ...state.appointments],
      };
    case 'CANCEL_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload ? { ...a, status: 'cancelled' as const } : a
        ),
      };
    case 'UPDATE_STATUS':
      return {
        ...state,
        appointments: state.appointments.map(a =>
          a.id === action.payload.id ? { ...a, status: action.payload.status } : a
        ),
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface AppointmentContextType extends AppointmentState {
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
      const userAppointments = await AppointmentService.getUserAppointments(userId);
      dispatch({ type: 'FETCH_SUCCESS', payload: userAppointments });
    } catch (error: any) {
      dispatch({ type: 'FETCH_FAILURE', payload: error.message ?? 'Failed to fetch appointments from server' });
    }
  }, []);

  const bookAppointment = useCallback(
    async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => {
      const created = await AppointmentService.createAppointment(appointmentData);
      dispatch({ type: 'ADD_APPOINTMENT', payload: created });
      return created;
    },
    []
  );

  const cancelAppointment = useCallback(async (appointmentId: string) => {
    try {
      await AppointmentService.cancelAppointment(appointmentId);
    } catch {
      // Still update UI status locally
    }
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
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an <AppointmentProvider>');
  }
  return context;
}
