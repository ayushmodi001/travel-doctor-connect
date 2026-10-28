import { Request, Response } from 'express';
import { Appointment, ConsultationType } from '../types';
import { getDbPool } from '../config/db';

// GET /api/appointments
export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { status, patientId } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let sql = `
      SELECT a.*, COALESCE(NULLIF(u.name, ''), a.patient_name) as real_patient_name
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (patientId) {
      params.push(patientId);
      sql += ` AND a.patient_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ' ORDER BY a.created_at DESC';

    const result = await pool.query(sql, params);
    const list = result.rows.map(r => ({
      id: r.id,
      doctorId: r.doctor_id,
      doctorName: r.doctor_name,
      doctorSpecialty: r.doctor_specialty,
      doctorImage: r.doctor_image,
      patientId: r.patient_id,
      patientName: r.real_patient_name || r.patient_name || 'Traveler',
      date: r.date,
      time: r.time,
      type: r.type,
      status: r.status,
      reason: r.reason,
      meetingLink: r.meeting_link,
      amount: Number(r.amount),
      currency: r.currency,
      createdAt: r.created_at,
    }));

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading appointments' });
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    const result = await pool.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Appointment ${id} not found in database.` });
    }

    const r = result.rows[0];
    return res.json({
      success: true,
      data: {
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
        createdAt: r.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error retrieving appointment' });
  }
};

// POST /api/appointments
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const {
      doctorId,
      doctorName,
      doctorSpecialty,
      doctorImage,
      patientId,
      patientName,
      date,
      time,
      type,
      reason,
      amount,
      currency,
    } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctorId, date, and time',
      });
    }

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      doctorId,
      doctorName: doctorName || 'Doctor',
      doctorSpecialty: doctorSpecialty || 'General Care',
      doctorImage: doctorImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      patientId: patientId || 'u1',
      patientName: patientName || 'Patient',
      date,
      time,
      type: (type as ConsultationType) || 'video',
      status: 'upcoming',
      reason: reason || 'Clinical consultation',
      meetingLink: `https://meet.mediconnect.dev/room-${Date.now()}`,
      amount: typeof amount === 'number' ? amount : 100,
      currency: currency || 'USD',
      createdAt: new Date().toISOString(),
    };

    const pool = getDbPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    await pool.query(
      `INSERT INTO appointments (id, doctor_id, doctor_name, doctor_specialty, doctor_image, patient_id, patient_name, date, time, type, status, reason, meeting_link, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        newAppointment.id,
        newAppointment.doctorId,
        newAppointment.doctorName,
        newAppointment.doctorSpecialty,
        newAppointment.doctorImage,
        newAppointment.patientId,
        newAppointment.patientName,
        newAppointment.date,
        newAppointment.time,
        newAppointment.type,
        newAppointment.status,
        newAppointment.reason,
        newAppointment.meetingLink,
        newAppointment.amount,
        newAppointment.currency,
      ]
    );

    return res.status(201).json({ success: true, data: newAppointment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error booking appointment' });
  }
};

// PATCH /api/appointments/:id
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pool = getDbPool();
    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    if (!status || !['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateRes = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found in database.' });
    }

    const r = updateRes.rows[0];
    return res.json({
      success: true,
      data: {
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
        createdAt: r.created_at,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error updating appointment' });
  }
};

// GET /api/appointments/:id/video-token
export const getVideoSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    let doctorName = 'Physician';
    let meetingLink = `https://meet.mediconnect.dev/room-${id}`;

    if (pool) {
      const resDb = await pool.query('SELECT doctor_name, meeting_link FROM appointments WHERE id = $1', [id]);
      if (resDb.rows.length > 0) {
        doctorName = resDb.rows[0].doctor_name;
        meetingLink = resDb.rows[0].meeting_link || meetingLink;
      }
    }

    return res.json({
      success: true,
      data: {
        appointmentId: id,
        channelId: `channel-${id}`,
        token: `webrtc-token-${id}-${Date.now()}`,
        doctorName,
        status: 'ready',
        meetingUrl: meetingLink,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error generating video call session' });
  }
};
