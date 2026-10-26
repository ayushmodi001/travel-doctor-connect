import { Request, Response } from 'express';
import { Doctor, ConsultationType } from '../types';
import { getDbPool } from '../config/db';

// GET /api/doctors
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const { specialty, consultationType, minRating } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let queryText = 'SELECT * FROM doctors WHERE 1=1';
    const params: any[] = [];

    if (typeof specialty === 'string' && specialty !== 'All') {
      params.push(`%${specialty}%`);
      queryText += ` AND specialty ILIKE $${params.length}`;
    }

    if (minRating) {
      params.push(Number(minRating));
      queryText += ` AND rating >= $${params.length}`;
    }

    const dbResult = await pool.query(queryText, params);
    let doctors: Doctor[] = dbResult.rows.map(r => ({
      id: r.id,
      name: r.name,
      specialty: r.specialty,
      subSpecialty: r.sub_specialty,
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

    if (typeof consultationType === 'string') {
      doctors = doctors.filter(d =>
        d.consultationType.includes(consultationType as ConsultationType)
      );
    }

    return res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching doctors from database' });
  }
};

// GET /api/doctors/:id
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Doctor with id ${id} not found in database.` });
    }

    const r = result.rows[0];
    const doctor: Doctor = {
      id: r.id,
      name: r.name,
      specialty: r.specialty,
      subSpecialty: r.sub_specialty,
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
    };

    return res.json({ success: true, data: doctor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching doctor details' });
  }
};

// GET /api/doctors/specialties
export const getSpecialties = async (_req: Request, res: Response) => {
  try {
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    const result = await pool.query('SELECT DISTINCT specialty FROM doctors ORDER BY specialty ASC');
    const specialties = result.rows.map(r => r.specialty);

    return res.json({ success: true, data: specialties });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading specialties' });
  }
};

// POST /api/doctors (Admin/Doctor Panel)
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database connection offline.' });

    const {
      name,
      specialty,
      subSpecialty,
      hospital,
      location,
      rating,
      reviewCount,
      experience,
      fee,
      currency,
      profileImage,
      about,
      qualifications,
      languages,
      availableSlots,
      isAvailableNow,
      consultationType,
    } = req.body;

    if (!name || !specialty || !hospital) {
      return res.status(400).json({ success: false, message: 'Please provide doctor name, specialty, and hospital' });
    }

    const id = `doc_${Date.now()}`;
    const loc = typeof location === 'object' ? location : {
      city: 'San Francisco',
      address: hospital,
      country: 'USA',
      latitude: 37.7749,
      longitude: -122.4194,
    };

    await pool.query(
      `INSERT INTO doctors (id, name, specialty, sub_specialty, hospital, location, rating, review_count, experience, fee, currency, profile_image, about, qualifications, languages, available_slots, is_available_now, consultation_type, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id,
        name,
        specialty,
        subSpecialty || specialty,
        hospital,
        JSON.stringify(loc),
        rating ? Number(rating) : 4.9,
        reviewCount ? Number(reviewCount) : 1,
        experience ? Number(experience) : 5,
        fee ? Number(fee) : 100,
        currency || 'USD',
        profileImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
        about || 'Licensed medical practitioner.',
        JSON.stringify(qualifications || ['Board Certified']),
        JSON.stringify(languages || ['English']),
        JSON.stringify(availableSlots || ['09:00 AM', '11:00 AM', '02:00 PM']),
        isAvailableNow !== undefined ? isAvailableNow : true,
        JSON.stringify(consultationType || ['video']),
        true,
      ]
    );

    return res.status(201).json({ success: true, message: 'Doctor profile created in Neon DB', data: { id, name, specialty } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error saving doctor' });
  }
};

// PUT /api/doctors/:id (Admin/Doctor Panel)
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database connection offline.' });

    const updates = req.body;
    const existing = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const cur = existing.rows[0];
    await pool.query(
      `UPDATE doctors SET
         name = $1,
         specialty = $2,
         hospital = $3,
         fee = $4,
         is_available_now = $5,
         about = $6,
         profile_image = $7
       WHERE id = $8`,
      [
        updates.name || cur.name,
        updates.specialty || cur.specialty,
        updates.hospital || cur.hospital,
        updates.fee ? Number(updates.fee) : cur.fee,
        updates.isAvailableNow !== undefined ? updates.isAvailableNow : cur.is_available_now,
        updates.about || cur.about,
        updates.profileImage || cur.profile_image,
        id,
      ]
    );

    return res.json({ success: true, message: 'Doctor updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error updating doctor' });
  }
};

// DELETE /api/doctors/:id (Admin Panel)
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    if (!pool) return res.status(500).json({ success: false, message: 'Database connection offline.' });

    await pool.query('DELETE FROM doctors WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Doctor deleted from Neon DB' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error deleting doctor' });
  }
};
