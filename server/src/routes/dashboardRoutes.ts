import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';

const router = Router();

router.get('/', getDashboardSummary);

export default router;
