import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import AvatarSelectionModal from './AvatarSelectionModal';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const UserSettings: React.FC = () => {
  const {
    user,
    userSettings,
    loadUserSettings,
    updateSettings,
    changePassword: storeChangePassword
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [emailNotifications, setEmailNotifications] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      await loadUserSettings();
      setLoading(false);
    };

    fetchSettings();
  }, [loadUserSettings]);

  // Update local state when userSettings changes
  useEffect(() => {
    if (userSettings) {
      setName(userSettings.name);
      setEmail(userSettings.email);
      setRole(userSettings.role);
      setAvatar(userSettings.avatar || '');
      setEmailNotifications(userSettings.emailNotifications);
    }
  }, [userSettings]);

  const handleUpdateSettings = async () => {
    setMessage('');
    setError('');

    try {
      await updateSettings({
        name,
        email,
        role,
        avatar,
        emailNotifications
      });
      setMessage('User settings updated successfully');
      setIsEditing(false);

      // Automatically clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to update settings');

      // Automatically clear the error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setError('New passwords do not match');

      // Automatically clear the error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
      return;
    }

    try {
      await storeChangePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmNewPassword
      );
      setMessage('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      setShowPasswordModal(false);

      // Automatically clear the message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to change password');

      // Automatically clear the error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset to original values when starting to edit
      if (userSettings) {
        setName(userSettings.name);
        setEmail(userSettings.email);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    if (userSettings) {
      setName(userSettings.name);
      setEmail(userSettings.email);
    }
  };

  if (loading) {
    return <div>Loading user settings...</div>;
  }

  if (!user || !userSettings) {
    return <div>Please log in to view settings</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={`transition-all duration-300 ease-in-out ${message ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${error ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

        <div className="flex items-start mb-6">
          <div className="mr-6">
            <div
              className="w-32 h-32 overflow-hidden flex-shrink-0 relative cursor-pointer"
              onClick={handleAvatarClick}
            >
              {avatar ? (
                <img src={avatar} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400 text-5xl">👤</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="mt-2 w-full px-3 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Change Avatar
            </button>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                readOnly={!isEditing}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                readOnly={!isEditing}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={role}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
              />
            </div>

            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleUpdateSettings}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={toggleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Password</h3>
          <div className="flex items-center">
            <input
              type="password"
              value="••••••••"
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded mr-4"
            />
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Change Password
            </button>
          </div>
        </div>

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-2xl font-bold mb-6">Change Password</h3>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded pr-10 bg-blue-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded pr-10 bg-blue-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded pr-10 bg-blue-50"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Email Notifications</h3>
          <div className="flex items-center">
            <input
              type="email"
              value={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded mr-4"
              readOnly={!isEditing}
            />
            <button
              onClick={handleUpdateSettings}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  );
};

export default UserSettings;