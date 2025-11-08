import { Request, Response, NextFunction } from 'express';
import { Error } from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastError = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err: any) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Validation Error: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token expired. Please log in again.', 401);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with more details
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  let error = { ...err };
  error.message = err.message;

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Default to 500 if no status code is set
  const status = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prevent sending response twice
  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure the promise is properly handled
    Promise.resolve(fn(req, res, next)).catch((error: any) => {
      // Log the error before passing to next middleware
      console.error('Async handler error:', error);
      next(error);
    });
  };
};