import React, { useState, useEffect } from 'react';
import { getLocalStorageKeys } from '../utils/localStorageUtils';

const DebugLocalStorage: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [storageData, setStorageData] = useState<{[key: string]: string}>({});
  
  const refreshData = () => {
    const keys = getLocalStorageKeys();
    const data: {[key: string]: string} = {};
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      data[key] = value || '';
    });
    
    setStorageData(data);
  };
  
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);
  
  const clearKey = (key: string) => {
    localStorage.removeItem(key);
    refreshData();
  };
  
  const clearAll = () => {
    localStorage.clear();
    refreshData();
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug localStorage"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Debug localStorage</h3>
          <div className="flex gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        
        {Object.keys(storageData).length === 0 ? (
          <p className="text-gray-500">No data in localStorage</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(storageData).map(([key, value]) => (
              <div key={key} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-blue-600">{key}</h4>
                  <button
                    onClick={() => clearKey(key)}
                    className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Clear
                  </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">{value}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugLocalStorage; 