import { Request, Response } from 'express';
import { MOCK_APPOINTMENTS } from '../data/mockData';
import { Appointment, ConsultationType } from '../types';

const appointments: Appointment[] = [...MOCK_APPOINTMENTS];

// GET /api/appointments
export const getAppointments = (req: Request, res: Response) => {
  const { status, patientId } = req.query;
  let filtered = [...appointments];

  if (typeof status === 'string') {
    filtered = filtered.filter(a => a.status === status);
  }
  if (typeof patientId === 'string') {
    filtered = filtered.filter(a => a.patientId === patientId);
  }

  return res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
};

// POST /api/appointments
export const createAppointment = (req: Request, res: Response) => {
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
    doctorSpecialty: doctorSpecialty || 'General',
    doctorImage: doctorImage || '',
    patientId: patientId || 'u1',
    patientName: patientName || 'Patient',
    date,
    time,
    type: (type as ConsultationType) || 'video',
    status: 'upcoming',
    reason: reason || '',
    meetingLink: `https://meet.mediconnect.dev/room-${Date.now()}`,
    amount: typeof amount === 'number' ? amount : 100,
    currency: currency || 'USD',
  };

  appointments.unshift(newAppointment);
  return res.status(201).json({ success: true, data: newAppointment });
};

// PATCH /api/appointments/:id
export const updateAppointmentStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const appointment = appointments.find(a => a.id === id);
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  if (status && ['upcoming', 'completed', 'cancelled'].includes(status)) {
    appointment.status = status as 'upcoming' | 'completed' | 'cancelled';
  }

  return res.json({ success: true, data: appointment });
};
