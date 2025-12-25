"use client";

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Notification } from '@/src/generated/models'; // Assuming generated types

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data: Notification[] = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds for better responsiveness
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const response = await fetch('/api/notifications', { method: 'PUT' });
      if (response.ok) {
        setUnreadCount(0);
        // Optimistically update the UI
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if(open) {
            handleMarkAsRead();
        }
    }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-semibold border-b">Notifications</div>
        <div className="flex flex-col max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
                <div key={notification.id} className={`p-4 border-b ${!notification.isRead && 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    {notification.link ? (
                        <Link href={notification.link} className="hover:underline" onClick={() => setIsOpen(false)}>
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                            </p>
                        </Link>
                    ) : (
                        <div>
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                            </p>
                        </div>
                    )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
