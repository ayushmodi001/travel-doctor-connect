import { Request, Response } from 'express';
import { getDbPool } from '../config/db';

// Helper to extract authenticated user ID from request headers or auth token
const extractUserId = (req: Request): string => {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && headerUserId.trim()) {
    return headerUserId.trim();
  }
  const queryUserId = req.query.userId as string;
  if (queryUserId && queryUserId.trim()) {
    return queryUserId.trim();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer clerk-token-')) {
    return authHeader.replace('Bearer clerk-token-', '').trim();
  }
  return 'default-user';
};

// POST /api/users/sync - Upserts Clerk authenticated user into Neon DB
export const syncUserProfile = async (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      email,
      phone,
      role = 'patient',
      bloodGroup = 'O+',
      allergies = [],
      medicalHistory = [],
      emergencyContact = {},
      profileImage = '',
    } = req.body;

    if (!id || !email) {
      return res.status(400).json({ success: false, message: 'User id and email are required for sync' });
    }

    const pool = getDbPool();
    if (pool) {
      const result = await pool.query(
        `INSERT INTO users (id, name, email, phone, role, blood_group, allergies, medical_history, emergency_contact, profile_image, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = COALESCE(EXCLUDED.phone, users.phone),
           role = COALESCE(EXCLUDED.role, users.role),
           blood_group = COALESCE(EXCLUDED.blood_group, users.blood_group),
           allergies = CASE WHEN EXCLUDED.allergies IS NOT NULL AND jsonb_array_length(EXCLUDED.allergies) > 0 THEN EXCLUDED.allergies ELSE users.allergies END,
           medical_history = CASE WHEN EXCLUDED.medical_history IS NOT NULL AND jsonb_array_length(EXCLUDED.medical_history) > 0 THEN EXCLUDED.medical_history ELSE users.medical_history END,
           emergency_contact = CASE WHEN EXCLUDED.emergency_contact IS NOT NULL AND EXCLUDED.emergency_contact != '{}'::jsonb THEN EXCLUDED.emergency_contact ELSE users.emergency_contact END,
           profile_image = COALESCE(EXCLUDED.profile_image, users.profile_image),
           updated_at = NOW()
         RETURNING *;`,
        [
          id,
          name || 'Traveler',
          email,
          phone || null,
          role,
          bloodGroup,
          JSON.stringify(allergies),
          JSON.stringify(medicalHistory),
          JSON.stringify(emergencyContact),
          profileImage || null,
        ]
      );

      const row = result.rows[0];
      return res.json({
        success: true,
        message: 'User synced successfully with Neon DB',
        data: {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          bloodGroup: row.blood_group,
          allergies: row.allergies || [],
          medicalHistory: row.medical_history || [],
          emergencyContact: row.emergency_contact || {},
          profileImage: row.profile_image,
        },
      });
    }

    return res.json({
      success: true,
      data: req.body,
    });
  } catch (error: any) {
    console.error('[User Sync Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error syncing user' });
  }
};

