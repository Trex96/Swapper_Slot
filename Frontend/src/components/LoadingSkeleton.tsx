import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface LoadingSkeletonProps {
  width?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  width = 'full',
  className = ''
}) => {
  return (
    <Card className={`w-${width} ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></CardTitle>
            <CardDescription className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></CardDescription>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      </CardFooter>
    </Card>
  );
};

export default LoadingSkeleton;