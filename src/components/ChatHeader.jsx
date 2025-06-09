import React, { useState } from 'react';
import { X, Phone, Video, Search, ChevronRight, ChevronDown, MoreVertical, Users } from "lucide-react";

const ChatHeader = ({ user, onClose, isGroup = false, onGroupInfoClick }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [expandActions, setExpandActions] = useState(false);

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

  const handleHeaderClick = () => {
    if (isGroup && onGroupInfoClick) {
      onGroupInfoClick();
    }
  };

  return (
    <div className="p-4 border-b border-base-300/50 bg-gradient-to-r from-base-100 to-base-50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
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
              {user.isOnline && !isGroup && (
                <span className="absolute bottom-0 right-0 size-3.5 bg-green-500 rounded-full ring-2 ring-white shadow-sm" />
              )}
            </div>
          </div>
          
          <button 
            onClick={handleHeaderClick}
            className={`flex-1 min-w-0 text-left ${isGroup ? 'hover:bg-base-200/50 rounded-lg p-2 -m-2 transition-colors' : ''}`}
          >
            <h3 className="font-semibold text-base-content text-lg flex items-center gap-2 truncate">
              {isGroup && <Users className="size-4 flex-shrink-0" />}
              {user.fullName}
            </h3>
            <p className="text-sm text-base-content/60 flex items-center gap-2 truncate">
              {isGroup ? (
                <>
                  <Users className="size-3 flex-shrink-0" />
                  <span className="truncate">
                    {/* Extract member names from fullName if it contains member count */}
                    {user.fullName.includes('members') 
                      ? user.memberNames || 'Group members'
                      : user.memberNames || 'Group Chat'
                    }
                  </span>
                </>
              ) : (
                <>
                  <span className={`size-2 rounded-full flex-shrink-0 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {user.isOnline ? "Online" : "Offline"}
                </>
              )}
            </p>
          </button>
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