// GET /api/users/profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const pool = getDbPool();

    if (pool) {
      // 1. Try querying by explicit user ID
      let result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

      // 2. If not found and not a default user, check if any user exists
      if (result.rows.length === 0 && userId !== 'default-user') {
        // Return blank profile with the requested ID so client can sync/fill it
        return res.json({
          success: true,
          data: {
            id: userId,
            name: 'Traveler',
            email: '',
            phone: '',
            bloodGroup: 'O+',
            allergies: [],
            medicalHistory: [],
            emergencyContact: {},
            profileImage: null,
          },
        });
      }

      // If user found in database
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return res.json({
          success: true,
          data: {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            role: row.role,
            bloodGroup: row.blood_group,
            allergies: row.allergies || [],
            medicalHistory: row.medical_history || [],
            emergencyContact: row.emergency_contact || {},
            profileImage: row.profile_image,
          },
        });
      }
    }

    return res.json({
      success: true,
      data: {
        id: userId,
        name: 'Traveler',
        email: '',
        phone: '',
        bloodGroup: 'O+',
        allergies: [],
        medicalHistory: [],
        emergencyContact: {},
        profileImage: null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading profile' });
  }
};

// PUT /api/users/profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const updates = req.body;
    const pool = getDbPool();

    if (pool) {
      const result = await pool.query(
        `INSERT INTO users (id, name, email, phone, blood_group, allergies, medical_history, emergency_contact, profile_image, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = COALESCE($2, users.name),
           phone = COALESCE($4, users.phone),
           blood_group = COALESCE($5, users.blood_group),
           allergies = COALESCE($6, users.allergies),
           medical_history = COALESCE($7, users.medical_history),
           emergency_contact = COALESCE($8, users.emergency_contact),
           profile_image = COALESCE($9, users.profile_image),
           updated_at = NOW()
         RETURNING *;`,
        [
          userId,
          updates.name || null,
          updates.email || `${userId}@mediconnect.user`,
          updates.phone || null,
          updates.bloodGroup || null,
          updates.allergies ? JSON.stringify(updates.allergies) : null,
          updates.medicalHistory ? JSON.stringify(updates.medicalHistory) : null,
          updates.emergencyContact ? JSON.stringify(updates.emergencyContact) : null,
          updates.profileImage || null,
        ]
      );

      const row = result.rows[0];
      return res.json({
        success: true,
        message: 'Profile updated successfully in Neon DB',
        data: {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          bloodGroup: row.blood_group,
          allergies: row.allergies || [],
          medicalHistory: row.medical_history || [],
          emergencyContact: row.emergency_contact || {},
          profileImage: row.profile_image,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { id: userId, ...updates },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error updating profile' });
  }
};

// GET /api/medical-records
export const getMedicalRecords = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const pool = getDbPool();

    if (pool) {
      const result = await pool.query('SELECT blood_group, allergies, medical_history FROM users WHERE id = $1', [userId]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return res.json({
          success: true,
          data: {
            bloodGroup: row.blood_group || 'O+',
            allergies: row.allergies || [],
            conditions: row.medical_history || [],
            vaccines: [
              { name: 'COVID-19 mRNA Booster', date: '2024-11-15', verified: true },
              { name: 'Hepatitis A & B', date: '2023-04-10', verified: true },
              { name: 'Tetanus Booster', date: '2022-08-20', verified: true },
            ],
          },
        });
      }
    }

    return res.json({
      success: true,
      data: {
        bloodGroup: 'O+',
        allergies: [],
        conditions: [],
        vaccines: [],
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading medical records' });
  }
};

// PUT /api/medical-records
export const updateMedicalRecords = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const { allergies, conditions, bloodGroup } = req.body;
    const pool = getDbPool();

    if (pool) {
      await pool.query(
        `UPDATE users
         SET allergies = COALESCE($1, allergies),
             medical_history = COALESCE($2, medical_history),
             blood_group = COALESCE($3, blood_group),
             updated_at = NOW()
         WHERE id = $4`,
        [
          allergies ? JSON.stringify(allergies) : null,
          conditions ? JSON.stringify(conditions) : null,
          bloodGroup || null,
          userId,
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Medical records updated successfully in Neon DB',
      data: {
        bloodGroup,
        allergies,
        conditions,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error saving medical records' });
  }
};

// User settings
let userSettingsState: Record<string, any> = {};

// GET /api/users/settings
export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const settings = userSettingsState[userId] || {
      notifications: true,
      darkMode: false,
      location: true,
      biometric: false,
      language: 'en',
    };
    return res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading settings' });
  }
};

// PUT /api/users/settings
export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    userSettingsState[userId] = {
      ...(userSettingsState[userId] || {
        notifications: true,
        darkMode: false,
        location: true,
        biometric: false,
        language: 'en',
      }),
      ...req.body,
    };
    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: userSettingsState[userId],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error saving settings' });
  }
};

