import express from 'express';
import { addReview, createBooking, getTechnicianBookings, getUserBookings } from '../controllers/bookingController.js';
import { protectTechnician, protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protectUser, createBooking);
router.get('/user', protectUser, getUserBookings);
router.get('/technician', protectTechnician, getTechnicianBookings);
router.post('/:id/review', protectUser, addReview);

export default router;
