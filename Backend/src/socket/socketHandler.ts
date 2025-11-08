import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';

export const initializeSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','),
      credentials: true
    }
  });
  
  io.on('connect', (socket) => {
    logger.info('Socket connected to server:', socket.id);
  });
  
  io.on('disconnect', (socket) => {
    logger.info('Socket disconnected from server:', socket.id);
  });
  
  const connectedUsers = new Map<string, Set<string>>(); 
  
  io.use((socket, next) => {
    logger.info('Socket.IO middleware triggered for authentication');
    
    const token = socket.handshake.auth.token;
    
    logger.info(`WebSocket authentication attempt with token: ${token ? 'Token present' : 'No token'}`);
    logger.info(`Token value: ${token}`);
    logger.info(`Token type: ${typeof token}`);
    logger.info(`Token length: ${token ? token.length : 0}`);
    
    if (!token) {
      logger.error('No authentication token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    if (typeof token !== 'string') {
      logger.error('Invalid token type provided:', typeof token);
      return next(new Error('Authentication error: Invalid token type'));
    }
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      logger.error('Invalid token format. Expected 3 parts, got:', tokenParts.length);
      return next(new Error('Authentication error: Invalid token format'));
    }
    
    logger.info('Token parts validation passed');
    
    try {
      logger.info('Attempting to verify token with JWT secret');
      const decoded: any = jwt.verify(token, env.JWT_SECRET);
      logger.info('Token decoded successfully:', decoded);
      
      logger.info('Decoded token keys:', Object.keys(decoded));
      
      let userId = decoded.userId || decoded.id;
      if (!userId) {
        logger.error('Decoded token does not contain userId or id:', decoded);
        return next(new Error('Authentication error: Token missing userId'));
      }
      
      socket.data.userId = userId;
      logger.info(`WebSocket authentication successful for user ${userId}`);
      next();
    } catch (err) {
      logger.error('WebSocket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    logger.info('New socket connection attempt:', socket.id);
    logger.info('Socket data:', socket.data);
    
    const userId = socket.data.userId;
    
    if (!userId) {
      logger.error('Connection attempt with invalid userId:', userId);
      socket.disconnect(true);
      return;
    }
    
    logger.info('Valid userId found:', userId);
    
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set<string>());
    }
    
    connectedUsers.get(userId)!.add(socket.id);
    
    socket.join(`user:${userId}`);
    
    const roomExists = io.sockets.adapter.rooms.has(`user:${userId}`);
    const socketsInRoom = roomExists ? io.sockets.adapter.rooms.get(`user:${userId}`) : null;
    
    logger.info(`User ${userId} connected with socket ${socket.id} and joined room user:${userId}. Room exists: ${roomExists}`);
    logger.info(`Sockets in room user:${userId}: ${socketsInRoom ? Array.from(socketsInRoom).join(', ') : 'None'}`);
    logger.info(`Total connections for user ${userId}: ${connectedUsers.get(userId)!.size}`);
    logger.info(`Current rooms: ${Array.from(io.sockets.adapter.rooms.keys()).join(', ')}`);
    
    logger.info(`Successfully established connection for user ${userId}`);
    
    socket.onAny((eventName, ...args) => {
      logger.info(`Received event from client ${socket.id}: ${eventName}`, args);
    });
    
    socket.on('eventCreated', (data) => {
      logger.info(`Received eventCreated from client ${socket.id}:`, data);
    });
    
    socket.on('disconnect', (reason) => {
      logger.info(`User ${userId} disconnected socket ${socket.id}. Reason: ${reason}`);
      logger.info(`User ${userId} left room user:${userId}`);
      
      if (connectedUsers.has(userId)) {
        const userSockets = connectedUsers.get(userId)!;
        userSockets.delete(socket.id);
        
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      
      logger.info(`User ${userId} now has ${connectedUsers.has(userId) ? connectedUsers.get(userId)!.size : 0} connections`);
      logger.info(`Current rooms after disconnect: ${Array.from(io.sockets.adapter.rooms.keys()).join(', ')}`);
    });
  });
  
  setInterval(() => {
    logger.info('Running periodic cleanup of disconnected sockets');
    let cleanupCount = 0;
    connectedUsers.forEach((userSockets, userId) => {
      userSockets.forEach(socketId => {
        if (!io.sockets.sockets.has(socketId)) {
          userSockets.delete(socketId);
          cleanupCount++;
        }
      });
      
      if (userSockets.size === 0) {
        connectedUsers.delete(userId);
        logger.info(`Cleaned up user ${userId} from connectedUsers`);
      }
    });
    logger.info(`Periodic cleanup completed. Removed ${cleanupCount} disconnected sockets`);
  }, 30000);
  
  return io;
};

