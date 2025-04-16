import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  section: string;
  teacher: string;
  created: string;
  color: string;
}

interface SelectClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClass: (classId: string) => void;
}

const SelectClassModal = ({ isOpen, onClose, onSelectClass }: SelectClassModalProps) => {
  const [classes, setClasses] = useState<Class[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);
  
  const loadClasses = () => {
    // Get all classes from localStorage
    const loadedClasses: Class[] = [];
    
    // First check for any manually created classes in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('classData-')) {
        try {
          const rawData = localStorage.getItem(key) || '';
          const classData = JSON.parse(rawData);
          const classId = key.replace('classData-', '');
          
          if (classData && classData.name && classData.name.trim() !== '' && classData.name !== 'Unnamed Class') {
            loadedClasses.push({
              id: classId,
              name: classData.name,
              section: classData.section || '',
              teacher: classData.teacherName || 'You',
              created: new Date().toLocaleDateString() === new Date(parseInt(classId.split('-')[1])).toLocaleDateString() 
                ? 'Today' 
                : 'Yesterday',
              color: classData.color || '#4285f4'
            });
          }
        } catch (e) {
          console.error('Error loading class from localStorage', e);
        }
      }
    }
    
    // Add default classes if no classes were found
    if (loadedClasses.length === 0) {
      const defaultClasses = [
        {
          id: '1',
          name: 'Riso',
          section: 'Batch 3',
          teacher: 'Kaung Kaung Thant Linn 123',
          created: 'Yesterday',
          color: '#1967d2'
        },
        {
          id: '2',
          name: 'Riso',
          section: 'Batch 4',
          teacher: 'Kaung Kaung Thant Linn 123',
          created: 'Yesterday',
          color: '#1967d2'
        }
      ];
      setClasses(defaultClasses);
    } else {
      setClasses(loadedClasses);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white w-full max-w-[800px] rounded-lg">
        <div className="flex items-center gap-6 p-4 border-b">
          <button onClick={onClose} className="text-[#5f6368] hover:bg-[#f8f9fa] p-2 rounded-full">
            <X size={24} />
          </button>
          <h2 className="text-[#3c4043] text-[22px] font-normal">Select class</h2>
        </div>

        <div className="px-6 py-2">
          <div className="grid grid-cols-[minmax(300px,1fr)_minmax(200px,1fr)_100px] items-center text-sm text-[#5f6368] border-b">
            <div className="py-3">Class</div>
            <div className="py-3">Teacher</div>
            <div className="py-3">Created</div>
          </div>

          <div className="divide-y divide-gray-100">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => onSelectClass(classItem.id)}
                className="w-full grid grid-cols-[minmax(300px,1fr)_minmax(200px,1fr)_100px] items-center py-2 hover:bg-[#f8f9fa] text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[15px]"
                    style={{ backgroundColor: classItem.color }}
                  >
                    {classItem.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[14px] text-[#3c4043]">{classItem.name}</div>
                    <div className="text-[12px] text-[#5f6368]">
                      {classItem.section.toLowerCase().includes('batch') 
                        ? `Batch-${classItem.section.replace('Batch ', '').replace('Batch-', '').replace(' ', '')}`
                        : classItem.section}
                    </div>
                  </div>
                </div>
                <div className="text-[14px] text-[#5f6368]">{classItem.teacher}</div>
                <div className="text-[14px] text-[#5f6368]">{classItem.created}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectClassModal;