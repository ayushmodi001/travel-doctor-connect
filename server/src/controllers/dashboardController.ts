import { Request, Response } from 'express';
import { getDbPool } from '../config/db';

// GET /api/dashboard
export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    // 1. Featured Doctors from Neon DB
    const dRes = await pool.query('SELECT * FROM doctors LIMIT 4');
    const doctorList = dRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      specialty: r.specialty,
      hospital: r.hospital,
      location: r.location,
      rating: Number(r.rating),
      reviewCount: r.review_count,
      experience: r.experience,
      fee: Number(r.fee),
      currency: r.currency,
      profileImage: r.profile_image,
      about: r.about,
      qualifications: r.qualifications || [],
      languages: r.languages || [],
      availableSlots: r.available_slots || [],
      isAvailableNow: r.is_available_now,
      consultationType: r.consultation_type || ['video'],
      verified: r.verified,
    }));

    // 2. Upcoming Appointments from Neon DB
    const aRes = await pool.query("SELECT * FROM appointments WHERE status = 'upcoming' ORDER BY created_at DESC LIMIT 2");
    const appointmentList = aRes.rows.map(r => ({
      id: r.id,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      doctorSpecialty: r.doctor_specialty,
      doctorImage: r.doctor_image,
      patientId: r.patient_id,
      patientName: r.patient_name,
      date: r.date,
      time: r.time,
      type: r.type,
      status: r.status,
      reason: r.reason,
      meetingLink: r.meeting_link,
      amount: Number(r.amount),
      currency: r.currency,
    }));

    // 3. User Vitals from Neon DB
    const vRes = await pool.query('SELECT * FROM user_vitals ORDER BY created_at DESC LIMIT 1');
    const vitalsData = vRes.rows.length > 0 ? {
      heartRate: vRes.rows[0].heart_rate,
      bloodPressure: vRes.rows[0].blood_pressure,
      bloodOxygen: vRes.rows[0].blood_oxygen,
      bloodGroup: vRes.rows[0].blood_group,
    } : null;

    // 4. Active Travel Destination from Neon DB
    const destRes = await pool.query('SELECT * FROM travel_destinations ORDER BY code ASC LIMIT 1');
    const activeDestination = destRes.rows.length > 0 ? {
      code: destRes.rows[0].code,
      name: destRes.rows[0].name,
      flag: destRes.rows[0].flag,
      localEmergency: destRes.rows[0].local_emergency?.general || '112',
      waterSafety: destRes.rows[0].health_advisories?.waterSafety || 'Check local guidelines',
    } : null;

    return res.json({
      success: true,
      data: {
        vitals: vitalsData,
        upcomingAppointments: appointmentList,
        featuredDoctors: doctorList,
        activeTravelDestination: activeDestination,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error generating dashboard data' });
  }
};
