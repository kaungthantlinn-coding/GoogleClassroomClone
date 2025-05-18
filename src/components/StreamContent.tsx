import React, { useState, useEffect } from 'react';
import { format, compareDesc } from 'date-fns';
import { Announcement } from '../types/announcement';
import { Assignment } from '../types/assignment';
import { Material } from '../types/material';
import AnnouncementList from './Announcement/AnnouncementList';
import StreamAssignmentCard from './StreamAssignmentCard';
import StreamMaterialCard from './StreamMaterialCard';

interface StreamContentProps {
  classId: string;
  announcements: Announcement[];
  assignments: Assignment[];
  materials: Material[];
  onAnnouncementUpdate: () => void;
}

interface StreamItem {
  type: 'announcement' | 'assignment' | 'material';
  item: Announcement | Assignment | Material;
  date: Date;
}

const StreamContent: React.FC<StreamContentProps> = ({
  classId,
  announcements,
  assignments,
  materials,
  onAnnouncementUpdate
}) => {
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);

  // Combine and sort all stream items by date
  useEffect(() => {
    const items: StreamItem[] = [];

    // Add announcements
    announcements.forEach(announcement => {
      items.push({
        type: 'announcement',
        item: announcement,
        date: new Date(announcement.createdAt)
      });
    });

    // Add assignments
    assignments.forEach(assignment => {
      items.push({
        type: 'assignment',
        item: assignment,
        date: new Date(assignment.createdAt)
      });
    });

    // Add materials
    materials.forEach(material => {
      items.push({
        type: 'material',
        item: material,
        date: new Date(material.createdAt)
      });
    });

    // Sort all items by date (newest first)
    const sortedItems = items.sort((a, b) => compareDesc(a.date, b.date));
    setStreamItems(sortedItems);
  }, [announcements, assignments, materials]);

  if (streamItems.length === 0) {
    return (
      <div className="text-center">
        <div className="w-64 h-64 mx-auto">
          <img
            src="/images/empty-stream.svg"
            alt="No content"
            className="w-full h-full"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://ssl.gstatic.com/classroom/empty_states_v2/streams.svg';
            }}
          />
        </div>
        <p className="text-[#5f6368] mt-4">
          This is where you'll see all class activity. Share important information with your class here.
        </p>
      </div>
    );
  }

  // Group items by date (today, yesterday, earlier this week, etc.)
  const groupedByDate: { [key: string]: StreamItem[] } = {};
  
  streamItems.forEach(item => {
    const date = item.date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey: string;
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      groupKey = 'Earlier this week';
    } else if (today.getTime() - date.getTime() < 30 * 24 * 60 * 60 * 1000) {
      groupKey = 'Earlier this month';
    } else {
      // Format as Month Year (e.g. "May 2023")
      groupKey = format(date, 'MMMM yyyy');
    }
    
    if (!groupedByDate[groupKey]) {
      groupedByDate[groupKey] = [];
    }
    
    groupedByDate[groupKey].push(item);
  });

  // Render the grouped stream items
  return (
    <div className="stream-content">
      {Object.entries(groupedByDate).map(([dateGroup, items]) => (
        <div key={dateGroup} className="mb-8">
          <h2 className="text-[#5f6368] text-sm font-medium mb-4 border-b pb-2">{dateGroup}</h2>
          
          <div className="stream-items-group">
            {items.map((streamItem, index) => {
              // Render appropriate component based on type
              if (streamItem.type === 'announcement') {
                const filteredAnnouncements = [streamItem.item as Announcement];
                return <AnnouncementList 
                  key={`announcement-${index}`}
                  announcements={filteredAnnouncements} 
                  onAnnouncementUpdate={onAnnouncementUpdate} 
                />;
              } else if (streamItem.type === 'assignment') {
                return <StreamAssignmentCard 
                  key={`assignment-${index}`}
                  assignment={streamItem.item as Assignment}
                  classId={classId} 
                />;
              } else if (streamItem.type === 'material') {
                return <StreamMaterialCard 
                  key={`material-${index}`}
                  material={streamItem.item as Material}
                  classId={classId} 
                />;
              } else {
                return null;
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StreamContent;
