import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, Role } from '../types';

interface LoginResult {
  success: boolean;
  role?: Role;
  isOnboarded?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<LoginResult>;
  completeDoctorOnboarding: (profile: Partial<AuthUser>) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check saved session in localStorage
    try {
      const savedToken = localStorage.getItem('mediconnect_token');
      const savedUser = localStorage.getItem('mediconnect_user');
      if (savedToken && savedUser) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error('Failed to parse cached session:', e);
      localStorage.removeItem('mediconnect_token');
      localStorage.removeItem('mediconnect_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Validation
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass.trim()) {
      setError('Please enter your authorized email address and password.');
      setIsLoading(false);
      return { success: false };
    }

    if (pass.length < 4) {
      setError('Password must contain at least 4 characters.');
      setIsLoading(false);
      return { success: false };
    }

    // Identify role based purely on credentials
    const isAdministrator = cleanEmail.includes('admin');
    const detectedRole: Role = isAdministrator ? 'admin' : 'doctor';

    let resolvedUser: AuthUser;

    if (detectedRole === 'admin') {
      resolvedUser = {
        id: 'admin-01',
        name: 'Sarah Chen (Ops Director)',
        email: cleanEmail,
        role: 'admin',
        isOnboarded: true,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      };
    } else {
      // Doctor identification from credentials / Neon DB cache
      const savedProfileStr = localStorage.getItem(`doctor_profile_${cleanEmail}`);
      let isOnboarded = false;
      let doctorData: Partial<AuthUser> = {};

      if (savedProfileStr) {
        doctorData = JSON.parse(savedProfileStr);
        isOnboarded = !!doctorData.isOnboarded;
      } else if (cleanEmail.includes('sarah')) {
        // Pre-onboarded Doctor from Neon DB
        isOnboarded = true;
        doctorData = {
          name: 'Dr. Sarah Mitchell',
          specialty: 'Cardiologist',
          hospital: 'San Francisco General Hospital',
          experience: 12,
          licenseNumber: 'MD-CA-902148',
          languages: ['English', 'Spanish'],
          phone: '+1 (415) 206-8000',
        };
      } else if (cleanEmail.includes('james')) {
        isOnboarded = true;
        doctorData = {
          name: 'Dr. James Wilson',
          specialty: 'General Practitioner',
          hospital: 'UCSF Medical Center',
          experience: 8,
          licenseNumber: 'MD-CA-771923',
          languages: ['English'],
        };
      } else {
        // New doctor signing in: requires initial data on Get Started page!
        isOnboarded = false;
        doctorData = {
          name: cleanEmail.includes('dr.') 
            ? 'Dr. ' + cleanEmail.split('@')[0].replace('dr.', '').replace('.', ' ')
            : 'Dr. ' + cleanEmail.split('@')[0],
        };
      }

      resolvedUser = {
        id: doctorData.id || `doc-${Date.now()}`,
        name: doctorData.name || 'Physician',
        email: cleanEmail,
        role: 'doctor',
        isOnboarded,
        specialty: doctorData.specialty,
        hospital: doctorData.hospital,
        licenseNumber: doctorData.licenseNumber,
        experience: doctorData.experience,
        languages: doctorData.languages,
        phone: doctorData.phone,
        about: doctorData.about,
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
      };
    }

    const dummyToken = `jwt-mc-${detectedRole}-${Date.now()}`;

    setUser(resolvedUser);
    setToken(dummyToken);

    try {
      localStorage.setItem('mediconnect_token', dummyToken);
      localStorage.setItem('mediconnect_user', JSON.stringify(resolvedUser));
    } catch (e) {
      console.warn('Could not persist session to localStorage', e);
    }

    setIsLoading(false);
    return {
      success: true,
      role: detectedRole,
      isOnboarded: resolvedUser.isOnboarded,
    };
  };

  const completeDoctorOnboarding = async (profile: Partial<AuthUser>): Promise<boolean> => {
    if (!user) return false;

    const updatedUser: AuthUser = {
      ...user,
      ...profile,
      isOnboarded: true,
    };

    setUser(updatedUser);

    try {
      localStorage.setItem('mediconnect_user', JSON.stringify(updatedUser));
      if (updatedUser.email) {
        localStorage.setItem(`doctor_profile_${updatedUser.email}`, JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.warn('Could not persist updated doctor profile:', e);
    }

    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('mediconnect_token');
    localStorage.removeItem('mediconnect_user');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        completeDoctorOnboarding,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
