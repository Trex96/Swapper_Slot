import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generateToken } from '../utils/jwt';
import logger from '../config/logger';
import { sendEmail, welcomeEmail } from '../config/email';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      throw new AppError('Please provide all required fields', 400);
    }
    
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }
    
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword
    });
    
    const token = generateToken(user.id.toString());
    
    logger.info(`User registered: ${user.email}`);
    
    try {
      const emailContent = welcomeEmail(trimmedName);
      await sendEmail({
        to: trimmedEmail,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
    }
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null
        },
        token
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      throw new AppError(messages.join(', '), 400);
    }
    logger.error('Registration error:', error);
    throw error;
  }
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      throw new AppError('Please provide email and password', 400);
    }
    
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const isMatch = await user.comparePassword(trimmedPassword);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }
    
    const token = generateToken(user.id.toString());
    
    logger.info(`User logged in: ${user.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          avatar: user?.avatar || null
        }
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    throw error;
  }
});