export const emitSwapRequest = (io: Server, targetUserId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${targetUserId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit newSwapRequest to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting newSwapRequest to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('newSwapRequest', data);
          logger.info(`Emitted newSwapRequest to user ${targetUserId}. Sockets in room: ${socketsInRoom.size}`);
          return true;
        } else {
          logger.info(`No sockets found in room ${room} for user ${targetUserId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${targetUserId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting newSwapRequest:', error);
  }
  return false; // Failed to emit
};

export const emitSwapAccepted = (io: Server, requesterId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${requesterId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit swapAccepted to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting swapAccepted to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('swapAccepted', data);
          logger.info(`Emitted swapAccepted to user ${requesterId}. Sockets in room: ${socketsInRoom.size}`);
        } else {
          logger.info(`No sockets found in room ${room} for user ${requesterId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${requesterId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting swapAccepted:', error);
  }
};

export const emitSwapRejected = (io: Server, requesterId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${requesterId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit swapRejected to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting swapRejected to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('swapRejected', data);
          logger.info(`Emitted swapRejected to user ${requesterId}. Sockets in room: ${socketsInRoom.size}`);
        } else {
          logger.info(`No sockets found in room ${room} for user ${requesterId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${requesterId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting swapRejected:', error);
  }
};

export const emitEventCreated = (io: Server, userId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${userId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit eventCreated to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting eventCreated to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('eventCreated', data);
          logger.info(`Emitted eventCreated to user ${userId}. Sockets in room: ${socketsInRoom.size}`);
        } else {
          logger.info(`No sockets found in room ${room} for user ${userId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${userId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting eventCreated:', error);
  }
};

export const emitEventUpdated = (io: Server, userId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${userId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit eventUpdated to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting eventUpdated to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('eventUpdated', data);
          logger.info(`Emitted eventUpdated to user ${userId}. Sockets in room: ${socketsInRoom.size}`);
        } else {
          logger.info(`No sockets found in room ${room} for user ${userId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${userId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting eventUpdated:', error);
  }
};

export const emitEventDeleted = (io: Server, userId: string, data: any) => {
  try {
    if (io) {
      const room = `user:${userId}`;
      const roomExists = io.sockets.adapter.rooms.has(room);
      logger.info(`Attempting to emit eventDeleted to room ${room}. Room exists: ${roomExists}`);
      
      if (roomExists) {
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (socketsInRoom && socketsInRoom.size > 0) {
          logger.info(`Emitting eventDeleted to ${socketsInRoom.size} socket(s) in room ${room}`);
          logger.info(`Socket IDs in room ${room}: ${Array.from(socketsInRoom).join(', ')}`);
          io.to(room).emit('eventDeleted', data);
          logger.info(`Emitted eventDeleted to user ${userId}. Sockets in room: ${socketsInRoom.size}`);
        } else {
          logger.info(`No sockets found in room ${room} for user ${userId}`);
        }
      } else {
        logger.info(`Room ${room} does not exist for user ${userId}`);
      }
    } else {
      logger.warn('Socket.io instance is not available');
    }
  } catch (error) {
    logger.error('Error emitting eventDeleted:', error);
  }
};
