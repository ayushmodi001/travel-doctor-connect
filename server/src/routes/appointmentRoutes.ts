import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  getVideoSession,
} from '../controllers/appointmentController';

const router = Router();

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.patch('/:id', updateAppointmentStatus);
router.get('/:id/video-token', getVideoSession);

export default router;
