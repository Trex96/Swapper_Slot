import express from 'express';
import { protect } from '../middleware/auth';
import { getUserStats, exportUserData } from '../controllers/userController';

const router = express.Router();

router.use(protect);

router.get('/stats', getUserStats);
router.get('/export', exportUserData);

export default router;