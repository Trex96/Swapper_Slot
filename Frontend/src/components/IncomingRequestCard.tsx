import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SwapRequest, Event, User } from '@/types';

interface IncomingRequestCardProps {
  request: SwapRequest;
  theirSlot: Event;
  yourSlot: Event;
  requester: User;
  onRespond: (requestId: string, status: 'ACCEPTED' | 'REJECTED') => Promise<void>;
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

const IncomingRequestCard: React.FC<IncomingRequestCardProps> = ({ 
  request,
  theirSlot,
  yourSlot,
  requester,
  onRespond
}) => {
  const [loading, setLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleRespond = async (status: 'ACCEPTED' | 'REJECTED') => {
    if (actionTaken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await onRespond(request.id, status);
      setActionTaken(true);
    } catch (err) {
      setError('Failed to respond to request. Please try again.');
      console.error('Error responding to swap request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => handleRespond('ACCEPTED');
  const handleReject = () => handleRespond('REJECTED');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar name={requester.name} className="w-8 h-8" />
            <div>
              <CardTitle className="text-lg">{requester.name}</CardTitle>
              <CardDescription>has requested a slot swap</CardDescription>
            </div>
          </div>
          <div className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {request.status}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Their Slot</h3>
            <div className="space-y-1">
              <p className="font-medium">{theirSlot.title}</p>
              <p className="text-sm text-gray-500">
                {formatDate(theirSlot.startTime)} - {formatDate(theirSlot.endTime)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-medium text-gray-900 mb-2">Your Slot</h3>
            <div className="space-y-1">
              <p className="font-medium">{yourSlot.title}</p>
              <p className="text-sm text-gray-500">
                {formatDate(yourSlot.startTime)} - {formatDate(yourSlot.endTime)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-3">
        <Button
          onClick={handleReject}
          variant="destructive"
          disabled={loading || actionTaken}
          size="sm"
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </Button>
        <Button
          onClick={handleAccept}
          variant="default"
          disabled={loading || actionTaken}
          size="sm"
        >
          {loading ? 'Accepting...' : 'Accept'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default IncomingRequestCard;