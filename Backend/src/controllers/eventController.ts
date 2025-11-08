import { Request, Response } from 'express';
import Event, { IEvent } from '../models/Event';
import SwapRequest from '../models/SwapRequest';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import logger from '../config/logger';
import { checkEventConflict, getConflictingEvents } from '../services/conflictService';
import { emitEventCreated, emitEventUpdated, emitEventDeleted } from '../socket/socketHandler';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new AppError('Request timeout', 408)), ms)
  );
  return Promise.race<T>([promise, timeout]) as Promise<T>;
};

export const getEvents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { status, startDate, endDate, sort = 'startTime', order = 'asc' } = req.query;
    
    const query: any = { userId };
    
    if (status && ['BUSY', 'SWAPPABLE', 'SWAPPED'].includes(status as string)) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate as string);
      }
    }
    
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;
    
    const events = await withTimeout(
      Event.find(query)
        .populate('userId', 'name email avatar')
        .sort(sortObj),
      10000
    );
    
    logger.info(`Retrieved ${events.length} events for user ${userId}`);
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error: any) {
    logger.error('Error in getEvents:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve events', 500);
  }
});

export const getEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await withTimeout(
      Event.findById(req.params.id).populate('userId', 'name email avatar'),
      10000
    );
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    const eventUserId = event.userId.toString();
    const reqUserId = req.user?._id?.toString();
    
    if (eventUserId !== reqUserId) {
      throw new AppError('Not authorized to access this event', 403);
    }
    
    logger.info(`Retrieved event ${event._id} for user ${reqUserId}`);
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error: any) {
    logger.error('Error in getEvent:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve event', 500);
  }
});

export const createEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, startTime, endTime, status } = req.body;
    const userId = req.user?._id;
    
    if (!title || !startTime || !endTime) {
      throw new AppError('Title, startTime, and endTime are required', 400);
    }
    
    const trimmedTitle = title?.trim();
    const trimmedDescription = description?.trim();
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400);
    }
    
    if (start >= end) {
      throw new AppError('End time must be after start time', 400);
    }
    
    const hasConflict = await withTimeout(
      checkEventConflict(
        userId!.toString(),
        start,
        end
      ),
      10000
    );
    
    if (hasConflict) {
      const conflicts = await withTimeout(
        getConflictingEvents(
          userId!.toString(),
          start,
          end
        ),
        10000
      );
      
      throw new AppError(`Event conflicts with existing event(s): ${conflicts.map((c: any) => c.title).join(', ')}`, 400);
    }
    
    const event = await withTimeout(
      Event.create({
        title: trimmedTitle,
        description: trimmedDescription,
        startTime: start,
        endTime: end,
        status,
        userId
      }),
      10000
    );
    
    const populatedEvent = await withTimeout(
      Event.findById(event._id).populate('userId', 'name email avatar'),
      10000
    );
    
    logger.info(`Created event ${event._id} for user ${userId}`);
    
    if (req.app.locals.io) {
      try {
        logger.info(`About to emit eventCreated for event ${event._id} to user ${userId!.toString()}`);
        emitEventCreated(req.app.locals.io, userId!.toString(), {
          event: populatedEvent,
          message: 'New event created'
        });
        logger.info(`Emitted eventCreated for event ${event._id} to user ${userId!.toString()}`);
      } catch (emitError) {
        logger.error('Error emitting eventCreated:', emitError);
      }
    }
    
    res.status(201).json({
      success: true,
      data: populatedEvent
    });
  } catch (error: any) {
    logger.error('Error in createEvent:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create event', 500);
  }
});

