import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, UserPlus } from 'lucide-react';
import { getUnreadNotifications, markNotificationAsRead, acceptFriendRequest, rejectFriendRequest } from '../lib/api';
import toast from 'react-hot-toast';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getUnreadNotifications();
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleAcceptFriendRequest = async (requestId, notificationId) => {
    try {
      await acceptFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept friend request');
    }
  };

  const handleRejectFriendRequest = async (requestId, notificationId) => {
    try {
      await rejectFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      toast.success('Friend request rejected');
    } catch (error) {
      toast.error('Failed to reject friend request');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-base-200 transition-colors"
      >
        <Bell className="size-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-base-300">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-base-content/60">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-base-content/60">
                <Bell className="size-12 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-base-300">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-3 hover:bg-base-200/50">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="size-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-content">
                          {notification.message}
                        </p>
                        <p className="text-xs text-base-content/60 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        
                        {/* Friend request actions */}
                        {notification.type === 'FRIEND_REQUEST' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleAcceptFriendRequest(notification.relatedId, notification.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            >
                              <Check className="size-3" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectFriendRequest(notification.relatedId, notification.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                            >
                              <X className="size-3" />
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {/* General notification mark as read */}
                        {notification.type !== 'FRIEND_REQUEST' && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;