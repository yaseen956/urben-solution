import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protectUser, createOrder);
router.post('/verify-payment', protectUser, verifyPayment);

export default router;
