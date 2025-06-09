import { Plus, Search, Users, MessageCircle, Bell, UsersRound, X, AlignLeft, Sparkles, Zap } from "lucide-react";
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
    selectUser 
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
    { id: "all", label: "All", icon: <MessageCircle className="size-4" />, gradient: "from-blue-500 to-blue-600" },
    { id: "unread", label: "Unread", icon: <Bell className="size-4" />, gradient: "from-orange-500 to-red-500" },
    { id: "groups", label: "Groups", icon: <UsersRound className="size-4" />, gradient: "from-purple-500 to-pink-500" },
  ];

  const drawerOptions = [
    { 
      id: "newGroup", 
      label: "New Group", 
      icon: <UsersRound className="size-5" />,
      gradient: "from-purple-500 to-pink-500",
      onClick: () => {
        setShowCreateGroupModal(true);
        setShowDrawer(false);
      }
    },
    { 
      id: "addUser", 
      label: "Add Friend", 
      icon: <Users className="size-5" />,
      gradient: "from-green-500 to-emerald-500",
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
      setFriends(friendsList);
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
        profilePic: '/avatar.png',
        isOnline: true
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
      await selectGroup(item);
      onSelectGroup(item);
    } else {
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
        className={`h-full border-r-0 flex flex-col transition-all duration-500 ease-out relative glass-subtle ${
          isExpanded ? 'w-80' : 'w-[68px]'
        } lg:w-80`}
      >
        {/* Header Section */}
        <div className="border-b border-white/10 w-full p-4 flex flex-col gap-4 glass-strong">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="size-10 flex items-center justify-center rounded-xl glass-subtle hover:glass-strong transition-all duration-300 lg:hidden group hover-lift"
              aria-label="Toggle sidebar"
            >
              <AlignLeft className="size-5 text-base-content/70 group-hover:text-base-content transition-colors" />
            </button>

            <div className={`relative flex-1 ${!isExpanded && 'hidden'} lg:block`}>
              <div className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder={activeTab === "groups" ? "Search groups" : "Search friends"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-macos pl-10 text-sm"
                  />
                </div>
                <button
                  ref={buttonRef}
                  onClick={toggleDrawer}
                  className="size-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary/20 to-primary/30 hover:from-primary/30 hover:to-primary/40 transition-all duration-300 group relative hover-lift shadow-macos"
                  aria-label={showDrawer ? "Close menu" : "Open menu"}
                >
                  {showDrawer ? (
                    <X className="size-5 text-primary transition-transform duration-300 rotate-90" />
                  ) : (
                    <Plus className="size-5 text-primary transition-transform duration-300 group-hover:rotate-90" />
                  )}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse-glow" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className={`flex py-1 gap-2 ${!isExpanded && 'hidden'} lg:flex`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 hover-lift ${
                  activeTab === tab.id
                    ? `glass-strong shadow-macos text-primary font-medium`
                    : "glass-subtle hover:glass-strong text-base-content/70 hover:text-base-content"
                }`}
              >
                <span className={`flex-shrink-0 ${activeTab === tab.id ? 'animate-pulse-glow' : ''}`}>
                  {tab.icon}
                </span>
                <span className="truncate text-xs sm:text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-10 pointer-events-none" 
                       style={{ background: `linear-gradient(135deg, ${tab.gradient.split(' ')[1]}, ${tab.gradient.split(' ')[3]})` }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="overflow-y-auto w-full py-2 flex-1 scrollbar-macos">
          {isLoadingFriends && activeTab !== "groups" ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4 animate-slide-up">
                <div className="relative">
                  <div className="animate-spin size-8 border-2 border-primary/30 border-t-primary rounded-full" />
                  <div className="absolute inset-0 animate-ping size-8 border border-primary/20 rounded-full" />
                </div>
                <span className={`text-sm text-base-content/60 font-medium ${!isExpanded && 'hidden'} lg:block`}>
                  Loading friends...
                </span>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-1 px-2">
              {filteredItems.map((item, index) => {
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
                    className={`w-full p-3 mb-1 flex items-center gap-3 rounded-xl transition-all duration-300 group hover-lift animate-slide-up ${
                      isSelected 
                        ? "glass-strong shadow-macos border border-primary/20" 
                        : "glass-subtle hover:glass-strong"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative mx-auto lg:mx-0 flex-shrink-0">
                      <div className="size-12 rounded-full shadow-macos overflow-hidden relative">
                        {item.type === 'group' ? (
                          <div className="size-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center glass-subtle">
                            <UsersRound className="size-6 text-purple-600" />
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
                        {/* Enhanced online indicator */}
                        {item.isOnline && item.type !== 'group' && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-macos animate-pulse-glow" />
                        )}
                      </div>
                    </div>

                    <div className={`${!isExpanded && 'hidden'} lg:block text-left min-w-0 flex-1`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium truncate transition-colors flex items-center gap-2 ${
                          isSelected ? 'text-primary' : 'text-base-content group-hover:text-base-content'
                        }`}>
                          {item.type === 'group' && <UsersRound className="size-3 opacity-60" />}
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
                          <div className="flex items-center justify-center min-w-5 h-5 text-xs font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-content rounded-full px-1.5 shadow-macos flex-shrink-0 animate-pulse-glow">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-base-content/40 py-12 px-4">
              <div className="flex flex-col items-center gap-6 animate-slide-up">
                <div className="size-20 rounded-2xl glass-subtle flex items-center justify-center shadow-macos">
                  {activeTab === "groups" ? (
                    <UsersRound className="size-10 opacity-40" />
                  ) : (
                    <Users className="size-10 opacity-40" />
                  )}
                </div>
                <div className={`${!isExpanded && 'hidden'} lg:block space-y-2`}>
                  <p className="text-sm font-medium">
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

        {/* Enhanced Drawer */}
        {showDrawer && (
          <div
            ref={drawerRef}
            className="absolute top-20 right-4 z-20 card-macos-strong p-2 min-w-48 animate-scale-in"
          >
            {drawerOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={option.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 text-left text-sm group hover-lift"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`bg-gradient-to-r ${option.gradient} p-2 rounded-lg shadow-macos group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {option.icon}
                  </div>
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