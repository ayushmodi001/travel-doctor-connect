import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Globe2,
  CheckCircle2,
  Sparkles,
  Shield,
  Stethoscope,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState('dr.takahashi@mediconnect.io');
  const [password, setPassword] = useState('doctor123');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email) {
      setValidationError('Please enter your authorized email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your clinical access key/password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.role === 'admin') {
        navigate('/admin');
      } else if (!result.isOnboarded) {
        // Doctor must complete initial profile setup on Get Started page before proceeding
        navigate('/doctor/get-started');
      } else {
        navigate('/doctor');
      }
    }
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    clearError();
    setValidationError(null);
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#F8FAFC',
      backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }}>
      {/* Left Column: Clinical Brand & Security Guarantee */}
      <div style={{
        flex: 1,
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        padding: '4rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '3rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.4)',
            }}>
              <Activity size={26} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Medi<span style={{ color: '#38BDF8' }}>Connect</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Cross-Border Clinical Workstation
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
            maxWidth: '520px',
          }}>
            Unified Clinical & Operations Portal.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#94A3B8',
            lineHeight: 1.7,
            maxWidth: '480px',
            marginBottom: '3rem',
          }}>
            Single unified sign-in. Your credentials automatically determine your workspace, accreditation status, and clearance level across our global care network.
          </p>

          {/* Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
              }}>
                <CheckCircle2 size={16} />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#E2E8F0', fontWeight: 500 }}>
                Automatic role clearance detection (Physician vs Administrator)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(13, 148, 136, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2DD4BF',
              }}>
                <Globe2 size={16} />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#E2E8F0', fontWeight: 500 }}>
                Mandatory Get Started onboarding gate for newly practicing physicians
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(22, 163, 74, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ADE80',
              }}>
                <Shield size={16} />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#E2E8F0', fontWeight: 500 }}>
                High-availability Neon Serverless PostgreSQL with sub-50ms latency
              </span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.82rem',
          color: '#64748B',
          borderTop: '1px solid #1E293B',
          paddingTop: '1.5rem',
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
          }} />
          <span>System Status: Fully Operational • Neon DB Verified</span>
        </div>
      </div>

      {/* Right Column: Portal Login Form */}
      <div style={{
        width: '540px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Workstation Sign In
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748B' }}>
              Enter your authorized email. Your role and practice credentials will be detected automatically.
            </p>
          </div>

          {/* Error Banner */}
          {(error || validationError) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#FEF2F2',
              borderRadius: '10px',
              border: '1px solid #FEE2E2',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#DC2626',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Authentication Notice:</strong> {error || validationError}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Authorized Clinical / Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mediconnect.io"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.75rem 0.7rem 2.5rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0284C7')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                  Security Access Passcode
                </label>
                <span style={{ fontSize: '0.78rem', color: '#0284C7', cursor: 'pointer' }}>
                  Forgot passcode?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.75rem 0.7rem 2.5rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0284C7')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                'Verifying Credentials...'
              ) : (
                <>
                  <span>Sign In to Workstation</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{
            marginTop: '2rem',
            padding: '1.1rem',
            backgroundColor: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
              <Sparkles size={14} color="#0284C7" />
              <span>One-Click Clinical Demo Credentials</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleFillCredentials('dr.takahashi@mediconnect.io', 'doctor123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid #FDE68A',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Stethoscope size={14} />
                  <span>New Doctor (Triggers Get Started Page)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#B45309' }}>dr.takahashi@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('dr.sarah@mediconnect.io', 'doctor123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#CCFBF1',
                  color: '#0F766E',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid #99F6E4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Stethoscope size={14} />
                  <span>Onboarded Doctor (Dr. Sarah Mitchell)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#0F766E' }}>dr.sarah@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillCredentials('admin@mediconnect.io', 'admin123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: '#E0F2FE',
                  color: '#0369A1',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid #BAE6FD',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={14} />
                  <span>Administrator (Ops Console)</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#0284C7' }}>admin@...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
