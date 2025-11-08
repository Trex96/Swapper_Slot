import express from 'express';
import {
  getIncomingRequests,
  getOutgoingRequests,
  createSwapRequest,
  acceptSwapRequest,
  rejectSwapRequest,
  cancelSwapRequest
} from '../controllers/swapRequestController';
import { protect } from '../middleware/auth';
import {
  validateSwapRequestCreation,
  validateIdParam
} from '../middleware/validator';

const router = express.Router();

router.get('/incoming', protect, getIncomingRequests);
router.get('/outgoing', protect, getOutgoingRequests);
router.post('/', protect, validateSwapRequestCreation, createSwapRequest);
router.patch('/:id/accept', protect, validateIdParam, acceptSwapRequest);
router.patch('/:id/reject', protect, validateIdParam, rejectSwapRequest);
router.delete('/:id', protect, validateIdParam, cancelSwapRequest);

export default router;