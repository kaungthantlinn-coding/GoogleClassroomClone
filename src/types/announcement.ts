import { User } from './user';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadDate: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate?: boolean;
}

export interface Announcement {
  id: string;
  classId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  attachments: Attachment[];
  comments: Comment[];
}

export interface AnnouncementFormData {
  content: string;
  attachments: File[];
}

// Local storage key for announcements
const ANNOUNCEMENTS_STORAGE_KEY = 'classroom_announcements';

// Get all announcements from localStorage
export const getAllAnnouncements = (): Announcement[] => {
  try {
    const storedAnnouncements = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    console.log('Fetched from localStorage:', storedAnnouncements);
    return storedAnnouncements ? JSON.parse(storedAnnouncements) : [];
  } catch (error) {
    console.error('Error getting announcements from localStorage:', error);
    return [];
  }
};

// Get announcements for a specific class
export const getAnnouncementsByClass = (classId: string): Announcement[] => {
  try {
    const announcements = getAllAnnouncements();
    console.log('All announcements:', announcements);
    console.log('Looking for classId:', classId);
    
    // Check if classId might be formatted differently (with or without hyphens)
    const normalizedClassId = classId.replace(/-/g, '').toLowerCase();
    
    // Additional debugging to check if IDs match
    announcements.forEach((announcement, index) => {
      const normalizedAnnouncementClassId = announcement.classId.replace(/-/g, '').toLowerCase();
      console.log(`Announcement ${index}:`, {
        id: announcement.id,
        classId: announcement.classId,
        normalizedClassId: normalizedAnnouncementClassId,
        matches: announcement.classId === classId,
        normalizedMatches: normalizedAnnouncementClassId === normalizedClassId,
        content: announcement.content.substring(0, 30) + (announcement.content.length > 30 ? '...' : '')
      });
    });
    
    // Try first with exact match
    let filtered = announcements.filter(announcement => announcement.classId === classId);
    
    // If no matches, try with normalized IDs (remove hyphens and lowercase)
    if (filtered.length === 0) {
      filtered = announcements.filter(announcement => {
        const normalizedAnnouncementClassId = announcement.classId.replace(/-/g, '').toLowerCase();
        return normalizedAnnouncementClassId === normalizedClassId;
      });
    }
    
    // Sort by creation date
    filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('Filtered announcements:', filtered.length);
    
    // TEMP FIX: Return ALL announcements if filtered is empty
    if (filtered.length === 0 && announcements.length > 0) {
      console.warn('No matching announcements found. Showing all announcements as a fallback.');
      return announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return filtered;
  } catch (error) {
    console.error('Error in getAnnouncementsByClass:', error);
    return [];
  }
};

// Save a new announcement
export const saveAnnouncement = (announcement: Announcement): void => {
  try {
    const announcements = getAllAnnouncements();
    announcements.push(announcement);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    console.log('Saved announcement:', announcement, 'All announcements now:', announcements);
  } catch (error) {
    console.error('Error saving announcement to localStorage:', error);
  }
};

// Update an existing announcement
export const updateAnnouncement = (updatedAnnouncement: Announcement): void => {
  try {
    const announcements = getAllAnnouncements();
    const index = announcements.findIndex(a => a.id === updatedAnnouncement.id);
    
    if (index !== -1) {
      announcements[index] = updatedAnnouncement;
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    }
  } catch (error) {
    console.error('Error updating announcement in localStorage:', error);
  }
};

// Delete an announcement
export const deleteAnnouncement = (announcementId: string): void => {
  try {
    const announcements = getAllAnnouncements();
    const filteredAnnouncements = announcements.filter(a => a.id !== announcementId);
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(filteredAnnouncements));
  } catch (error) {
    console.error('Error deleting announcement from localStorage:', error);
  }
};

// Add a comment to an announcement
export const addComment = (announcementId: string, comment: Comment): void => {
  try {
    const announcements = getAllAnnouncements();
    const announcementIndex = announcements.findIndex(a => a.id === announcementId);
    
    if (announcementIndex !== -1) {
      if (!announcements[announcementIndex].comments) {
        announcements[announcementIndex].comments = [];
      }
      
      announcements[announcementIndex].comments.push(comment);
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    }
  } catch (error) {
    console.error('Error adding comment to announcement in localStorage:', error);
  }
};

// Remove a comment from an announcement
export const removeComment = (announcementId: string, commentId: string): void => {
  try {
    const announcements = getAllAnnouncements();
    const announcementIndex = announcements.findIndex(a => a.id === announcementId);
    
    if (announcementIndex !== -1 && announcements[announcementIndex].comments) {
      announcements[announcementIndex].comments = announcements[announcementIndex].comments.filter(
        c => c.id !== commentId
      );
      localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    }
  } catch (error) {
    console.error('Error removing comment from announcement in localStorage:', error);
  }
}; 