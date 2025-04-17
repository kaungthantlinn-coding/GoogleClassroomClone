import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DebugAnnouncements: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      refreshData();
      setCurrentUrl(window.location.href);
    }
  }, [isOpen]);
  
  const refreshData = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    setLocalStorageKeys(keys);
    
    // Check for announcements
    try {
      const stored = localStorage.getItem('classroom_announcements');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnnouncements(parsed);
      } else {
        setAnnouncements([]);
      }
    } catch (e) {
      console.error("Error parsing announcements:", e);
      setAnnouncements([]);
    }
  };
  
  const addTestAnnouncement = () => {
    if (!classId) {
      alert("No classId found in URL. Current URL: " + window.location.href);
      return;
    }
    
    const testAnnouncement = {
      id: `test-announcement-${Date.now()}`,
      classId: classId,
      content: "This is a test announcement. If you can see this, it's working!",
      authorId: "test-user",
      authorName: "Test User",
      authorAvatar: null,
      createdAt: new Date().toISOString(),
      attachments: [],
      comments: []
    };
    
    try {
      let existing = [];
      const stored = localStorage.getItem('classroom_announcements');
      if (stored) {
        existing = JSON.parse(stored);
      }
      
      existing.push(testAnnouncement);
      localStorage.setItem('classroom_announcements', JSON.stringify(existing));
      
      refreshData();
      alert("Test announcement added! Please refresh the page to see it.");
    } catch (e) {
      console.error("Error adding test announcement:", e);
      alert("Error adding test announcement: " + e);
    }
  };
  
  const clearAnnouncements = () => {
    if (confirm("Are you sure you want to clear all announcements?")) {
      localStorage.removeItem('classroom_announcements');
      refreshData();
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-red-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug Announcements"
      >
        🔍
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Announcement Debugging</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded p-4 bg-blue-50">
            <h3 className="font-medium mb-2">Current Page Information</h3>
            <p><strong>Current URL:</strong> {currentUrl}</p>
            <p><strong>ClassId from URL:</strong> {classId || "No classId found in URL"}</p>
          </div>
          
          <div className="border rounded p-4 bg-green-50">
            <h3 className="font-medium mb-2">Actions</h3>
            <div className="flex gap-2">
              <button 
                onClick={addTestAnnouncement}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Test Announcement
              </button>
              <button 
                onClick={clearAnnouncements}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear All Announcements
              </button>
              <button 
                onClick={refreshData}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Refresh Data
              </button>
            </div>
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">localStorage Keys ({localStorageKeys.length})</h3>
            {localStorageKeys.length > 0 ? (
              <ul className="list-disc pl-5">
                {localStorageKeys.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No keys found in localStorage</p>
            )}
          </div>
          
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Announcements ({announcements.length})</h3>
            {announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((announcement, index) => (
                  <div key={announcement.id} className="border p-3 rounded bg-gray-50">
                    <pre className="text-xs overflow-auto">{JSON.stringify(announcement, null, 2)}</pre>
                    <div className="mt-2 text-sm">
                      <p><strong>Matches current classId:</strong> {announcement.classId === classId ? "✅ Yes" : "❌ No"}</p>
                      <p className="text-red-500">
                        {announcement.classId !== classId && 
                          `Announcement classId (${announcement.classId}) doesn't match URL classId (${classId})`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No announcements found in localStorage</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAnnouncements; 