export const updateEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await withTimeout(
      Event.findById(req.params.id),
      10000
    );
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    if (event.userId.toString() !== req.user?._id?.toString()) {
      throw new AppError('Not authorized to update this event', 403);
    }
    
    const { startTime, endTime } = req.body;
    let start = event.startTime;
    let end = event.endTime;
    
    if (startTime || endTime) {
      start = startTime ? new Date(startTime) : event.startTime;
      end = endTime ? new Date(endTime) : event.endTime;
      
      if (startTime && isNaN(start.getTime())) {
        throw new AppError('Invalid startTime format', 400);
      }
      
      if (endTime && isNaN(end.getTime())) {
        throw new AppError('Invalid endTime format', 400);
      }
      
      if (start >= end) {
        throw new AppError('End time must be after start time', 400);
      }
      
      const hasConflict = await withTimeout(
        checkEventConflict(
          req.user?._id!.toString(),
          start,
          end,
          event._id ? (event._id as any).toString() : undefined
        ),
        10000
      );
      
      if (hasConflict) {
        const conflicts = await withTimeout(
          getConflictingEvents(
            req.user?._id!.toString(),
            start,
            end
          ),
          10000
        );
        
        const filteredConflicts = conflicts.filter((c: any) => 
          event._id && c._id.toString() !== (event._id as any).toString());
        
        if (filteredConflicts.length > 0) {
          throw new AppError(`Event conflicts with existing event(s): ${filteredConflicts.map((c: any) => c.title).join(', ')}`, 400);
        }
      }
    }
    
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
        if (typeof req.body[key] === 'string') {
          (event as any)[key] = req.body[key].trim();
        } else {
          (event as any)[key] = req.body[key];
        }
      }
    });
    
    await withTimeout(event.save(), 10000);
    
    const populatedEvent = await withTimeout(
      Event.findById(event._id).populate('userId', 'name email avatar'),
      10000
    );
    
    logger.info(`Updated event ${event._id} for user ${req.user?._id}`);
    
    if (req.app.locals.io) {
      try {
        logger.info(`About to emit eventUpdated for event ${event._id} to user ${req.user?._id!.toString()}`);
        emitEventUpdated(req.app.locals.io, req.user?._id!.toString(), {
          event: populatedEvent,
          message: 'Event updated'
        });
        logger.info(`Emitted eventUpdated for event ${event._id} to user ${req.user?._id!.toString()}`);
      } catch (emitError) {
        logger.error('Error emitting eventUpdated:', emitError);
      }
    }
    
    res.status(200).json({
      success: true,
      data: populatedEvent
    });
  } catch (error: any) {
    logger.error('Error in updateEvent:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to update event', 500);
  }
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await withTimeout(
      Event.findById(req.params.id),
      10000
    );
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    if (event.userId.toString() !== req.user?._id?.toString()) {
      throw new AppError('Not authorized to delete this event', 403);
    }
    
    const pendingSwapRequest = await withTimeout(
      SwapRequest.findOne({
        $or: [
          { requesterEventId: event._id },
          { targetEventId: event._id }
        ],
        status: 'PENDING'
      }),
      10000
    );
    
    if (pendingSwapRequest) {
      throw new AppError('Cannot delete event with pending swap requests', 400);
    }
    
    await withTimeout(
      Event.findByIdAndDelete(req.params.id),
      10000
    );
    
    logger.info(`Deleted event ${event._id} for user ${req.user?._id}`);
    
    if (req.app.locals.io) {
      try {
        logger.info(`About to emit eventDeleted for event ${event._id} to user ${req.user?._id!.toString()}`);
        emitEventDeleted(req.app.locals.io, req.user?._id!.toString(), {
          eventId: event._id,
          message: 'Event deleted'
        });
        logger.info(`Emitted eventDeleted for event ${event._id} to user ${req.user?._id!.toString()}`);
      } catch (emitError) {
        logger.error('Error emitting eventDeleted:', emitError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error in deleteEvent:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to delete event', 500);
  }
});

export const markEventAsSwappable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await withTimeout(
      Event.findById(req.params.id),
      10000
    );
    
    if (!event) {
      throw new AppError('Event not found', 404);
    }
    
    if (event.userId.toString() !== req.user?._id?.toString()) {
      throw new AppError('Not authorized to update this event', 403);
    }
    
    if (event.status === 'SWAPPABLE') {
      throw new AppError('Event is already swappable', 400);
    }
    
    event.status = 'SWAPPABLE';
    
    await withTimeout(event.save(), 10000);
    
    const populatedEvent = await withTimeout(
      Event.findById(event._id).populate('userId', 'name email avatar'),
      10000
    );
    
    logger.info(`Marked event ${event._id} as swappable for user ${req.user?._id}`);
    
    if (req.app.locals.io) {
      try {
        emitEventUpdated(req.app.locals.io, req.user?._id!.toString(), {
          event: populatedEvent,
          message: 'Event marked as swappable'
        });
      } catch (emitError) {
        logger.error('Error emitting eventUpdated:', emitError);
      }
    }
    
    res.status(200).json({
      success: true,
      data: populatedEvent
    });
  } catch (error: any) {
    logger.error('Error in markEventAsSwappable:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to mark event as swappable', 500);
  }
});
