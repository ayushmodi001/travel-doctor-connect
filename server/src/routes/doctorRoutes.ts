import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getSpecialties,
} from '../controllers/doctorController';

const router = Router();

router.get('/', getDoctors);
router.get('/specialties', getSpecialties);
router.get('/:id', getDoctorById);

export default router;
