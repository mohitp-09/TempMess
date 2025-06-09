import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Loader2, Check, Search } from 'lucide-react';
import { createGroup } from '../lib/groupApi';
import { getAllFriends } from '../lib/api';
import { getCurrentUserFromToken } from '../lib/jwtUtils';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Fetch friends when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await getAllFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      toast.error('Failed to load friends list');
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (friend) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.username === friend.username);
      if (isSelected) {
        return prev.filter(member => member.username !== friend.username);
      } else {
        return [...prev, friend];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    const currentUser = getCurrentUserFromToken();
    if (!currentUser?.username) {
      toast.error('Unable to get current user information');
      return;
    }

    setIsCreating(true);
    try {
      // Include current user in the group
      const memberUsernames = [
        currentUser.username,
        ...selectedMembers.map(member => member.username)
      ];

      const groupData = {
        name: groupName.trim(),
        createdBy: currentUser.username,
        members: memberUsernames
      };

      const result = await createGroup(groupData);
      toast.success('Group created successfully!');
      
      // Reset form
      setGroupName('');
      setSelectedMembers([]);
      setSearchQuery('');
      
      // Notify parent component
      if (onGroupCreated) {
        onGroupCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(error.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Create Group
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-base-200 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 space-y-4">
            {/* Group Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-base-content">
                Group Name
              </label>
              <input
                type="text"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-2 bg-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={50}
              />
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-base-content">
                  Selected Members ({selectedMembers.length})
                </label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.username}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{member.fullName}</span>
                      <button
                        onClick={() => toggleMember(member)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Friends */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-base-content">
                Add Members
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto px-4">
            {isLoadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin size-5 text-primary" />
                  <span className="text-base-content/70 text-sm">Loading friends...</span>
                </div>
              </div>
            ) : filteredFriends.length > 0 ? (
              <div className="space-y-2 pb-4">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedMembers.some(member => member.username === friend.username);
                  
                  return (
                    <button
                      key={friend.username}
                      onClick={() => toggleMember(friend)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-base-200'
                      }`}
                    >
                      <div className="size-10 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={friend.profilePic}
                          alt={friend.fullName}
                          className="size-10 object-cover"
                          onError={(e) => {
                            e.target.src = '/avatar.png';
                          }}
                        />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-base-content">{friend.fullName}</h3>
                        <p className="text-sm text-base-content/60">@{friend.username}</p>
                      </div>
                      
                      {isSelected && (
                        <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="size-4 text-primary-content" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-base-content/60">
                <Users className="size-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {searchQuery ? 'No friends found' : 'No friends available'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-base-content/70 hover:text-base-content transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;