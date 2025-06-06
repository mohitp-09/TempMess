import React, { useState } from 'react';
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react';
import { searchUser, sendFriendRequest } from '../lib/api';
import { getCurrentUserFromToken } from '../lib/jwtUtils';
import toast from 'react-hot-toast';

const AddUserModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a username or email');
      return;
    }

    setIsSearching(true);
    setRequestSent(false); // Reset request sent status
    try {
      const user = await searchUser(searchTerm.trim());
      setSearchResult(user);
    } catch (error) {
      toast.error(error.message);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!searchResult) return;

    setIsSendingRequest(true);
    try {
      // Get current user's username from JWT token
      const currentUser = getCurrentUserFromToken();
      
      if (!currentUser || !currentUser.username) {
        toast.error('Unable to get current user information. Please try logging in again.');
        return;
      }
      
      const senderUsername = currentUser.username;
      
      // Check if trying to send request to themselves
      if (senderUsername === searchResult.username) {
        toast.error("You can't send a friend request to yourself!");
        return;
      }
      
      console.log('Sending friend request from:', senderUsername, 'to:', searchResult.username);
      
      await sendFriendRequest(senderUsername, searchResult.username);
      toast.success('Friend request sent successfully!');
      setRequestSent(true);
      
      // Auto close modal after 2 seconds
      setTimeout(() => {
        setSearchResult(null);
        setSearchTerm('');
        setRequestSent(false);
        onClose();
        
        // Trigger a custom event to refresh notifications
        window.dispatchEvent(new CustomEvent('friendRequestSent'));
      }, 2000);
      
    } catch (error) {
      console.error('Friend request failed:', error);
      
      // Handle specific error cases with user-friendly messages
      switch (error.message) {
        case 'FRIEND_REQUEST_EXISTS':
          toast.error('You have already sent a friend request to this user!');
          break;
        case 'USER_NOT_FOUND':
          toast.error('User not found. Please check the username or email.');
          break;
        case 'ALREADY_FRIENDS':
          toast.success('You are already friends with this user!');
          break;
        default:
          toast.error(error.message || 'Failed to send friend request');
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResult(null);
    setRequestSent(false);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Add User</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-base-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-base-content">
              Search by username or email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Enter username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-3 py-2 bg-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Search
              </button>
            </div>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="border border-base-300 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {searchResult.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{searchResult.username}</h3>
                  <p className="text-sm text-base-content/60">{searchResult.email}</p>
                </div>
              </div>
              
              {requestSent ? (
                <div className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-500 text-white rounded-lg">
                  <Check className="size-4" />
                  Request Sent!
                </div>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={isSendingRequest}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingRequest ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  {isSendingRequest ? 'Sending...' : 'Send Friend Request'}
                </button>
              )}
            </div>
          )}

          {/* No results message */}
          {searchTerm && !searchResult && !isSearching && (
            <div className="text-center py-8 text-base-content/60">
              <Search className="size-12 mx-auto mb-2 opacity-50" />
              <p>No user found with that username or email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;