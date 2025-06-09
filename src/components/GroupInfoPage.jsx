import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Star, 
  Bell, 
  BellOff, 
  Shield, 
  FileText, 
  Image, 
  Link, 
  Download,
  Search,
  Heart,
  LogOut,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Camera,
  Edit3
} from 'lucide-react';
import { useGroupChatStore } from '../store/useGroupChatStore';
import { getCurrentUserFromToken } from '../lib/jwtUtils';

const GroupInfoPage = ({ group, onBack }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { getGroupMembers } = useGroupChatStore();
  const [members, setMembers] = useState([]);
  const currentUser = getCurrentUserFromToken();

  useEffect(() => {
    if (group?.id) {
      const groupMembers = getGroupMembers(group.id);
      setMembers(groupMembers);
    }
  }, [group, getGroupMembers]);

  const handleExitGroup = () => {
    if (window.confirm('Are you sure you want to exit this group?')) {
      // Implement exit group logic
      console.log('Exiting group:', group.name);
      onBack();
    }
  };

  const handleReportGroup = () => {
    if (window.confirm('Report this group?')) {
      console.log('Reporting group:', group.name);
    }
  };

  const visibleMembers = showAllMembers ? members : members.slice(0, 6);
  const remainingCount = members.length - 6;

  // Mock data for media, links, and docs
  const mediaCount = 146;
  const linksCount = 23;
  const docsCount = 8;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      {/* Header */}
      <div className="p-4 border-b border-base-300/50 bg-base-100 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-base-200 transition-colors"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold">Group info</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
                <h2 className="text-2xl font-bold text-base-content">{group.name}</h2>
                <button className="p-1 rounded-full hover:bg-base-200 transition-colors">
                  <Edit3 className="size-4 text-base-content/60" />
                </button>
              </div>
              
              {/* Member Names */}
              <p className="text-base-content/70 text-sm leading-relaxed max-w-md">
                {members.map(member => member.fullName || member.username).join(', ')}
              </p>
            </div>

            {/* Group Stats */}
            <div className="flex items-center gap-6 text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span>{members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Group Description */}
            <div className="w-full max-w-md">
              <p className="text-sm text-base-content/80 italic">
                "Udaipur trip ki baat par gour krke sabka apna name bata de..."
              </p>
              <p className="text-xs text-base-content/50 mt-1">
                Group created by {group.createdBy}, on {new Date(group.createdAt).toLocaleDateString()} at {new Date(group.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Media, Links and Docs */}
        <div className="border-b border-base-300/50">
          <button className="w-full p-4 flex items-center justify-between hover:bg-base-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="size-5 text-blue-600" />
              </div>
              <span className="font-medium">Media, links and docs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60">{mediaCount}</span>
              <ChevronRight className="size-4 text-base-content/40" />
            </div>
          </button>

          {/* Media Preview */}
          <div className="px-4 pb-4">
            <div className="flex gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-base-200 rounded-lg flex items-center justify-center">
                    <Image className="size-6 text-base-content/40" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1 w-16">
                <button className="flex-1 bg-base-200 rounded-lg flex flex-col items-center justify-center text-xs text-base-content/60 hover:bg-base-300 transition-colors">
                  <Download className="size-4 mb-1" />
                  <span>{docsCount}</span>
                </button>
                <button className="flex-1 bg-base-200 rounded-lg flex flex-col items-center justify-center text-xs text-base-content/60 hover:bg-base-300 transition-colors">
                  <Link className="size-4 mb-1" />
                  <span>{linksCount}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Starred Messages */}
        <div className="border-b border-base-300/50">
          <button className="w-full p-4 flex items-center justify-between hover:bg-base-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="size-5 text-yellow-600" />
              </div>
              <span className="font-medium">Starred messages</span>
            </div>
            <ChevronRight className="size-4 text-base-content/40" />
          </button>
        </div>

        {/* Notifications */}
        <div className="border-b border-base-300/50">
          <div className="p-4 space-y-4">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center">
                  {isMuted ? <BellOff className="size-5 text-green-600" /> : <Bell className="size-5 text-green-600" />}
                </div>
                <span className="font-medium">Muted</span>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${isMuted ? 'bg-green-500' : 'bg-base-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${isMuted ? 'translate-x-6 ml-1' : 'translate-x-1'}`} />
              </div>
            </button>
            {isMuted && (
              <p className="text-sm text-base-content/60 ml-13">Always</p>
            )}
          </div>
        </div>

        {/* Encryption */}
        <div className="border-b border-base-300/50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="size-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Encryption</div>
                <p className="text-sm text-base-content/60">Messages are end-to-end encrypted. Click to learn more.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="border-b border-base-300/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base-content">{members.length} members</h3>
              <button className="p-2 rounded-full hover:bg-base-200 transition-colors">
                <Search className="size-4 text-base-content/60" />
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-1">
              {visibleMembers.map((member, index) => {
                const isCurrentUser = member.username === currentUser?.username;
                const isAdmin = index < 4; // Mock: first 4 members are admins
                
                return (
                  <div key={member.id || member.username} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-50 transition-colors">
                    <div className="size-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                      {member.profilePic ? (
                        <img 
                          src={member.profilePic} 
                          alt={member.fullName} 
                          className="size-12 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`size-12 rounded-full bg-primary/10 flex items-center justify-center ${member.profilePic ? 'hidden' : 'flex'}`}>
                        <span className="text-primary font-semibold">
                          {(member.fullName || member.username)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base-content truncate">
                          {member.fullName || member.username}
                          {isCurrentUser && <span className="text-base-content/60"> (You)</span>}
                        </span>
                        {isAdmin && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Group admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-base-content/60 truncate">
                        {member.username === 'you' ? 'Radiating positivity in every moment! ✨' :
                         member.username === 'akshat' ? "Haven't Mind For Thinking That" What is Good or Bad In This Work" :
                         member.username === 'arsh' ? 'Hey there! I am using WhatsApp.' :
                         member.username === 'hemant' ? 'Stress less and enjoy the best 😊😎' :
                         'Hey there! I am using MessUp.'}
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

        {/* Add to Favourites */}
        <div className="border-b border-base-300/50">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-base-50 transition-colors">
            <div className="size-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Heart className="size-5 text-pink-600" />
            </div>
            <span className="font-medium">Add to favourites</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-1 p-4">
          <button 
            onClick={handleExitGroup}
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
          >
            <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center">
              <LogOut className="size-5 text-red-600" />
            </div>
            <span className="font-medium">Exit group</span>
          </button>

          <button 
            onClick={handleReportGroup}
            className="w-full p-4 flex items-center gap-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
          >
            <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <span className="font-medium">Report group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoPage;