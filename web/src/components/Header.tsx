import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Activity,
  LogOut,
  Database,
  Shield,
  Stethoscope,
} from 'lucide-react';

interface HeaderProps {
  portalType: 'admin' | 'doctor';
}

export const Header: React.FC<HeaderProps> = ({ portalType }) => {
  const { user, logout } = useAuth();
  const [dbStatus, setDbStatus] = useState<{ status: string; latencyMs: number }>({
    status: 'checking',
    latencyMs: 38,
  });

  useEffect(() => {
    let mounted = true;
    const checkDb = async () => {
      const res = await api.checkHealth();
      if (mounted) setDbStatus(res);
    };

    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo & Portal Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)',
            }}>
              <Activity size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Medi<span style={{ color: '#0284C7' }}>Connect</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                International Care
              </div>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0' }} />

          {/* Role badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: portalType === 'admin' ? '#F0F9FF' : '#F0FDFA',
            border: `1px solid ${portalType === 'admin' ? '#BAE6FD' : '#99F6E4'}`,
          }}>
            {portalType === 'admin' ? (
              <>
                <Shield size={14} color="#0284C7" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369A1' }}>
                  ADMIN OPERATIONS HUB
                </span>
              </>
            ) : (
              <>
                <Stethoscope size={14} color="#0D9488" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>
                  PHYSICIAN CLINICAL PORTAL
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: Database status, User chip, and Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Neon DB Ping */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.78rem',
            color: '#475569',
          }}>
            <Database size={14} color="#64748B" />
            <span>Neon DB:</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
              color: dbStatus.status === 'healthy' ? '#16A34A' : '#EF4444',
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: dbStatus.status === 'healthy' ? '#16A34A' : '#EF4444',
                boxShadow: dbStatus.status === 'healthy' ? '0 0 8px #16A34A' : 'none',
              }} />
              <span>{dbStatus.status === 'healthy' ? `${dbStatus.latencyMs}ms` : 'Offline'}</span>
            </div>
          </div>

          {/* User Profile Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: portalType === 'admin' ? '#E0F2FE' : '#CCFBF1',
              color: portalType === 'admin' ? '#0369A1' : '#0F766E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
                {user?.name || 'Authorized Member'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                {user?.email || 'authenticated'}
              </span>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0' }} />

          {/* Logout Action */}
          <button
            onClick={logout}
            title="Sign out of clinical session"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
