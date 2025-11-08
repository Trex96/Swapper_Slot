import { useState, useEffect, useCallback } from 'react';
import { getSwappableSlots } from '@/lib/api';
import type { Event } from '@/types';

interface UseSwappableSlotsReturn {
  slots: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSwappableSlots = (): UseSwappableSlotsReturn => {
  const [slots, setSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getSwappableSlots();
      
      if (response.success && response.data) {
        setSlots(response.data);
      } else {
        setError(response.error || 'Failed to fetch swappable slots');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching swappable slots');
      console.error('Error fetching swappable slots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    slots,
    loading,
    error,
    refetch: fetchSlots,
  };
};