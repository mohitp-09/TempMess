import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Calendar, 
  LogOut,
  AlertTriangle,
  MoreVertical,
  Camera,
  Edit3
} from 'lucide-react';
import { useGroupChatStore } from '../store/useGroupChatStore';
import { getCurrentUserFromToken } from '../lib/jwtUtils';

const GroupInfoPanel = ({ group, isOpen, onClose }) => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { getGroupMembers } = useGroupChatStore();
  const [members, setMembers] = useState([]);
  const currentUser = getCurrentUserFromToken();

  useEffect(() => {
    if (group?.id && isOpen) {
      const groupMembers = getGroupMembers(group.id);
      setMembers(Array.isArray(groupMembers) ? groupMembers : []);
    }
  }, [group, getGroupMembers, isOpen]);

  const handleExitGroup = () => {
    if (window.confirm('Are you sure you want to exit this group?')) {
      console.log('Exiting group:', group?.name);
      onClose();
    }
  };

  // Safe member name extraction
  const getMemberName = (member) => {
    if (!member) return 'Unknown User';
    if (typeof member === 'string') return member;
    if (typeof member === 'object' && member !== null) {
      return member.fullName || member.username || member.name || 'Unknown User';
    }
    return 'Unknown User';
  };

  const getMemberUsername = (member) => {
    if (!member) return 'unknown';
    if (typeof member === 'string') return member;
    if (typeof member === 'object' && member !== null) {
      return member.username || member.name || 'unknown';
    }
    return 'unknown';
  };

  const getMemberProfilePic = (member) => {
    if (!member || typeof member !== 'object') return null;
    return member.profilePic || member.profilePicture || null;
  };

  const visibleMembers = showAllMembers ? members : members.slice(0, 6);
  const remainingCount = Math.max(0, members.length - 6);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Slide-in Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-base-300/50 bg-base-100 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-base-200 transition-colors"
          >
            <X className="size-5" />
          </button>
          <h1 className="text-lg font-semibold">Group info</h1>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto h-full pb-20">
          {/* Group Profile Section */}
          <div className="p-6 border-b border-base-300/50 bg-base-50">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Group Avatar */}
              <div className="relative">
                <div className="size-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg">
                  <Users className="size-16 text-primary" />
                </div>
                <button className="absolute bottom-2 right-2 size-10 bg-primary text-primary-content rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="size-5" />
                </button>
              </div>

              {/* Group Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-base-content">{group?.name || 'Group Name'}</h2>
                  <button className="p-1 rounded-full hover:bg-base-200 transition-colors">
                    <Edit3 className="size-4 text-base-content/60" />
                  </button>
                </div>
              </div>

              {/* Group Stats */}
              <div className="flex items-center gap-6 text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <Users className="size-4" />
                  <span>{members.length} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>Created {group?.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>

              {/* Created By */}
              <div className="w-full max-w-md">
                <p className="text-xs text-base-content/50">
                  Group created by <span className="font-medium text-primary">{group?.createdBy || 'Unknown'}</span>
                  {group?.createdAt && (
                    <span> on {new Date(group.createdAt).toLocaleDateString()} at {new Date(group.createdAt).toLocaleTimeString()}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="border-b border-base-300/50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base-content">{members.length} members</h3>
              </div>

              {/* Members List */}
              <div className="space-y-1">
                {visibleMembers.map((member, index) => {
                  const memberName = getMemberName(member);
                  const memberUsername = getMemberUsername(member);
                  const memberProfilePic = getMemberProfilePic(member);
                  const isCurrentUser = memberUsername === currentUser?.username;
                  const isCreator = memberUsername === group?.createdBy;
                  
                  return (
                    <div key={member?.id || memberUsername || index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-50 transition-colors group">
                      <div className="size-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                        {memberProfilePic ? (
                          <img 
                            src={memberProfilePic} 
                            alt={memberName} 
                            className="size-12 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`size-12 rounded-full bg-primary/10 flex items-center justify-center ${memberProfilePic ? 'hidden' : 'flex'}`}>
                          <span className="text-primary font-semibold">
                            {memberName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-base-content truncate">
                            {memberName}
                            {isCurrentUser && <span className="text-base-content/60"> (You)</span>}
                          </span>
                          {isCreator && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-base-content/60 truncate">
                          @{memberUsername}
                        </p>
                      </div>

                      <button className="p-2 rounded-full hover:bg-base-200 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="size-4 text-base-content/60" />
                      </button>
                    </div>
                  );
                })}

                {/* Show More Members */}
                {!showAllMembers && remainingCount > 0 && (
                  <button
                    onClick={() => setShowAllMembers(true)}
                    className="w-full p-2 text-left text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    View all ({remainingCount} more)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Exit Group Button */}
          <div className="p-4">
            <button 
              onClick={handleExitGroup}
              className="w-full p-4 flex items-center gap-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
            >
              <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center">
                <LogOut className="size-5 text-red-600" />
              </div>
              <span className="font-medium">Exit group</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupInfoPanel;