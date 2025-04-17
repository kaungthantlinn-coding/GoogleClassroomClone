import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnnouncementInput from '../components/AnnouncementInput';
import AnnouncementList from '../components/Announcement/AnnouncementList';
import AnnouncementFixer from '../components/AnnouncementFixer';
import { getAnnouncementsByClass, deleteAnnouncement, addComment, type Announcement, type Comment } from '../types/announcement';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { isLocalStorageAvailable } from '../utils/localStorageUtils';
import DebugLocalStorage from '../components/DebugLocalStorage';
import DebugAnnouncements from '../components/DebugAnnouncements';

const StreamPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showEmergencyFix, setShowEmergencyFix] = useState(true);
  const user = useAuthStore((state) => state.user) || { id: 'user1', name: 'You', avatar: undefined };

  // Force a refresh
  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Check if localStorage is available
    const localStorageWorks = isLocalStorageAvailable();
    setStorageAvailable(localStorageWorks);

    if (classId && localStorageWorks) {
      loadAnnouncements();
      
      // Set up an interval to reload announcements periodically
      const intervalId = setInterval(() => {
        loadAnnouncements();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [classId, refreshTrigger]);

  const loadAnnouncements = () => {
    if (classId) {
      const loadedAnnouncements = getAnnouncementsByClass(classId);
      console.log(`Loaded ${loadedAnnouncements.length} announcements for class ${classId}`);
      setAnnouncements(loadedAnnouncements);
      
      // If we've loaded announcements successfully, we can hide the emergency fix
      if (loadedAnnouncements.length > 0) {
        setShowEmergencyFix(false);
      }
    }
  };

  // Debug function to forcibly reload announcements
  const debugShowStorage = () => {
    console.log("Current localStorage state:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`${key}: ${localStorage.getItem(key)}`);
    }
    loadAnnouncements();
  };

  const addTestAnnouncement = () => {
    if (!classId) return;
    
    const testAnnouncement = {
      id: `test-announcement-${Date.now()}`,
      classId: classId,
      content: "This is a test announcement added directly to localStorage. If you can see this, the announcement loading works!",
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      createdAt: new Date().toISOString(),
      attachments: [],
      comments: []
    };
    
    // Get existing announcements
    let announcements = [];
    try {
      const stored = localStorage.getItem('classroom_announcements');
      if (stored) {
        announcements = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading announcements:", e);
    }
    
    // Add the test announcement
    announcements.push(testAnnouncement);
    
    // Save back to localStorage
    try {
      localStorage.setItem('classroom_announcements', JSON.stringify(announcements));
      console.log("Test announcement added:", testAnnouncement);
      console.log("All announcements:", announcements);
      
      // Refresh the announcements
      loadAnnouncements();
    } catch (e) {
      console.error("Error saving test announcement:", e);
    }
  };

  if (!storageAvailable) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-500 mr-3" />
            <div>
              <p className="font-medium text-yellow-700">Storage Not Available</p>
              <p className="text-yellow-600">
                Your browser does not support localStorage or it's disabled. Announcements require localStorage to function properly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stream-page p-6">
      <AnnouncementInput onAnnouncementPosted={forceRefresh} />
      
      {/* Emergency Fix: Always show this component when announcements don't appear */}
      {showEmergencyFix && (
        <AnnouncementFixer />
      )}
      
      <div className="mt-8">
        {announcements.length === 0 ? (
          <div className="text-center">
            <div className="w-64 h-64 mx-auto">
              <img 
                src="/images/empty-stream.svg" 
                alt="No announcements" 
                className="w-full h-full"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://ssl.gstatic.com/classroom/empty_states_v2/streams.svg';
                }}
              />
            </div>
            <p className="text-[#5f6368] mt-4">
              This is where you'll see announcements. Share important information with your class here.
            </p>
            {/* Debug buttons */}
            <div className="mt-4 flex gap-3 justify-center">
              <button 
                onClick={debugShowStorage}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Debug: Check Announcements
              </button>
              <button 
                onClick={addTestAnnouncement}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Test Announcement
              </button>
              <button 
                onClick={forceRefresh}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Force Refresh
              </button>
              <button 
                onClick={() => setShowEmergencyFix(!showEmergencyFix)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                {showEmergencyFix ? "Hide Emergency Fix" : "Show Emergency Fix"}
              </button>
            </div>
          </div>
        ) : (
          <AnnouncementList 
            announcements={announcements} 
            onAnnouncementUpdate={forceRefresh} 
          />
        )}
      </div>
      
      {/* Debug components */}
      <DebugLocalStorage />
      <DebugAnnouncements />
    </div>
  );
};

export default StreamPage; 