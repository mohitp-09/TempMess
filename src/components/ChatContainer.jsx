import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { formatMessageTime, getDateLabel } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { getCurrentUserFromToken } from "../lib/jwtUtils";

const ChatContainer = ({ selectedUser, onClose }) => {
  const messageEndRef = useRef(null);
  const { 
    getMessagesForUser, 
    sendMessage, 
    isLoading,
    currentUser 
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
    }, 1000); // Check for new messages every second

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
      // You could show a toast notification here
    }
  };

  if (!selectedUser) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <ChatHeader user={selectedUser} onClose={onClose} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-base-100 to-base-50">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 bg-base-200/50 backdrop-blur-sm rounded-full px-6 py-3">
              <div className="animate-spin size-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-base-content/70 text-sm font-medium">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-base-content mb-3">
              Start a conversation
            </h3>
            <p className="text-base-content/60 max-w-sm leading-relaxed">
              Send a message to <span className="font-medium text-primary">{selectedUser.fullName}</span> to start your conversation.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const currDate = new Date(message.createdAt).toDateString();
            const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
            const showDateLabel = currDate !== prevDate;

            const isOwnMessage = message.senderId === authUser?.username;

            return (
              <div key={message._id}>
                {showDateLabel && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-base-200/80 backdrop-blur-sm text-base-content/60 text-xs font-medium px-4 py-2 rounded-full shadow-sm">
                      {getDateLabel(message.createdAt)}
                    </div>
                  </div>
                )}

                <div
                  className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                  ref={index === messages.length - 1 ? messageEndRef : null}
                >
                  <div className="chat-image avatar">
                    <div className="size-10 rounded-full border-2 border-base-300/50 shadow-sm overflow-hidden">
                      <img
                        src={
                          isOwnMessage
                            ? "/avatar.png" // Current user avatar
                            : selectedUser.profilePic
                        }
                        alt="profile pic"
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="chat-header mb-1">
                    <time className="text-xs text-base-content/50 ml-1 font-medium">
                      {formatMessageTime(message.createdAt)}
                    </time>
                    {message.isTemp && (
                      <span className="text-xs text-base-content/40 ml-2 flex items-center gap-1">
                        <div className="size-2 bg-orange-400 rounded-full animate-pulse"></div>
                        Sending...
                      </span>
                    )}
                  </div>
                  <div
                    className={`chat-bubble shadow-md ${
                      isOwnMessage
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content border border-primary/20"
                        : "bg-base-200 text-base-content border border-base-300/50"
                    } flex flex-col relative`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="max-w-[200px] rounded-lg mb-2 shadow-sm"
                      />
                    )}
                    {message.text && <p className="leading-relaxed">{message.text}</p>}
                    
                    {/* Message status indicator for sent messages */}
                    {isOwnMessage && !message.isTemp && (
                      <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="size-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;