import { Request, Response } from 'express';
import { MOCK_DOCTORS } from '../data/mockData';
import { Doctor, ConsultationType } from '../types';

const doctors: Doctor[] = [...MOCK_DOCTORS];

// GET /api/doctors
export const getDoctors = (req: Request, res: Response) => {
  const { specialty, consultationType, minRating } = req.query;
  let filtered = [...doctors];

  if (typeof specialty === 'string') {
    filtered = filtered.filter(d =>
      d.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }

  if (typeof consultationType === 'string') {
    filtered = filtered.filter(d =>
      d.consultationType.includes(consultationType as ConsultationType)
    );
  }

  if (minRating) {
    filtered = filtered.filter(d => d.rating >= Number(minRating));
  }

  return res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
};

// GET /api/doctors/:id
export const getDoctorById = (req: Request, res: Response) => {
  const doctor = doctors.find(d => d.id === req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }
  return res.json({ success: true, data: doctor });
};

// GET /api/doctors/specialties
export const getSpecialties = (_req: Request, res: Response) => {
  const specialties = [...new Set(doctors.map(d => d.specialty))];
  return res.json({ success: true, data: specialties });
};
