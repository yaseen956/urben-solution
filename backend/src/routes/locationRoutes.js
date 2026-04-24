import express from 'express';
import { updateLiveLocation } from '../controllers/technicianController.js';
import { protectTechnician } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/update', protectTechnician, asyncHandler(updateLiveLocation));

export default router;
