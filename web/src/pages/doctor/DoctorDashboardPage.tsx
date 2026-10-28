import React, { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Appointment, PatientDossier } from '../../types';
import {
  Stethoscope,
  Video,
  AlertTriangle,
  Activity,
  Phone,
  Globe,
  FileCheck,
  ShieldAlert,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  ChevronRight,
  Shield,
  Pill,
  Loader2,
} from 'lucide-react';

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientDossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftStatus, setShiftStatus] = useState<'available' | 'busy' | 'offline'>('available');

  // Selected Patient for Dossier Inspection
  const [selectedPatient, setSelectedPatient] = useState<PatientDossier | null>(null);

  // Clinical Prescription & Notes Editor
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescribedMed, setPrescribedMed] = useState('Salbutamol Inhaler 100mcg (Equivalent: Sultanol Inhaler Japan)');
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      const [appts, patientList] = await Promise.all([
        api.getAppointments(),
        api.getPatients(),
      ]);
      setAppointments(appts);
      setPatients(patientList);
      if (patientList.length > 0) {
        setSelectedPatient(patientList[0]);
      }
    } catch (err: any) {
      console.error('Error fetching doctor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchVideo = (appt: Appointment) => {
    alert(`Initiating secure HIPAA/telehealth video consultation room with ${appt.patientName}...\nSession ID: ${appt.id}`);
  };

  const handleSaveClinicalNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <Header portalType="doctor" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
          <Loader2 size={36} color="#0D9488" className="animate-spin" />
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading Physician Clinical Dossiers & Appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Header portalType="doctor" />

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.75rem 1.5rem 4rem' }}>
        {/* Doctor Shift Status Bar */}
        <div className="glass-panel" style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#CCFBF1',
              color: '#0F766E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  {user?.name || 'Dr. Sarah Mitchell'}
                </h1>
                <span className="badge badge-teal">Board Certified</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                {user?.specialty || 'Cardiologist'} • {user?.hospital || 'San Francisco General Hospital'}
              </p>
            </div>
          </div>

          {/* Shift State Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Clinical Shift:</span>
            <div style={{
              display: 'flex',
              padding: '0.25rem',
              backgroundColor: '#F1F5F9',
              borderRadius: '8px',
              gap: '0.25rem',
            }}>
              <button
                type="button"
                onClick={() => setShiftStatus('available')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: shiftStatus === 'available' ? '#DCFCE7' : 'transparent',
                  color: shiftStatus === 'available' ? '#15803D' : '#64748B',
                }}
              >
                ● Available for Video
              </button>
              <button
                type="button"
                onClick={() => setShiftStatus('busy')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: shiftStatus === 'busy' ? '#FEF3C7' : 'transparent',
                  color: shiftStatus === 'busy' ? '#B45309' : '#64748B',
                }}
              >
                ● In Consultation / Rounds
              </button>
              <button
                type="button"
                onClick={() => setShiftStatus('offline')}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: shiftStatus === 'offline' ? '#FEE2E2' : 'transparent',
                  color: shiftStatus === 'offline' ? '#B91C1C' : '#64748B',
                }}
              >
                ● Offline
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Clinical Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Scheduled Consultations Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#0284C7" />
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                    Scheduled Consultations
                  </h2>
                </div>
                <span className="badge badge-primary">{appointments.length} Active</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {appointments.map((appt) => {
                  const isSelected = selectedPatient?.id === appt.patientId || selectedPatient?.name === appt.patientName;
                  return (
                    <div
                      key={appt.id}
                      onClick={() => {
                        const matched = patients.find((p) => p.id === appt.patientId || p.name === appt.patientName) || patients[0];
                        if (matched) setSelectedPatient(matched);
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#0284C7' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                          {appt.patientName}
                        </div>
                        <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                          {appt.type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748B', marginBottom: '0.5rem' }}>
                        <Clock size={13} />
                        <span>{appt.date} • {appt.time}</span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                        "{appt.reason || 'Travel sickness / Allergic reaction triage'}"
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchVideo(appt);
                          }}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                        >
                          <Video size={14} />
                          <span>Start Video</span>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
                        >
                          Dossier
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registered Travelers Directory */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.75rem' }}>
                All Registered Travel Patients
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {patients.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPatient(pat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: selectedPatient?.id === pat.id ? '#E0F2FE' : '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>{pat.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Origin: {pat.countryOfOrigin} • Blood: {pat.bloodGroup}
                      </div>
                    </div>
                    <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>View</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Full Patient Medical Dossier & Clinical Actions (Requirement 3 & 6) */}
          {selectedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Patient Identity & Passport Header */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '14px',
                      backgroundColor: '#E0F2FE',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      border: '2px solid white',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.15)',
                    }}>
                      {selectedPatient.name[0]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                          {selectedPatient.name}
                        </h2>
                        <span className="badge badge-sage">
                          <CheckCircle2 size={12} />
                          Active Traveler
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Patient ID: <span style={{ fontFamily: 'monospace' }}>{selectedPatient.id}</span> • {selectedPatient.phone}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <button
                      onClick={() => alert(`Connecting with ${selectedPatient.name} via high-definition WebRTC video...`)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Video size={16} />
                      <span>Start Video Telehealth</span>
                    </button>
                  </div>
                </div>

                {/* Country of Origin, Passport & Location Badges */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      Country of Origin
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontWeight: 700, color: '#0F172A' }}>
                      <Globe size={16} color="#0284C7" />
                      <span>{selectedPatient.countryOfOrigin}</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      Passport & Travel Status
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontWeight: 700, color: '#0F172A' }}>
                      <FileCheck size={16} color="#16A34A" />
                      <span>{selectedPatient.passportNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>
                      ✓ {selectedPatient.travelDocumentStatus} (Exp: {selectedPatient.passportExpiry})
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      Current Coordinates
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                      📍 {selectedPatient.currentLocation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Alert: Allergies, Adverse Reactions & Blood Group */}
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: '14px',
                padding: '1.25rem 1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <ShieldAlert size={20} color="#DC2626" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#991B1B' }}>
                    Critical Clinical Warnings: Allergies & Intolerances
                  </h3>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {selectedPatient.allergies.map((allergy, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.85rem',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #EF4444',
                        color: '#B91C1C',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <AlertTriangle size={14} color="#EF4444" />
                      <span>{allergy}</span>
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#7F1D1D' }}>
                  <strong>Physician Precaution:</strong> Prior to prescribing anti-inflammatories or antibiotics in Japan, verify formula does not contain penicillin derivatives or Aspirin NSAID blends (e.g. avoid Bufferin A, prescribe Acetaminophen/Paracetamol or Loxonin with gastroprotection if tolerated).
                </div>
              </div>

              {/* Vitals, Emergency Contacts & Insurance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {/* Vitals Box */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Activity size={18} color="#0284C7" />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Live Vitals Telemetry</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>Heart Rate:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedPatient.vitals.heartRate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>Blood Pressure:</span>
                      <strong style={{ color: '#0F172A' }}>{selectedPatient.vitals.bloodPressure}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>Oxygen (SpO2):</span>
                      <strong style={{ color: '#16A34A' }}>{selectedPatient.vitals.bloodOxygen}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748B' }}>Blood Group:</span>
                      <strong style={{ color: '#DC2626', fontWeight: 800 }}>{selectedPatient.bloodGroup}</strong>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Phone size={18} color="#16A34A" />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Emergency Contact</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    {selectedPatient.emergencyContact.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.4rem' }}>
                    Relationship: {selectedPatient.emergencyContact.relation}
                  </div>
                  <a
                    href={`tel:${selectedPatient.emergencyContact.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#0284C7',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={13} />
                    <span>{selectedPatient.emergencyContact.phone}</span>
                  </a>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.4rem' }}>
                    Embassy Hotline: +81 3-3262-2101
                  </div>
                </div>

                {/* Travel Insurance Details */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Shield size={18} color="#0D9488" />
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Allianz Travel Policy</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                    {selectedPatient.insurance.provider}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B', marginBottom: '0.3rem' }}>
                    {selectedPatient.insurance.policyNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 600 }}>
                    Coverage: {selectedPatient.insurance.coverageLimit}
                  </div>
                  <span className="badge badge-sage" style={{ fontSize: '0.68rem', marginTop: '0.4rem' }}>
                    Direct Hospital Billing Enabled
                  </span>
                </div>
              </div>

              {/* Physician Consultation Charting & e-Prescription Generator */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                  <Pill size={20} color="#0284C7" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                    Clinical Consultation Notes & Japanese Drug Prescription
                  </h3>
                </div>

                <form onSubmit={handleSaveClinicalNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                      Diagnostic Impression & Travel Advice
                    </label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="e.g. Patient presents with mild altitude sickness and bronchospasm. Advised hydration, avoiding NSAIDs due to mild asthma. Prescribed Salbutamol equivalent..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                      Prescribe Japanese Pharmacy Equivalent Medication
                    </label>
                    <select
                      value={prescribedMed}
                      onChange={(e) => setPrescribedMed(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.85rem',
                        backgroundColor: 'white',
                      }}
                    >
                      <option value="Salbutamol Inhaler 100mcg (Equivalent: Sultanol Inhaler Japan)">
                        Salbutamol Inhaler 100mcg (Equivalent: Sultanol Inhaler Japan)
                      </option>
                      <option value="Acetaminophen / Paracetamol 500mg (Equivalent: Calonal 500)">
                        Acetaminophen / Paracetamol 500mg (Equivalent: Calonal 500 - Penicillin Safe)
                      </option>
                      <option value="Cetirizine 10mg (Equivalent: Zyrtec Tablets Japan)">
                        Cetirizine 10mg (Equivalent: Zyrtec Tablets Japan)
                      </option>
                      <option value="Oral Rehydration Salts (Equivalent: OS-1 Otsuka Pharmaceutical)">
                        Oral Rehydration Salts (Equivalent: OS-1 Otsuka Pharmaceutical)
                      </option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    {noteSaved && (
                      <span style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={16} />
                        Chart updated & e-Prescription transmitted to traveler mobile app!
                      </span>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ marginLeft: 'auto', fontSize: '0.85rem' }}
                    >
                      <Send size={15} />
                      <span>Transmit e-Prescription to Patient</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
              Select a patient from the consultation queue to inspect their travel medical dossier.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
