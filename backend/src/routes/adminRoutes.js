import express from 'express';
import { approveTechnician, listBookings, listTechnicians, listUsers, stats } from '../controllers/adminController.js';
import { adminOnly, protectUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protectUser, adminOnly);
router.get('/stats', asyncHandler(stats));
router.get('/users', asyncHandler(listUsers));
router.get('/technicians', asyncHandler(listTechnicians));
router.put('/technicians/:id/approve', asyncHandler(approveTechnician));
router.get('/bookings', asyncHandler(listBookings));

export default router;
