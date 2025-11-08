import { Request, Response } from 'express';
import SwapRequest, { ISwapRequest } from '../models/SwapRequest';
import Event from '../models/Event';
import SwapHistory from '../models/SwapHistory';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import mongoose from 'mongoose';
import { emitSwapRequest, emitSwapAccepted, emitSwapRejected, emitEventUpdated } from '../socket/socketHandler';
import { sendEmail, swapRequestEmail, swapAcceptedEmail, swapRejectedEmail } from '../config/email';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const getEventTitle = (event: any): string => {
  if (!event) return '';
  return typeof event === 'object' && 'title' in event ? event.title : '';
};

export const getIncomingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const requests = await SwapRequest.find({
      targetUserId: userId,
      status: 'PENDING'
    })
      .populate('requesterId', 'name email avatar')
      .populate('requesterEventId')
      .populate('targetUserId', 'name email avatar')
      .populate('targetEventId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    logger.error('Error in getIncomingRequests:', error);
    throw error;
  }
};

export const getOutgoingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const requests = await SwapRequest.find({
      requesterId: userId
    })
      .populate('requesterId', 'name email avatar')
      .populate('requesterEventId')
      .populate('targetUserId', 'name email avatar')
      .populate('targetEventId')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    logger.error('Error in getOutgoingRequests:', error);
    throw error;
  }
};

