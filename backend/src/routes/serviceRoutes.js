import express from 'express';
import { createService, getServices } from '../controllers/serviceController.js';
import { adminOnly, protectUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getServices);
router.post('/', protectUser, adminOnly, upload.single('image'), createService);

export default router;
