import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useStudentData } from '../contexts/StudentDataContext';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent } = useStudentData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    // Create a new student with a unique ID
    const newStudent = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || undefined,
      assignmentAvg: '0%',
      participation: '0%',
      finalGrade: '0%',
      finalGradeColor: 'text-red-600'
    };
    
    // Add the student to the context
    addStudent(newStudent);
    
    // Reset form and close modal
    setName('');
    setEmail('');
    onClose();
    
    // Dispatch a custom event to notify other components about the new student
    const newStudentEvent = new CustomEvent('newStudentAdded', {
      detail: { studentId: newStudent.id }
    });
    window.dispatchEvent(newStudentEvent);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white w-full max-w-[500px] rounded-lg">
        <div className="flex items-center gap-6 p-4 border-b">
          <button onClick={onClose} className="text-[#5f6368] hover:bg-[#f8f9fa] p-2 rounded-full">
            <X size={24} />
          </button>
          <h2 className="text-[#3c4043] text-[22px] font-normal">Add Student</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium text-[#3c4043] mb-1">
              Student Name *
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              placeholder="Enter student name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="student-email" className="block text-sm font-medium text-[#3c4043] mb-1">
              Email (optional)
            </label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              placeholder="Enter student email"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#5f6368] hover:bg-[#f8f9fa] rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className={`px-4 py-2 rounded flex items-center gap-2 ${name.trim() ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' : 'bg-[#dadce0] text-[#5f6368] cursor-not-allowed'}`}
            >
              <UserPlus size={18} />
              Add Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;