export const createSwapRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { targetEventId, requesterEventId } = req.body;
    const requesterId = req.user?._id;
    const requesterName = req.user?.name;
    
    logger.info('Creating swap request:', { targetEventId, requesterEventId, requesterId });
    
    if (targetEventId === requesterEventId) {
      throw new AppError('Cannot swap a slot with itself. Please select different slots.', 400);
    }
    
    const requesterEvent = await Event.findById(requesterEventId);
    const targetEvent = await Event.findById(targetEventId);
    
    if (!requesterEvent) {
      throw new AppError('Requester event not found', 404);
    }
    
    if (requesterEvent.userId.toString() !== requesterId?.toString()) {
      throw new AppError('Not authorized to create swap request for this event', 403);
    }
    
    if (requesterEvent.status !== 'SWAPPABLE') {
      throw new AppError('Your event must be swappable', 400);
    }
    
    if (!targetEvent) {
      throw new AppError('Target event not found', 404);
    }
    
    if (targetEvent.status !== 'SWAPPABLE') {
      throw new AppError('Target event is not swappable', 400);
    }
    
    if (targetEvent.userId.toString() === requesterId?.toString()) {
      throw new AppError('Cannot swap with yourself', 400);
    }
    
    const existingRequest = await SwapRequest.findOne({
      requesterEventId,
      targetEventId,
      status: 'PENDING'
    });
    
    if (existingRequest) {
      throw new AppError('Swap request already exists', 400);
    }
    
    const targetUserId = targetEvent.userId;
    logger.info(`Target user ID for swap request: ${targetUserId.toString()}`);
    
    const swapRequest = await SwapRequest.create({
      requesterId,
      requesterEventId,
      targetUserId,
      targetEventId,
      status: 'PENDING'
    });
    
    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email avatar')
      .populate('requesterEventId')
      .populate('targetUserId', 'name email avatar')
      .populate('targetEventId');
    
        if (req.app.locals.io) {
      try {
        logger.info(`About to emit newSwapRequest to user ${targetUserId.toString()}`);
        logger.info(`Swap request details:`, {
          requesterId: requesterId?.toString(),
          targetUserId: targetUserId.toString(),
          requesterEventId: requesterEventId,
          targetEventId: targetEventId
        });
        logger.info(`Verifying target user room exists before emitting`);
        const roomExists = req.app.locals.io.sockets.adapter.rooms.has(`user:${targetUserId.toString()}`);
        logger.info(`Room user:${targetUserId.toString()} exists: ${roomExists}`);
        if (roomExists) {
          const socketsInRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${targetUserId.toString()}`);
          logger.info(`Number of sockets in room: ${socketsInRoom?.size || 0}`);
          logger.info(`Socket IDs in room: ${socketsInRoom ? Array.from(socketsInRoom).join(', ') : 'None'}`);
        }
        
        logger.info(`Socket.io instance verification: ${req.app.locals.io ? 'Available' : 'Not available'}`);
        if (req.app.locals.io) {
          logger.info(`Socket.io engine: ${req.app.locals.io.engine ? 'Available' : 'Not available'}`);
          logger.info(`Socket.io sockets count: ${req.app.locals.io.sockets ? req.app.locals.io.sockets.sockets.size : 'Unknown'}`);
        }
        
        emitSwapRequest(req.app.locals.io, targetUserId.toString(), {
          swapRequest: populatedRequest,
          message: `${requesterName} sent you a swap request`
        });
        logger.info(`Emitted newSwapRequest to user ${targetUserId.toString()}`);
      } catch (emitError) {
        logger.error('Error emitting swapRequest:', emitError);
      }
    } else {
      logger.warn('Socket.io instance not available in app.locals');
    }
    
    try {
      const targetUser = await mongoose.model('User').findById(targetUserId);
      if (targetUser && targetUser.email && populatedRequest) {
        const eventTitle = getEventTitle(populatedRequest.targetEventId);
        const emailContent = swapRequestEmail(requesterName || 'Someone', eventTitle);
        await sendEmail({
          to: targetUser.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
      }
    } catch (emailError) {
      logger.error('Failed to send email notification:', emailError);
    }
    
    res.status(201).json({
      success: true,
      data: populatedRequest
    });
  } catch (error: any) {
    logger.error('Error in createSwapRequest:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      throw new AppError(messages.join(', '), 400);
    }
    throw error;
  }
};

export const acceptSwapRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const requestId = req.params.id;
    const userName = req.user?.name;
    
    const swapRequest = await SwapRequest.findById(requestId);
    
    if (!swapRequest) {
      throw new AppError('Swap request not found', 404);
    }
    
    if (swapRequest.targetUserId.toString() !== userId?.toString()) {
      throw new AppError('Not authorized', 403);
    }
    
    if (swapRequest.status !== 'PENDING') {
      throw new AppError('Request already processed', 400);
    }
    
    const requesterEvent = await Event.findById(swapRequest.requesterEventId).populate('userId', 'name email');
    const targetEvent = await Event.findById(swapRequest.targetEventId).populate('userId', 'name email');
    
    if (!requesterEvent || !targetEvent) {
      throw new AppError('One or both events not found', 404);
    }
    
    if (requesterEvent.status !== 'SWAPPABLE' || targetEvent.status !== 'SWAPPABLE') {
      throw new AppError('One or both events are no longer swappable', 400);
    }
    
    const requesterUser = requesterEvent.userId as any;
    const targetUser = targetEvent.userId as any;
    
    if (requesterUser && targetUser) {
      (requesterEvent as any).originalOwnerObject = {
        id: requesterUser._id?.toString() || requesterUser.id,
        name: requesterUser.name,
        email: requesterUser.email
      };
      
      (targetEvent as any).originalOwnerObject = {
        id: targetUser._id?.toString() || targetUser.id,
        name: targetUser.name,
        email: targetUser.email
      };
    }
    
    requesterEvent.userId = swapRequest.targetUserId as any;
    targetEvent.userId = swapRequest.requesterId as any;
    
    requesterEvent.status = 'SWAPPED';
    targetEvent.status = 'SWAPPED';
    
    requesterEvent.originalEventId = swapRequest.targetEventId;
    targetEvent.originalEventId = swapRequest.requesterEventId;
    
    await Promise.all([
      requesterEvent.save(),
      targetEvent.save()
    ]);
    
    swapRequest.status = 'ACCEPTED';
    await swapRequest.save();
    
    await SwapHistory.create({
      user1Id: swapRequest.requesterId,
      user1EventId: swapRequest.requesterEventId,
      user1EventSnapshot: requesterEvent.toObject(),
      user2Id: swapRequest.targetUserId,
      user2EventId: swapRequest.targetEventId,
      user2EventSnapshot: targetEvent.toObject(),
      swapRequestId: swapRequest._id
    });
    
    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email avatar')
      .populate('requesterEventId')
      .populate('targetUserId', 'name email avatar')
      .populate('targetEventId');
    
    const updatedRequesterEvent = await Event.findById(requesterEvent._id)
      .populate('userId', 'name email avatar');
    
    const updatedTargetEvent = await Event.findById(targetEvent._id)
      .populate('userId', 'name email avatar');
    
    if (req.app.locals.io) {
      try {
        logger.info(`About to emit swapAccepted events for swap request ${swapRequest._id}`);
        logger.info(`Swap acceptance details:`, {
          requestId: swapRequest._id,
          requesterId: swapRequest.requesterId.toString(),
          targetUserId: swapRequest.targetUserId.toString(),
          requesterEventId: swapRequest.requesterEventId.toString(),
          targetEventId: swapRequest.targetEventId.toString()
        });
        logger.info(`Socket.io instance verification: ${req.app.locals.io ? 'Available' : 'Not available'}`);
        if (req.app.locals.io) {
          logger.info(`Socket.io engine: ${req.app.locals.io.engine ? 'Available' : 'Not available'}`);
          logger.info(`Socket.io sockets count: ${req.app.locals.io.sockets ? req.app.locals.io.sockets.sockets.size : 'Unknown'}`);
        }
        logger.info(`Verifying requester room exists before emitting swapAccepted`);
        const requesterRoomExists = req.app.locals.io.sockets.adapter.rooms.has(`user:${swapRequest.requesterId.toString()}`);
        logger.info(`Room user:${swapRequest.requesterId.toString()} exists: ${requesterRoomExists}`);
        if (requesterRoomExists) {
          const socketsInRequesterRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.requesterId.toString()}`);
          logger.info(`Number of sockets in requester room: ${socketsInRequesterRoom?.size || 0}`);
          logger.info(`Socket IDs in requester room: ${socketsInRequesterRoom ? Array.from(socketsInRequesterRoom).join(', ') : 'None'}`);
        }
        emitSwapAccepted(req.app.locals.io, swapRequest.requesterId.toString(), {
          swapRequest: populatedRequest,
          message: `${userName} accepted your swap request`
        });
        logger.info(`Emitted swapAccepted to requester ${swapRequest.requesterId.toString()}`);
        
        logger.info(`Verifying target user room exists before emitting swapAccepted`);
        const targetRoomExists = req.app.locals.io.sockets.adapter.rooms.has(`user:${swapRequest.targetUserId.toString()}`);
        logger.info(`Room user:${swapRequest.targetUserId.toString()} exists: ${targetRoomExists}`);
        if (targetRoomExists) {
          const socketsInTargetRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.targetUserId.toString()}`);
          logger.info(`Number of sockets in target room: ${socketsInTargetRoom?.size || 0}`);
          logger.info(`Socket IDs in target room: ${socketsInTargetRoom ? Array.from(socketsInTargetRoom).join(', ') : 'None'}`);
        }
        emitSwapAccepted(req.app.locals.io, swapRequest.targetUserId.toString(), {
          swapRequest: populatedRequest,
          message: `You accepted ${requesterUser?.name || 'someone'}'s swap request`
        });
        logger.info(`Emitted swapAccepted to target user ${swapRequest.targetUserId.toString()}`);
        
        logger.info(`About to emit eventUpdated events for swap request ${swapRequest._id}`);
        logger.info(`Event update details:`, {
          requesterEventId: updatedRequesterEvent?.id,
          targetEventId: updatedTargetEvent?.id
        });
        logger.info(`Verifying requester room exists before emitting eventUpdated`);
        if (requesterRoomExists) {
          const socketsInRequesterRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.requesterId.toString()}`);
          logger.info(`Number of sockets in requester room: ${socketsInRequesterRoom?.size || 0}`);
          logger.info(`Socket IDs in requester room: ${socketsInRequesterRoom ? Array.from(socketsInRequesterRoom).join(', ') : 'None'}`);
        }
        emitEventUpdated(req.app.locals.io, swapRequest.requesterId.toString(), {
          event: updatedRequesterEvent,
          message: 'Your event has been swapped'
        });
        logger.info(`Emitted eventUpdated to requester ${swapRequest.requesterId.toString()}`);
        
        logger.info(`Verifying target user room exists before emitting eventUpdated`);
        if (targetRoomExists) {
          const socketsInTargetRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.targetUserId.toString()}`);
          logger.info(`Number of sockets in target room: ${socketsInTargetRoom?.size || 0}`);
          logger.info(`Socket IDs in target room: ${socketsInTargetRoom ? Array.from(socketsInTargetRoom).join(', ') : 'None'}`);
        }
        emitEventUpdated(req.app.locals.io, swapRequest.targetUserId.toString(), {
          event: updatedTargetEvent,
          message: 'Your event has been swapped'
        });
        logger.info(`Emitted eventUpdated to target user ${swapRequest.targetUserId.toString()}`);
      } catch (emitError) {
        logger.error('Error emitting swapAccepted or eventUpdated:', emitError);
      }
    } else {
      logger.warn('Socket.io instance not available in app.locals');
    }
    
    try {
      const requesterUser = await mongoose.model('User').findById(swapRequest.requesterId);
      if (requesterUser && requesterUser.email && populatedRequest) {
        const eventTitle = getEventTitle(populatedRequest.targetEventId);
        const emailContent = swapAcceptedEmail(userName || 'Someone', eventTitle);
        await sendEmail({
          to: requesterUser.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
      }
    } catch (emailError) {
      logger.error('Failed to send email notification:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Swap completed successfully',
      data: {
        swapRequest: populatedRequest,
        swappedEvents: [updatedRequesterEvent, updatedTargetEvent]
      }
    });
  } catch (error) {
    logger.error('Error in acceptSwapRequest:', error);
    throw error;
  }
};

