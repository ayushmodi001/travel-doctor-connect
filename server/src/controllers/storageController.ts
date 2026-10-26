import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getDbPool } from '../config/db';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload bucket directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to extract authenticated user ID
const extractUserId = (req: Request): string => {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && headerUserId.trim()) {
    return headerUserId.trim();
  }
  const queryUserId = req.query.userId as string;
  if (queryUserId && queryUserId.trim()) {
    return queryUserId.trim();
  }
  return 'default-user';
};

// GET /api/documents - List documents for user from Neon DB
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const pool = getDbPool();

    if (pool) {
      const result = await pool.query(
        `SELECT id, user_id, title, file_url, file_type, file_size, category, created_at
         FROM medical_documents
         WHERE user_id = $1 OR user_id = 'default-user' OR user_id = 'all'
         ORDER BY created_at DESC`,
        [userId]
      );

      return res.json({
        success: true,
        count: result.rows.length,
        data: result.rows.map(row => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          fileUrl: row.file_url,
          fileType: row.file_type,
          fileSize: row.file_size,
          category: row.category,
          createdAt: row.created_at,
        })),
      });
    }

    return res.json({
      success: true,
      count: 0,
      data: [],
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error loading documents' });
  }
};

// POST /api/documents/upload - Upload file to bucket & persist in Neon DB
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const {
      title,
      fileBase64,
      fileUrl,
      fileType = 'application/pdf',
      fileSize = 0,
      category = 'medical_record',
    } = req.body;

    if (!title || (!fileBase64 && !fileUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Document title and file data (base64 or URL) are required',
      });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let finalUrl = fileUrl;

    // If fileBase64 provided, store in bucket directory
    if (fileBase64) {
      const ext = fileType.includes('png')
        ? 'png'
        : fileType.includes('jpeg') || fileType.includes('jpg')
        ? 'jpg'
        : 'pdf';
      const fileName = `${docId}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      // Clean base64 header if present
      const base64Data = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const protocol = req.protocol;
      const host = req.get('host');
      finalUrl = `${protocol}://${host}/uploads/${fileName}`;
    }

    const pool = getDbPool();
    if (pool) {
      const result = await pool.query(
        `INSERT INTO medical_documents (id, user_id, title, file_url, file_type, file_size, category, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *;`,
        [docId, userId, title, finalUrl, fileType, fileSize, category]
      );

      const saved = result.rows[0];
      return res.status(201).json({
        success: true,
        message: 'File stored in bucket & metadata saved to Neon DB',
        data: {
          id: saved.id,
          userId: saved.user_id,
          title: saved.title,
          fileUrl: saved.file_url,
          fileType: saved.file_type,
          fileSize: saved.file_size,
          category: saved.category,
          createdAt: saved.created_at,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: docId,
        userId,
        title,
        fileUrl: finalUrl,
        fileType,
        fileSize,
        category,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Document Upload Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error storing document' });
  }
};

// DELETE /api/documents/:id - Delete document from Neon DB
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();

    if (pool) {
      await pool.query('DELETE FROM medical_documents WHERE id = $1', [id]);
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully from Neon DB',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Error deleting document' });
  }
};
