import { useState, useEffect, useCallback } from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent } from '@/lib/api';
import type { Event, CreateEventRequest, UpdateEventRequest, ApiResponse } from '@/types';

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  create: (eventData: CreateEventRequest) => Promise<ApiResponse<Event>>;
  update: (eventId: string, eventData: UpdateEventRequest) => Promise<ApiResponse<Event>>;
  delete: (eventId: string) => Promise<ApiResponse<null>>;
}

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEvents();
      
      if (response.success && response.data) {
        setEvents(response.data);
      } else {
        setError(response.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const create = useCallback(async (eventData: CreateEventRequest) => {
    try {
      const response = await createEvent(eventData);
      
      if (response.success && response.data) {
        fetchEvents();
      }
      
      return response;
    } catch (err) {
      console.error('Error creating event:', err);
      return { success: false, error: 'An unexpected error occurred while creating event' };
    }
  }, [fetchEvents]);

  const update = useCallback(async (eventId: string, eventData: UpdateEventRequest) => {
    try {
      const response = await updateEvent(eventId, eventData);
      
      if (response.success && response.data) {
        fetchEvents();
      }
      
      return response;
    } catch (err) {
      console.error('Error updating event:', err);
      return { success: false, error: 'An unexpected error occurred while updating event' };
    }
  }, [fetchEvents]);

  const deleteEventCallback = useCallback(async (eventId: string) => {
    try {
      const response = await deleteEvent(eventId);
      
      if (response.success) {
        fetchEvents();
      }
      
      return response;
    } catch (err) {
      console.error('Error deleting event:', err);
      return { success: false, error: 'An unexpected error occurred while deleting event' };
    }
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    create,
    update,
    delete: deleteEventCallback,
  };
};