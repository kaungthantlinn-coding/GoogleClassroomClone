// Import only what's needed for announcement types
import * as announcementApi from '../api/announcementApi';

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

// Define the comment input format used in the UI
export interface CommentInput {
  userId: string;
  userName: string;
  text: string;
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

// Get announcements for a specific class using API
export const getAnnouncementsByClass = async (classId: string): Promise<Announcement[]> => {
  if (!classId) {
    console.error('Invalid classId provided to getAnnouncementsByClass');
    return [];
  }
  
  try {
    return await announcementApi.getAnnouncements(classId);
  } catch (error) {
    console.error(`Error fetching announcements for class ${classId}:`, error);
    return [];
  }
};

// Save a new announcement using API
export const saveAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement | null> => {
  try {
    // Validate classId is present
    if (!announcement.classId) {
      console.error('Missing classId in announcement data:', announcement);
      throw new Error('Cannot create announcement: Missing classId');
    }
    
    // Log the ID format being used
    const isGuid = typeof announcement.classId === 'string' && announcement.classId.includes('-');
    console.log(`Using ${isGuid ? 'GUID' : 'numeric ID'} format for creating announcement: ${announcement.classId}`);
    
    return await announcementApi.createAnnouncement(announcement);
  } catch (error) {
    console.error('Error creating announcement via API:', error);
    return null;
  }
};

// Helper function to safely check if an ID is generated
export const isGeneratedId = (id: string | number | undefined): boolean => {
  if (!id) return false;
  const idStr = String(id);
  return idStr.startsWith('generated-') || idStr.startsWith('local-') || idStr.startsWith('created-');
};

// Update an existing announcement using API
export const updateAnnouncement = async (announcementId: string | number | undefined, updatedData: Partial<Announcement>): Promise<Announcement | null> => {
  try {
    // Validate announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcementId provided to updateAnnouncement:', announcementId);
      throw new Error(`Cannot update announcement: Invalid ID: ${announcementId}`);
    }
    
    console.log(`Updating announcement with ID: ${announcementId}`);
    return await announcementApi.updateAnnouncement(announcementId, updatedData);
  } catch (error) {
    console.error(`Error updating announcement ${announcementId} via API:`, error);
    return null;
  }
};

// Delete an announcement using API
export const deleteAnnouncement = async (announcementId: string | number | undefined): Promise<boolean> => {
  try {
    // Validate announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcementId provided to deleteAnnouncement:', announcementId);
      throw new Error(`Cannot delete announcement: Invalid ID: ${announcementId}`);
    }
    
    console.log(`Deleting announcement with ID: ${announcementId}`);
    await announcementApi.deleteAnnouncement(announcementId);
    return true;
  } catch (error) {
    console.error(`Error deleting announcement ${announcementId} via API:`, error);
    return false;
  }
};

// Add a comment to an announcement using API
export const addComment = async (announcementId: string | number | undefined, comment: CommentInput): Promise<Announcement | null> => {
  try {
    // Validate announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcementId provided to addComment:', announcementId);
      throw new Error(`Cannot add comment: Invalid announcement ID: ${announcementId}`);
    }
    
    // Ensure comment data has all required fields with fallbacks
    const validatedComment: CommentInput = {
      userId: comment.userId || '1004',
      userName: comment.userName || 'User',
      text: comment.text.trim()
    };
    
    console.log(`Adding comment to announcement with ID: ${announcementId}`, validatedComment);
    return await announcementApi.addComment(announcementId, validatedComment);
  } catch (error) {
    console.error(`Error adding comment to announcement ${announcementId} via API:`, error);
    return null;
  }
};

// Add a new function to edit a comment
export const editComment = async (commentId: string, content: string | { content: string }): Promise<Announcement | null> => {
  try {
    // Validate comment ID
    if (!commentId || commentId === 'undefined') {
      console.error('Invalid commentId provided to editComment:', commentId);
      throw new Error(`Cannot edit comment: Invalid comment ID: ${commentId}`);
    }
    
    const contentValue = typeof content === 'string' ? content : content.content;
    console.log(`Types/announcement: Editing comment with ID: ${commentId}, content: ${contentValue}`);
    
    // Direct API call to the correct endpoint: PUT /api/comments/{commentId}
    return await announcementApi.editComment(commentId, content);
  } catch (error) {
    console.error(`Error editing comment ${commentId} via API:`, error);
    throw error; // Re-throw to let component handle the error
  }
};

// Remove a comment from an announcement using API
export const removeComment = async (commentId: string | undefined): Promise<Announcement | null> => {
  try {
    // Validate comment ID
    if (!commentId || commentId === 'undefined') {
      console.error('Invalid commentId provided to removeComment:', commentId);
      throw new Error(`Cannot remove comment: Invalid comment ID: ${commentId}`);
    }
    
    console.log(`Types/announcement: Removing comment with ID: ${commentId}`);
    
    // Direct API call to the correct endpoint: DELETE /api/comments/{commentId}
    // The empty string is for the announcement ID which is not needed with the new API
    return await announcementApi.deleteComment('', commentId);
  } catch (error) {
    console.error(`Error removing comment ${commentId} via API:`, error);
    throw error; // Re-throw to let component handle the error
  }
};

// Fetch comments for an announcement
export const getCommentsForAnnouncement = async (announcementId: string | number | undefined): Promise<Comment[]> => {
  try {
    // Validate announcement ID
    if (!announcementId || announcementId === 'undefined') {
      console.error('Invalid announcementId provided to getCommentsForAnnouncement:', announcementId);
      return [];
    }
    
    console.log(`Fetching comments for announcement with ID: ${announcementId}`);
    return await announcementApi.getComments(announcementId);
  } catch (error) {
    console.error(`Error fetching comments for announcement ${announcementId} via API:`, error);
    throw error; // Propagate error to allow UI to handle it
  }
}; 