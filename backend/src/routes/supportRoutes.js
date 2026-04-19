import express from 'express';
import { createSupportTicket } from '../controllers/technicianController.js';
import { protectTechnician } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/ticket', protectTechnician, createSupportTicket);

export default router;
