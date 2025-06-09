import React, { useState, useEffect } from 'react';
import { X, Phone, Video, Search, ChevronRight, ChevronDown, MoreVertical, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = ({ user, onClose, isGroup = false }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [expandActions, setExpandActions] = useState(false);
  const [userStatus, setUserStatus] = useState({ isOnline: user?.isOnline || false, lastSeen: null });
  
  const { getUserStatus } = useChatStore();

  // Update user status when it changes
  useEffect(() => {
    if (!isGroup && user?.username) {
      const status = getUserStatus(user.username);
      setUserStatus({
        isOnline: status.isOnline || user.isOnline || false,
        lastSeen: status.lastSeen
      });
    }
  }, [user, getUserStatus, isGroup]);

  // Subscribe to status updates for this specific user
  useEffect(() => {
    if (!isGroup && user?.username) {
      const interval = setInterval(() => {
        const status = getUserStatus(user.username);
        setUserStatus(prev => ({
          isOnline: status.isOnline || user.isOnline || false,
          lastSeen: status.lastSeen || prev.lastSeen
        }));
      }, 1000); // Check every second for status updates

      return () => clearInterval(interval);
    }
  }, [user?.username, getUserStatus, isGroup]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setExpandActions(false); // Close drawer when opening search
    }
  };

  const toggleActions = () => {
    setExpandActions(!expandActions);
    if (!expandActions) {
      setShowSearch(false); // Close search when opening drawer
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  const getStatusText = () => {
    if (isGroup) return 'Group Chat';
    
    if (userStatus.isOnline) {
      return 'Online';
    } else if (userStatus.lastSeen) {
      return `Last seen ${formatLastSeen(userStatus.lastSeen)}`;
    } else {
      return 'Offline';
    }
  };

  const getStatusColor = () => {
    if (isGroup) return 'bg-primary';
    return userStatus.isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  return (
    <div className="p-4 border-b border-base-300/50 bg-gradient-to-r from-base-100 to-base-50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="size-12 rounded-full ring-2 ring-base-300/50 shadow-md overflow-hidden">
              {isGroup ? (
                <div className="size-12 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
              ) : (
                <img
                  src={user.profilePic}
                  alt={user.fullName}
                  className="size-12 rounded-full object-cover"
                />
              )}
              {!isGroup && (
                <span 
                  className={`absolute bottom-0 right-0 size-3.5 ${getStatusColor()} rounded-full ring-2 ring-white shadow-sm transition-colors duration-300`}
                />
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-base-content text-lg flex items-center gap-2">
              {isGroup && <Users className="size-4" />}
              {user.fullName}
            </h3>
            <p className="text-sm text-base-content/60 flex items-center gap-2 transition-all duration-300">
              {isGroup ? (
                <>
                  <Users className="size-3" />
                  Group Chat
                </>
              ) : (
                <>
                  <span className={`size-2 rounded-full ${getStatusColor()} transition-colors duration-300`}></span>
                  <span className="transition-all duration-300">
                    {getStatusText()}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          {/* Search input that appears when search icon is clicked */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center mr-3 ${showSearch ? 'w-48 sm:w-64 opacity-100' : 'w-0 opacity-0'}`}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search conversation..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-base-200/80 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-base-200 transition-all duration-200 border border-base-300/50"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
            </div>
          </div>

          {/* Desktop view: all icons visible */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={toggleSearch}
              className="p-2.5 rounded-xl hover:bg-base-200/80 transition-all duration-200 group"
              aria-label="Search conversation"
            >
              <Search className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
            </button>
            {!isGroup && (
              <>
                <button
                  className="p-2.5 rounded-xl hover:bg-base-200/80 transition-all duration-200 group"
                  aria-label="Voice call"
                >
                  <Phone className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
                </button>
                <button
                  className="p-2.5 rounded-xl hover:bg-base-200/80 transition-all duration-200 group"
                  aria-label="Video call"
                >
                  <Video className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
                </button>
              </>
            )}
          </div>

          {/* Mobile view: collapsible menu */}
          <div className="sm:hidden relative">
            {expandActions ? (
              <div className="absolute right-0 top-full mt-2 bg-base-100 rounded-xl shadow-xl border border-base-300/50 py-2 z-10 min-w-[160px] backdrop-blur-sm">
                <button
                  onClick={toggleSearch}
                  className="flex items-center w-full px-4 py-3 hover:bg-base-200/80 transition-colors"
                  aria-label="Search conversation"
                >
                  <Search className="size-4 mr-3 text-base-content/70" />
                  <span className="text-sm font-medium">Search</span>
                </button>
                {!isGroup && (
                  <>
                    <button
                      className="flex items-center w-full px-4 py-3 hover:bg-base-200/80 transition-colors"
                      aria-label="Voice call"
                    >
                      <Phone className="size-4 mr-3 text-base-content/70" />
                      <span className="text-sm font-medium">Call</span>
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-3 hover:bg-base-200/80 transition-colors"
                      aria-label="Video call"
                    >
                      <Video className="size-4 mr-3 text-base-content/70" />
                      <span className="text-sm font-medium">Video</span>
                    </button>
                  </>
                )}
              </div>
            ) : null}

            <button
              onClick={toggleActions}
              className="p-2.5 rounded-xl hover:bg-base-200/80 transition-all duration-200 group"
              aria-label="More options"
            >
              <MoreVertical className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all duration-200 ml-2 group"
            aria-label="Close chat"
          >
            <X className="size-5 text-base-content/70 group-hover:text-red-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;