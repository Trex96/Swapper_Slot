import mongoose from 'mongoose';
import app from './app';
import { env, validateEnv } from './config/env';
import logger from './config/logger';
import { initializeSocket } from './socket/socketHandler';

let server: any;
let io: any;

let activeConnections = 0;
const connectionTimeouts = new Map();

const connectDB = async (retries = 5): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    
    if (retries > 0) {
      logger.info(`Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      logger.error('Failed to connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

const cleanupResources = async () => {
  logger.info('Cleaning up resources...');
  
  connectionTimeouts.forEach(timeout => clearTimeout(timeout));
  connectionTimeouts.clear();
  
  if (io) {
    logger.info('Closing Socket.io connections...');
    io.close();
  }
  
  if (server) {
    logger.info('Closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

const startServer = async (): Promise<void> => {
  validateEnv();
  
  await connectDB();
  
  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  io = initializeSocket(server);
  app.locals.io = io;
  
  logger.info('Socket.io instance initialized and attached to app.locals');
  logger.info(`Socket.io server initialized with ${io ? 'valid' : 'invalid'} instance`);
  
  server.on('connection', (socket: any) => {
    activeConnections++;
    
    if (!socket.upgrade) {
      const timeout = setTimeout(() => {
        try {
          socket.destroy();
          logger.info('Destroyed inactive HTTP connection');
        } catch (error) {
          logger.error('Error destroying HTTP connection:', error);
        }
      }, 300000);
      
      connectionTimeouts.set(socket, timeout);
    }
    
    socket.on('close', () => {
      activeConnections--;
      const timeout = connectionTimeouts.get(socket);
      if (timeout) {
        clearTimeout(timeout);
        connectionTimeouts.delete(socket);
      }
    });
    
    socket.on('error', (error: any) => {
      logger.error('Socket error:', error);
      activeConnections--;
      const timeout = connectionTimeouts.get(socket);
      if (timeout) {
        clearTimeout(timeout);
        connectionTimeouts.delete(socket);
      }
    });
  });
};

const gracefulShutdown = async (signal: string = 'SIGTERM') => {
  logger.info(`Received ${signal} signal, closing server gracefully...`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await cleanupResources();
        logger.info('All resources cleaned up');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 15000);
  } else {
    process.exit(0);
  }
};

process.on('beforeExit', () => {
  logger.info('Process beforeExit event');
});

process.on('exit', () => {
  logger.info('Process exit event');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown();
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});