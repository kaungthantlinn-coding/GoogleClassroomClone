import { useState, useEffect, useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, MoreVertical, Trash, Check, X } from 'lucide-react';
import { useStudentData } from '../contexts/StudentDataContext';
import AddStudentModal from '../components/AddStudentModal';
import { 
  getCourseMembers, 
  Member, 
  removeMember, 
  addMember, 
  getPendingEnrollmentRequests, 
  processEnrollmentRequest 
} from '../api/membersApi';
import { ClassDataContext } from './ClassPage';
import { useAuthStore } from '../stores/useAuthStore';

interface Teacher extends Member {
  role: 'Teacher';
}

interface Student extends Member {
  role: 'Student';
  requestId?: string; // Added for enrollment requests
  requestDate?: string; // Date when the enrollment request was made
}

export default function PeoplePage() {
  const { classId } = useParams<{ classId: string }>();
  const classData = useContext(ClassDataContext);
  const { removeStudent } = useStudentData();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  
  // Get user role to determine if user is a teacher
  const userRole = localStorage.getItem('user_role') || sessionStorage.getItem('user_role') || '';
  const isTeacher = userRole.toLowerCase() === 'teacher';
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Commented out unused function
  // const handleAddTeacher = async () => {
  //   if (!classId || !classData.enrollmentCode) return;
  //   
  //   try {
  //     // For testing purposes, add a hardcoded teacher
  //     const success = await addMember(classData.enrollmentCode, {
  //       name: 'Test Teacher',
  //       email: 'teacher@example.com'
  //     });
  //     
  //     if (success) {
  //       console.log('Teacher added successfully!');
  //       // Refresh the members list
  //       window.dispatchEvent(new CustomEvent('courseMembersUpdated'));
  //     }
  //   } catch (err) {
  //     console.error('Error adding teacher:', err);
  //     setError('Failed to add teacher. Please try again.');
  //   }
  // };
  
  // Load members and enrollment requests from API
  useEffect(() => {
    const loadMembersAndRequests = async () => {
      if (!classId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching members for class ID:', classId);
        const members = await getCourseMembers(classId);
        console.log('API response for members:', members);
        
        // Separate members by role and ensure proper status
        const teachersList = members.filter(m => m.role === 'Teacher').map(teacher => ({
          ...teacher,
          status: 'approved' as const // Teachers are always approved
        })) as Teacher[];
        
        // Get approved students
        const approvedStudentsList = members.filter(m => m.role === 'Student') as Student[];
        console.log('Approved students:', approvedStudentsList);
        
        // For teachers, also fetch pending enrollment requests
        let pendingStudentsList: Student[] = [];
        
        if (isTeacher) {
          try {
            console.log('Fetching pending enrollment requests for class ID:', classId);
            const pendingRequests = await getPendingEnrollmentRequests(classId);
            console.log('Pending enrollment requests:', pendingRequests);
            
            // Map enrollment requests to student format
            pendingStudentsList = pendingRequests.map((req: any) => ({
              id: req.id,
              userId: req.userId || req.user?.id || req.email,
              name: req.name || req.user?.name || 'Unknown',
              email: req.email || req.user?.email || 'unknown@example.com',
              role: 'Student' as const,
              status: 'pending' as const,
              requestDate: req.requestDate || new Date().toISOString(),
              requestId: req.id // Store the request ID for approval/rejection
            }));
          } catch (reqErr) {
            console.error('Error fetching enrollment requests:', reqErr);
            // Non-fatal error, continue with empty pending list
          }
        }
        
        console.log('Pending students from enrollment requests:', pendingStudentsList);
        
        setTeachers(teachersList);
        setPendingStudents(pendingStudentsList);
        setStudents(approvedStudentsList);
      } catch (err: any) {
        console.error('Error loading members:', err);
        setError(err.message || 'Failed to load class members');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMembersAndRequests();
    
    // Add an event listener for when the course members are updated
    window.addEventListener('courseMembersUpdated', loadMembersAndRequests);
    
    return () => {
      window.removeEventListener('courseMembersUpdated', loadMembersAndRequests);
    };
  }, [classId, isTeacher]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle removing a student
  const handleRemoveStudent = async (userId: string) => {
    if (!classId) return;
    
    try {
      const success = await removeMember(classId, userId);
      
      if (success) {
        // Update local state to remove the student
        setStudents(prev => prev.filter(student => student.userId !== userId));
        
        // Also update the StudentDataContext for compatibility
        if (studentToDelete) {
          removeStudent(studentToDelete);
        }
      }
    } catch (err) {
      console.error('Error removing student:', err);
      setError('Failed to remove student. Please try again.');
    } finally {
      setDeleteModalVisible(false);
      setStudentToDelete(null);
    }
  };

  // Handle approving a pending student
  const handleApproveStudent = async (studentId: string) => {
    if (!classId) return;
    
    try {
      // Find the student to get their request ID
      const student = pendingStudents.find(s => s.userId === studentId);
      
      if (!student || !student.requestId) {
        console.error(`No request ID found for student ${studentId}`);
        setError('Failed to approve student: No enrollment request found.');
        return;
      }
      
      console.log(`Processing enrollment request with ID: ${student.requestId} for approval`);
      const success = await processEnrollmentRequest(student.requestId, 'approve');
      
      if (success) {
        // Update local state to move the student from pending to approved
        setPendingStudents(prev => prev.filter(s => s.userId !== studentId));
        
        // Add to approved students with updated status
        const updatedStudent = { ...student, status: 'approved' as const };
        setStudents(prev => [...prev, updatedStudent]);
        
        // Show success message
        setError(null);
        // Use a styled success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
        successDiv.style.zIndex = '9999';
        successDiv.innerHTML = `<strong>Success!</strong> ${student.name} has been approved and can now access the class.`;
        document.body.appendChild(successDiv);
        setTimeout(() => {
          successDiv.remove();
        }, 3000);
        
        console.log(`Student ${studentId} approved successfully`);
      }
    } catch (err) {
      console.error('Error approving student:', err);
      setError('Failed to approve student. Please try again.');
    }
  };

  // Handle rejecting a pending student
  const handleRejectStudent = async (studentId: string) => {
    if (!classId) return;
    
    try {
      // Find the student to get their request ID
      const student = pendingStudents.find(s => s.userId === studentId);
      
      if (!student || !student.requestId) {
        console.error(`No request ID found for student ${studentId}`);
        setError('Failed to reject student: No enrollment request found.');
        return;
      }
      
      console.log(`Processing enrollment request with ID: ${student.requestId} for rejection`);
      const success = await processEnrollmentRequest(student.requestId, 'reject');
      
      if (success) {
        // Remove from pending students list
        setPendingStudents(prev => prev.filter(s => s.userId !== studentId));
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        successDiv.style.zIndex = '9999';
        successDiv.innerHTML = `<strong>Student Rejected</strong> The student will need to request access again with a new enrollment code.`;
        document.body.appendChild(successDiv);
        setTimeout(() => {
          successDiv.remove();
        }, 3000);
        
        console.log(`Student ${studentId} rejected successfully`);
      }
    } catch (err) {
      console.error('Error rejecting student:', err);
      setError('Failed to reject student. Please try again.');
    }
  };

  // Show AddStudentModal with teacher mode
  const openAddTeacherModal = () => {
    setIsTeacherMode(true);
    setShowAddStudentModal(true);
  };

  // Show AddStudentModal with student mode
  const openAddStudentModal = () => {
    setIsTeacherMode(false);
    setShowAddStudentModal(true);
  };

  // Function to add the current user as a teacher to this course
  const addCurrentUserAsTeacher = async () => {
    if (!classId) return;
    
    try {
      // Get current user info from auth store
      const user = useAuthStore.getState().user;
      
      if (!user) {
        setError('You must be logged in to add yourself as a teacher');
        return;
      }
      
      console.log('Adding current user as teacher:', user);
      
      const userData = {
        name: user.name,
        email: user.email,
        role: 'Teacher' as const,
        classId: classId
      };
      
      // First try using the enrollment code if available
      if (classData.enrollmentCode) {
        await addMember(classData.enrollmentCode, userData);
      } else {
        // If no enrollment code, import and use the direct method
        const { addTeacherToCourse } = await import('../api/courseApi');
        await addTeacherToCourse(classId, {
          name: user.name,
          email: user.email
        });
      }
      
      // Refresh the members list
      window.dispatchEvent(new CustomEvent('courseMembersUpdated'));
      
    } catch (err) {
      console.error('Error adding current user as teacher:', err);
      setError('Failed to add you as a teacher. Please try again.');
    }
  };

  const EmptyStateIllustration = () => (
    <svg viewBox="0 0 221 161" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-48 h-48">
      <path d="M3 156.083C12.0042 145.648 23.2805 127.051 23.2805 127.051C38.6802 134.12 57.1094 134.204 72.5091 127.303C64.8513 136.392 58.2034 149.94 52.0603 156.251C33.0421 163.404 17.8107 160.122 3 156.083Z" fill="#DADCDF"/>
      <path d="M39.438 103.404C57.0256 102.478 74.5291 101.973 92.1168 101.637C109.62 101.3 127.208 101.216 144.711 101.132C154.641 101.048 164.571 101.048 174.501 100.963C175.679 100.963 175.763 99.0279 174.501 99.112C156.913 99.2803 139.326 99.3645 121.738 99.4486C104.235 99.617 86.6469 99.8694 69.1434 100.374C59.2136 100.711 49.2837 101.048 39.3538 101.552C38.1757 101.552 38.1757 103.488 39.438 103.404Z" fill="#606266"/>
      <path d="M219.269 48.1162L175.511 100.29H120.812M218.849 58.6351L175.511 109.126L96.4082 108.284" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M87.7409 39.2803L37.25 94.8202L175.258 93.9787L219.859 40.9633L87.7409 39.2803Z" fill="#DADCE0"/>
      <path d="M158.849 67.0498L149.592 68.7328L42.7197 88.9292L59.55 68.7328L158.849 67.0498Z" fill="#606266"/>
      <path d="M79.7465 116.7L78.905 109.968H46.0859L38.933 107.864C38.344 103.572 37.8391 99.2804 37.25 95.0729L175.258 92.8008" fill="#606266"/>
      <path d="M219.69 41.8047L218.849 67.4709L175.09 117.12L79.1572 115.858" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M175.511 93.9785V116.699" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M166.591 48.8738C168.779 47.6115 173.491 44.5821 173.239 42.0575C172.986 38.6915 161.794 36.3352 161.794 36.3352L159.438 24.8065C159.27 24.0491 158.176 23.8808 157.839 24.6382L154.136 33.3899C153.8 34.0631 152.79 34.0631 152.537 33.3058L149.676 25.4797C149.424 24.7223 148.33 24.7223 148.077 25.5638L146.058 32.6326C145.889 33.3058 144.964 33.4741 144.543 32.885C139.915 26.2371 119.887 -0.607258 100.784 1.07577C77.8951 3.09541 60.7282 20.5989 62.9161 46.181C63.8418 56.4474 67.4603 61.4965 72.0886 65.5358C72.6777 66.0407 72.3411 66.9664 71.5837 67.0505C66.4505 67.4713 58.8769 68.3128 58.8769 68.3128C49.6202 69.3226 40.2794 71.2581 32.4533 76.3072C27.7408 79.3366 23.4491 83.2917 20.9246 88.3408C18.4 93.3899 17.811 99.533 20.2513 104.666C23.954 112.324 33.1265 115.438 41.4575 116.868C52.9863 118.804 64.8516 118.972 76.4645 117.289C78.4841 117.036 79.9989 115.269 79.9989 113.334C79.8306 107.78 65.9456 110.641 57.4463 110.978C36.5767 111.735 28.6665 103.656 27.9933 98.6073C27.2359 92.6326 35.3986 83.965 40.7843 81.0197C46.0858 78.0743 58.961 76.0547 65.0199 75.5498L87.9091 73.2777L158.765 67.0505C161.121 66.8822 163.056 65.0309 163.309 62.6746L163.645 59.9818C163.73 59.4769 164.234 59.1403 164.655 59.3086C166.002 59.6452 168.526 59.8135 170.378 57.6256C172.397 55.1852 168.526 51.8191 166.507 50.3885C166.002 49.8836 166.086 49.1263 166.591 48.8738Z" fill="white" stroke="#606266" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M152.285 44.1613C153.884 44.1613 153.884 41.6367 152.285 41.6367C150.686 41.6367 150.686 44.1613 152.285 44.1613Z" fill="#606266"/>
      <path d="M158.259 43.4034C159.858 43.4034 159.858 40.8789 158.259 40.8789C156.576 40.8789 156.576 43.4034 158.259 43.4034Z" fill="#606266"/>
      <path d="M139.746 41.3838C136.801 42.3656 131.079 44.9182 131.752 47.2744C132.425 49.6306 138.764 49.3782 141.85 48.9574C139.325 50.6404 134.445 54.5956 135.118 56.9518C135.791 59.308 140.447 58.4946 142.692 57.7933" stroke="#606266" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M155.375 48.125C156.286 48.125 157.104 48 158 48" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M156.625 52C157.215 52.8089 158.25 53.375 158.25 53.375" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M156.425 48.25C156.425 49.1936 156.8 52 156.8 52" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M156.75 52C155.909 52.2003 155 53.25 155 53.25" stroke="#5F6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M130.827 135.803L84.291 143.208C84.3752 143.292 91.1914 146.069 91.1914 146.069L87.9937 149.688L92.033 151.371L86.6473 157.766L133.183 150.445C135.034 145.48 134.193 139.926 130.827 135.803Z" fill="#1E8E3E" className="P5VoX"/>
      <path d="M111.767 148.802C119.342 147.606 125.277 145.334 125.023 143.727C124.77 142.121 118.423 141.787 110.848 142.983C103.273 144.178 97.3384 146.45 97.592 148.057C97.8456 149.664 104.192 149.997 111.767 148.802Z" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M79.5782 147.668C82.1027 149.183 82.6076 152.633 80.6721 154.821L73.351 153.306C72.5936 153.138 72.4253 152.212 73.0985 151.791L79.5782 147.668Z" fill="#606266"/>
      <path d="M85.0478 143.629L73.2666 152.465L87.5723 157.093" stroke="#606266" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M113.238 154.148V154.148C125.823 150.791 138.935 148.811 151.948 148.257V148.257M134.276 136.896C135.118 137.878 136.885 140.347 137.221 142.366C137.558 144.386 137.081 146.854 136.801 148.257M135.538 138.159L141.679 137.574C143.21 137.428 144.604 138.464 144.905 139.972L145.408 142.488C145.756 144.226 144.529 145.885 142.765 146.062L137.642 146.574" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22.5 74C25.2227 56.1515 24 18 24 18" stroke="#CEEAD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rTGbBf"/>
      <path d="M17.2703 41.6331C23.0524 44.8387 24.9999 58.0001 24.9999 58.0001C24.9999 58.0001 16.471 55.1873 13.2271 50.9122C9.49994 46.0002 11.9459 38.6813 17.2703 41.6331Z" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M17.2703 21.68C23.0524 24.8855 24.9999 38.047 24.9999 38.047C24.9999 38.047 16.471 35.2342 13.2271 30.9591C9.49994 26.0471 11.9459 18.7282 17.2703 21.68Z" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M30.7297 41.68C24.9476 44.8855 23.0001 58.047 23.0001 58.047C23.0001 58.047 31.529 55.2342 34.7729 50.9591C38.5001 46.0471 36.0541 38.7282 30.7297 41.68Z" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M30.7297 21.7269C24.9476 24.9324 23.0001 38.0938 23.0001 38.0938C23.0001 38.0938 31.529 35.281 34.7729 31.0059C38.5001 26.094 36.0541 18.7751 30.7297 21.7269Z" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M22 73.5C14.9633 73.6303 8.01809 73.5 1 73.5" stroke="#DADCDF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Add Student Modal */}
      <AddStudentModal 
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        isTeacherMode={isTeacherMode}
      />
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 max-w-[1000px] mx-auto">
          {error}
        </div>
      )}
      
      {/* Main Content */}
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        {/* Teachers Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[32px] font-normal text-[#3c4043]">Teachers</h2>
            {isTeacher && (
              <button 
                className="p-2 hover:bg-[#f8f9fa] rounded-full"
                onClick={openAddTeacherModal}
              >
                <UserPlus size={20} className="text-[#1a73e8]" />
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="animate-pulse flex space-x-4 items-center justify-center">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 max-w-[300px]">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ) : teachers.length > 0 ? (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-4 p-3 hover:bg-[#f8f9fa] rounded-lg"
                >
                  {teacher.avatar ? (
                    <img
                      src={teacher.avatar}
                      alt={teacher.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-[15px]">
                      {teacher.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-[14px] text-[#3c4043]">{teacher.name}</div>
                    <div className="text-[12px] text-[#5f6368]">{teacher.email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <EmptyStateIllustration />
              <p className="text-[#5f6368] mt-4">No teachers in this class yet</p>
              <button 
                className="mt-4 px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1765c6] transition-colors"
                onClick={addCurrentUserAsTeacher}
              >
                Add Teacher
              </button>
            </div>
          )}
        </div>

        {/* Pending Students Section - Only visible to teachers */}
        {isTeacher && pendingStudents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[32px] font-normal text-[#3c4043]">Pending Approvals</h2>
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {pendingStudents.length} {pendingStudents.length === 1 ? 'student' : 'students'} awaiting approval
              </div>
            </div>
            
            <div className="space-y-2 bg-white rounded-lg border border-gray-200">
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[#f8f9fa] border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white text-[15px]">
                        {student.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-[14px] text-[#3c4043] font-medium">{student.name}</div>
                      <div className="text-[12px] text-[#5f6368]">{student.email}</div>
                      <div className="text-[12px] text-yellow-600 mt-1 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                        Requested to join on {new Date().toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">ID: {student.userId}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        console.log(`Approving student with userId: ${student.userId}`);
                        handleApproveStudent(student.userId);
                      }}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors flex items-center gap-1 font-medium"
                      title="Approve"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        console.log(`Rejecting student with userId: ${student.userId}`);
                        handleRejectStudent(student.userId);
                      }}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center gap-1 font-medium"
                      title="Reject"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
              <p><strong>Note:</strong> Students will gain access to class materials only after you approve them. Rejected students will need to request access again with a new enrollment code.</p>
            </div>
          </div>
        )}

        {/* Students Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[32px] font-normal text-[#3c4043]">Students</h2>
            <div className="flex items-center gap-2">
              {isTeacher && (
                <button 
                  className="p-2 hover:bg-[#f8f9fa] rounded-full"
                  onClick={openAddStudentModal}
                >
                  <UserPlus size={20} className="text-[#1a73e8]" />
                </button>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex space-x-4 items-center">
                    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-2 bg-white rounded-lg border border-gray-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[#f8f9fa] border-b border-gray-100 last:border-b-0 relative"
                >
                  <div className="flex items-center gap-4">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-[15px]">
                        {student.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-[14px] text-[#3c4043]">{student.name}</div>
                      <div className="text-[12px] text-[#5f6368]">{student.email}</div>
                      {student.status === 'approved' && (
                        <div className="text-[12px] text-green-600 mt-1 flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                          Approved
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.finalGrade && (
                      <div className={`text-sm font-medium ${student.finalGradeColor || 'text-gray-600'}`}>{student.finalGrade}</div>
                    )}
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === student.id ? null : student.id)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {/* Dropdown menu */}
                    {activeDropdownId === student.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-4 top-12 bg-white shadow-lg rounded-md border border-gray-200 z-10 py-1 w-32"
                      >
                        <button 
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 text-red-600"
                          onClick={() => {
                            setStudentToDelete(student.userId);
                            setDeleteModalVisible(true);
                            setActiveDropdownId(null);
                          }}
                        >
                          <Trash size={16} />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <EmptyStateIllustration />
              <p className="text-[#5f6368] mt-4">No students in this class yet</p>
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {isTeacher && (
                  <button 
                    className="px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1765c6] transition-colors flex items-center gap-2"
                    onClick={openAddStudentModal}
                  >
                    <UserPlus size={18} />
                    Add Student
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Remove student?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently remove the student from this class. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalVisible(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (studentToDelete) {
                    handleRemoveStudent(studentToDelete);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}