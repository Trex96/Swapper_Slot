import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SwapRequest, Event, User, SwapRequestStatus } from '@/types';

interface OutgoingRequestCardProps {
  request: SwapRequest;
  yourSlot: Event;
  theirSlot: Event;
  receiver: User;
  onCancel: (requestId: string) => Promise<void>;
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

const OutgoingRequestCard: React.FC<OutgoingRequestCardProps> = ({ 
  request,
  yourSlot,
  theirSlot,
  receiver,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const getStatusBadge = (status: SwapRequestStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Pending</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Accepted</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">Unknown</span>;
    }
  };

  const handleCancel = async () => {
    if (!request || !request.id) {
      setError('Invalid request. Cannot cancel.');
      console.error('Attempted to cancel request with missing ID:', request);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onCancel(request.id);
    } catch (err) {
      setError('Failed to cancel request. Please try again.');
      console.error('Error cancelling swap request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <Avatar name={receiver.name} className="w-8 h-8" />
            <div>
              <CardTitle className="text-lg">{receiver.name}</CardTitle>
              <CardDescription>received your swap request</CardDescription>
            </div>
          </div>
          {getStatusBadge(request.status)}
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
            <h3 className="font-medium mb-2">Your Slot</h3>
            <div className="space-y-1">
              <p className="font-medium">{yourSlot.title}</p>
              <p className="text-sm text-gray-500">
                {formatDate(yourSlot.startTime)} - {formatDate(yourSlot.endTime)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium  mb-2">Their Slot</h3>
            <div className="space-y-1">
              <p className="font-medium">{theirSlot.title}</p>
              <p className="text-sm text-gray-500">
                {formatDate(theirSlot.startTime)} - {formatDate(theirSlot.endTime)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {request.status === 'PENDING' && (
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default OutgoingRequestCard;