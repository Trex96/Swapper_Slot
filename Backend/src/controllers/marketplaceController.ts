import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';
import { AppError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';

export const getAvailableSlots = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    return next(new AppError('User not authenticated', 401));
  }
  
  const {
    search,
    startDate,
    endDate,
    minDuration,
    maxDuration,
    page = 1,
    limit = 20
  } = req.query;
  
  const query: any = {
    status: 'SWAPPABLE',
    userId: { $ne: userId }
  };
  
  if (search && typeof search === 'string' && search.trim() !== '') {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } }
    ];
  }
  
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        query.startTime.$gte = start;
      } else {
        return next(new AppError('Invalid start date format', 400));
      }
    }
    if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        query.startTime.$lte = end;
      } else {
        return next(new AppError('Invalid end date format', 400));
      }
    }
  }
  
  let allMatchingEvents = await Event.find(query).populate('userId', 'name email');
  
  if (minDuration || maxDuration) {
    const minDur = minDuration ? Number(minDuration) : 0;
    const maxDur = maxDuration ? Number(maxDuration) : Infinity;
    
    if (isNaN(minDur) || minDur < 0) {
      return next(new AppError('Min duration must be a positive number', 400));
    }
    
    if (maxDuration && (isNaN(maxDur) || maxDur < 0)) {
      return next(new AppError('Max duration must be a positive number', 400));
    }
    
    allMatchingEvents = allMatchingEvents.filter(event => {
      const duration = Math.floor((event.endTime.getTime() - event.startTime.getTime()) / 60000);
      return duration >= minDur && duration <= maxDur;
    });
  }
  
  const totalCount = allMatchingEvents.length;
  const totalPages = Math.ceil(totalCount / Number(limit));
  const currentPage = Number(page);
  const skip = (currentPage - 1) * Number(limit);
  
  const paginatedEvents = allMatchingEvents.slice(skip, skip + Number(limit));
  
  res.status(200).json({
    success: true,
    count: paginatedEvents.length,
    totalPages,
    currentPage,
    data: paginatedEvents
  });
});

export const getSlotDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?._id;
  const eventId = req.params.id;
  
  const event = await Event.findById(eventId).populate('userId', 'name email');
  
  if (!event) {
    return next(new AppError('Event not found', 404));
  }
  
  if (event.status !== 'SWAPPABLE') {
    return next(new AppError('Event is not swappable', 400));
  }
  
  if (event.userId.toString() === userId?.toString()) {
    return next(new AppError('Cannot view own event in marketplace', 400));
  }
  
  res.status(200).json({
    success: true,
    data: event
  });
});

export const createListing = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(201).json({
    success: true,
    data: {}
  });
});