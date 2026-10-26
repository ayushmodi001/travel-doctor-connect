/**
 * AuthContext – global authentication state management.
 * Integrates Clerk when configured, with seamless session management,
 * token caching, user profile persistence, and graceful fallback.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser, useAuth as useClerkAuth } from '@clerk/expo';
import { AuthState, User } from '../types';
import { UserService } from '../services/api';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = '@mediconnect_token';
const USER_KEY = '@mediconnect_user';
const USER_ID_KEY = '@mediconnect_user_id';
const PROFILE_KEY_PREFIX = '@mediconnect_profile_';

// ─── Actions & Reducer ────────────────────────────────────────────────────────

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
  isLoading: true,
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
      if (
        !state.isAuthenticated &&
        !state.isLoading &&
        state.user === null &&
        state.token === null &&
        state.error === null
      ) {
        return state;
      }
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

// ─── Context Definition ───────────────────────────────────────────────────────

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  clearError: () => void;
  isClerkEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Clerk Sync Bridge Component ──────────────────────────────────────────────

interface ClerkSyncBridgeProps {
  children: ReactNode;
  onSync: (user: User | null, token: string | null) => void;
  onLogoutRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

function ClerkSyncBridge({ children, onSync, onLogoutRef }: ClerkSyncBridgeProps) {
  const { user: clerkUser, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { getToken, signOut, isLoaded: isAuthLoaded } = useClerkAuth();

  const getTokenRef = useRef(getToken);
  const onSyncRef = useRef(onSync);
  const signOutRef = useRef(signOut);
  const lastSyncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // Expose Clerk signOut to the parent AuthProvider without effect re-triggering
  useEffect(() => {
    onLogoutRef.current = async () => {
      if (signOutRef.current) {
        await signOutRef.current();
      }
    };
  }, [onLogoutRef]);

  const clerkUserId = clerkUser?.id ?? null;
  const clerkUpdatedAt = clerkUser?.updatedAt
    ? clerkUser.updatedAt instanceof Date
      ? clerkUser.updatedAt.getTime()
      : new Date(clerkUser.updatedAt).getTime()
    : null;

  // Synchronize Clerk user state with MediConnect user state safely
  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded) return;

    if (!isSignedIn || !clerkUserId || !clerkUser) {
      if (lastSyncedKeyRef.current !== 'signed_out') {
        lastSyncedKeyRef.current = 'signed_out';
        onSyncRef.current(null, null);
      }
      return;
    }

    const syncKey = `${clerkUserId}:${clerkUpdatedAt ?? '0'}`;
    if (lastSyncedKeyRef.current === syncKey) {
      return;
    }

    let isCancelled = false;

    const syncUserData = async () => {
      try {
        const fetchToken = getTokenRef.current;
        const token = (fetchToken ? await fetchToken() : null) || `clerk-token-${clerkUserId}`;

        // Retrieve any local health profile data stored for this Clerk user
        const storedProfileJson = await AsyncStorage.getItem(
          `${PROFILE_KEY_PREFIX}${clerkUserId}`
        );
        const storedProfile: Partial<User> = storedProfileJson
          ? JSON.parse(storedProfileJson)
          : {};

        const email =
          clerkUser.primaryEmailAddress?.emailAddress ||
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          '';

        const name =
          clerkUser.fullName ||
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          'Traveler';

        const phone = clerkUser.primaryPhoneNumber?.phoneNumber;

        const appUser: User = {
          id: clerkUserId,
          email,
          name,
          phone: phone ?? storedProfile.phone,
          profileImage: clerkUser.imageUrl || storedProfile.profileImage,
          bloodGroup: storedProfile.bloodGroup || 'O+',
          medicalHistory: storedProfile.medicalHistory || [
            'Allergies (recorded via profile)',
          ],
          allergies: storedProfile.allergies || ['Seasonal'],
          emergencyContact: storedProfile.emergencyContact || {
            name: 'Emergency Contact',
            phone: '+1-555-0199',
            relation: 'Family',
          },
          createdAt:
            clerkUser.createdAt instanceof Date
              ? clerkUser.createdAt.toISOString()
              : new Date().toISOString(),
          ...storedProfile,
        };

        if (!isCancelled) {
          lastSyncedKeyRef.current = syncKey;
          onSyncRef.current(appUser, token);
        }
      } catch (err) {
        console.warn('Error syncing Clerk user:', err);
        if (!isCancelled) {
          lastSyncedKeyRef.current = 'signed_out';
          onSyncRef.current(null, null);
        }
      }
    };

    syncUserData();

    return () => {
      isCancelled = true;
    };
  }, [isUserLoaded, isAuthLoaded, isSignedIn, clerkUserId, clerkUpdatedAt, clerkUser]);

  return <>{children}</>;
}

// ─── Provider Component ───────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
  isClerkEnabled?: boolean;
}

export function AuthProvider({ children, isClerkEnabled = false }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const clerkSignOutRef = React.useRef<(() => Promise<void>) | null>(null);

  // Restore fallback session on mount if Clerk is disabled
  useEffect(() => {
    if (isClerkEnabled) return;

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
  }, [isClerkEnabled]);

  const handleClerkSync = useCallback(async (user: User | null, token: string | null) => {
    if (user && token) {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
        AsyncStorage.setItem(USER_ID_KEY, user.id),
      ]);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      // Upsert and sync authenticated user to Neon DB
      try {
        await UserService.syncUser(user);
      } catch (err: any) {
        console.warn('[AuthContext] Backend syncUser notice:', err.message);
      }
    } else {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
        AsyncStorage.removeItem(USER_ID_KEY),
      ]);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Real login via backend API when Clerk is not used.
   * Throws real error if invalid — NO fake bypass!
   */
  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Invalid email or password.');
      }

      const user: User = {
        id: json.data.user.id,
        email: json.data.user.email,
        name: json.data.user.name || 'Traveler',
        createdAt: new Date().toISOString(),
      };
      const token = json.data.token;

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message ?? 'Login failed. Please check credentials.' });
      throw error;
    }
  };

  /**
   * Real signup via backend API when Clerk is not used.
   */
  const signup = async (name: string, email: string, password: string, phone: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Registration failed. Please check your information.');
      }

      const newUser: User = {
        id: json.data.user.id,
        email: json.data.user.email,
        name: json.data.user.name,
        phone,
        bloodGroup: 'O+',
        medicalHistory: [],
        allergies: [],
        createdAt: new Date().toISOString(),
      };
      const token = json.data.token;

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
      ]);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user: newUser, token } });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message ?? 'Signup failed.' });
      throw error;
    }
  };

  /**
   * Log out current user from Clerk or local storage.
   */
  const logout = async () => {
    try {
      if (clerkSignOutRef.current) {
        await clerkSignOutRef.current();
      }
    } catch (err) {
      console.warn('Clerk signOut error:', err);
    }

    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(USER_ID_KEY),
    ]);
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Update profile fields and persist locally.
   */
  const updateProfile = async (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: data });

    if (state.user) {
      const updatedUser = { ...state.user, ...data };
      if (isClerkEnabled) {
        await AsyncStorage.setItem(
          `${PROFILE_KEY_PREFIX}${state.user.id}`,
          JSON.stringify(updatedUser)
        );
      } else {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    clearError,
    isClerkEnabled,
  };

  const content = (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );

  if (isClerkEnabled) {
    return (
      <ClerkSyncBridge onSync={handleClerkSync} onLogoutRef={clerkSignOutRef}>
        {content}
      </ClerkSyncBridge>
    );
  }

  return content;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
