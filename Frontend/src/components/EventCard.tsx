import React from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import type { Event, EventStatus } from '@/types';

interface EventCardProps {
  event: Event;
  onMakeSwappable?: (eventId: string) => void;
  onRemoveFromMarket?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onMakeSwappable, 
  onRemoveFromMarket, 
  onDelete 
}) => {
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

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
  };

  const handleMakeSwappable = () => {
    if (onMakeSwappable) {
      onMakeSwappable(event.id);
    }
  };

  const handleRemoveFromMarket = () => {
    if (onRemoveFromMarket) {
      onRemoveFromMarket(event.id);
    }
  };

  const getOwnerName = () => {
    if (event.owner) {
      return event.owner.name;
    }
    if (typeof event.userId === 'object' && event.userId !== null) {
      return event.userId.name;
    }
    return 'Unknown';
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <CardDescription className="mt-1">
              {formatDate(event.startTime)} - {formatDate(event.endTime)}
            </CardDescription>
          </div>
          {getStatusBadge(event.status)}
        </div>
      </CardHeader>
      
      <CardContent>
        {event.description && (
          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
        )}
        <div className="flex items-center text-sm text-muted-foreground">
          <span>Owner: {getOwnerName()}</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {event.status === 'BUSY' && (
          <Button onClick={handleMakeSwappable} size="sm">
            Make Swappable
          </Button>
        )}
        
        {event.status === 'SWAPPABLE' && (
          <Button onClick={handleRemoveFromMarket} variant="outline" size="sm">
            Remove from Market
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the event "{event.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default EventCard;