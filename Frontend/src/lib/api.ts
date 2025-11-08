import axios, { AxiosError } from 'axios';
import type { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse, 
  RegisterResponse, 
  ApiResponse,
  CreateEventRequest,
  UpdateEventRequest,
  CreateSwapRequestRequest,
  Event,
  SwapRequest
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const unauthorizedEvent = new CustomEvent('unauthorized', { 
        detail: { status: 401 } 
      });
      window.dispatchEvent(unauthorizedEvent);
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse }>('/auth/login', credentials);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const signup = async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: RegisterResponse }>('/auth/register', userData);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Signup failed';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const getEvents = async (): Promise<ApiResponse<Event[]>> => {
  try {
    const response = await apiClient.get<{ success: boolean; count: number; data: Event[] }>('/events');
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch events';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const getEvent = async (eventId: string): Promise<ApiResponse<Event>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: Event }>(`/events/${eventId}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch event';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const createEvent = async (eventData: CreateEventRequest): Promise<ApiResponse<Event>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: Event }>('/events', eventData);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to create event';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const updateEvent = async (eventId: string, eventData: UpdateEventRequest): Promise<ApiResponse<Event>> => {
  try {
    const response = await apiClient.put<{ success: boolean; data: Event }>(`/events/${eventId}`, eventData);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to update event';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const deleteEvent = async (eventId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await apiClient.delete<{ success: boolean }> (`/events/${eventId}`);
    return { success: response.data.success, data: null };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to delete event';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const createSwapRequest = async (requestData: CreateSwapRequestRequest): Promise<ApiResponse<SwapRequest>> => {
  try {
    const backendData = {
      targetEventId: requestData.theirSlot,
      requesterEventId: requestData.mySlot
    };
    
    const response = await apiClient.post<{ success: boolean; data: SwapRequest }>('/swap-requests', backendData);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to create swap request';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const acceptSwapRequest = async (requestId: string): Promise<ApiResponse<SwapRequest>> => {
  try {
    const response = await apiClient.patch<{ success: boolean; data: SwapRequest }>(`/swap-requests/${requestId}/accept`);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to accept swap request';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const rejectSwapRequest = async (requestId: string): Promise<ApiResponse<SwapRequest>> => {
  try {
    const response = await apiClient.patch<{ success: boolean; data: SwapRequest }>(`/swap-requests/${requestId}/reject`);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to reject swap request';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const cancelSwapRequest = async (requestId: string): Promise<ApiResponse<null>> => {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/swap-requests/${requestId}`);
    return { success: response.data.success, data: null };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to cancel swap request';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const getIncomingRequests = async (): Promise<ApiResponse<SwapRequest[]>> => {
  try {
    const response = await apiClient.get<{ success: boolean; count: number; data: SwapRequest[] }>('/swap-requests/incoming');
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch incoming requests';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};


export const getSwappableSlots = async (): Promise<ApiResponse<Event[]>> => {
  try {
    const response = await apiClient.get<{ success: boolean; count: number; data: Event[] }>('/events/swappable');
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch swappable slots';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const getOutgoingRequests = async (): Promise<ApiResponse<SwapRequest[]>> => {
  try {
    const response = await apiClient.get<{ success: boolean; count: number; data: SwapRequest[] }>('/swap-requests/outgoing');
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch outgoing requests';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};

export const getMarketplaceSlots = async (filters?: { 
  startDate?: string; 
  endDate?: string; 
  search?: string 
}): Promise<ApiResponse<Event[]>> => {
  try {
    let url = '/marketplace';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.startDate && filters.startDate.trim() !== '') {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate && filters.endDate.trim() !== '') {
        params.append('endDate', filters.endDate);
      }
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const response = await apiClient.get<{ success: boolean; count: number; totalPages: number; currentPage: number; data: Event[] }>(url);
    return { success: true, data: response.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to fetch marketplace slots';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Network error' };
  }
};