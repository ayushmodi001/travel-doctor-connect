import { Router } from 'express';
import {
  getTravelHub,
  getMedicalPhrases,
  translateCustomText,
  getMedicineEquivalents,
  getTravelInsurance,
  createDestination,
  deleteDestination,
} from '../controllers/travelController';

const router = Router();

router.get('/hub', getTravelHub);
router.post('/destinations', createDestination);
router.delete('/destinations/:code', deleteDestination);
router.get('/phrases', getMedicalPhrases);
router.post('/translate', translateCustomText);
router.get('/medicines', getMedicineEquivalents);
router.get('/insurance', getTravelInsurance);

export default router;
