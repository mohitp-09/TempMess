import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { formatMessageTime, getDateLabel } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { getCurrentUserFromToken } from "../lib/jwtUtils";
import { MessageSquare, Sparkles, Loader2, Check, CheckCheck, CheckCircle, Zap, Heart } from "lucide-react";

const ChatContainer = ({ selectedUser, onClose }) => {
  const messageEndRef = useRef(null);
  const { 
    getMessagesForUser, 
    sendMessage, 
    isLoading,
    currentUser,
    isLoadingOldMessages,
    getMessageStatus
  } = useChatStore();
  
  const [messages, setMessages] = useState([]);
  const authUser = getCurrentUserFromToken();

  // Get messages for the selected user
  useEffect(() => {
    if (selectedUser) {
      const userMessages = getMessagesForUser(selectedUser.username);
      setMessages(userMessages);
    }
  }, [selectedUser, getMessagesForUser]);

  // Subscribe to message updates for this user
  useEffect(() => {
    if (!selectedUser) return;

    const interval = setInterval(() => {
      const userMessages = getMessagesForUser(selectedUser.username);
      setMessages(userMessages);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedUser, getMessagesForUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (text, image) => {
    if (!text.trim() && !image) return;

    const success = await sendMessage(text, image);
    if (!success) {
      console.error('Failed to send message');
    }
  };

  if (!selectedUser) {
    return null;
  }

  const isLoadingMessages = isLoadingOldMessages(selectedUser.username);

  // Function to check if messages are consecutive
  const isConsecutiveMessage = (currentMsg, prevMsg) => {
    if (!prevMsg || !currentMsg) return false;
    
    const isSameSender = currentMsg.senderId === prevMsg.senderId;
    const timeDiff = new Date(currentMsg.createdAt) - new Date(prevMsg.createdAt);
    const isWithinTimeLimit = timeDiff < 2 * 60 * 1000;
    
    return isSameSender && isWithinTimeLimit;
  };

  // Enhanced message status display
  const getMessageStatusDisplay = (message, isOwnMessage) => {
    if (!isOwnMessage) return null;
    
    if (message.isTemp) {
      return {
        icon: <Loader2 className="size-3 animate-spin" />,
        text: "Sending...",
        className: "text-white/60"
      };
    }
    
    const status = message.status || getMessageStatus(message._id) || 'SENT';
    
    switch (status) {
      case 'SENT':
        return {
          icon: <Check className="size-3" />,
          text: "Sent",
          className: "text-white/70"
        };
      case 'DELIVERED':
        return {
          icon: <CheckCheck className="size-3" />,
          text: "Delivered",
          className: "text-white/70"
        };
      case 'READ':
        return {
          icon: <CheckCheck className="size-3" />,
          text: "Read",
          className: "text-blue-400"
        };
      default:
        return {
          icon: <Check className="size-3" />,
          text: "Sent",
          className: "text-white/70"
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden glass-subtle">
      <ChatHeader user={selectedUser} onClose={onClose} />

      {/* Enhanced Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-macos relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary rounded-full blur-3xl animate-float-gentle" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary rounded-full blur-3xl animate-float-gentle" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-12">
              <div className="card-macos p-6 flex items-center gap-4 animate-scale-in">
                <div className="relative">
                  <Loader2 className="animate-spin size-6 text-primary" />
                  <div className="absolute inset-0 animate-ping size-6 border border-primary/20 rounded-full" />
                </div>
                <span className="text-base-content/70 text-sm font-medium">Loading chat history...</span>
              </div>
            </div>
          ) : isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="card-macos p-6 flex items-center gap-4 animate-scale-in">
                <div className="animate-spin size-6 border-2 border-primary/30 border-t-primary rounded-full" />
                <span className="text-base-content/70 text-sm font-medium">Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* Enhanced Welcome Section */}
              <div className="flex justify-center gap-6 mb-12">
                <div className="relative animate-float-gentle">
                  <div className="w-24 h-24 rounded-3xl glass-strong flex items-center justify-center shadow-macos-lg">
                    <MessageSquare className="w-12 h-12 text-primary" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-primary/60 animate-pulse-glow" />
                  <Heart className="absolute -bottom-2 -left-2 w-6 h-6 text-pink-500/60 animate-pulse" />
                </div>
              </div>

              <div className="space-y-8 max-w-md">
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-base-content">
                    Ready to chat with{" "}
                    <span className="gradient-text">
                      {selectedUser.fullName}
                    </span>
                    ?
                  </h3>
                  
                  <p className="text-base-content/60 leading-relaxed text-lg">
                    Break the ice and send your first message! Every great conversation starts with a simple "Hello" ✨
                  </p>
                </div>

                {/* Enhanced Action Tip */}
                <div className="card-macos p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-primary/80 font-medium">
                      Start typing in the message box below to begin your conversation
                    </p>
                  </div>
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

              const messageStatus = getMessageStatusDisplay(message, isOwnMessage);

              return (
                <div key={message._id} className="animate-message-appear">
                  {showDateLabel && (
                    <div className="flex items-center justify-center my-8">
                      <div className="card-macos px-4 py-2 text-xs font-medium text-base-content/60">
                        {getDateLabel(message.createdAt)}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${
                      isConsecutive ? "mb-1" : "mb-4"
                    }`}
                    ref={index === messages.length - 1 ? messageEndRef : null}
                  >
                    {/* Enhanced Avatar */}
                    {!isOwnMessage && !isConsecutive && (
                      <div className="mr-3 mt-auto">
                        <div className="size-10 rounded-full shadow-macos overflow-hidden glass-subtle">
                          <img
                            src={selectedUser.profilePic}
                            alt="profile pic"
                            className="rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = '/avatar.png';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {!isOwnMessage && isConsecutive && (
                      <div className="w-13"></div>
                    )}

                    <div className="max-w-[75%] flex flex-col">
                      {/* Enhanced Message Bubble */}
                      <div
                        className={`px-4 py-3 shadow-macos relative transition-all duration-300 hover-lift ${
                          isOwnMessage
                            ? "bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-content ml-auto"
                            : "glass-strong text-base-content"
                        } ${
                          isOwnMessage
                            ? isConsecutive
                              ? isLastInGroup
                                ? "rounded-t-2xl rounded-l-2xl rounded-br-lg"
                                : "rounded-t-2xl rounded-l-2xl rounded-br-md"
                              : isLastInGroup
                              ? "rounded-t-2xl rounded-l-2xl rounded-br-lg"
                              : "rounded-t-2xl rounded-l-2xl rounded-br-sm"
                            : isConsecutive
                            ? isLastInGroup
                              ? "rounded-t-2xl rounded-r-2xl rounded-bl-lg"
                              : "rounded-t-2xl rounded-r-2xl rounded-bl-md"
                            : isLastInGroup
                            ? "rounded-t-2xl rounded-r-2xl rounded-bl-lg"
                            : "rounded-t-2xl rounded-r-2xl rounded-bl-sm"
                        }`}
                      >
                        {/* Message Content */}
                        <div className="flex flex-col">
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Attachment"
                              className="max-w-[250px] rounded-xl mb-3 shadow-macos"
                            />
                          )}
                          
                          {message.text && (
                            <div className="flex items-end gap-3">
                              <p className="leading-relaxed flex-1 text-[15px]">{message.text}</p>
                              
                              {/* Enhanced Time and Status */}
                              <div className="flex items-center gap-1.5 text-xs flex-shrink-0 ml-3 mt-1">
                                <span className="text-[11px] opacity-70 font-medium">
                                  {formatMessageTime(message.createdAt)}
                                </span>
                                
                                {messageStatus && (
                                  <div className={`flex items-center transition-all duration-300 ${messageStatus.className}`}>
                                    {messageStatus.icon}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Message Glow Effect for Own Messages */}
                        {isOwnMessage && (
                          <div className="absolute inset-0 rounded-inherit bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        )}
                      </div>

                      {/* Status Text */}
                      {messageStatus && isOwnMessage && (
                        <div className="text-xs text-base-content/50 mt-1 text-right font-medium">
                          {messageStatus.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;