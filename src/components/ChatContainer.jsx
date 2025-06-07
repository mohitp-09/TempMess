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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
            <span className="text-base-content/60">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-base-content mb-2">
              Start a conversation
            </h3>
            <p className="text-base-content/60 max-w-sm">
              Send a message to {selectedUser.fullName} to start your conversation.
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
                  <div className="text-center text-sm text-base-content/40 my-2">
                    {getDateLabel(message.createdAt)}
                  </div>
                )}

                <div
                  className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
                  ref={index === messages.length - 1 ? messageEndRef : null}
                >
                  <div className="chat-image avatar">
                    <div className="size-10 rounded-full border border-base-300">
                      <img
                        src={
                          isOwnMessage
                            ? "/avatar.png" // Current user avatar
                            : selectedUser.profilePic
                        }
                        alt="profile pic"
                        className="rounded-full"
                        onError={(e) => {
                          e.target.src = '/avatar.png';
                        }}
                      />
                    </div>
                  </div>
                  <div className="chat-header mb-1">
                    <time className="text-xs text-base-content/50 ml-1">
                      {formatMessageTime(message.createdAt)}
                    </time>
                    {message.isTemp && (
                      <span className="text-xs text-base-content/40 ml-2">
                        Sending...
                      </span>
                    )}
                  </div>
                  <div
                    className={`chat-bubble ${
                      isOwnMessage
                        ? "bg-primary text-primary-content"
                        : "bg-base-200 text-base-content"
                    } flex flex-col`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="max-w-[200px] rounded-md mb-2"
                      />
                    )}
                    {message.text && <p>{message.text}</p>}
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