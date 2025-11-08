import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { CreateEventRequest } from '@/types';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventRequest) => Promise<void>;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ 
  isOpen, 
  onClose, 
  onCreateEvent 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }

    if (!startDate || !startTime) {
      setError('Start date and time are required');
      return false;
    }

    if (!endDate || !endTime) {
      setError('End date and time are required');
      return false;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      const eventData: CreateEventRequest = {
        title,
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'BUSY'
      };

      if (description.trim()) {
        eventData.description = description;
      }

      await onCreateEvent(eventData);

      handleClose();
      handleClose();
    } catch (err) {
      setError('Failed to create event. Please try again.');
      console.error('Error creating event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <form onSubmit={handleSubmit}>
            <CardContent className="">
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <Label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                  placeholder="Event title"
                />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description (Optional)
                </Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  disabled={isLoading}
                  placeholder="Event description"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="startDate" className="block text-sm font-medium mb-1">
                    Start Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isLoading}
                      className="[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 pl-8"
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
                
                <div>
                  <Label htmlFor="startTime" className="block text-sm font-medium mb-1">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="endDate" className="block text-sm font-medium mb-1">
                    End Date
                  </Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isLoading}
                      className="[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 pl-8"
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
                
                <div>
                  <Label htmlFor="endTime" className="block text-sm font-medium mb-1">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-3">
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
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;