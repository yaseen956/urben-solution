import express from 'express';
import { createService, getServices } from '../controllers/serviceController.js';
import { adminOnly, protectUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(getServices));
router.post('/', protectUser, adminOnly, upload.single('image'), asyncHandler(createService));

export default router;
