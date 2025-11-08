import React, { createContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WebSocketContextType {
  socket: Socket | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

interface SwapRequestData {
  swapRequest: any;
  message: string;
}

interface EventData {
  event: any;
  message: string;
}

interface EventDeletedData {
  eventId: string;
  message: string;
}

const WebSocketProviderComponent: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const tokenParts = token.split('.');
      if (typeof token !== 'string' || token === 'undefined' || token.length < 50 || tokenParts.length !== 3) {
        console.error('Invalid token format for WebSocket connection');
        return;
      }
      
      const socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000', {
        auth: {
          token: token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      socketRef.current = socket;

      socket.on('newSwapRequest', (data: SwapRequestData) => {
        window.dispatchEvent(new CustomEvent('newSwapRequest', { detail: data }));
        toast.success(data.message || 'You have received a new swap request!');
      });

      socket.on('swapAccepted', (data: SwapRequestData) => {
        window.dispatchEvent(new CustomEvent('swapAccepted', { detail: data }));
        toast.success(data.message || 'Your swap request has been accepted!');
      });

      socket.on('swapRejected', (data: SwapRequestData) => {
        window.dispatchEvent(new CustomEvent('swapRejected', { detail: data }));
        toast.error(data.message || 'Your swap request has been rejected.');
      });

      socket.on('eventCreated', (data: EventData) => {
        window.dispatchEvent(new CustomEvent('eventCreated', { detail: data }));
        toast.info(data.message || 'A new event has been created in the marketplace');
      });

      socket.on('eventUpdated', (data: EventData) => {
        window.dispatchEvent(new CustomEvent('eventUpdated', { detail: data }));
        toast.info(data.message || 'An event has been updated');
      });

      socket.on('eventDeleted', (data: EventDeletedData) => {
        window.dispatchEvent(new CustomEvent('eventDeleted', { detail: data }));
        toast.info(data.message || 'An event has been removed from the marketplace');
      });

      socket.on('connect', () => {
        toast.success('Connected to real-time updates');
      });
      
      socket.on('disconnect', () => {
        toast.warning('Disconnected from real-time updates');
      });
      
      socket.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error);
        toast.error('Connection error. Please check your network.');
      });

      return () => {
        socket.off('newSwapRequest');
        socket.off('swapAccepted');
        socket.off('swapRejected');
        socket.off('eventCreated');
        socket.off('eventUpdated');
        socket.off('eventDeleted');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.offAny();
        socket.close();
      };
    }
  }, [isAuthenticated, token]);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const WebSocketProvider = WebSocketProviderComponent;
export { WebSocketContext };