export const rejectSwapRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const requestId = req.params.id;
    const userName = req.user?.name;
    
    const swapRequest = await SwapRequest.findById(requestId);
    
    if (!swapRequest) {
      throw new AppError('Swap request not found', 404);
    }
    
    if (swapRequest.targetUserId.toString() !== userId?.toString()) {
      throw new AppError('Not authorized', 403);
    }
    
    if (swapRequest.status !== 'PENDING') {
      throw new AppError('Request already processed', 400);
    }
    
    swapRequest.status = 'REJECTED';
    await swapRequest.save();
    
    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email avatar')
      .populate('requesterEventId')
      .populate('targetUserId', 'name email avatar')
      .populate('targetEventId');
    
    const requesterUser = await mongoose.model('User').findById(swapRequest.requesterId);
    
    if (req.app.locals.io) {
      try {
        logger.info(`About to emit swapRejected events for swap request ${swapRequest._id}`);
        logger.info(`Swap rejection details:`, {
          requestId: swapRequest._id,
          requesterId: swapRequest.requesterId.toString(),
          targetUserId: swapRequest.targetUserId.toString(),
          requesterEventId: swapRequest.requesterEventId.toString(),
          targetEventId: swapRequest.targetEventId.toString()
        });
        logger.info(`Socket.io instance verification: ${req.app.locals.io ? 'Available' : 'Not available'}`);
        if (req.app.locals.io) {
          logger.info(`Socket.io engine: ${req.app.locals.io.engine ? 'Available' : 'Not available'}`);
          logger.info(`Socket.io sockets count: ${req.app.locals.io.sockets ? req.app.locals.io.sockets.sockets.size : 'Unknown'}`);
        }
        logger.info(`Verifying requester room exists before emitting swapRejected`);
        const requesterRoomExists = req.app.locals.io.sockets.adapter.rooms.has(`user:${swapRequest.requesterId.toString()}`);
        logger.info(`Room user:${swapRequest.requesterId.toString()} exists: ${requesterRoomExists}`);
        if (requesterRoomExists) {
          const socketsInRequesterRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.requesterId.toString()}`);
          logger.info(`Number of sockets in requester room: ${socketsInRequesterRoom?.size || 0}`);
          logger.info(`Socket IDs in requester room: ${socketsInRequesterRoom ? Array.from(socketsInRequesterRoom).join(', ') : 'None'}`);
        }
        emitSwapRejected(req.app.locals.io, swapRequest.requesterId.toString(), {
          swapRequest: populatedRequest,
          message: `${userName} rejected your swap request`
        });
        logger.info(`Emitted swapRejected to requester ${swapRequest.requesterId.toString()}`);
        
        if (requesterUser) {
          logger.info(`Verifying target user room exists before emitting swapRejected`);
          const targetRoomExists = req.app.locals.io.sockets.adapter.rooms.has(`user:${swapRequest.targetUserId.toString()}`);
          logger.info(`Room user:${swapRequest.targetUserId.toString()} exists: ${targetRoomExists}`);
          if (targetRoomExists) {
            const socketsInTargetRoom = req.app.locals.io.sockets.adapter.rooms.get(`user:${swapRequest.targetUserId.toString()}`);
            logger.info(`Number of sockets in target room: ${socketsInTargetRoom?.size || 0}`);
            logger.info(`Socket IDs in target room: ${socketsInTargetRoom ? Array.from(socketsInTargetRoom).join(', ') : 'None'}`);
          }
          emitSwapRejected(req.app.locals.io, swapRequest.targetUserId.toString(), {
            swapRequest: populatedRequest,
            message: `You rejected ${requesterUser.name}'s swap request`
          });
          logger.info(`Emitted swapRejected to target user ${swapRequest.targetUserId.toString()}`);
        }
      } catch (emitError) {
        logger.error('Error emitting swapRejected:', emitError);
      }
    } else {
      logger.warn('Socket.io instance not available in app.locals');
    }
    
    try {
      const requesterUser = await mongoose.model('User').findById(swapRequest.requesterId);
      if (requesterUser && requesterUser.email && populatedRequest) {
        const eventTitle = getEventTitle(populatedRequest.targetEventId);
        const emailContent = swapRejectedEmail(userName || 'Someone', eventTitle);
        await sendEmail({
          to: requesterUser.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
      }
    } catch (emailError) {
      logger.error('Failed to send email notification:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Swap request rejected',
      data: populatedRequest
    });
  } catch (error) {
    logger.error('Error in rejectSwapRequest:', error);
    throw error;
  }
};

export const cancelSwapRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const requestId = req.params.id;
    
    const swapRequest = await SwapRequest.findById(requestId);
    
    if (!swapRequest) {
      throw new AppError('Swap request not found', 404);
    }
    
    if (swapRequest.requesterId.toString() !== userId?.toString()) {
      throw new AppError('Not authorized', 403);
    }
    
    if (swapRequest.status !== 'PENDING') {
      throw new AppError('Can only cancel pending requests', 400);
    }
    
    await SwapRequest.findByIdAndDelete(requestId);
    
    res.status(200).json({
      success: true,
      message: 'Swap request cancelled'
    });
  } catch (error) {
    logger.error('Error in cancelSwapRequest:', error);
    throw error;
  }
};