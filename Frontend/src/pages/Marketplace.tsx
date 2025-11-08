import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import SwappableSlotCard from '@/components/SwappableSlotCard';
import SwapRequestDialog from '@/components/SwapRequestDialog';
import { getMarketplaceSlots, getEvents, createSwapRequest } from '@/lib/api';
import type { Event } from '@/types';
import { toast } from 'sonner';

const Marketplace: React.FC = () => {
  const [swappableSlots, setSwappableSlots] = useState<Event[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<Event[]>([]);
  const [userSwappableSlots, setUserSwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<Event | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (startDate && isNaN(Date.parse(startDate))) {
        setError('Please enter a valid start date');
        setLoading(false);
        return;
      }
      if (endDate && isNaN(Date.parse(endDate))) {
        setError('Please enter a valid end date');
        setLoading(false);
        return;
      }
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setError('Start date must be before end date');
        setLoading(false);
        return;
      }
      
      const slotsResponse = await getMarketplaceSlots({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined
      });
      
      if (slotsResponse.success && slotsResponse.data) {
        setSwappableSlots(slotsResponse.data);
        setFilteredSlots(slotsResponse.data);
      } else {
        toast.error(slotsResponse.error || 'Failed to fetch swappable slots. Please try again later.');
        setError(slotsResponse.error || 'Failed to fetch swappable slots. Please try again later.');
      }
      
      const userEventsResponse = await getEvents();
      if (userEventsResponse.success && userEventsResponse.data) {
        if (Array.isArray(userEventsResponse.data)) {
          const swappableEvents = userEventsResponse.data.filter(
            event => event.status === 'SWAPPABLE'
          );
          setUserSwappableSlots(swappableEvents);
        } else {
          console.error('Expected array but got:', userEventsResponse.data);
          toast.error('Failed to process user events data. Please try again later.');
          setError('Failed to process user events data. Please try again later.');
        }
      } else if (userEventsResponse.error) {
        toast.error(userEventsResponse.error);
        setError(userEventsResponse.error);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      toast.error('An unexpected error occurred while fetching slots.');
      if (err instanceof Error) {
        if ('response' in err && err.response && typeof err.response === 'object') {
          const response = err.response as { data?: { message?: string }; statusText?: string };
          setError(`Server error: ${response.data?.message || response.statusText || 'Unknown server error'}`);
        } else if ('request' in err && err.request) {
          setError('Network error: Please check your connection and try again');
        } else {
          setError(`Error: ${err.message || 'An unexpected error occurred'}`);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, searchTerm]);

  useEffect(() => {
    fetchSlots();
  }, [startDate, endDate, searchTerm, fetchSlots]);

  useEffect(() => {
    const handleNewSwapRequest = (event: CustomEvent) => {
      console.log('New swap request received via CustomEvent in Marketplace:', event.detail);
      console.log('Processing new swap request in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after new swap request');
      }).catch(err => {
        console.error('Error refreshing slots after new swap request:', err);
      });
      if (event.detail && event.detail.swapRequest) {
        const eventTitle = event.detail.swapRequest.targetEventId?.title || 'an event';
        console.log('Showing toast notification for new swap request:', eventTitle);
        toast.info(`New swap request for: ${eventTitle}`);
      }
    };

    const handleSwapAccepted = (event: CustomEvent) => {
      console.log('Swap accepted via CustomEvent in Marketplace:', event.detail);
      console.log('Processing swap acceptance in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after swap acceptance');
      }).catch(err => {
        console.error('Error refreshing slots after swap acceptance:', err);
      });
      if (event.detail && event.detail.swapRequest) {
        const eventTitle = event.detail.swapRequest.targetEventId?.title || 'Event';
        console.log('Showing toast notification for accepted swap:', eventTitle);
        toast.success(`Swap completed: ${eventTitle} is no longer available`);
      }
    };

    const handleSwapRejected = (event: CustomEvent) => {
      console.log('Swap rejected via CustomEvent in Marketplace:', event.detail);
      console.log('Processing swap rejection in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after swap rejection');
      }).catch(err => {
        console.error('Error refreshing slots after swap rejection:', err);
      });
      if (event.detail && event.detail.swapRequest) {
        const eventTitle = event.detail.swapRequest.targetEventId?.title || 'Event';
        console.log('Showing toast notification for rejected swap:', eventTitle);
        toast.info(`Swap rejected for: ${eventTitle}`);
      }
    };

    const handleEventCreated = (event: CustomEvent) => {
      console.log('New event created via CustomEvent in Marketplace:', event.detail);
      console.log('Processing event creation in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after event creation');
      }).catch(err => {
        console.error('Error refreshing slots after event creation:', err);
      });
      if (event.detail && event.detail.event) {
        console.log('Showing toast notification for new event:', event.detail.event.title);
        toast.info(`New slot available: ${event.detail.event.title}`);
      }
    };

    const handleEventUpdated = (event: CustomEvent) => {
      console.log('Event updated via CustomEvent in Marketplace:', event.detail);
      console.log('Processing event update in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after event update');
      }).catch(err => {
        console.error('Error refreshing slots after event update:', err);
      });
      if (event.detail && event.detail.event) {
        console.log('Showing toast notification for updated event:', event.detail.event.title);
        toast.info(`Slot updated: ${event.detail.event.title}`);
      }
    };

    const handleEventDeleted = (event: CustomEvent) => {
      console.log('Event deleted via CustomEvent in Marketplace:', event.detail);
      console.log('Processing event deletion in Marketplace');
      fetchSlots().then(() => {
        console.log('Successfully refreshed slots after event deletion');
      }).catch(err => {
        console.error('Error refreshing slots after event deletion:', err);
      });
      console.log('Showing toast notification for deleted event');
      toast.info('A slot is no longer available');
    };

    console.log('Adding event listeners in Marketplace component');
    window.addEventListener('newSwapRequest', handleNewSwapRequest as EventListener);
    window.addEventListener('swapAccepted', handleSwapAccepted as EventListener);
    window.addEventListener('swapRejected', handleSwapRejected as EventListener);
    window.addEventListener('eventCreated', handleEventCreated as EventListener);
    window.addEventListener('eventUpdated', handleEventUpdated as EventListener);
    window.addEventListener('eventDeleted', handleEventDeleted as EventListener);
    console.log('Event listeners added in Marketplace component');

    return () => {
      window.removeEventListener('newSwapRequest', handleNewSwapRequest as EventListener);
      window.removeEventListener('swapAccepted', handleSwapAccepted as EventListener);
      window.removeEventListener('swapRejected', handleSwapRejected as EventListener);
      window.removeEventListener('eventCreated', handleEventCreated as EventListener);
      window.removeEventListener('eventUpdated', handleEventUpdated as EventListener);
      window.removeEventListener('eventDeleted', handleEventDeleted as EventListener);
    };
  }, [fetchSlots]);

  useEffect(() => {
    if (!Array.isArray(swappableSlots)) {
      setFilteredSlots([]);
      return;
    }
    
    if (searchTerm) {
      const filtered = swappableSlots.filter(slot =>
        slot.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSlots(filtered);
    } else {
      setFilteredSlots(swappableSlots);
    }
  }, [searchTerm, swappableSlots]);

  const handleRequestSwap = (slot: Event) => {
    setSelectedTargetSlot(slot);
    setIsSwapDialogOpen(true);
  };

  const handleCreateSwapRequest = async (mySlotId: string, theirSlotId: string) => {
    try {
      if (mySlotId === theirSlotId) {
        toast.error('Cannot swap a slot with itself. Please select different slots.');
        throw new Error('Cannot swap a slot with itself. Please select different slots.');
      }
      
      const response = await createSwapRequest({
        mySlot: mySlotId,
        theirSlot: theirSlotId
      });
      
      if (response.success) {
        toast.success('Swap request created successfully!');
        return Promise.resolve();
      } else {
        toast.error(response.error || 'Failed to create swap request. Please try again.');
        throw new Error(response.error || 'Failed to create swap request. Please try again.');
      }
    } catch (err) {
      console.error('Error creating swap request:', err);
      if (err instanceof Error) {
        toast.error(err.message);
        throw new Error(err.message);
      } else {
        toast.error('Failed to create swap request. Please try again.');
        throw new Error('Failed to create swap request. Please try again.');
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleFilter = () => {
    if (startDate && isNaN(Date.parse(startDate))) {
      setError('Please enter a valid start date');
      return;
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      setError('Please enter a valid end date');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }
    setError(null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const SlotSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-muted rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 rounded-full bg-muted mr-2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
        <div className="flex justify-end">
          <div className="h-8 w-24 bg-muted rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Available Slots</h1>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search slots by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <label htmlFor="startDate" className="mr-2 text-sm">Start:</label>
              <div className="relative">
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background text-foreground border border-input rounded-md px-2 py-1 pl-8 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0"
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-foreground pointer-events-none" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center">
              <label htmlFor="endDate" className="mr-2 text-sm">End:</label>
              <div className="relative">
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background text-foreground border border-input rounded-md px-2 py-1 pl-8 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0"
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-foreground pointer-events-none" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleFilter}>Filter</Button>
            {(startDate || endDate) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear</Button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <SlotSkeleton key={index} />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400 dark:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          {(!Array.isArray(filteredSlots) || filteredSlots.length === 0) ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-muted-foreground mb-4">
                  {searchTerm || startDate || endDate ? 'No slots match your search criteria.' : 'No swappable slots available at the moment.'}
                </div>
                {!searchTerm && !startDate && !endDate && (
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSlots.map((slot) => (
                <SwappableSlotCard
                  key={slot.id}
                  event={slot}
                  onRequestSwap={() => handleRequestSwap(slot)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selectedTargetSlot && (
        <SwapRequestDialog
          isOpen={isSwapDialogOpen}
          onClose={() => {
            setIsSwapDialogOpen(false);
            setSelectedTargetSlot(null);
          }}
          targetSlot={selectedTargetSlot}
          userSwappableSlots={userSwappableSlots}
          onCreateSwapRequest={handleCreateSwapRequest}
        />
      )}
    </div>
  );
};

export default Marketplace;