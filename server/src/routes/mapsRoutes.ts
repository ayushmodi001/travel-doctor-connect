import { Router, Request, Response } from 'express';
import { getDbPool } from '../config/db';

const router = Router();

// GET /api/maps/locations
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    const dRes = await pool.query('SELECT * FROM doctors');
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

    const eRes = await pool.query('SELECT * FROM emergency_services');
    const emergencyList = eRes.rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      phone: r.phone,
      address: r.address,
      location: r.location,
      available24h: r.available24h,
    }));

    const doctorPlaces = doctorList.map(d => ({
      id: d.id,
      name: d.name,
      category: 'doctor',
      specialty: d.specialty,
      address: d.location?.address || `${d.hospital}, San Francisco`,
      rating: d.rating,
      latitude: d.location?.latitude || 37.7749,
      longitude: d.location?.longitude || -122.4194,
      image: d.profileImage,
      fee: d.fee,
      currency: d.currency,
      availableNow: d.isAvailableNow,
      rawDoctor: d,
    }));

    const emergencyPlaces = emergencyList.map(svc => ({
      id: svc.id,
      name: svc.name,
      category: svc.type === 'hospital' ? 'hospital' : svc.type === 'ambulance' ? 'emergency' : 'clinic',
      address: svc.address,
      latitude: svc.location?.latitude || 37.7749,
      longitude: svc.location?.longitude || -122.4194,
      phone: svc.phone,
      availableNow: svc.available24h,
    }));

    let allPlaces = [...doctorPlaces, ...emergencyPlaces];

    if (category && typeof category === 'string' && category !== 'all') {
      allPlaces = allPlaces.filter(p => p.category === category);
    }

    return res.json({
      success: true,
      count: allPlaces.length,
      data: allPlaces,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading map locations from database' });
  }
});

export default router;
