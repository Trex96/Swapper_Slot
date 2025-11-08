import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Event } from '@/types';

interface SwapRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: Event;
  userSwappableSlots: Event[];
  onCreateSwapRequest: (mySlotId: string, theirSlotId: string) => Promise<void>;
}

const SwapRequestDialog: React.FC<SwapRequestDialogProps> = ({ 
  isOpen, 
  onClose, 
  targetSlot, 
  userSwappableSlots,
  onCreateSwapRequest
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleClose = () => {
    setSelectedSlotId(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlotId) {
      setError('Please select one of your slots to offer in exchange');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCreateSwapRequest(selectedSlotId, targetSlot.id);
      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create swap request. Please try again.');
      }
      console.error('Error creating swap request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  let targetUserName = 'Unknown User';
  if (targetSlot.owner?.name) {
    targetUserName = targetSlot.owner.name;
  } else if (typeof targetSlot.userId === 'object' && targetSlot.userId !== null && 'name' in targetSlot.userId) {
    targetUserName = (targetSlot.userId as { name: string }).name;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Slot Swap</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Target Slot</h3>
          <Card className="border-blue-20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg ">{targetSlot.title}</CardTitle>
                  <CardDescription className="mt-1 text-yellow-700">
                    {formatDate(targetSlot.startTime)} - {formatDate(targetSlot.endTime)}
                  </CardDescription>
                </div>
                <div className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {targetUserName}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Your Swappable Slots</h3>
          {userSwappableSlots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              You don't have any swappable slots. Make some of your events swappable first.
            </div>
          ) : (
            <div className="space-y-3">
              {userSwappableSlots.map((slot) => (
                <div 
                  key={slot.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSlotId === slot.id 
                      ? 'border-blue-50 ' 
                      : ' hover:border-gray-300'
                  }`}
                  onClick={() => !isLoading && setSelectedSlotId(slot.id)}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      id={`slot-${slot.id}`}
                      name="selectedSlot"
                      checked={selectedSlotId === slot.id}
                      onChange={() => !isLoading && setSelectedSlotId(slot.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  <Label 
                    htmlFor={`slot-${slot.id}`}
                    className="ml-3 flex-1 cursor-pointer"
                  >
                    <div className="font-medium ">{slot.title}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(slot.startTime)} - {formatDate(slot.endTime)}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !selectedSlotId}
          >
            {isLoading ? 'Requesting...' : 'Confirm Swap Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwapRequestDialog;