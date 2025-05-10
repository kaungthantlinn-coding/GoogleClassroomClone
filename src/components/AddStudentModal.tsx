import React, { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { X, UserPlus } from 'lucide-react';
import { useStudentData } from '../contexts/StudentDataContext';
import { addMember } from '../api/membersApi';
import { ClassDataContext } from '../pages/ClassPage';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacherMode?: boolean;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, isTeacherMode = false }) => {
  const { classId } = useParams<{ classId: string }>();
  const classData = useContext(ClassDataContext);
  const { addStudent } = useStudentData();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get enrollment code from class data
      const enrollmentCode = classData.enrollmentCode;
      
      if (!enrollmentCode && !classId) {
        setError('Course information not found. Please try again.');
        return;
      }
      
      // Add member to the course via API
      // Note: We're using the same API call for both teachers and students
      // The backend should distinguish based on the role parameter
      const userData = {
        name: name.trim(),
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
        role: isTeacherMode ? 'Teacher' : 'Student',
        classId: classId // Passing the classId for teacher additions
      };
      
      console.log('Adding member with data:', userData);
      
      const success = await addMember(enrollmentCode || '', userData);
      
      if (success) {
        // For backwards compatibility, also add to StudentDataContext
        if (!isTeacherMode) {
          const newStudent = {
            id: `student-${Date.now()}`,
            name: name.trim(),
            email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
            assignmentAvg: '0%',
            participation: '0%',
            finalGrade: '0%',
            finalGradeColor: 'text-red-600'
          };
          
          addStudent(newStudent);
        }
        
        // Reset form and close modal
        setName('');
        setEmail('');
        onClose();
        
        // Force reload the people page by dispatching an event
        window.dispatchEvent(new CustomEvent('courseMembersUpdated'));
      } else {
        setError(`Failed to add ${isTeacherMode ? 'teacher' : 'student'}. Please try again.`);
      }
    } catch (err) {
      console.error(`Error adding ${isTeacherMode ? 'teacher' : 'student'}:`, err);
      setError(`An error occurred while adding the ${isTeacherMode ? 'teacher' : 'student'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white w-full max-w-[500px] rounded-lg">
        <div className="flex items-center gap-6 p-4 border-b">
          <button onClick={onClose} className="text-[#5f6368] hover:bg-[#f8f9fa] p-2 rounded-full">
            <X size={24} />
          </button>
          <h2 className="text-[#3c4043] text-[22px] font-normal">
            Add {isTeacherMode ? 'Teacher' : 'Student'}
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="member-name" className="block text-sm font-medium text-[#3c4043] mb-1">
              {isTeacherMode ? 'Teacher' : 'Student'} Name *
            </label>
            <input
              id="member-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              placeholder={`Enter ${isTeacherMode ? 'teacher' : 'student'} name`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="member-email" className="block text-sm font-medium text-[#3c4043] mb-1">
              Email (optional)
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[#dadce0] rounded focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              placeholder={`Enter ${isTeacherMode ? 'teacher' : 'student'} email`}
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
              disabled={!name.trim() || isSubmitting}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                name.trim() && !isSubmitting 
                  ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]' 
                  : 'bg-[#dadce0] text-[#5f6368] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Add {isTeacherMode ? 'Teacher' : 'Student'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;