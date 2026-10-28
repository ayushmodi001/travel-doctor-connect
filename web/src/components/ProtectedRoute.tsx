import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import type { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: Role;
  requireOnboarded?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  requireOnboarded = true,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        gap: '1rem',
      }}>
        <Loader2 size={36} color="#0284C7" className="animate-spin" />
        <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>
          Verifying Clinical Cryptographic Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role validation
  if (allowedRole && user.role !== allowedRole) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShieldAlert size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>
            Restricted Clinical Area
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your account is assigned the role <strong style={{ color: '#0284C7' }}>{user.role.toUpperCase()}</strong>.
            You do not have clearance to access the {allowedRole.toUpperCase()} workspace.
          </p>

          <Link
            to={user.role === 'admin' ? '/admin' : (user.isOnboarded ? '/doctor' : '/doctor/get-started')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
          >
            Go to Your Authorized {user.role === 'admin' ? 'Admin Console' : 'Doctor Portal'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  // Doctor Onboarding Gate: If doctor hasn't completed initial data, DO NOT allow them to go any further into the workstation!
  if (user.role === 'doctor') {
    if (requireOnboarded && !user.isOnboarded) {
      return <Navigate to="/doctor/get-started" replace />;
    }
    // If they already completed onboarding and try to access /doctor/get-started again:
    if (!requireOnboarded && user.isOnboarded) {
      return <Navigate to="/doctor" replace />;
    }
  }

  return <>{children}</>;
};
