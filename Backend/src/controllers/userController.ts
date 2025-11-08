import { Request, Response } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import SwapRequest from '../models/SwapRequest';
import SwapHistory from '../models/SwapHistory';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [
      totalEvents,
      totalSwaps,
      pendingRequests,
      swappableEvents
    ] = await Promise.all([
      Event.countDocuments({ userId }),
      SwapHistory.countDocuments({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      }),
      SwapRequest.countDocuments({
        $or: [{ requesterId: userId }, { targetUserId: userId }],
        status: 'PENDING'
      }),
      Event.countDocuments({ userId, status: 'SWAPPABLE' })
    ]);
    
    res.json({
      success: true,
      data: {
        totalEvents,
        totalSwaps,
        pendingRequests,
        swappableEvents
      }
    });
  } catch (error) {
    throw error;
  }
};

export const exportUserData = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const [user, events, swapRequests, swapHistory] = await Promise.all([
      User.findById(userId).select('-password'),
      Event.find({ userId }),
      SwapRequest.find({
        $or: [{ requesterId: userId }, { targetUserId: userId }]
      }),
      SwapHistory.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      })
    ]);
    
    const exportData = {
      user,
      events,
      swapRequests,
      swapHistory,
      exportedAt: new Date()
    };
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    throw error;
  }
};