import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AnnouncementInput from '../components/AnnouncementInput';
import AnnouncementFixer from '../components/AnnouncementFixer';
import StreamContent from '../components/StreamContent';
import { getAnnouncementsByClass, type Announcement } from '../types/announcement';
import { getAssignments } from '../api/assignmentApi';
import { getClassMaterials } from '../types/material';
import { Assignment } from '../types/assignment';
import { Material } from '../types/material';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { isLocalStorageAvailable } from '../utils/localStorageUtils';
import DebugLocalStorage from '../components/DebugLocalStorage';
import DebugAnnouncements from '../components/DebugAnnouncements';

const StreamPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

    if (classId) {
      setIsLoading(true);
      loadAnnouncements();
      
      // Execute async functions for assignments and materials
      const loadData = async () => {
        await loadAssignments();
        await loadMaterials();
      };
      loadData();
      
      // Set up an interval to reload announcements periodically
      const intervalId = setInterval(() => {
        loadAnnouncements();
      }, 3000); // Check every 3 seconds only for announcements which change frequently
      
      return () => clearInterval(intervalId);
    }
  }, [classId, refreshTrigger]);

  const loadAnnouncements = async () => {
    if (classId) {
      try {
        const loadedAnnouncements = getAnnouncementsByClass(classId);
        // Check if it's a promise and await if needed
        const announcements = loadedAnnouncements instanceof Promise ? await loadedAnnouncements : loadedAnnouncements;
        console.log(`Loaded ${announcements.length} announcements for class ${classId}`);
        setAnnouncements(announcements);
        
        // If we've loaded announcements successfully, we can hide the emergency fix
        if (announcements.length > 0) {
          setShowEmergencyFix(false);
        }
      } catch (error) {
        console.error('Error loading announcements:', error);
        setAnnouncements([]);
      }
    }
  };
  
  const loadAssignments = async () => {
    if (!classId) return;
    
    try {
      console.log('Fetching assignments for class:', classId);
      const loadedAssignments = await getAssignments(classId);
      console.log('API Response for assignments:', loadedAssignments);
      console.log(`Loaded ${loadedAssignments ? loadedAssignments.length : 0} assignments for class ${classId}`);
      
      // If we got no assignments or undefined, create a test assignment for debugging
      if (!loadedAssignments || loadedAssignments.length === 0) {
        console.log('Creating test assignment for debugging');
        const testAssignment = {
          id: `test-assignment-${Date.now()}`,
          title: 'Test Assignment',
          instructions: 'This is a test assignment',
          points: '100',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '11:59 PM',
          topic: 'Test Topic',
          attachments: [],
          assignTo: ['All students'],
          scheduledFor: null,
          classId: classId,
          createdAt: new Date().toISOString()
        };
        setAssignments([testAssignment]);
      } else {
        setAssignments(loadedAssignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterials = async () => {
    if (!classId) return;
    
    try {
      console.log('Fetching materials for class:', classId);
      const loadedMaterials = await getClassMaterials(classId);
      console.log('API Response for materials:', loadedMaterials);
      console.log(`Loaded ${loadedMaterials ? loadedMaterials.length : 0} materials for class ${classId}`);
      
      // If we got no materials or undefined, create a test material for debugging
      if (!loadedMaterials || loadedMaterials.length === 0) {
        console.log('Creating test material for debugging');
        const testMaterial = {
          id: `test-material-${Date.now()}`,
          title: 'Test Study Material',
          description: 'This is a test study material',
          topic: 'Study Resources',
          attachments: [
            {
              type: 'document' as 'document',
              name: 'Sample Document.pdf',
              url: 'https://example.com/sample.pdf'
            }
          ],
          assignTo: ['All students'],
          scheduledFor: null,
          classId: classId,
          createdAt: new Date().toISOString()
        };
        setMaterials([testMaterial]);
      } else {
        setMaterials(loadedMaterials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to forcibly reload announcements
  const debugShowStorage = () => {
    console.log("Current localStorage state:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        const value = localStorage.getItem(key) || ''; // Use empty string if value is null
        console.log(`${key}: ${value}`);
      }
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
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : announcements.length === 0 && assignments.length === 0 && materials.length === 0 ? (
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
          <StreamContent 
            classId={classId ?? ''}
            announcements={announcements}
            assignments={assignments}
            materials={materials}
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