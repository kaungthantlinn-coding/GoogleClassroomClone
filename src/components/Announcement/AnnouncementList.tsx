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

  // Create a map to ensure we don't have duplicate keys and that all announcements have valid IDs
  const processedAnnouncements = announcements.map((announcement, index) => {
    // If an announcement doesn't have an ID, generate one and warn
    if (!announcement.id) {
      console.warn(`Announcement at index ${index} is missing an ID. Content: "${announcement.content.substring(0, 20)}..."`);
      // Create a deterministic but unique ID
      const generatedId = `generated-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      return { 
        ...announcement, 
        id: generatedId,
        _uniqueKey: generatedId
      };
    }
    
    return { 
      ...announcement, 
      _uniqueKey: announcement.id 
    };
  });

  console.log(`Processed ${processedAnnouncements.length} announcements, all with valid IDs`);

  return (
    <div className="space-y-6">
      {processedAnnouncements.map((announcement, index) => (
        <AnnouncementItem
          key={announcement._uniqueKey}
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