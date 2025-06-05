import React, { useState } from 'react';
import { X, Phone, Video, Search, ChevronRight, ChevronDown } from "lucide-react";

const ChatHeader = ({ user, onClose }) => {
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

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full">
              <img
                src={user.profilePic}
                alt={user.fullName}
                className="size-10 rounded-full object-cover"
              />
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white" />
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium">{user.fullName}</h3>
            <p className="text-sm text-gray-500">
              {user.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          {/* Search input that appears when search icon is clicked */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center mr-2 ${showSearch ? 'w-40 sm:w-56 opacity-100' : 'w-0 opacity-0'}`}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search conversation..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            </div>
          </div>

          {/* Desktop view: all icons visible */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={toggleSearch}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Search conversation"
            >
              <Search className="size-5 text-gray-600" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Voice call"
            >
              <Phone className="size-5 text-gray-600" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Video call"
            >
              <Video className="size-5 text-gray-600" />
            </button>
          </div>

          {/* Mobile view: collapsible menu */}
          <div className="sm:hidden relative">
            {expandActions ? (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                <button
                  onClick={toggleSearch}
                  className="flex items-center w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                  aria-label="Search conversation"
                >
                  <Search className="size-4 mr-2 text-gray-600" />
                  <span className="text-sm">Search</span>
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                  aria-label="Voice call"
                >
                  <Phone className="size-4 mr-2 text-gray-600" />
                  <span className="text-sm">Call</span>
                </button>
                <button
                  className="flex items-center w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                  aria-label="Video call"
                >
                  <Video className="size-4 mr-2 text-gray-600" />
                  <span className="text-sm">Video</span>
                </button>
              </div>
            ) : null}

            <button
              onClick={toggleActions}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="More options"
            >
              {expandActions ?
                <ChevronDown className="size-5 text-gray-600" /> :
                <ChevronRight className="size-5 text-gray-600" />
              }
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-1"
            aria-label="Close chat"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
