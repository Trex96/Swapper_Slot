import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: keyof typeof Icons;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title,
  description,
  icon = 'Inbox',
  actionText,
  onAction,
  className = ''
}) => {
  const IconComponent = Icons[icon];
  
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
        <IconComponent className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {onAction && actionText && (
        <div className="mt-6">
          <Button onClick={onAction} variant="default">
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;