import express from 'express';
import {
  createSupportTicket,
  earnings,
  loginTechnician,
  me,
  nearbyTechnicians,
  performance,
  profile,
  registerTechnician,
  updateLiveLocation,
  updateAvailability,
  updateJobStatus,
  updateProfile
} from '../controllers/technicianController.js';
import { getTechnicianBookings } from '../controllers/bookingController.js';
import { protectTechnician } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  asyncHandler(registerTechnician)
);
router.post('/login', asyncHandler(loginTechnician));
router.get('/nearby', asyncHandler(nearbyTechnicians));
router.get('/me', protectTechnician, asyncHandler(me));
router.get('/jobs', protectTechnician, asyncHandler(getTechnicianBookings));
router.put('/status', protectTechnician, asyncHandler(updateJobStatus));
router.patch('/status', protectTechnician, asyncHandler(updateAvailability));
router.put('/availability', protectTechnician, asyncHandler(updateAvailability));
router.get('/earnings', protectTechnician, asyncHandler(earnings));
router.get('/performance', protectTechnician, asyncHandler(performance));
router.get('/profile', protectTechnician, asyncHandler(profile));
router.put(
  '/profile',
  protectTechnician,
  upload.fields([
    { name: 'dl', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'others', maxCount: 5 }
  ]),
  asyncHandler(updateProfile)
);
router.post('/support/ticket', protectTechnician, asyncHandler(createSupportTicket));
router.post('/location/update', protectTechnician, asyncHandler(updateLiveLocation));

export default router;
