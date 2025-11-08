import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getEvents, getIncomingRequests, getOutgoingRequests, createEvent, deleteEvent, updateEvent, cancelSwapRequest, acceptSwapRequest, rejectSwapRequest } from '@/lib/api';
import type { Event, SwapRequest, CreateEventRequest, User,EventStatus } from '@/types';
import { format } from 'date-fns';
import EventCard from '@/components/EventCard';
import CreateEventDialog from '@/components/CreateEventDialog';
import IncomingRequestCard from '@/components/IncomingRequestCard';
import OutgoingRequestCard from '@/components/OutgoingRequestCard';
import { toast } from 'sonner';


const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, incomingResponse, outgoingResponse] = await Promise.all([
        getEvents(),
        getIncomingRequests(),
        getOutgoingRequests()
      ]);

      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }

      if (incomingResponse.success && incomingResponse.data) {
        setIncomingRequests(incomingResponse.data);
      }

      if (outgoingResponse.success && outgoingResponse.data) {
        setOutgoingRequests(outgoingResponse.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusBadge = (status: EventStatus) => {
      switch (status) {
        case 'BUSY':
          return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Busy</span>;
        case 'SWAPPABLE':
          return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Swappable</span>;
          case 'SWAPPED':
          return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Swapped</span>;
        default:
          return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Unknown</span>;
      }
    };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    console.log('Adding WebSocket event listeners in Dashboard component');
    const handleNewSwapRequest = (event: CustomEvent) => {
      console.log('New swap request received via CustomEvent in Dashboard:', event.detail);
      console.log('Processing new swap request in Dashboard');
      getIncomingRequests().then(incomingResponse => {
        if (incomingResponse.success && incomingResponse.data) {
          console.log('Successfully fetched incoming requests:', incomingResponse.data);
          setIncomingRequests(incomingResponse.data);
          console.log('Updated incoming requests state');
        } else {
          console.log('Failed to fetch incoming requests');
        }
      }).catch(err => {
        console.error('Error fetching incoming requests:', err);
        toast.error('Failed to update incoming requests');
      });
      
      if (event.detail && event.detail.swapRequest && event.detail.swapRequest.requesterId) {
        const requesterName = typeof event.detail.swapRequest.requesterId === 'string' 
          ? 'A user' 
          : event.detail.swapRequest.requesterId.name || 'A user';
        console.log('Showing toast notification for new swap request from:', requesterName);
        toast.info(`New swap request from ${requesterName}`);
      }
    };

    const handleSwapAccepted = (event: CustomEvent) => {
      console.log('Swap accepted via CustomEvent in Dashboard:', event.detail);
      console.log('Processing swap acceptance in Dashboard');

      Promise.all([
        getEvents(),
        getOutgoingRequests()
      ]).then(([eventsResponse, outgoingResponse]) => {
        if (eventsResponse.success && eventsResponse.data) {
          console.log('Successfully fetched events:', eventsResponse.data);
          setEvents(eventsResponse.data);
          console.log('Updated events state');
        }
        if (outgoingResponse.success && outgoingResponse.data) {
          console.log('Successfully fetched outgoing requests:', outgoingResponse.data);
          setOutgoingRequests(outgoingResponse.data);
          console.log('Updated outgoing requests state');
        }
      }).catch(err => {
        console.error('Error fetching data after swap acceptance:', err);
        toast.error('Failed to update dashboard after swap acceptance');
      });
      

      if (event.detail && event.detail.swapRequest) {
        const eventTitle = event.detail.swapRequest.requesterEventId?.title || event.detail.swapRequest.targetEventId?.title || 'Event';
        console.log('Showing toast notification for accepted swap:', eventTitle);
        toast.success(`Swap accepted: ${eventTitle} swapped successfully!`);
      }
    };

    const handleSwapRejected = (event: CustomEvent) => {
      console.log('Swap rejected via CustomEvent in Dashboard:', event.detail);
      console.log('Processing swap rejection in Dashboard');

      getOutgoingRequests().then(outgoingResponse => {
        if (outgoingResponse.success && outgoingResponse.data) {
          console.log('Successfully fetched outgoing requests:', outgoingResponse.data);
          setOutgoingRequests(outgoingResponse.data);
          console.log('Updated outgoing requests state');
        }
      }).catch(err => {
        console.error('Error fetching outgoing requests:', err);
        toast.error('Failed to update outgoing requests');
      });
      

      if (event.detail && event.detail.swapRequest) {
        const eventTitle = event.detail.swapRequest.requesterEventId?.title || event.detail.swapRequest.targetEventId?.title || 'Event';
        console.log('Showing toast notification for rejected swap:', eventTitle);
        toast.info(`Swap rejected for: ${eventTitle}`);
      }
    };

    const handleEventCreated = (event: CustomEvent) => {
      console.log('New event created via CustomEvent in Dashboard:', event.detail);
      console.log('Processing event creation in Dashboard');

      getEvents().then(eventsResponse => {
        if (eventsResponse.success && eventsResponse.data) {
          console.log('Successfully fetched events:', eventsResponse.data);
          setEvents(eventsResponse.data);
          console.log('Updated events state');
        }
      }).catch(err => {
        console.error('Error fetching events:', err);
        toast.error('Failed to update events list');
      });
      
      if (event.detail && event.detail.event) {
        console.log('Showing toast notification for new event:', event.detail.event.title);
        toast.info(`New event created: ${event.detail.event.title}`);
      }
    };

    const handleEventUpdated = (event: CustomEvent) => {
      console.log('Event updated via CustomEvent in Dashboard:', event.detail);
      console.log('Processing event update in Dashboard');

      getEvents().then(eventsResponse => {
        if (eventsResponse.success && eventsResponse.data) {
          console.log('Successfully fetched events:', eventsResponse.data);
          setEvents(eventsResponse.data);
          console.log('Updated events state');
        }
      }).catch(err => {
        console.error('Error fetching events:', err);
        toast.error('Failed to update events list');
      });
      
      if (event.detail && event.detail.event) {
        console.log('Showing toast notification for updated event:', event.detail.event.title);
        toast.info(`Event updated: ${event.detail.event.title}`);
      }
    };

    const handleEventDeleted = (event: CustomEvent) => {
      console.log('Event deleted via CustomEvent in Dashboard:', event.detail);
      console.log('Processing event deletion in Dashboard');

      getEvents().then(eventsResponse => {
        if (eventsResponse.success && eventsResponse.data) {
          console.log('Successfully fetched events:', eventsResponse.data);
          setEvents(eventsResponse.data);
          console.log('Updated events state');
        }
      }).catch(err => {
        console.error('Error fetching events:', err);
        toast.error('Failed to update events list');
      });
      
      console.log('Showing toast notification for deleted event');
      toast.info('An event has been deleted');
    };


    window.addEventListener('newSwapRequest', handleNewSwapRequest as EventListener);
    window.addEventListener('swapAccepted', handleSwapAccepted as EventListener);
    window.addEventListener('swapRejected', handleSwapRejected as EventListener);
    window.addEventListener('eventCreated', handleEventCreated as EventListener);
    window.addEventListener('eventUpdated', handleEventUpdated as EventListener);
    window.addEventListener('eventDeleted', handleEventDeleted as EventListener);
    console.log('WebSocket event listeners added in Dashboard component');


    return () => {
      console.log('Removing WebSocket event listeners in Dashboard component');
      window.removeEventListener('newSwapRequest', handleNewSwapRequest as EventListener);
      window.removeEventListener('swapAccepted', handleSwapAccepted as EventListener);
      window.removeEventListener('swapRejected', handleSwapRejected as EventListener);
      window.removeEventListener('eventCreated', handleEventCreated as EventListener);
      window.removeEventListener('eventUpdated', handleEventUpdated as EventListener);
      window.removeEventListener('eventDeleted', handleEventDeleted as EventListener);
      console.log('WebSocket event listeners removed in Dashboard component');
    };
    }, [fetchData]);

  const handleCreateEvent = async (eventData: CreateEventRequest) => {
    try {
      const response = await createEvent(eventData);
      if (response.success && response.data) {

        const eventsResponse = await getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
        setShowCreateDialog(false);
        toast.success('Event created successfully!');
      } else {
        toast.error(response.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      if (!window.confirm('Are you sure you want to delete this event?')) {
        return;
      }

      const response = await deleteEvent(eventId);
      if (response.success) {

        const eventsResponse = await getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
        toast.success('Event deleted successfully!');
      } else {
        toast.error(response.error || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event. Please try again.');
    }
  };

  const handleMakeSwappable = async (eventId: string) => {
    try {
      const response = await updateEvent(eventId, { status: 'SWAPPABLE' });
      if (response.success && response.data) {

        const eventsResponse = await getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
        toast.success('Event marked as swappable!');
      } else {
        toast.error(response.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      toast.error('Failed to update event. Please try again.');
    }
  };

  const handleRemoveFromMarket = async (eventId: string) => {
    try {
      const response = await updateEvent(eventId, { status: 'BUSY' });
      if (response.success && response.data) {

        const eventsResponse = await getEvents();
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
        toast.success('Event removed from market!');
      } else {
        toast.error(response.error || 'Failed to update event');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      toast.error('Failed to update event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full py-6 md:py-8">
        <div className="mx-4 md:mx-20">
          <div className="grid gap-6">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your schedule and swap requests here.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <Separator />
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>My Events</CardTitle>
                    <CardDescription>
                      Create and manage your scheduled events
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    Create Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No events found</p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="mt-4"
                    >
                      Create Your First Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.slice(0, 2).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onMakeSwappable={handleMakeSwappable}
                          onRemoveFromMarket={handleRemoveFromMarket}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                    {events.length > 2 && (
                      <div className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              View All Events ({events.length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl w-full max-h-[90vh] h-[80vh] p-4 grid-rows-[auto_1fr]">
                            <DialogHeader className="gap-1 py-5">
                              <DialogTitle>All Events</DialogTitle>
                            </DialogHeader>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="whitespace-nowrap">Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="whitespace-nowrap">Start Time</TableHead>
                                    <TableHead className="whitespace-nowrap">End Time</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {events.map((event) => (
                                    <TableRow key={event.id}>
                                      <TableCell className="font-medium whitespace-nowrap">{event.title}</TableCell>
                                      <TableCell className="max-w-xs truncate">{event.description || 'No description'}</TableCell>
                                      <TableCell className="whitespace-nowrap">{format(new Date(event.startTime), 'MMM dd, yyyy HH:mm')}</TableCell>
                                      <TableCell className="whitespace-nowrap">{format(new Date(event.endTime), 'MMM dd, yyyy HH:mm')}</TableCell>
                                      <TableCell>
                                        <div className="px-2 py-1 rounded-full text-xs font-medium">
                                         {getStatusBadge(event.status)}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex flex-wrap justify-end gap-2">
                                          {event.status === 'BUSY' ? (
                                            <Button 
                                              size="sm" 
                                              onClick={() => handleMakeSwappable(event.id)}
                                            >
                                              Make Swappable
                                            </Button>
                                          ) : (

                                            event.status === 'SWAPPED' ? "":
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={() => handleRemoveFromMarket(event.id)}
                                            >
                                              Remove from Market
                                            </Button>
                                          )}
                                          <Button 
                                            size="sm" 
                                            variant="destructive" 
                                            onClick={() => handleDeleteEvent(event.id)}
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Requests</CardTitle>
                  <CardDescription>
                    Requests from other users to swap slots with you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incomingRequests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No incoming requests</p>
                  ) : (
                    <div className="space-y-4">
                      {incomingRequests.slice(0, 1).map((request) => {

                        const theirSlot = events.find(e => e.id === request.targetEventId);
                        const yourSlot = events.find(e => e.id === request.requesterEventId);
                        

                        const requester: User = typeof request.requesterId === 'string' 
                          ? { id: request.requesterId, name: 'Requester', email: '' }
                          : request.requesterId as User;
                        

                        const finalYourSlot: Event = yourSlot ? yourSlot : {
                          id: typeof request.requesterEventId === 'string' 
                            ? request.requesterEventId 
                            : request.requesterEventId && request.requesterEventId.id 
                              ? request.requesterEventId.id 
                              : 'unknown-your-slot',
                          title: typeof request.requesterEventId === 'string' 
                            ? 'Unknown Event' 
                            : request.requesterEventId && request.requesterEventId.title 
                              ? request.requesterEventId.title 
                              : 'Unknown Event',
                          startTime: new Date(),
                          endTime: new Date(),
                          status: 'SWAPPABLE',
                          userId: typeof request.requesterId === 'string' 
                            ? request.requesterId 
                            : request.requesterId && (request.requesterId as User).id 
                              ? (request.requesterId as User).id 
                              : 'unknown-requester'
                        };
                        
                        const finalTheirSlot: Event = theirSlot ? theirSlot : {
                          id: typeof request.targetEventId === 'string' 
                            ? request.targetEventId 
                            : request.targetEventId && request.targetEventId.id 
                              ? request.targetEventId.id 
                              : 'unknown-their-slot',
                          title: typeof request.targetEventId === 'string' 
                            ? 'Unknown Event' 
                            : request.targetEventId && request.targetEventId.title 
                              ? request.targetEventId.title 
                              : 'Unknown Event',
                          startTime: new Date(),
                          endTime: new Date(),
                          status: 'SWAPPABLE',
                          userId: typeof request.targetUserId === 'string' 
                            ? request.targetUserId 
                            : request.targetUserId && (request.targetUserId as User).id 
                              ? (request.targetUserId as User).id 
                              : 'unknown-target'
                        };
                        
                        return (
                          <IncomingRequestCard
                            key={request.id}
                            request={request}
                            theirSlot={finalTheirSlot}
                            yourSlot={finalYourSlot}
                            requester={requester}
                            onRespond={async (requestId, status) => {
                              try {
                                let response;
                                if (status === 'ACCEPTED') {
                                  response = await acceptSwapRequest(requestId);
                                } else {
                                  response = await rejectSwapRequest(requestId);
                                }
                                
                                if (response.success) {

                                  const incomingResponse = await getIncomingRequests();
                                  if (incomingResponse.success && incomingResponse.data) {
                                    setIncomingRequests(incomingResponse.data);
                                  }
                                  toast.success(`Swap request ${status.toLowerCase()} successfully!`);
                                } else {
                                  toast.error(response.error || `Failed to ${status.toLowerCase()} request`);
                                }
                              } catch (err) {
                                console.error('Error responding to request:', err);
                                toast.error('Failed to respond to request. Please try again.');
                              }
                            }}
                          />
                        );
                      })}
                      {incomingRequests.length > 1 && (
                        <div className="text-center">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                View All Incoming Requests ({incomingRequests.length})
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl w-full max-h-[90vh] h-[80vh] p-4 grid-rows-[auto_1fr]">
                              <DialogHeader className="gap-1 py-5">
                                <DialogTitle>All Incoming Requests</DialogTitle>
                              </DialogHeader>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="whitespace-nowrap">Requester</TableHead>
                                      <TableHead>Their Slot</TableHead>
                                      <TableHead>Your Slot</TableHead>
                                      <TableHead className="whitespace-nowrap">Requested At</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {incomingRequests.map((request) => {

                                      const theirSlot = events.find(e => e.id === request.targetEventId);
                                      const yourSlot = events.find(e => e.id === request.requesterEventId);
                                      

                                      const requester: User = typeof request.requesterId === 'string' 
                                        ? { id: request.requesterId, name: 'Requester', email: '' }
                                        : request.requesterId as User;
                                      
                                      return (
                                        <TableRow key={request.id}>
                                          <TableCell className="font-medium whitespace-nowrap">{requester.name || 'Unknown User'}</TableCell>
                                          <TableCell>
                                            {theirSlot && theirSlot.startTime ? (
                                              <div>
                                                <div className="font-medium truncate">{theirSlot.title}</div>
                                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                  {format(new Date(theirSlot.startTime), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                              </div>
                                            ) : (
                                              typeof request.targetEventId === 'string' 
                                                ? 'Unknown Event' 
                                                : request.targetEventId && request.targetEventId.title 
                                                  ? request.targetEventId.title 
                                                  : 'Unknown Event'
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {yourSlot && yourSlot.startTime ? (
                                              <div>
                                                <div className="font-medium truncate">{yourSlot.title}</div>
                                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                  {format(new Date(yourSlot.startTime), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                              </div>
                                            ) : (
                                              typeof request.requesterEventId === 'string' 
                                                ? 'Unknown Event' 
                                                : request.requesterEventId && request.requesterEventId.title 
                                                  ? request.requesterEventId.title 
                                                  : 'Unknown Event'
                                            )}
                                          </TableCell>
                                          <TableCell className="whitespace-nowrap">
                                            {request.createdAt 
                                              ? format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm') 
                                              : 'Unknown date'}
                                          </TableCell>
                                          <TableCell>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              request.status === 'PENDING' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : request.status === 'ACCEPTED' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                            }`}>
                                              {request.status}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {request.status === 'PENDING' ? (
                                              <div className="flex flex-wrap justify-end gap-2">
                                                <Button 
                                                  size="sm" 
                                                  onClick={() => {
                                                    acceptSwapRequest(request.id).then(response => {
                                                      if (response.success) {
                                                        toast.success('Swap request accepted successfully!');

                                                      } else {
                                                        toast.error(response.error || 'Failed to accept request');
                                                      }
                                                    }).catch(err => {
                                                      console.error('Error accepting request:', err);
                                                      toast.error('Failed to accept request. Please try again.');
                                                    });
                                                  }}
                                                >
                                                  Accept
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline" 
                                                  onClick={() => {
                                                    rejectSwapRequest(request.id).then(response => {
                                                      if (response.success) {
                                                        toast.success('Swap request rejected successfully!');

                                                      } else {
                                                        toast.error(response.error || 'Failed to reject request');
                                                      }
                                                    }).catch(err => {
                                                      console.error('Error rejecting request:', err);
                                                      toast.error('Failed to reject request. Please try again.');
                                                    });
                                                  }}
                                                >
                                                  Reject
                                                </Button>
                                              </div>
                                            ) : (
                                              <span className="text-muted-foreground whitespace-nowrap">No action needed</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Outgoing Requests</CardTitle>
                  <CardDescription>
                    Your requests to swap slots with others
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {outgoingRequests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No outgoing requests</p>
                    ) : (
                      <>
                        {outgoingRequests.slice(0, 1).map((request) => {

                          if (!request || !request.id) {
                            return null;
                          }
                          

                          const yourSlot = events.find(e => e.id === request.requesterEventId);
                          const theirSlot = events.find(e => e.id === request.targetEventId);
                          

                          const receiver: User = typeof request.targetUserId === 'string' 
                            ? { id: request.targetUserId, name: 'Receiver', email: '' }
                            : request.targetUserId as User;
                          

                          const finalYourSlot: Event = yourSlot ? yourSlot : {
                            id: typeof request.requesterEventId === 'string' 
                              ? request.requesterEventId 
                              : request.requesterEventId && request.requesterEventId.id 
                                ? request.requesterEventId.id 
                                : 'unknown-your-slot',
                            title: typeof request.requesterEventId === 'string' 
                              ? 'Unknown Event' 
                              : request.requesterEventId && request.requesterEventId.title 
                                ? request.requesterEventId.title 
                                : 'Unknown Event',
                            startTime: new Date(),
                            endTime: new Date(),
                            status: 'SWAPPABLE',
                            userId: typeof request.requesterId === 'string' 
                              ? request.requesterId 
                              : request.requesterId && (request.requesterId as User).id 
                                ? (request.requesterId as User).id 
                                : 'unknown-requester'
                          };
                          
                          const finalTheirSlot: Event = theirSlot ? theirSlot : {
                            id: typeof request.targetEventId === 'string' 
                              ? request.targetEventId 
                              : request.targetEventId && request.targetEventId.id 
                                ? request.targetEventId.id 
                                : 'unknown-their-slot',
                            title: typeof request.targetEventId === 'string' 
                              ? 'Unknown Event' 
                              : request.targetEventId && request.targetEventId.title 
                                ? request.targetEventId.title 
                                : 'Unknown Event',
                            startTime: new Date(),
                            endTime: new Date(),
                            status: 'SWAPPABLE',
                            userId: typeof request.targetUserId === 'string' 
                              ? request.targetUserId 
                              : request.targetUserId && (request.targetUserId as User).id 
                                ? (request.targetUserId as User).id 
                                : 'unknown-target'
                          };
                          
                          return (
                            <OutgoingRequestCard
                              key={request.id}
                              request={request}
                              yourSlot={finalYourSlot}
                              theirSlot={finalTheirSlot}
                              receiver={receiver}
                              onCancel={async (requestId) => {
                                try {
                                  const response = await cancelSwapRequest(requestId);
                                  if (response.success) {

                                    const outgoingResponse = await getOutgoingRequests();
                                    if (outgoingResponse.success && outgoingResponse.data) {
                                      setOutgoingRequests(outgoingResponse.data);
                                    }
                                    toast.success('Swap request cancelled successfully!');
                                  } else {
                                    toast.error(response.error || 'Failed to cancel request');
                                  }
                                } catch (err) {
                                  console.error('Error cancelling request:', err);
                                  toast.error('Failed to cancel request. Please try again.');
                                }
                              }}
                            />
                          );
                        }).filter(Boolean)
                        }
                        {outgoingRequests.length > 1 && (
                          <div className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full">
                                  View All Outgoing Requests ({outgoingRequests.length})
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-4xl w-full max-h-[90vh] h-[80vh] p-4 grid-rows-[auto_1fr]">
                                <DialogHeader className="gap-1 py-5">
                                  <DialogTitle>All Outgoing Requests</DialogTitle>
                                </DialogHeader>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="whitespace-nowrap">Receiver</TableHead>
                                        <TableHead>Your Slot</TableHead>
                                        <TableHead>Their Slot</TableHead>
                                        <TableHead className="whitespace-nowrap">Requested At</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {outgoingRequests.map((request) => {
                                        if (!request || !request.id) {
                                          return null;
                                        }
                                        
                                        const yourSlot = events.find(e => e.id === request.requesterEventId);
                                        const theirSlot = events.find(e => e.id === request.targetEventId);
                                        
                                        const receiver: User = typeof request.targetUserId === 'string' 
                                          ? { id: request.targetUserId, name: 'Receiver', email: '' }
                                          : request.targetUserId as User;
                                        
                                        return (
                                          <TableRow key={request.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{receiver.name || 'Unknown User'}</TableCell>
                                            <TableCell>
                                              {yourSlot && yourSlot.startTime ? (
                                                <div>
                                                  <div className="font-medium truncate">{yourSlot.title}</div>
                                                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(yourSlot.startTime), 'MMM dd, yyyy HH:mm')}
                                                  </div>
                                                </div>
                                              ) : (
                                                typeof request.requesterEventId === 'string' 
                                                  ? 'Unknown Event' 
                                                  : request.requesterEventId && request.requesterEventId.title 
                                                    ? request.requesterEventId.title 
                                                    : 'Unknown Event'
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              {theirSlot && theirSlot.startTime ? (
                                                <div>
                                                  <div className="font-medium truncate">{theirSlot.title}</div>
                                                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(theirSlot.startTime), 'MMM dd, yyyy HH:mm')}
                                                  </div>
                                                </div>
                                              ) : (
                                                typeof request.targetEventId === 'string' 
                                                  ? 'Unknown Event' 
                                                  : request.targetEventId && request.targetEventId.title 
                                                    ? request.targetEventId.title 
                                                    : 'Unknown Event'
                                              )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              {request.createdAt 
                                                ? format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm') 
                                                : 'Unknown date'}
                                            </TableCell>
                                            <TableCell>
                                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                request.status === 'PENDING' 
                                                  ? 'bg-yellow-100 text-yellow-800' 
                                                  : request.status === 'ACCEPTED' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                              }`}>
                                                {request.status}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {request.status === 'PENDING' ? (
                                                <Button 
                                                  size="sm" 
                                                  variant="outline" 
                                                  onClick={() => {
                                                    cancelSwapRequest(request.id).then(response => {
                                                      if (response.success) {
                                                        getOutgoingRequests().then(outgoingResponse => {
                                                          if (outgoingResponse.success && outgoingResponse.data) {
                                                            setOutgoingRequests(outgoingResponse.data);
                                                          }
                                                        });
                                                        toast.success('Swap request cancelled successfully!');
                                                      } else {
                                                        toast.error(response.error || 'Failed to cancel request');
                                                      }
                                                    }).catch(err => {
                                                      console.error('Error cancelling request:', err);
                                                      toast.error('Failed to cancel request. Please try again.');
                                                    });
                                                  }}
                                                >
                                                  Cancel
                                                </Button>
                                              ) : (
                                                <span className="text-muted-foreground whitespace-nowrap">No action needed</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      }).filter(Boolean) 
                                      }
                                    </TableBody>
                                  </Table>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
          </div>
        </div>
      </main>
      
      <CreateEventDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
};

export default Dashboard;