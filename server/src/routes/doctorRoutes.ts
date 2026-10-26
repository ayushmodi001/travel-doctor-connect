import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getSpecialties,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController';

const router = Router();

router.get('/', getDoctors);
router.get('/specialties', getSpecialties);
router.get('/:id', getDoctorById);

// Admin / Doctor Panel Routes
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;
