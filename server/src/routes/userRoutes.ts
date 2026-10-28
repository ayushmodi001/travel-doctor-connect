import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  syncUserProfile,
  getMedicalRecords,
  updateMedicalRecords,
  getUserSettings,
  updateUserSettings,
  getUserVitals,
  saveUserVitals,
  getAllPatients,
} from '../controllers/userController';

const router = Router();

router.get('/patients', getAllPatients);

router.post('/sync', syncUserProfile);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.patch('/profile', updateUserProfile);

router.get('/settings', getUserSettings);
router.put('/settings', updateUserSettings);

// Medical records routes
router.get('/medical-records', getMedicalRecords);
router.put('/medical-records', updateMedicalRecords);

// User vitals routes
router.get('/vitals', getUserVitals);
router.post('/vitals', saveUserVitals);

export default router;
