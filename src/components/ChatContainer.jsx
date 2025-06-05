import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { formatMessageTime, getDateLabel } from "../lib/utils";
import { messagesByUser } from "../data/mockData";

const ChatContainer = ({ selectedUser, authUser, onClose }) => {
  const messageEndRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const userMessages = messagesByUser[selectedUser._id] || [];
    setMessages(userMessages);
  }, [selectedUser._id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (text, image) => {
    const newMessage = {
      _id: `new-${Date.now()}`,
      senderId: authUser._id,
      text: text,
      ...(image && { image }),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <ChatHeader user={selectedUser} onClose={onClose} />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const currDate = new Date(message.createdAt).toDateString();
          const prevDate = prevMessage ? new Date(prevMessage.createdAt).toDateString() : null;
          const showDateLabel = currDate !== prevDate;

          return (
            <div key={message._id}>
              {showDateLabel && (
                <div className="text-center text-sm text-base-content/40 my-2">
                  {getDateLabel(message.createdAt)}
                </div>
              )}

              <div
                className={`chat ${
                  message.senderId === authUser._id ? "chat-end" : "chat-start"
                }`}
                ref={index === messages.length - 1 ? messageEndRef : null}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border border-base-300">
                    <img
                      src={
                        message.senderId === authUser._id
                          ? authUser.profilePic
                          : selectedUser.profilePic
                      }
                      alt="profile pic"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs text-base-content/50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div
                  className={`chat-bubble ${
                    message.senderId === authUser._id
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
        })}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
