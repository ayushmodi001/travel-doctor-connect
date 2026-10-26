import { Router } from 'express';
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
} from '../controllers/storageController';

const router = Router();

router.get('/', getDocuments);
router.post('/upload', uploadDocument);
router.delete('/:id', deleteDocument);

export default router;
