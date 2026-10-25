import { Router } from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from '../controllers/appointmentController';

const router = Router();

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id', updateAppointmentStatus);

export default router;
