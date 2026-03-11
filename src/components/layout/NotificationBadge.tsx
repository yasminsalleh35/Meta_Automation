import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export const NotificationBadge: React.FC = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/dashboard/notifications');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative"
      onClick={handleClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};