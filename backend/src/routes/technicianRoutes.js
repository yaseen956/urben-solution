import express from 'express';
import { earnings, loginTechnician, me, registerTechnician, updateAvailability, updateJobStatus } from '../controllers/technicianController.js';
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
router.put('/availability', protectTechnician, updateAvailability);
router.get('/earnings', protectTechnician, earnings);

export default router;
