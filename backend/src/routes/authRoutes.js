import express from 'express';
import { register, login, refresh, logout, me, changePassword, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Routes protégées
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);

export default router;
