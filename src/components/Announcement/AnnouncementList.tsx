import React from 'react';
import { Announcement } from '../../types/announcement';
import AnnouncementItem from './AnnouncementItem';
import { useAuthStore } from '../../stores/useAuthStore';

interface AnnouncementListProps {
  announcements: Announcement[];
  onAnnouncementUpdate: () => void;
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({ 
  announcements,
  onAnnouncementUpdate
}) => {
  const user = useAuthStore((state) => state.user) || { id: 'user1', name: 'You', avatar: undefined };

  // If there are no announcements, don't render anything so the "This is where you can talk to your class" message shows
  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {announcements.map(announcement => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserAvatar={user.avatar}
          onAnnouncementUpdate={onAnnouncementUpdate}
        />
      ))}
    </div>
  );
};

export default AnnouncementList; 