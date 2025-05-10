import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createCourse, enrollCourse, addTeacherToCourse } from '../api/courseApi';

interface ClassActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'join' | 'create';
}

export default function ClassActionDialog({ isOpen, onClose, type }: ClassActionDialogProps) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form fields when dialog opens or type changes
  React.useEffect(() => {
    setClassName('');
    setSection('');
    setSubject('');
    setRoom('');
    setEnrollmentCode('');
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'name':
        setClassName(value);
        break;
      case 'section':
        setSection(value);
        break;
      case 'subject':
        setSubject(value);
        break;
      case 'room':
        setRoom(value);
        break;
      case 'classCode':
        setEnrollmentCode(value);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'create') {
      // Only create class if name is provided
      if (!className.trim()) {
        alert("Please provide a class name");
        return;
      }
      
      // Random theme colors
      const colors = ['#1a73e8', '#1e8e3e', '#d93025', '#4285f4', '#f8836b', '#ff6d00', '#795548'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      console.log("Selected random color for new class:", randomColor);

      // Random education-related keywords for Unsplash
      const keywords = [
        'education',
        'classroom',
        'learning',
        'study',
        'school',
        'university',
        'library',
        'books',
        'technology',
        'computer'
      ];
      
      // Get two random keywords
      const randomKeyword1 = keywords[Math.floor(Math.random() * keywords.length)];
      const randomKeyword2 = keywords[Math.floor(Math.random() * keywords.length)];
      
      // Create random Unsplash URL with timestamp to prevent caching
      const randomImage = `https://source.unsplash.com/random/1600x900/?${randomKeyword1},${randomKeyword2}&t=${Date.now()}`;
      
      // Create course data object to send to the API
      const courseData = { 
        name: className.trim(),
        section: section.trim() || "Batch 1",
        teacherName: user?.name || 'You',
        subject: subject.trim(),
        room: room.trim(),
        color: randomColor,
        textColor: 'white',
        coverImage: randomImage
      };
      
      console.log("Creating course with data:", JSON.stringify(courseData, null, 2));
      
      try {
        // Call the API to create a new course
        const createdCourse = await createCourse(courseData);
        console.log('Created new course:', createdCourse);
        
        // Ensure we have a color to use (prefer API response, fallback to our random color)
        const finalColor = createdCourse.color || randomColor;
        console.log('Final color being used:', finalColor);
        
        // Invalidate courses query to refresh data
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        
        // Dispatch class-created event to update sidebar
        const classCreatedEvent = new CustomEvent('class-created', {
          detail: {
            action: 'addClass',
            class: {
              id: createdCourse.id || createdCourse.courseId?.toString() || createdCourse.courseGuid,
              name: createdCourse.name,
              section: createdCourse.section || '',
              color: finalColor
            }
          }
        });
        window.dispatchEvent(classCreatedEvent);
        
        // Navigate to the new class page using the appropriate ID (courseGuid, courseId, or id)
        const courseId = createdCourse.courseGuid || createdCourse.courseId?.toString() || createdCourse.id;
        navigate(`/class/${courseId}`, { 
          state: { 
            className: createdCourse.name, 
            section: createdCourse.section,
            coverImage: randomImage,
            color: finalColor
          }
        });

        // Add current user as teacher if they created the course
        if (createdCourse.id && user) {
          try {
            await addTeacherToCourse(createdCourse.id, {
              name: user.name,
              email: user.email
            });
            console.log('Added creator as teacher to the course');
          } catch (teacherError) {
            console.error('Error adding teacher to course:', teacherError);
            // Continue anyway since the course was created
          }
        }
      } catch (error) {
        console.error('Error creating course:', error);
        alert('Failed to create course. Please try again.');
      }
    } else if (type === 'join') {
      // Join existing class
      if (!enrollmentCode) {
        alert("Please enter a class code");
        return;
      }
      
      try {
        // Call the API to join a course with the enrollment code
        await enrollCourse(enrollmentCode);
        
        // Invalidate courses query to refresh data
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        
        // Dispatch event to update sidebar with joined class
        const joinedClassEvent = new CustomEvent('class-created', {
          detail: { action: 'addClass' }
        });
        window.dispatchEvent(joinedClassEvent);
        
        // Navigate to home page to see the joined class
        navigate('/');
        
      } catch (error) {
        console.error('Error joining course:', error);
        alert('Failed to join class. Please check the class code and try again.');
      }
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-[450px] overflow-hidden">
        {type === 'join' ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Join class</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <p className="text-sm text-[#5f6368] mb-4">
                Ask your teacher for the class code, then enter it here.
              </p>
              <div className="mb-6">
                <input
                  type="text"
                  name="classCode"
                  placeholder="Class code"
                  value={enrollmentCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a73e8] text-white font-medium rounded hover:bg-[#1557b0] disabled:opacity-50 disabled:hover:bg-[#1a73e8]"
                  disabled={!enrollmentCode}
                >
                  Join
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Create class</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={className}
                    onChange={handleInputChange}
                    placeholder="Class name (required)"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="section"
                    value={section}
                    onChange={handleInputChange}
                    placeholder="Section"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={handleInputChange}
                    placeholder="Subject"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="room"
                    value={room}
                    onChange={handleInputChange}
                    placeholder="Room"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a73e8] text-white rounded-md font-medium hover:bg-[#1557b0] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!className}
                >
                  Create
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}