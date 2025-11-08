import express from 'express';
import {
  getAvailableSlots,
  getSlotDetails,
  createListing
} from '../controllers/marketplaceController';
import { protect } from '../middleware/auth';
import { query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

const validateMarketplaceQuery = [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('minDuration').optional().isInt({ min: 0 }).withMessage('Min duration must be a positive integer'),
  query('maxDuration').optional().isInt({ min: 0 }).withMessage('Max duration must be a positive integer'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  (req: Request, res: Response, next: NextFunction) => {
    const hasQueryParams = Object.keys(req.query).length > 0;
    if (hasQueryParams) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const messages = errors.array().map((err: any) => err.msg);
        return next(new AppError(`Validation Error: ${messages.join(', ')}`, 400));
      }
    }
    next();
  }
];

const router = express.Router();

router.get('/', protect, validateMarketplaceQuery, getAvailableSlots);
router.get('/:id', protect, getSlotDetails);
router.post('/listings', protect, createListing);

export default router;