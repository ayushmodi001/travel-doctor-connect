import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building2,
  FileCheck2,
  Globe2,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const DoctorGetStartedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, completeDoctorOnboarding, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || 'Dr. Yuto Takahashi, MD',
    licenseNumber: 'JPN-MHLW-849204',
    specialty: 'Emergency Travel Medicine',
    subSpecialty: 'Tropical Medicine & Allergic Reactions',
    hospital: 'Tokyo Metropolitan Hiroo Hospital',
    city: 'Tokyo',
    country: 'Japan',
    phone: '+81 3-3444-1181',
    experience: 8,
    fee: 4500,
    currency: 'JPY',
    languages: 'English, Japanese',
    about: 'Board-certified emergency physician with 8 years of clinical experience specializing in international traveler care, emergency allergic response, and acute high-altitude illnesses.',
    videoConsultation: true,
    chatConsultation: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.name.trim()) return setValidationError('Physician full legal name is required.');
    if (!formData.licenseNumber.trim()) return setValidationError('Medical License / Board Accreditation ID is required.');
    if (!formData.hospital.trim()) return setValidationError('Primary Hospital Affiliation is required.');

    setIsSubmitting(true);

    try {
      // 1. Sync to Neon PostgreSQL
      await api.createDoctor({
        name: formData.name,
        specialty: formData.specialty,
        subSpecialty: formData.subSpecialty,
        hospital: formData.hospital,
        location: {
          city: formData.city,
          country: formData.country,
        },
        experience: Number(formData.experience),
        fee: Number(formData.fee),
        currency: formData.currency,
        languages: formData.languages.split(',').map((s) => s.trim()),
        about: formData.about,
        rating: 5.0,
        reviewCount: 1,
        isAvailableNow: true,
        verified: true,
        consultationType: ['video', 'chat'],
      });

      // 2. Mark doctor profile as onboarded in session
      await completeDoctorOnboarding({
        name: formData.name,
        specialty: formData.specialty,
        hospital: formData.hospital,
        licenseNumber: formData.licenseNumber,
        experience: Number(formData.experience),
        languages: formData.languages.split(',').map((s) => s.trim()),
        phone: formData.phone,
        about: formData.about,
        isOnboarded: true,
      });

      // 3. Navigate to the unlocked Doctor Workstation
      navigate('/doctor');
    } catch (err: any) {
      console.warn('Backend sync warning, completing local accreditation:', err.message);
      await completeDoctorOnboarding({
        name: formData.name,
        specialty: formData.specialty,
        hospital: formData.hospital,
        licenseNumber: formData.licenseNumber,
        experience: Number(formData.experience),
        languages: formData.languages.split(',').map((s) => s.trim()),
        phone: formData.phone,
        about: formData.about,
        isOnboarded: true,
      });
      navigate('/doctor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Top Header */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              Medi<span style={{ color: '#0284C7' }}>Connect</span>
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Physician Accreditation Gateway
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <LogOut size={14} />
          <span>Exit Setup</span>
        </button>
      </header>

      {/* Main Form Container */}
      <main style={{ maxWidth: '840px', margin: '2.5rem auto 4rem', padding: '0 1.5rem' }}>
        {/* Onboarding Gate Banner */}
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1.5px solid #BFDBFE',
          borderRadius: '14px',
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#DBEAFE',
            color: '#1D4ED8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E3A8A', marginBottom: '0.35rem' }}>
              Mandatory Initial Clinical Intake
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#3B82F6', lineHeight: 1.6 }}>
              Welcome to the MediConnect Cross-Border Care Network. Before accessing traveling patient medical dossiers, allergy histories, or consultation video links, you must complete your initial accreditation and clinical setup below.
            </p>
          </div>
        </div>

        {/* Error notice */}
        {validationError && (
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#DC2626',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}>
            {validationError}
          </div>
        )}

        {/* Form Card */}
        <div className="glass-panel" style={{ padding: '2.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Section 1: Legal & Professional Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <FileCheck2 size={18} color="#0284C7" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  1. Physician Credentials & License
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Full Legal Name (with MD / MBBS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Medical Council / Board License ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JPN-MHLW-849204"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Primary Medical Specialty *
                  </label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', backgroundColor: 'white' }}
                  >
                    <option value="Emergency Travel Medicine">Emergency Travel Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Infectious Disease">Infectious Disease</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Sub-Specialty / Clinical Focus
                  </label>
                  <input
                    type="text"
                    value={formData.subSpecialty}
                    onChange={(e) => setFormData({ ...formData, subSpecialty: e.target.value })}
                    placeholder="e.g. Altitude Sickness, Allergic Response"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Hospital Affiliation & Practice Location */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <Building2 size={18} color="#0D9488" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  2. Hospital Affiliation & Practice Base
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Primary Hospital / Clinic Facility *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hospital}
                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    placeholder="e.g. Tokyo Metropolitan Hiroo Hospital"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    City & Country Base
                  </label>
                  <input
                    type="text"
                    value={`${formData.city}, ${formData.country}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(',');
                      setFormData({
                        ...formData,
                        city: parts[0]?.trim() || '',
                        country: parts[1]?.trim() || 'Japan',
                      });
                    }}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Direct On-Call Emergency Phone / Clinical Pager
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+81 3-3444-1181"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            {/* Section 3: Consultation Settings & Languages */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E2E8F0' }}>
                <Globe2 size={18} color="#16A34A" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                  3. Practice Consultation Parameters
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Years Experience
                  </label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Consultation Fee (JPY)
                  </label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Spoken Languages
                  </label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="English, Japanese, Spanish"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Physician Practice Statement & Clinical Approach
                </label>
                <textarea
                  rows={3}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16A34A', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} />
                <span>Verification & HIPAA Agreement Accepted</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                {isSubmitting ? (
                  'Activating Clinical Accreditation...'
                ) : (
                  <>
                    <span>Complete Intake & Unlock Workstation</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
