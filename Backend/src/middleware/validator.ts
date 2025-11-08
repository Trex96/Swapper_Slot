import { body, validationResult, param } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => (err as any).msg);
    throw new AppError(`Validation Error: ${messages.join(', ')}`, 400);
  }
  next();
};

export const validateUserRegistration = [
  body('name').notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

export const validateUserLogin = [
  body('email').isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const validateEventCreation = [
  body('title').notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('startTime').isISO8601().withMessage('Start time must be a valid date'),
  body('endTime').isISO8601().withMessage('End time must be a valid date'),
  validate
];

export const validateSwapRequestCreation = [
  body('targetEventId').notEmpty().withMessage('Target event ID is required')
    .isMongoId().withMessage('Target event ID must be a valid MongoDB ID'),
  body('requesterEventId').notEmpty().withMessage('Requester event ID is required')
    .isMongoId().withMessage('Requester event ID must be a valid MongoDB ID'),
  validate
];

export const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate
];