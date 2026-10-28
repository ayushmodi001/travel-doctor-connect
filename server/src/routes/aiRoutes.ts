import { Router } from 'express';
import {
  translateTextAI,
  harvestPhrasesBatchAI,
  harvestDestinationAI,
  harvestMedicinesBatchAI,
  generateMedicineAI,
  getAIStatus,
} from '../controllers/aiController';

const router = Router();

router.get('/status', getAIStatus);
router.post('/translate', translateTextAI);
router.post('/harvest-phrases', harvestPhrasesBatchAI);
router.post('/harvest-destination', harvestDestinationAI);
router.post('/harvest-medicines', harvestMedicinesBatchAI);
router.post('/generate-medicine', generateMedicineAI);

export default router;
