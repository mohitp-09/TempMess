import { useRef, useState } from "react";
import { Camera, Mic, Plus, Send, X, Image } from "lucide-react";

const MessageInput = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
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
    { id: "camera", icon: <Camera size={20} />, label: "Camera" },
    {
      id: "gallery",
      icon: <Image size={20} />,
      label: "Photo & Video",
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 flex gap-2">
          <input
            type="text"
            className="w-full px-4 py-2 bg-base-200 rounded-lg focus:outline-none"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="flex items-center justify-center p-2 rounded-full hover:bg-base-200 transition-colors"
            onClick={() => setShowDrawer(!showDrawer)}
          >
            <Plus size={20} className="text-base-content/70" />
          </button>

          {showDrawer && (
            <div className="absolute bottom-full right-0 mb-2 bg-base-100 rounded-lg shadow-lg border border-base-300 p-1 min-w-40">
              {drawerOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={option.onClick}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-base-200 transition-colors text-left"
                >
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="p-2 rounded-full bg-primary text-primary-content disabled:opacity-50 transition-opacity flex items-center justify-center"
          disabled={!text.trim() && !imagePreview}
        >
          {text.trim() ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
