import React from 'react';
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
  const classes: Class[] = [
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
    },
    {
      id: '3',
      name: 'Riso',
      section: 'Batch 3',
      teacher: 'Kaung Kaung Thant Linn 123',
      created: 'Yesterday',
      color: '#1967d2'
    },
    {
      id: '4',
      name: 'Test',
      section: 'Test',
      teacher: 'Kaung Kaung Thant Linn 123',
      created: 'Apr 4',
      color: '#1967d2'
    },
    {
      id: '5',
      name: 'Test',
      section: 'Test',
      teacher: 'Kaung Kaung Thant Linn 123',
      created: 'Apr 3',
      color: '#9334ea'
    },
    {
      id: '6',
      name: 'Test',
      section: 'Batch -2',
      teacher: 'Kaung Kaung Thant Linn 123',
      created: 'Apr 3',
      color: '#1967d2'
    }
  ];

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
                    <div className="text-[12px] text-[#5f6368]">{classItem.section}</div>
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