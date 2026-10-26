import { Router, Request, Response } from 'express';
import { getDbPool } from '../config/db';
import { EmergencyService } from '../types';

const router = Router();

// GET /api/emergency/nearby
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const pool = getDbPool();

    if (!pool) {
      return res.status(500).json({ success: false, message: 'Database connection offline.' });
    }

    let sql = 'SELECT * FROM emergency_services WHERE 1=1';
    const params: any[] = [];

    if (typeof type === 'string' && type !== 'all') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    const result = await pool.query(sql, params);
    const services: EmergencyService[] = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      phone: r.phone,
      address: r.address,
      location: r.location,
      available24h: r.available24h,
    }));

    return res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error fetching emergency facilities from database' });
  }
});

export default router;
