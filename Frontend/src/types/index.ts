export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


export type EventStatus = 'BUSY' | 'SWAPPABLE' | 'SWAPPED';
export const EventStatus = {
  BUSY: 'BUSY' as EventStatus,
  SWAPPABLE: 'SWAPPABLE' as EventStatus,
  SWAPPED: 'SWAPPED' as EventStatus
};


export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  userId: string | User;
  owner?: User;
  duration?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SwapRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export const SwapRequestStatus = {
  PENDING: 'PENDING' as SwapRequestStatus,
  ACCEPTED: 'ACCEPTED' as SwapRequestStatus,
  REJECTED: 'REJECTED' as SwapRequestStatus
};

export interface SwapRequest {
  id: string;
  requesterEventId: string | Event;
  description: string;
  targetEventId: string | Event;
  status: SwapRequestStatus;
  requesterId: string | User;
  targetUserId: string | User;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  status?: EventStatus;
}

export interface CreateSwapRequestRequest {
  mySlot: string; 
  theirSlot: string; 
}