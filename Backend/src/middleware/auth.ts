import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AppError } from './errorHandler';
import { env } from '../config/env';


declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}


export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {

    const authHeader = req.headers.authorization;
    let token: string | undefined;
    

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }
    

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }
    

    const decoded: any = jwt.verify(token, env.JWT_SECRET);
    

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }
    

    req.user = user;
    

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Access denied. No user found.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    
    next();
  };
};