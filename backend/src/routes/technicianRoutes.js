import express from 'express';
import {
  createSupportTicket,
  earnings,
  loginTechnician,
  me,
  performance,
  profile,
  registerTechnician,
  updateAvailability,
  updateJobStatus,
  updateProfile
} from '../controllers/technicianController.js';
import { getTechnicianBookings } from '../controllers/bookingController.js';
import { protectTechnician } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  registerTechnician
);
router.post('/login', loginTechnician);
router.get('/me', protectTechnician, me);
router.get('/jobs', protectTechnician, getTechnicianBookings);
router.put('/status', protectTechnician, updateJobStatus);
router.patch('/status', protectTechnician, updateAvailability);
router.put('/availability', protectTechnician, updateAvailability);
router.get('/earnings', protectTechnician, earnings);
router.get('/performance', protectTechnician, performance);
router.get('/profile', protectTechnician, profile);
router.put(
  '/profile',
  protectTechnician,
  upload.fields([
    { name: 'dl', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'others', maxCount: 5 }
  ]),
  updateProfile
);
router.post('/support/ticket', protectTechnician, createSupportTicket);

export default router;
