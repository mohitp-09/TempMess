// Mock authenticated user
export const authUser = {
  _id: "authUserId",
  fullName: "You",
  profilePic: "/avatar.png",
  isOnline: true,
};

// Mock users list
export const users = [
  {
    _id: "1",
    fullName: "John Doe",
    profilePic: "/avatar.png",
    isOnline: true,
  },
  {
    _id: "2",
    fullName: "Jane Smith",
    profilePic: "/avatar.png",
    isOnline: false,
  },
  {
    _id: "3",
    fullName: "Alex Johnson",
    profilePic: "/avatar.png",
    isOnline: true,
  },
  {
    _id: "4",
    fullName: "Sarah Williams",
    profilePic: "/avatar.png",
    isOnline: false,
  },
];

// Mock messages
export const messagesByUser = {
  "1": [
    {
      _id: "m1",
      senderId: "authUserId",
      text: "Hello! Working on new UI.",
      image: "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      createdAt: "2025-05-16T10:30:00Z",
    },
    {
      _id: "m2",
      senderId: "1",
      text: "It looks good!",
      createdAt: "2025-05-16T10:31:00Z",
    },
    {
      _id: "m3",
      senderId: "authUserId",
      text: "Almost done with the chat feature.",
      createdAt: "2025-05-16T10:32:00Z",
    },
    {
      _id: "m4",
      senderId: "1",
      text: "Can't wait to see it.",
      createdAt: "2025-05-16T10:35:00Z",
    },
  ],
  "2": [
    {
      _id: "m5",
      senderId: "authUserId",
      text: "Hey Jane, how's the project going?",
      createdAt: "2025-05-15T14:20:00Z",
    },
    {
      _id: "m6",
      senderId: "2",
      text: "It's going well! Just finalizing some details.",
      createdAt: "2025-05-15T14:25:00Z",
    },
    {
      _id: "m7",
      senderId: "2",
      text: "Should be ready by tomorrow.",
      createdAt: "2025-05-15T14:26:00Z",
    },
  ],
  "3": [
    {
      _id: "m8",
      senderId: "3",
      text: "Did you get my email about the meeting?",
      createdAt: "2025-05-14T09:10:00Z",
    },
    {
      _id: "m9",
      senderId: "authUserId",
      text: "Yes, I'll be there at 3PM.",
      createdAt: "2025-05-14T09:15:00Z",
    },
  ],
  "4": [
    {
      _id: "m10",
      senderId: "4",
      text: "Have you reviewed my pull request?",
      createdAt: "2025-05-13T16:40:00Z",
    },
    {
      _id: "m11",
      senderId: "authUserId",
      text: "Not yet, I'll look at it this afternoon.",
      createdAt: "2025-05-13T16:45:00Z",
    },
    {
      _id: "m12",
      senderId: "4",
      text: "Thanks, let me know if you have any questions.",
      createdAt: "2025-05-13T16:50:00Z",
    },
  ],
};

// Generate chat data with last messages
export const chats = users.map(user => {
  const messages = messagesByUser[user._id] || [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return {
    user,
    messages,
    lastMessage,
    unreadCount: user._id === "3" ? 2 : 0,
  };
});
