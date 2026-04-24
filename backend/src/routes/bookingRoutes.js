import express from 'express';
import {
  addReview,
  createBooking,
  getTechnicianBookings,
  getUserBookingById,
  getUserBookings,
  requestCancellationOtp,
  updateBookingStatus,
  verifyCancellationOtp
} from '../controllers/bookingController.js';
import { protectTechnician, protectUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/', protectUser, asyncHandler(createBooking));
router.get('/user', protectUser, asyncHandler(getUserBookings));
router.get('/user/:id', protectUser, asyncHandler(getUserBookingById));
router.get('/technician', protectTechnician, asyncHandler(getTechnicianBookings));
router.patch('/:id/status', protectTechnician, asyncHandler(updateBookingStatus));
router.post('/:id/cancel/request', protectUser, asyncHandler(requestCancellationOtp));
router.post('/:id/cancel/verify', protectUser, asyncHandler(verifyCancellationOtp));
router.post('/:id/review', protectUser, asyncHandler(addReview));
router.post('/technician/:id/cancel/request', protectTechnician, asyncHandler(requestCancellationOtp));
router.post('/technician/:id/cancel/verify', protectTechnician, asyncHandler(verifyCancellationOtp));

export default router;
