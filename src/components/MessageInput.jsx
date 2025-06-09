import { useRef, useState } from "react";
import { Camera, Mic, Plus, Send, X, Image, Smile, Paperclip, Zap } from "lucide-react";

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setShowDrawer(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    onSendMessage(text, imagePreview);

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const drawerOptions = [
    { 
      id: "camera", 
      icon: <Camera size={20} />, 
      label: "Camera", 
      gradient: "from-blue-500 to-blue-600",
      onClick: () => console.log("Camera clicked")
    },
    {
      id: "gallery",
      icon: <Image size={20} />,
      label: "Photo & Video",
      gradient: "from-green-500 to-emerald-500",
      onClick: () => fileInputRef.current?.click(),
    },
    {
      id: "document",
      icon: <Paperclip size={20} />,
      label: "Document",
      gradient: "from-purple-500 to-purple-600",
      onClick: () => console.log("Document clicked")
    },
  ];

  return (
    <div className="p-6 glass-strong border-t border-white/10 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Enhanced Image Preview */}
        {imagePreview && (
          <div className="mb-4 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-2xl shadow-macos glass-subtle"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-macos hover:bg-red-600 transition-all duration-300 group-hover:scale-110 hover-lift"
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="text-sm text-base-content/80 space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Image ready to send
                </p>
                <p className="text-xs opacity-75">Click send or add a message</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="relative flex-1">
            {/* Enhanced Input Container */}
            <div className={`relative flex items-center glass-strong rounded-2xl border-2 transition-all duration-300 shadow-macos ${
              isFocused ? 'border-primary/30 shadow-macos-lg' : 'border-white/10'
            }`}>
              <input
                type="text"
                className="flex-1 px-4 py-4 bg-transparent rounded-2xl focus:outline-none placeholder:text-base-content/50 text-base-content text-[15px]"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              
              {/* Enhanced Action Icons */}
              <div className="flex items-center gap-1 pr-3">
                <button
                  type="button"
                  className="p-2.5 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group hover-lift"
                  title="Emoji"
                >
                  <Smile size={18} className="text-base-content/60 group-hover:text-yellow-500 transition-colors" />
                </button>
                
                <button
                  type="button"
                  className="p-2.5 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 group relative hover-lift"
                  onClick={() => setShowDrawer(!showDrawer)}
                  title="Attach"
                >
                  <Plus size={18} className={`text-base-content/60 group-hover:text-primary transition-all duration-300 ${showDrawer ? 'rotate-45' : ''}`} />
                </button>
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            {/* Enhanced Attachment Drawer */}
            {showDrawer && (
              <div className="absolute bottom-full right-0 mb-3 card-macos-strong p-2 min-w-52 animate-scale-in">
                {drawerOptions.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={option.onClick}
                    className="w-full flex items-center gap-3 p-3 rounded-xl glass-subtle hover:glass-strong transition-all duration-300 text-left group hover-lift"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`bg-gradient-to-r ${option.gradient} p-2.5 rounded-xl shadow-macos group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {option.icon}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-base-content group-hover:text-base-content/80">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Send Button */}
          <button
            type="submit"
            className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-macos hover-lift ${
              text.trim() || imagePreview
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-content hover:shadow-macos-lg hover:scale-105 animate-pulse-glow'
                : 'glass-subtle text-base-content/60 cursor-not-allowed'
            }`}
            disabled={!text.trim() && !imagePreview}
            title={text.trim() || imagePreview ? "Send message" : "Send voice message"}
          >
            {text.trim() || imagePreview ? (
              <Send size={20} className="transform translate-x-0.5" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;