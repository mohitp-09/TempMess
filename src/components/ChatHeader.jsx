import React, { useState } from 'react';
import { X, Phone, Video, Search, MoreVertical, Users, Zap, Heart } from "lucide-react";

const ChatHeader = ({ user, onClose, isGroup = false }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [expandActions, setExpandActions] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setExpandActions(false);
    }
  };

  const toggleActions = () => {
    setExpandActions(!expandActions);
    if (!expandActions) {
      setShowSearch(false);
    }
  };

  return (
    <div className="p-6 border-b border-white/10 glass-strong relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="size-14 rounded-2xl shadow-macos overflow-hidden glass-subtle">
              {isGroup ? (
                <div className="size-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Users className="size-7 text-purple-600" />
                </div>
              ) : (
                <img
                  src={user.profilePic}
                  alt={user.fullName}
                  className="size-14 rounded-2xl object-cover"
                />
              )}
              {user.isOnline && !isGroup && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-macos animate-pulse-glow" />
              )}
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-base-content text-xl flex items-center gap-2">
              {isGroup && <Users className="size-5 text-purple-600" />}
              {user.fullName}
            </h3>
            <p className="text-sm text-base-content/60 flex items-center gap-2 font-medium">
              {isGroup ? (
                <>
                  <Users className="size-3" />
                  Group Chat
                </>
              ) : (
                <>
                  <div className={`size-2 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {user.isOnline ? (
                    <span className="flex items-center gap-1">
                      <Zap className="size-3 text-green-500" />
                      Online
                    </span>
                  ) : (
                    "Offline"
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Enhanced Search Input */}
          <div className={`overflow-hidden transition-all duration-500 ease-out flex items-center ${showSearch ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search conversation..."
                className="input-macos pl-10 text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={toggleSearch}
              className="p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group hover-lift shadow-macos"
              aria-label="Search conversation"
            >
              <Search className="size-5 text-base-content/70 group-hover:text-primary transition-colors" />
            </button>
            {!isGroup && (
              <>
                <button
                  className="p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group hover-lift shadow-macos"
                  aria-label="Voice call"
                >
                  <Phone className="size-5 text-base-content/70 group-hover:text-green-500 transition-colors" />
                </button>
                <button
                  className="p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group hover-lift shadow-macos"
                  aria-label="Video call"
                >
                  <Video className="size-5 text-base-content/70 group-hover:text-blue-500 transition-colors" />
                </button>
              </>
            )}
          </div>

          {/* Enhanced Mobile Menu */}
          <div className="sm:hidden relative">
            {expandActions && (
              <div className="absolute right-0 top-full mt-3 card-macos-strong py-2 z-20 min-w-[180px] animate-scale-in">
                <button
                  onClick={toggleSearch}
                  className="flex items-center w-full px-4 py-3 glass-subtle hover:glass-strong transition-all duration-300 mx-2 rounded-lg"
                  aria-label="Search conversation"
                >
                  <Search className="size-4 mr-3 text-base-content/70" />
                  <span className="text-sm font-medium">Search</span>
                </button>
                {!isGroup && (
                  <>
                    <button
                      className="flex items-center w-full px-4 py-3 glass-subtle hover:glass-strong transition-all duration-300 mx-2 rounded-lg"
                      aria-label="Voice call"
                    >
                      <Phone className="size-4 mr-3 text-base-content/70" />
                      <span className="text-sm font-medium">Call</span>
                    </button>
                    <button
                      className="flex items-center w-full px-4 py-3 glass-subtle hover:glass-strong transition-all duration-300 mx-2 rounded-lg"
                      aria-label="Video call"
                    >
                      <Video className="size-4 mr-3 text-base-content/70" />
                      <span className="text-sm font-medium">Video</span>
                    </button>
                  </>
                )}
              </div>
            )}

            <button
              onClick={toggleActions}
              className="p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group hover-lift shadow-macos"
              aria-label="More options"
            >
              <MoreVertical className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
            </button>
          </div>

          {/* Enhanced Close Button */}
          <button
            onClick={onClose}
            className="p-3 rounded-xl glass-subtle hover:bg-red-500/20 hover:text-red-500 transition-all duration-300 ml-2 group hover-lift shadow-macos"
            aria-label="Close chat"
          >
            <X className="size-5 text-base-content/70 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;