import express from 'express';
import { addReview, createBooking, getTechnicianBookings, getUserBookingById, getUserBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { protectTechnician, protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protectUser, createBooking);
router.get('/user', protectUser, getUserBookings);
router.get('/user/:id', protectUser, getUserBookingById);
router.get('/technician', protectTechnician, getTechnicianBookings);
router.patch('/:id/status', protectTechnician, updateBookingStatus);
router.post('/:id/review', protectUser, addReview);

export default router;
