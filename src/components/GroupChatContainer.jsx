import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import GroupInfoPanel from "./GroupInfoPanel";
import { formatMessageTime, getDateLabel } from "../lib/utils";
import { useGroupChatStore } from "../store/useGroupChatStore";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { MessageSquare, Sparkles, Loader2, Check, CheckCheck, Users, UserPlus } from "lucide-react";

const GroupChatContainer = ({ selectedGroup, onClose }) => {
  const messageEndRef = useRef(null);
  const { 
    getMessagesForGroup, 
    sendGroupMessage, 
    isLoading,
    isLoadingOldMessages,
    getGroupMembers
  } = useGroupChatStore();
  
  const [messages, setMessages] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const authUser = getCurrentUserFromToken();

  // Get messages for the selected group
  useEffect(() => {
    if (selectedGroup) {
      const groupMessages = getMessagesForGroup(selectedGroup.id);
      setMessages(groupMessages);
      
      // Get group members
      const members = getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
    }
  }, [selectedGroup, getMessagesForGroup, getGroupMembers]);

  // Subscribe to message updates for this group
  useEffect(() => {
    if (!selectedGroup) return;

    const interval = setInterval(() => {
      const groupMessages = getMessagesForGroup(selectedGroup.id);
      setMessages(groupMessages);
      
      // Update members as well
      const members = getGroupMembers(selectedGroup.id);
      setGroupMembers(members);
    }, 1000); // Check for new messages every second

    return () => clearInterval(interval);
  }, [selectedGroup, getMessagesForGroup, getGroupMembers]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (text, image) => {
    if (!text.trim() && !image) return;

    const success = await sendGroupMessage(selectedGroup.id, text, image);
    if (!success) {
      console.error('Failed to send group message');
    }
  };

  const handleGroupInfoClick = () => {
    setShowGroupInfo(true);
  };

  const handleCloseGroupInfo = () => {
    setShowGroupInfo(false);
  };

  if (!selectedGroup) {
    return null;
  }

  const isLoadingMessages = isLoadingOldMessages(selectedGroup.id);

  // Function to check if messages are consecutive (same sender, within 2 minutes)
  const isConsecutiveMessage = (currentMsg, prevMsg) => {
    if (!prevMsg || !currentMsg) return false;
    
    const isSameSender = currentMsg.senderId === prevMsg.senderId;
    const timeDiff = new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt);
    const isWithinTimeLimit = timeDiff < 2 * 60 * 1000; // 2 minutes
    
    return isSameSender && isWithinTimeLimit;
  };

  // Function to get message status with proper icons
  const getMessageStatus = (message, isOwnMessage) => {
    if (!isOwnMessage) return null;
    
    if (message.isTemp) {
      return {
        icon: <Loader2 className="size-3 animate-spin" />,
        text: "Sending...",
        className: "text-white/60"
      };
    }
    
    // For group messages, we'll show delivered status
    return {
      icon: <CheckCheck className="size-3" />,
      text: "Delivered",
      className: "text-white/70"
    };
  };

  // Safe member names extraction
  const getMemberNames = () => {
    if (!Array.isArray(groupMembers) || groupMembers.length === 0) {
      return 'No members';
    }
    
    return groupMembers
      .map(member => {
        if (typeof member === 'string') return member;
        if (typeof member === 'object' && member !== null) {
          return member.fullName || member.username || member.name || 'Unknown';
        }
        return 'Unknown';
      })
      .filter(name => name && name !== 'Unknown')
      .join(', ');
  };

  // Create a user object for the header with member names
  const groupAsUser = {
    fullName: selectedGroup.name,
    profilePic: '/avatar.png', // Default group avatar
    isOnline: true, // Groups are always "online"
    username: selectedGroup.name,
    memberNames: getMemberNames()
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100 relative">
      <ChatHeader 
        user={groupAsUser} 
        onClose={onClose} 
        isGroup={true}
        onGroupInfoClick={handleGroupInfoClick}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-base-100 to-base-50">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 bg-base-200/50 backdrop-blur-sm rounded-full px-6 py-3">
              <Loader2 className="animate-spin size-5 text-primary" />
              <span className="text-base-content/70 text-sm font-medium">Loading group history...</span>
            </div>
          </div>
        ) : isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 bg-base-200/50 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-base-content/70 text-sm font-medium">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* Group Icon */}
            <div className="flex justify-center gap-4 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center animate-bounce shadow-lg border border-primary/20 backdrop-blur-sm">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary/60 animate-pulse" />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary/90 backdrop-blur-sm text-primary-content text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-primary/30">
                    Group
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 max-w-sm">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-base-content">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    {selectedGroup.name}
                  </span>
                  !
                </h3>
                
                <p className="text-base-content/60 leading-relaxed">
                  Start the conversation! Send your first message to get everyone talking ✨
                </p>
              </div>

              {/* Group info */}
              <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-4 text-primary" />
                  <p className="text-sm text-primary/80 font-medium">
                    {groupMembers.length} members in this group
                  </p>
                </div>
                <p className="text-xs text-primary/60">
                  Everyone will see your messages
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const currDate = new Date(message.createdAt).toDateString();
            const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
            const showDateLabel = currDate !== prevDate;

            const isOwnMessage = message.senderId === authUser?.username;
            const isConsecutive = isConsecutiveMessage(message, prevMessage);
            const isLastInGroup = !nextMessage || !isConsecutiveMessage(nextMessage, message);

            const messageStatus = getMessageStatus(message, isOwnMessage);

            // Check if this is a system message
            const isSystemMessage = message.senderId === 'System' || message.senderId === null;

            return (
              <div key={message._id}>
                {showDateLabel && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-base-200/80 backdrop-blur-sm text-base-content/60 text-xs font-medium px-4 py-2 rounded-full shadow-sm">
                      {getDateLabel(message.createdAt)}
                    </div>
                  </div>
                )}

                {isSystemMessage ? (
                  // System message styling
                  <div className="flex justify-center my-4">
                    <div className="bg-base-200/60 text-base-content/70 text-xs px-3 py-1 rounded-full">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${
                      isConsecutive ? "mb-1" : "mb-3"
                    }`}
                    ref={index === messages.length - 1 ? messageEndRef : null}
                  >
                    {/* Avatar - only show for first message in group and received messages */}
                    {!isOwnMessage && !isConsecutive && (
                      <div className="mr-2 mt-auto">
                        <div className="size-8 rounded-full border border-base-300/50 shadow-sm overflow-hidden bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold text-xs">
                            {message.senderName?.charAt(0).toUpperCase() || message.senderId?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Spacer for consecutive received messages */}
                    {!isOwnMessage && isConsecutive && (
                      <div className="w-10"></div>
                    )}

                    <div className="max-w-[70%] flex flex-col">
                      {/* Sender name for group messages (only for received messages and first in group) */}
                      {!isOwnMessage && !isConsecutive && (
                        <div className="text-xs text-primary font-medium mb-1 ml-3">
                          {message.senderName || message.senderId}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`px-3 py-2 shadow-sm relative ${
                          isOwnMessage
                            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content ml-auto"
                            : "bg-base-200 text-base-content"
                        } ${
                          // Rounded corners based on position in group
                          isOwnMessage
                            ? isConsecutive
                              ? isLastInGroup
                                ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" // Last in group
                                : "rounded-l-2xl rounded-r-md" // Middle of group
                              : isLastInGroup
                              ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" // Single or last
                              : "rounded-l-2xl rounded-tr-2xl rounded-br-sm" // First in group
                            : isConsecutive
                            ? isLastInGroup
                              ? "rounded-r-2xl rounded-tl-2xl rounded-bl-md" // Last in group
                              : "rounded-r-2xl rounded-l-md" // Middle of group
                            : isLastInGroup
                            ? "rounded-r-2xl rounded-tl-2xl rounded-bl-md" // Single or last
                            : "rounded-r-2xl rounded-tl-2xl rounded-bl-sm" // First in group
                        }`}
                      >
                        {/* Message content */}
                        <div className="flex flex-col">
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Attachment"
                              className="max-w-[200px] rounded-lg mb-2 shadow-sm"
                            />
                          )}
                          
                          {message.text && (
                            <div className="flex items-end gap-2">
                              <p className="leading-relaxed flex-1">{message.text}</p>
                              
                              {/* Time and status in bottom right */}
                              <div className="flex items-center gap-1 text-xs flex-shrink-0 ml-2 mt-1">
                                <span className="text-[11px] opacity-70">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                
                                {/* Status indicator for own messages */}
                                {messageStatus && (
                                  <div className={`flex items-center ${messageStatus.className}`}>
                                    {messageStatus.icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status text below message for own messages */}
                      {messageStatus && isOwnMessage && (
                        <div className="text-xs text-base-content/50 mt-1 text-right">
                          {messageStatus.text}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />

      {/* Group Info Slide-in Panel */}
      <GroupInfoPanel 
        group={selectedGroup}
        isOpen={showGroupInfo}
        onClose={handleCloseGroupInfo}
      />
    </div>
  );
};

export default GroupChatContainer;