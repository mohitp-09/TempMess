import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { getUnreadNotifications, markNotificationAsRead, acceptFriendRequest, rejectFriendRequest, getUserById } from '../lib/api';
import toast from 'react-hot-toast';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userCache, setUserCache] = useState({}); // Cache for user details
  const [processingRequests, setProcessingRequests] = useState(new Set()); // Track processing requests
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

  // Auto-refresh notifications every 30 seconds when dropdown is open
  useEffect(() => {
    let interval;
    if (isOpen) {
      interval = setInterval(() => {
        fetchNotifications();
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  // Fetch notifications on component mount to get initial count
  useEffect(() => {
    fetchNotifications();
    
    // Set up periodic refresh every 2 minutes for notification count
    const interval = setInterval(() => {
      fetchNotifications();
    }, 120000); // 2 minutes
    
    // Listen for friend request sent events
    const handleFriendRequestSent = () => {
      setTimeout(() => {
        fetchNotifications();
      }, 1000); // Wait 1 second for backend to process
    };
    
    window.addEventListener('friendRequestSent', handleFriendRequestSent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('friendRequestSent', handleFriendRequestSent);
    };
  }, []);

  const fetchUserDetails = async (userId) => {
    // Check cache first
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      console.log(`Fetching user details for ID: ${userId}`);
      const userDetails = await getUserById(userId);
      console.log(`User details fetched:`, userDetails);
      
      // Cache the user details
      setUserCache(prev => ({
        ...prev,
        [userId]: userDetails
      }));
      return userDetails;
    } catch (error) {
      console.error(`Failed to fetch user details for ID ${userId}:`, error);
      // Return a default user object
      return {
        id: userId,
        username: 'Unknown User',
        email: '',
        profilePic: '/avatar.png' // Default avatar
      };
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getUnreadNotifications();
      console.log('Fetched notifications:', data);
      
      const notificationsArray = Array.isArray(data) ? data : [];
      
      // Process notifications to get sender details
      const notificationsWithUserDetails = await Promise.all(
        notificationsArray.map(async (notification) => {
          console.log('Processing notification:', notification);
          
          // For friend requests, use reference_id to get sender details
          if (notification.type === 'FRIEND_REQUEST' || notification.type === 'friend_request') {
            const senderId = notification.reference_id; // reference_id points to sender_id in friend_requests
            
            if (senderId) {
              try {
                console.log(`Fetching sender details for notification ${notification.id}, sender ID: ${senderId}`);
                const senderDetails = await fetchUserDetails(senderId);
                
                return {
                  ...notification,
                  senderDetails: senderDetails,
                  // Store the friend request ID for accept/reject actions
                  friendRequestId: notification.reference_id
                };
              } catch (error) {
                console.error('Failed to fetch sender details:', error);
                return {
                  ...notification,
                  senderDetails: {
                    id: senderId,
                    username: 'Unknown User',
                    email: '',
                    profilePic: '/avatar.png'
                  }
                };
              }
            }
          }
          
          return notification;
        })
      );
      
      console.log('Notifications with user details:', notificationsWithUserDetails);
      setNotifications(notificationsWithUserDetails);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Don't show error toast for background fetches
      if (isOpen) {
        toast.error('Failed to fetch notifications');
      }
      // Set empty array on error
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleAcceptFriendRequest = async (requestId, notificationId) => {
    // Prevent multiple clicks
    if (processingRequests.has(requestId)) {
      return;
    }

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      console.log(`Accepting friend request ID: ${requestId}, notification ID: ${notificationId}`);
      
      // Validate requestId
      if (!requestId) {
        throw new Error('Invalid request ID');
      }

      await acceptFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      toast.success('Friend request accepted!');
      
      // Refresh notifications to get updated list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      
      // Show user-friendly error message
      if (error.message.includes('connect to server')) {
        toast.error('Unable to connect to server. Please check your connection and try again.');
      } else if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error.message || 'Failed to accept friend request');
      }
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectFriendRequest = async (requestId, notificationId) => {
    // Prevent multiple clicks
    if (processingRequests.has(requestId)) {
      return;
    }

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      console.log(`Rejecting friend request ID: ${requestId}, notification ID: ${notificationId}`);
      
      // Validate requestId
      if (!requestId) {
        throw new Error('Invalid request ID');
      }

      await rejectFriendRequest(requestId);
      await handleMarkAsRead(notificationId);
      toast.success('Friend request rejected');
      
      // Refresh notifications to get updated list
      fetchNotifications();
    } catch (error) {
      console.error('Failed to reject friend request:', error);
      
      // Show user-friendly error message
      if (error.message.includes('connect to server')) {
        toast.error('Unable to connect to server. Please check your connection and try again.');
      } else if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error.message || 'Failed to reject friend request');
      }
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatTimeAgo = (timestamp) => {
    try {
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
    } catch (error) {
      return 'Recently';
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Fetch fresh notifications when opening
      fetchNotifications();
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
    toast.success('Notifications refreshed');
  };

  const getNotificationMessage = (notification) => {
    if (notification.senderDetails) {
      return `${notification.senderDetails.username} sent you a friend request`;
    }
    return notification.message || 'New friend request';
  };

  const getUserAvatar = (notification) => {
    if (notification.senderDetails?.profilePic) {
      return notification.senderDetails.profilePic;
    }
    return `/avatar.png`; // Use default avatar
  };

  const getUserInitial = (notification) => {
    if (notification.senderDetails?.username) {
      return notification.senderDetails.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 rounded-full hover:bg-base-200 transition-colors"
        aria-label="Notifications"
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
          <div className="p-3 border-b border-base-300 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              disabled={isLoading}
            >
              <RefreshCw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-4 text-center text-base-content/60">
                <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-base-content/60">
                <Bell className="size-12 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
                <p className="text-xs mt-1">Friend requests will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-base-300">
                {notifications.map((notification) => {
                  const isProcessing = processingRequests.has(notification.friendRequestId || notification.reference_id);
                  
                  return (
                    <div key={notification.id} className="p-3 hover:bg-base-200/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* User Avatar */}
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {notification.senderDetails?.profilePic ? (
                            <img 
                              src={getUserAvatar(notification)} 
                              alt={notification.senderDetails?.username || 'User'} 
                              className="size-10 rounded-full object-cover"
                              onError={(e) => {
                                // Fallback to initial if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`size-10 rounded-full bg-primary/10 flex items-center justify-center ${
                              notification.senderDetails?.profilePic ? 'hidden' : 'flex'
                            }`}
                          >
                            <span className="text-primary font-medium text-sm">
                              {getUserInitial(notification)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-base-content">
                            {getNotificationMessage(notification)}
                          </p>
                          {notification.senderDetails?.email && (
                            <p className="text-xs text-base-content/50 mt-0.5">
                              {notification.senderDetails.email}
                            </p>
                          )}
                          <p className="text-xs text-base-content/60 mt-1">
                            {formatTimeAgo(notification.createdAt || notification.timestamp)}
                          </p>
                          
                          {/* Friend request actions */}
                          {(notification.type === 'FRIEND_REQUEST' || notification.type === 'friend_request') && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleAcceptFriendRequest(
                                  notification.friendRequestId || notification.reference_id, 
                                  notification.id
                                )}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessing ? (
                                  <div className="size-3 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectFriendRequest(
                                  notification.friendRequestId || notification.reference_id, 
                                  notification.id
                                )}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isProcessing ? (
                                  <div className="size-3 border border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X className="size-3" />
                                )}
                                Reject
                              </button>
                            </div>
                          )}
                          
                          {/* General notification mark as read */}
                          {notification.type !== 'FRIEND_REQUEST' && notification.type !== 'friend_request' && (
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;