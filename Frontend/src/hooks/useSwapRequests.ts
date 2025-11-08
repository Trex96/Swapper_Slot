import { useState, useEffect, useCallback } from 'react';
import { getIncomingRequests, getOutgoingRequests, acceptSwapRequest, rejectSwapRequest, cancelSwapRequest, createSwapRequest } from '@/lib/api';
import type { SwapRequest, CreateSwapRequestRequest, ApiResponse } from '@/types';

interface UseSwapRequestsReturn {
  incomingRequests: SwapRequest[];
  outgoingRequests: SwapRequest[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  acceptRequest: (requestId: string) => Promise<ApiResponse<SwapRequest>>;
  rejectRequest: (requestId: string) => Promise<ApiResponse<SwapRequest>>;
  cancelRequest: (requestId: string) => Promise<ApiResponse<null>>;
  createRequest: (data: CreateSwapRequestRequest) => Promise<ApiResponse<SwapRequest>>;
}

export const useSwapRequests = (): UseSwapRequestsReturn => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [incomingResponse, outgoingResponse] = await Promise.all([
        getIncomingRequests(),
        getOutgoingRequests()
      ]);
      
      if (incomingResponse.success && incomingResponse.data) {
        setIncomingRequests(incomingResponse.data);
      } else if (incomingResponse.error) {
        setError(incomingResponse.error);
      }
      
      if (outgoingResponse.success && outgoingResponse.data) {
        setOutgoingRequests(outgoingResponse.data);
      } else if (outgoingResponse.error && !error) {
        setError(outgoingResponse.error);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching swap requests');
      console.error('Error fetching swap requests:', err);
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const response = await acceptSwapRequest(requestId);
      
      if (response.success) {
        fetchRequests();
      }
      
      return response;
    } catch (err) {
      console.error('Error accepting swap request:', err);
      return { success: false, error: 'An unexpected error occurred while accepting swap request' };
    }
  }, [fetchRequests]);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      const response = await rejectSwapRequest(requestId);
      
      if (response.success) {
        fetchRequests();
      }
      
      return response;
    } catch (err) {
      console.error('Error rejecting swap request:', err);
      return { success: false, error: 'An unexpected error occurred while rejecting swap request' };
    }
  }, [fetchRequests]);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const response = await cancelSwapRequest(requestId);
      
      if (response.success) {
        fetchRequests();
      }
      
      return response;
    } catch (err) {
      console.error('Error canceling swap request:', err);
      return { success: false, error: 'An unexpected error occurred while canceling swap request' };
    }
  }, [fetchRequests]);

  const createRequest = useCallback(async (data: CreateSwapRequestRequest) => {
    try {
      const response = await createSwapRequest(data);
      
      if (response.success) {
        fetchRequests();
      }
      
      return response;
    } catch (err) {
      console.error('Error creating swap request:', err);
      return { success: false, error: 'An unexpected error occurred while creating swap request' };
    }
  }, [fetchRequests]);

  return {
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    refetch: fetchRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    createRequest,
  };
};