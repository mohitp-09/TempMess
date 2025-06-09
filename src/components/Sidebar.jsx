import { Plus, Search, Users, MessageCircle, Bell, UsersRound, X, AlignLeft, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getAllFriends } from "../lib/api";
import { useChatStore } from "../store/useChatStore";
import { useGroupChatStore } from "../store/useGroupChatStore";
import AddUserModal from "./AddUserModal";
import CreateGroupModal from "./CreateGroupModal";
import toast from "react-hot-toast";

const Sidebar = ({ onSelectUser, onSelectGroup, selectedUserId, selectedGroupId, activeTab: parentActiveTab, onTabChange }) => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState(parentActiveTab || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const drawerRef = useRef(null);
  const buttonRef = useRef(null);

  // Get chat store functions
  const { 
    getLastMessageForUser, 
    getUnreadCountForUser,
    selectUser,
    getUserStatus
  } = useChatStore();

  // Get group chat store functions
  const {
    groups,
    getLastMessageForGroup,
    getUnreadCountForGroup,
    selectGroup,
    refreshGroups
  } = useGroupChatStore();

  const tabs = [
    { id: "all", label: "All", icon: <MessageCircle className="size-4" /> },
    { id: "unread", label: "Unread", icon: <Bell className="size-4" /> },
    { id: "groups", label: "Groups", icon: <UsersRound className="size-4" /> },
  ];

  const drawerOptions = [
    { 
      id: "newGroup", 
      label: "New Group", 
      icon: <UsersRound className="size-5" />,
      color: "text-blue-600",
      onClick: () => {
        setShowCreateGroupModal(true);
        setShowDrawer(false);
      }
    },
    { 
      id: "addUser", 
      label: "Add User", 
      icon: <Users className="size-5" />,
      color: "text-green-600",
      onClick: () => {
        setShowAddUserModal(true);
        setShowDrawer(false);
      }
    },
  ];

  // Fetch friends from backend
  const fetchFriends = async () => {
    setIsLoadingFriends(true);
    try {
      const friendsList = await getAllFriends();
      console.log('Fetched friends:', friendsList);
      
      // Update friends with real-time status
      const friendsWithStatus = friendsList.map(friend => {
        const status = getUserStatus(friend.username);
        return {
          ...friend,
          isOnline: status.isOnline || friend.isOnline || false,
          lastSeen: status.lastSeen
        };
      });
      
      setFriends(friendsWithStatus);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      toast.error('Failed to load friends list');
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // Load friends on component mount
  useEffect(() => {
    fetchFriends();
  }, []);

  // Update friends status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setFriends(prevFriends => 
        prevFriends.map(friend => {
          const status = getUserStatus(friend.username);
          return {
            ...friend,
            isOnline: status.isOnline || friend.isOnline || false,
            lastSeen: status.lastSeen
          };
        })
      );
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getUserStatus]);

  // Listen for friend request acceptance to refresh friends list
  useEffect(() => {
    const handleFriendRequestAccepted = () => {
      setTimeout(() => {
        fetchFriends();
      }, 1000);
    };
    
    window.addEventListener('friendRequestAccepted', handleFriendRequestAccepted);
    
    return () => {
      window.removeEventListener('friendRequestAccepted', handleFriendRequestAccepted);
    };
  }, []);

  // Handle tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  // Filter items based on active tab and search query
  const getFilteredItems = () => {
    let items = [];

    if (activeTab === "groups") {
      items = groups.map(group => ({
        ...group,
        type: 'group',
        fullName: group.name,
        profilePic: '/avatar.png', // Default group avatar
        isOnline: true // Groups are always "online"
      }));
    } else {
      items = friends.map(friend => ({
        ...friend,
        type: 'user'
      }));

      if (activeTab === "unread") {
        items = items.filter(item => {
          const unreadCount = item.type === 'group' 
            ? getUnreadCountForGroup(item.id)
            : getUnreadCountForUser(item.username);
          return unreadCount > 0;
        });
      }
    }

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const handleItemSelect = async (item) => {
    if (item.type === 'group') {
      // Select group
      await selectGroup(item);
      onSelectGroup(item);
    } else {
      // Select user
      await selectUser(item);
      onSelectUser(item);
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return days === 1 ? 'Yesterday' : `${days}d ago`;
    }

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleGroupCreated = () => {
    // Refresh groups list when a new group is created
    refreshGroups();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDrawer &&
        drawerRef.current &&
        !drawerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDrawer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDrawer]);

  return (
    <>
      <aside
        className={`h-full border-r border-base-300/50 flex flex-col transition-all duration-300 relative bg-gradient-to-b from-base-100 to-base-50 ${
          isExpanded ? 'w-80' : 'w-[68px]'
        } lg:w-80`}
      >
        <div className="border-b border-base-300/50 w-full p-4 flex flex-col gap-4 bg-base-100/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="size-10 flex items-center justify-center rounded-xl hover:bg-base-200/80 transition-all duration-200 lg:hidden group"
              aria-label="Toggle sidebar"
            >
              <AlignLeft className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
            </button>

            <div className={`relative flex-1 ${!isExpanded && 'hidden'} lg:block`}>
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder={activeTab === "groups" ? "Search groups" : "Search friends"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-base-200/80 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-base-300/50 transition-all duration-200"
                  />
                </div>
                <button
                  ref={buttonRef}
                  onClick={toggleDrawer}
                  className="size-10 flex items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-200 group relative"
                  aria-label={showDrawer ? "Close menu" : "Open menu"}
                >
                  {showDrawer ? (
                    <X className="size-5 text-primary transition-transform duration-200" />
                  ) : (
                    <Plus className="size-5 text-primary transition-transform duration-200 group-hover:rotate-90" />
                  )}
                  <Sparkles className="absolute -top-1 -right-1 size-3 text-primary/60 animate-pulse" />
                </button>
              </div>
            </div>
          </div>

          {/* Fixed tabs container with proper width and no overflow */}
          <div className={`flex py-1 gap-2 ${!isExpanded && 'hidden'} lg:flex`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-0 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary font-medium shadow-sm"
                    : "hover:bg-base-200/80 text-base-content/70 hover:text-base-content"
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                <span className="truncate text-xs sm:text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto w-full py-2 flex-1">
          {isLoadingFriends && activeTab !== "groups" ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin size-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className={`text-sm text-base-content/60 font-medium ${!isExpanded && 'hidden'} lg:block`}>
                  Loading friends...
                </span>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const lastMessage = item.type === 'group' 
                ? getLastMessageForGroup(item.id)
                : getLastMessageForUser(item.username);
              const unreadCount = item.type === 'group'
                ? getUnreadCountForGroup(item.id)
                : getUnreadCountForUser(item.username);
              const isSelected = item.type === 'group' 
                ? selectedGroupId === item.id
                : selectedUserId === item._id;

              return (
                <button
                  key={item.type === 'group' ? `group-${item.id}` : `user-${item._id}`}
                  onClick={() => handleItemSelect(item)}
                  className={`w-full p-3 mx-2 mb-1 flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                    isSelected 
                      ? "bg-primary/10 border border-primary/20 shadow-sm" 
                      : "hover:bg-base-200/80"
                  }`}
                >
                  <div className="relative mx-auto lg:mx-0 flex-shrink-0">
                    <div className="size-12 rounded-full ring-2 ring-base-300/50 shadow-sm overflow-hidden">
                      {item.type === 'group' ? (
                        <div className="size-12 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <UsersRound className="size-6 text-primary" />
                        </div>
                      ) : (
                        <img
                          src={item.profilePic}
                          alt={item.fullName}
                          className="size-12 object-cover rounded-full"
                          onError={(e) => {
                            e.target.src = '/avatar.png';
                          }}
                        />
                      )}
                    </div>
                    {item.isOnline && item.type !== 'group' && (
                     <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full ring-2 ring-white shadow-sm animate-pulse" />
                    )}
                  </div>

                  <div className={`${!isExpanded && 'hidden'} lg:block text-left min-w-0 flex-1`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium truncate transition-colors flex items-center gap-2 ${
                        isSelected ? 'text-primary' : 'text-base-content group-hover:text-base-content'
                      }`}>
                        {item.type === 'group' && <UsersRound className="size-3" />}
                        {item.fullName}
                      </span>
                      {lastMessage && (
                        <span className="text-xs text-base-content/40 font-medium flex-shrink-0 ml-2">
                          {formatMessageTime(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/60 truncate leading-relaxed pr-2">
                        {lastMessage ? lastMessage.text : item.type === 'group' ? 'Start group conversation' : 'Start a conversation'}
                      </span>
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 text-xs font-bold bg-primary text-primary-content rounded-full px-1.5 shadow-sm flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center text-base-content/40 py-12 px-4">
              <div className="flex flex-col items-center gap-4">
                <div className="size-16 rounded-full bg-base-200/50 flex items-center justify-center">
                  {activeTab === "groups" ? (
                    <UsersRound className="size-8 opacity-40" />
                  ) : (
                    <Users className="size-8 opacity-40" />
                  )}
                </div>
                <div className={`${!isExpanded && 'hidden'} lg:block`}>
                  <p className="text-sm font-medium mb-1">
                    {searchQuery 
                      ? `No ${activeTab === "groups" ? "groups" : "friends"} found` 
                      : activeTab === "groups" 
                        ? 'No groups yet' 
                        : 'No friends yet'}
                  </p>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {searchQuery 
                      ? 'Try a different search term' 
                      : activeTab === "groups"
                        ? 'Create a group to start chatting'
                        : 'Add friends to start chatting'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {showDrawer && (
          <div
            ref={drawerRef}
            className="absolute top-20 right-4 z-10 bg-base-100/95 backdrop-blur-sm border border-base-300/50 rounded-xl shadow-xl p-2 min-w-44 animate-in fade-in zoom-in-95 duration-200"
          >
            {drawerOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-200/80 transition-all duration-200 text-left text-sm group"
              >
                <div className={`${option.color} group-hover:scale-110 transition-transform duration-200`}>
                  {option.icon}
                </div>
                <span className="font-medium text-base-content group-hover:text-base-content/80">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Modals */}
      <AddUserModal 
        isOpen={showAddUserModal} 
        onClose={() => setShowAddUserModal(false)} 
      />
      
      <CreateGroupModal 
        isOpen={showCreateGroupModal} 
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};

export default Sidebar;