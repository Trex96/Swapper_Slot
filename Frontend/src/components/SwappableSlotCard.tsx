import React from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

interface SwappableSlotCardProps {
  event: Event;
  onRequestSwap?: (eventId: string) => void;
}

const Avatar: React.FC<{ name: string; className?: string }> = ({ name, className = '' }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden bg-blue-100 rounded-full border border-blue-300 ${className}`}>
      <span className="font-medium text-blue-800 text-sm">
        {getInitials(name)}
      </span>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
};

const SwappableSlotCard: React.FC<SwappableSlotCardProps> = ({ 
  event,
  onRequestSwap
}) => {
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleRequestSwap = () => {
    if (onRequestSwap) {
      onRequestSwap(event.id);
    }
  };

  let userName = 'Unknown User';
  if (event.owner?.name) {
    userName = event.owner.name;
  } else if (typeof event.userId === 'object' && event.userId !== null && 'name' in event.userId) {
    userName = (event.userId as { name: string }).name;
  }

  return (
    <Card >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription >
              {formatDate(event.startTime)} - {formatDate(event.endTime)}
            </CardDescription>
          </div>
          <Badge >
            Available
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {event.description && (
          <p >{event.description}</p>
        )}
        <div className="flex items-center space-x-2 mt-4">
          <Avatar name={userName} className="w-8 h-8" />
          <span className="text-sm font-medium">
            {userName}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleRequestSwap}
          size="sm"
        >
          Request Swap
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SwappableSlotCard;