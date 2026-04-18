import express from 'express';
import { approveTechnician, listBookings, listTechnicians, listUsers, stats } from '../controllers/adminController.js';
import { adminOnly, protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectUser, adminOnly);
router.get('/stats', stats);
router.get('/users', listUsers);
router.get('/technicians', listTechnicians);
router.put('/technicians/:id/approve', approveTechnician);
router.get('/bookings', listBookings);

export default router;
