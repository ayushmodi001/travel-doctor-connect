/**
 * AuthContext – global authentication state management using Context API.
 * Handles login, signup, logout and persists token via AsyncStorage.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';

// ─── State & Actions ──────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // start true while we check AsyncStorage
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return { ...initialState, isLoading: false };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = '@mediconnect_token';
const USER_KEY  = '@mediconnect_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount – restore persisted session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (token && userJson) {
          const user: User = JSON.parse(userJson);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };

    restoreSession();
  }, []);

  /**
   * Login with email + password.
   * In production replace the mock below with a real Firebase / Auth0 call.
   */
  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // ── MOCK AUTH ─────────────────────────────────────────────────────────
      await new Promise(res => setTimeout(res, 1200));

      if (password.length < 6) {
        throw new Error('Invalid email or password.');
      }

      const mockUser: User = {
        id: 'u1',
        email,
        name: 'Alex Johnson',
        phone: '+1-415-555-0101',
        profileImage: 'https://randomuser.me/api/portraits/men/85.jpg',
        bloodGroup: 'O+',
        medicalHistory: ['Hypertension (controlled)', 'Seasonal allergies'],
        allergies: ['Penicillin', 'Pollen'],
        emergencyContact: {
          name: 'Maria Johnson',
          phone: '+1-415-555-0202',
          relation: 'Spouse',
        },
        createdAt: '2024-01-15T08:00:00Z',
      };
      const mockToken = 'mock-jwt-token-' + Date.now();
      // ─────────────────────────────────────────────────────────────────────

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, mockToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser)),
      ]);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: mockUser, token: mockToken } });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message ?? 'Login failed.' });
    }
  };

  /**
   * Create a new account.
   */
  const signup = async (name: string, email: string, password: string, phone: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      // ── MOCK SIGNUP ───────────────────────────────────────────────────────
      await new Promise(res => setTimeout(res, 1500));

      const newUser: User = {
        id: 'u' + Date.now(),
        email,
        name,
        phone,
        medicalHistory: [],
        allergies: [],
        createdAt: new Date().toISOString(),
      };
      const token = 'mock-jwt-token-' + Date.now();
      // ─────────────────────────────────────────────────────────────────────

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
      ]);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: newUser, token } });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message ?? 'Signup failed.' });
    }
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, updateProfile, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
