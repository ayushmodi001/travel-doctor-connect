import { Router } from 'express';
import { assessSymptoms } from '../controllers/triageController';

const router = Router();

router.post('/assess', assessSymptoms);

export default router;
