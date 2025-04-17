import React, { useEffect, useState } from 'react';
import { Announcement } from '../types/announcement';
import AnnouncementItem from './Announcement/AnnouncementItem';
import { useAuthStore } from '../stores/useAuthStore';

const AnnouncementFixer: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user) || { id: 'user1', name: 'You', avatar: undefined };

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadAllAnnouncements();
    }, 3000);

    loadAllAnnouncements();
    
    return () => clearInterval(intervalId);
  }, []);

  const loadAllAnnouncements = () => {
    try {
      const storedData = localStorage.getItem('classroom_announcements');
      if (!storedData) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(storedData);
      if (!Array.isArray(parsed)) {
        console.error('Announcements data is not an array:', parsed);
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      // Sort by creation date (newest first)
      const sorted = [...parsed].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setAnnouncements(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setAnnouncements([]);
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    loadAllAnnouncements();
  };

  if (loading) {
    return <div className="text-center py-4">Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return (
      <div className="my-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
        <p>No announcements found in storage.</p>
        <button 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={loadAllAnnouncements}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-4">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-800">
        <p className="font-medium">Emergency Fix Mode</p>
        <p className="text-sm">Showing all announcements regardless of class.</p>
        <p className="text-sm mt-1">Found {announcements.length} announcement(s) in storage.</p>
        <button 
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          onClick={loadAllAnnouncements}
        >
          Refresh
        </button>
      </div>

      {announcements.map((announcement) => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserAvatar={user.avatar}
          onAnnouncementUpdate={handleUpdate}
        />
      ))}
    </div>
  );
};

export default AnnouncementFixer; 