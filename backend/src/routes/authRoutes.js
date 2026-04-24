import express from 'express';
import { login, me, register } from '../controllers/authController.js';
import { protectUser } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', protectUser, asyncHandler(me));

export default router;
