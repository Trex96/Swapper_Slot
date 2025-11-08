import express from 'express';
import {
  register,
  login,
  getCurrentUser
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin
} from '../middleware/validator';

const router = express.Router();

router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.get('/me', protect, getCurrentUser);

export default router;