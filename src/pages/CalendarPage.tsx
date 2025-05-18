import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as courseApi from '../api/courseApi';
import { Course } from '../types/course';
import { Assignment, getCalendarAssignments } from '../types/assignment';

interface CalendarAssignment extends Assignment {
  color?: string;
}

export default function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<CalendarAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.date) {
      setCurrentDate(new Date(location.state.date));
    }
    
    // Update document title
    document.title = "Calendar - Google Classroom";

    // Fetch courses and calendar assignments
    const fetchData = async () => {
      try {
        // Fetch courses
        const fetchedCourses = await courseApi.getCourses();
        setCourses(fetchedCourses);
        
        // Fetch all calendar assignments
        try {
          const calendarAssignments = await getCalendarAssignments();
          setAssignments(calendarAssignments);
          console.log('Fetched calendar assignments:', calendarAssignments);
        } catch (error) {
          console.error('Error fetching calendar assignments:', error);
          setAssignments([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [location.state?.date]);
  
  // Filter assignments when selectedClass changes
  useEffect(() => {
    if (selectedClass === 'All classes') {
      setSelectedClassId(null);
    } else {
      const selected = courses.find(course => `${course.name} - ${course.section || ''}`.trim() === selectedClass);
      setSelectedClassId(selected?.id || null);
    }
  }, [selectedClass, courses]);

  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const formatDateRange = () => {
    const endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Helper function to get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    if (!assignments || assignments.length === 0) return [];
    
    // Filter assignments based on the due date
    const dateAssignments = assignments.filter(assignment => {
      // Skip if no due date
      if (!assignment.dueDate) {
        return false;
      }
      
      // If a class is selected, filter by class ID
      if (selectedClassId && assignment.classId !== selectedClassId) {
        return false;
      }
      
      try {
        // Handle different date formats
        const dueDate = new Date(assignment.dueDate);
        
        // Check if dates match (ignore time)
        const dateMatch = dueDate.toDateString() === date.toDateString();
        
        return dateMatch;
      } catch (err) {
        console.error('Error parsing date:', assignment.dueDate, err);
        return false;
      }
    });
    
    return dateAssignments;
  };
  
  // Handle assignment click - navigate to assignment details
  const handleAssignmentClick = (assignment: Assignment) => {
    navigate(`/c/${assignment.classId}/a/${assignment.id}/details`);
  };
  
  
  // Format time from a date string or "11:59 PM" format
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      // Try parsing it as a date-time string
      if (timeString.includes('T') || timeString.includes('-')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      
      // Otherwise, assume it's already in the right format
      return timeString;
    } catch (e) {
      return timeString; // Return as is if parsing fails
    }
  };
  
  // Used for debugging when assignments aren't showing
  useEffect(() => {
    if (assignments.length > 0) {
      console.log('Assignment dates in calendar:', assignments.map(a => {
        return {
          title: a.title,
          dueDate: a.dueDate,
          parsed: a.dueDate ? new Date(a.dueDate).toDateString() : 'none'
        };
      }));
      
      // Check if any assignments would appear on May 16th
      const may16 = new Date('2025-05-16');
      const may16Assignments = assignments.filter(a => {
        if (!a.dueDate) return false;
        try {
          const dueDate = new Date(a.dueDate);
          return dueDate.toDateString() === may16.toDateString();
        } catch (e) {
          return false;
        }
      });
      
      console.log('Assignments for May 16th:', may16Assignments);
    }
  }, [assignments]);

  // Render a skeleton loader for assignments
  const renderSkeletonLoader = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={`skeleton-${i}`} className="mb-2 p-2 rounded-md shadow-sm bg-gray-100 animate-pulse">
        <div className="flex flex-col">
          <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
          <div className="bg-gray-200 h-3 w-1/3 rounded"></div>
        </div>
      </div>
    ));
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-[#f9f9f9] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 pt-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="relative inline-block min-w-[200px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-[15px] text-gray-700 focus:outline-none focus:border-blue-500 hover:bg-gray-50"
              disabled={loading}
            >
              <option>All classes</option>
              {courses.map(course => (
                <option key={course.id}>
                  {`${course.name}${course.section ? ` - ${course.section}` : ''}`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown size={20} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              disabled={loading}
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-[#3c4043] text-[15px] font-medium">{formatDateRange()}</span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              disabled={loading}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="grid grid-cols-7 h-full">
            {weekDates.map((date, index) => (
              <div 
                key={date.toISOString()} 
                className={`bg-white ${index !== 6 ? 'border-r border-gray-100' : ''}`}
              >
                <div className="text-center py-2.5 border-b border-gray-100">
                  <div className="text-[11px] text-[#70757a] font-medium uppercase tracking-wide">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div 
                    className={`text-[26px] mt-0.5 mx-auto
                      ${isToday(date) 
                        ? 'text-white bg-[#1a73e8] rounded-full w-10 h-10 flex items-center justify-center font-normal' 
                        : 'text-[#3c4043] font-light'
                      }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
                <div className="h-full p-2 overflow-y-auto">
                  {loading ? (
                    renderSkeletonLoader()
                  ) : getAssignmentsForDate(date).length > 0 ? (
                    getAssignmentsForDate(date).map(assignment => (
                      <div 
                        key={assignment.id}
                        className="mb-2 p-2 rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md"
                        style={{ 
                          backgroundColor: assignment.color ? `${assignment.color}10` : '#f0f8ff',
                          borderLeft: `4px solid ${assignment.color || '#4285f4'}`
                        }}
                        onClick={() => handleAssignmentClick(assignment)}
                        title={`Due: ${assignment.dueDate} at ${assignment.dueTime || '11:59 PM'}
Class: ${assignment.className || 'Unknown'}
Points: ${assignment.points}
${assignment.instructions ? 'Instructions: ' + assignment.instructions.substring(0, 100) + (assignment.instructions.length > 100 ? '...' : '') : ''}`}
                      >
                        <div className="flex flex-col">
                          <div className="font-medium text-sm truncate">
                            {assignment.title}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-gray-600">
                              {assignment.dueTime ? formatTime(assignment.dueTime) : '11:59 PM'}
                            </div>
                            {assignment.className && (
                              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                                {assignment.className}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-gray-500 text-sm">No assignments due</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
