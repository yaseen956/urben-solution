import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protectUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/create-order', protectUser, asyncHandler(createOrder));
router.post('/verify-payment', protectUser, asyncHandler(verifyPayment));

export default router;
