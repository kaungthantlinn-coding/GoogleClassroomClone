import React from 'react';
import { X } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// DiceBear avatar options
const AVATAR_OPTIONS = [
  {
    name: "Default",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Default",
    alt: "Default avatar style"
  },
  {
    name: "Professional",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Professional",
    alt: "Professional avatar style"
  },
  {
    name: "Creative",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Creative",
    alt: "Creative avatar style"
  },
  {
    name: "Friendly",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Friendly",
    alt: "Friendly avatar style"
  },
  {
    name: "Casual",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casual",
    alt: "Casual avatar style"
  },
  {
    name: "Serious",
    src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Serious",
    alt: "Serious avatar style"
  },
];

// Use AVATAR_OPTIONS as our avatar options list
const allAvatarOptions = AVATAR_OPTIONS;

export default function AvatarSelectionModal({ isOpen, onClose }: AvatarSelectionModalProps) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  if (!isOpen || !user) return null;

  const handleAvatarSelect = (avatarSrc: string) => {
    // Update user avatar in store and localStorage
    const updatedUser = { ...user, avatar: avatarSrc };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    // Also update the user settings in the store
    const updateUserSettings = useAuthStore.getState().updateSettings;
    if (updateUserSettings && user) {
      updateUserSettings({
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: avatarSrc,
        emailNotifications: ''
      });
    }
  };

  const handleApplyChanges = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Choose Avatar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {allAvatarOptions.map((avatar, index) => (
              <button
                key={index}
                onClick={() => handleAvatarSelect(avatar.src)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${user.avatar === avatar.src ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <img
                  src={avatar.src}
                  alt={avatar.alt}
                  className="w-16 h-16 mb-2"
                />
                <span className="text-xs text-gray-600 font-medium">{avatar.name}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded hover:bg-blue-600"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}