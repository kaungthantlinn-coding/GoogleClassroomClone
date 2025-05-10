import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, BellDot, Settings, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useStudentData, Student } from '../contexts/StudentDataContext';
import * as courseApi from '../api/courseApi';

export default function GradesPage() {
  const { classId } = useParams();
  const location = useLocation();

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isStream = currentPath.endsWith('/stream') || currentPath === `/class/${classId}`;
  const isClasswork = currentPath.endsWith('/classwork');
  const isPeople = currentPath.endsWith('/people');
  const isGrades = currentPath.endsWith('/grades');

  // State for API-fetched students data
  const [apiStudents, setApiStudents] = useState<Student[]>([]);
  // State for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track if a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Track last fetch time to prevent excessive API calls
  const [lastFetchTime, setLastFetchTime] = useState(0);
  // Min time between API calls (5 seconds)
  const MIN_FETCH_INTERVAL = 5000;
  // Add dummy state at the top-level of the component for force re-render
  const [, forceUpdate] = useState(0);
  
  // Get student data from context (as fallback)
  const { students: contextStudents, syncGradeData } = useStudentData();
  
  // Combine API students with context students, prioritizing API data
  const students = apiStudents.length > 0 ? apiStudents : contextStudents;
  
  // Get user role to determine which API to use
  const userRole = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');
  const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
  const isTeacher = userRole?.toLowerCase() === 'teacher';

  // Create fetchGradesData function with useCallback to avoid recreation on each render
  const fetchGradesData = useCallback(async () => {
    if (!classId) return;
    
    // Prevent excessive API calls
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      console.log('Skipping API call - too soon since last fetch');
      return;
    }
    
    setLastFetchTime(now);
    setLoading(true);
    setError(null);
    
    try {
      let gradeData;
      
      if (isTeacher) {
        // Teacher can see all grades
        console.log('Fetching all course grades as teacher');
        gradeData = await courseApi.getCourseGrades(classId);
      } else if (userId) {
        // Student can only see their own grades
        console.log('Fetching student grades');
        gradeData = await courseApi.getStudentGrades(classId, userId);
      }
      
      console.log('Successfully fetched grades data:', gradeData);
      
      // Handle different API response formats
      if (gradeData) {
        // The structure might be in different formats
        const studentArray = Array.isArray(gradeData.studentGrades) ? gradeData.studentGrades : 
                            Array.isArray(gradeData.students) ? gradeData.students :
                            Array.isArray(gradeData) ? gradeData : [];
                            
        if (studentArray.length > 0) {
          // Map API data to match the Student interface
          const mappedStudents = studentArray.map((student: any) => ({
            id: student.studentId || student.id || `student-${Date.now()}`,
            name: student.studentName || student.name || 'Unknown Student',
            email: student.email,
            avatar: student.avatar,
            assignmentAvg: student.assignmentAvg || student.assignmentAverage || (student.grade ? `${student.grade}%` : '0%'),
            participation: student.participation || (student.submissions ? `${(student.submissions.length / (student.totalAssignments || 1) * 100).toFixed(1)}%` : '0%'),
            finalGrade: student.finalGrade || student.overallGrade || (student.grade ? `${student.grade}%` : '0%')
          }));
          
          console.log('Mapped student data:', mappedStudents);
          setApiStudents(mappedStudents);
          return; // Exit early if we successfully processed the data
        }
      }
      
      console.log('Grade data format unexpected, falling back to context data');
      // Fall back to context data
      syncGradeData();
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(err instanceof Error ? err.message : 'Failed to load grades data');
      // Fall back to context data
      syncGradeData();
    } finally {
      setLoading(false);
    }
  }, [classId, isTeacher, userId, lastFetchTime, MIN_FETCH_INTERVAL, syncGradeData]);

  // Function to manually refresh data
  const handleManualRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    await fetchGradesData();
    setIsRefreshing(false);
  };
  
  // Fetch grades data on component mount and when dependencies change
  useEffect(() => {
    // Initial data fetch
    fetchGradesData();
    
    // Listen for grade updates but prevent cascading refreshes
    const handleGradeUpdate = () => {
      forceUpdate(n => n + 1); // Re-render on grade updates
      // Don't call fetchGradesData() here to prevent infinite loops
    };
    
    window.addEventListener('gradesUpdated', handleGradeUpdate);
    window.addEventListener('submissionUpdated', handleGradeUpdate);
    window.addEventListener('newAssignmentCreated', handleGradeUpdate);
    
    return () => {
      window.removeEventListener('gradesUpdated', handleGradeUpdate);
      window.removeEventListener('submissionUpdated', handleGradeUpdate);
      window.removeEventListener('newAssignmentCreated', handleGradeUpdate);
    };
  }, [fetchGradesData]);

  // Calculate class metrics from student data
  const classMetrics = {
    average: calculateClassAverage(students),
    highest: findHighestGrade(students),
    lowest: findLowestGrade(students)
  };
  
  // Helper function to calculate class average
  function calculateClassAverage(studentList: Student[]) {
    if (studentList.length === 0) return '0%';
    
    const validGrades = studentList
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => {
        // Safely convert finalGrade to a number, handling both string and number types
        const gradeStr = typeof student.finalGrade === 'string' ? student.finalGrade : String(student.finalGrade || 0);
        return parseFloat(gradeStr.replace('%', ''));
      });
      
    if (validGrades.length === 0) return '0%';
    
    const sum = validGrades.reduce((total: number, grade: number) => total + grade, 0);
    return (sum / validGrades.length).toFixed(1) + '%';
  }
  
  // Helper function to find highest grade
  function findHighestGrade(studentList: Student[]) {
    if (studentList.length === 0) return '0%';
    
    const validGrades = studentList
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => {
        // Safely convert finalGrade to a number, handling both string and number types
        const gradeStr = typeof student.finalGrade === 'string' ? student.finalGrade : String(student.finalGrade || 0);
        return parseFloat(gradeStr.replace('%', ''));
      });
      
    if (validGrades.length === 0) return '0%';
    
    return Math.max(...validGrades).toFixed(1) + '%';
  }
  
  // Helper function to find lowest grade
  function findLowestGrade(studentList: Student[]) {
    if (studentList.length === 0) return '0%';
    
    const validGrades = studentList
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => {
        // Safely convert finalGrade to a number, handling both string and number types
        const gradeStr = typeof student.finalGrade === 'string' ? student.finalGrade : String(student.finalGrade || 0);
        return parseFloat(gradeStr.replace('%', ''));
      });
      
    if (validGrades.length === 0) return '0%';
    
    return Math.min(...validGrades).toFixed(1) + '%';
  }

  // Calculate grade distribution from student data
  const gradeDistribution = calculateGradeDistribution(students);
  
  // Helper function to calculate grade distribution
  function calculateGradeDistribution(studentList: Student[]) {
    const distribution = [
      { range: '90-100', count: 0, label: 'A' },
      { range: '80-89', count: 0, label: 'B' },
      { range: '70-79', count: 0, label: 'C' },
      { range: '60-69', count: 0, label: 'D' },
      { range: '0-59', count: 0, label: 'F' }
    ];
    
    studentList.forEach((student: Student) => {
      if (!student.finalGrade || student.finalGrade === '0%') return;
      
      // Safely handle finalGrade as either string or number
      let grade: number;
      if (typeof student.finalGrade === 'string') {
        grade = parseFloat(student.finalGrade.replace('%', ''));
      } else if (typeof student.finalGrade === 'number') {
        grade = student.finalGrade;
      } else {
        return; // Skip if finalGrade is neither string nor number
      }
      
      if (grade >= 90) distribution[0].count++;
      else if (grade >= 80) distribution[1].count++;
      else if (grade >= 70) distribution[2].count++;
      else if (grade >= 60) distribution[3].count++;
      else distribution[4].count++;
    });
    
    return distribution;
  }

  const [search, setSearch] = React.useState('');
  const filteredStudents = students.filter(
    (student: Student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.id && student.id.toLowerCase().includes(search.toLowerCase()))
  );

  // Export grades as CSV
  const handleExportGrades = () => {
    const header = ['Student Name', 'Assignment Avg', 'Participation', 'Final Grade'];
    const rows = students.map((s: Student) => [
      s.name,
      s.assignmentAvg,
      s.participation,
      s.finalGrade
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${location.state ? (location.state as any).className || 'class' : 'class'}_grades.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#e0e0e0] w-full">
        <div className="flex flex-wrap justify-between items-center w-full px-3 sm:px-6">
          <nav className="flex overflow-x-auto scrollbar-hide">
            <Link
              to={`/class/${classId}/stream`}
              className={`px-2 sm:px-4 py-3 sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isStream
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium"
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
                }`}
            >
              Stream
            </Link>
            <Link
              to={`/class/${classId}/classwork`}
              className={`px-2 sm:px-4 py-3 sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isClasswork
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium"
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
                }`}
            >
              Classwork
            </Link>
            <Link
              to={`/class/${classId}/people`}
              className={`px-2 sm:px-4 py-3 sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isPeople
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium"
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
                }`}
            >
              People
            </Link>
            <Link
              to={`/class/${classId}/grades`}
              className={`px-2 sm:px-4 py-3 sm:py-[14px] text-[13px] sm:text-[14px] whitespace-nowrap ${isGrades
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium"
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
                }`}
            >
              Grades
            </Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className="p-1 sm:p-2 hover:bg-[#f8f9fa] rounded-full relative"
              title="Refresh grades data"
            >
              <RefreshCw size={18} className={`text-[#444746] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-1 sm:p-2 hover:bg-[#f8f9fa] rounded-full">
              <Calendar size={18} className="text-[#444746]" />
            </button>
            <button className="p-1 sm:p-2 hover:bg-[#f8f9fa] rounded-full">
              <BellDot size={18} className="text-[#444746]" />
            </button>
            <button className="p-1 sm:p-2 hover:bg-[#f8f9fa] rounded-full">
              <Settings size={18} className="text-[#444746]" />
            </button>
          </div>
        </div>
      </div>

      {/* Header with Class Name and Export Button */}
      <div className="bg-white border-b py-3 sm:py-4 px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <div className="text-blue-700 bg-blue-100 rounded p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold truncate">{location.state?.className || 'Class'} - Grades</h1>
        </div>
        <button className="flex items-center gap-2 border rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base hover:bg-gray-50" onClick={handleExportGrades}>
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Export Grades</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left side - Student Grades */}
        <div className="flex-1 order-2 lg:order-1">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-3 sm:p-4 border-b flex items-center gap-2">
              <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <h2 className="text-lg sm:text-xl font-bold">Student Grades</h2>
            </div>

            {/* Search input */}
            <div className="p-3 sm:p-4 border-b">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <input
                  type="search"
                  className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search students..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-10 flex justify-center items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500">Loading grade data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="py-10 flex justify-center items-center">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md">
                    <div className="flex items-start">
                      <AlertCircle className="text-red-500 mt-0.5 mr-2" size={18} />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Error loading grades</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                        <p className="mt-2 text-sm text-red-700">Using backup grade data instead.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="hidden sm:table-header-group">
                    <tr className="border-b">
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-medium text-gray-600">Assignment Avg</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-medium text-gray-600">Participation</th>
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-6 font-medium text-gray-600">Final Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => {
                        // Determine grade color based on final grade percentage
                        // Safely convert finalGrade to a number, handling both string and number types
                        let gradeValue: number;
                        if (typeof student.finalGrade === 'string') {
                          gradeValue = parseFloat(student.finalGrade.replace('%', ''));
                        } else if (typeof student.finalGrade === 'number') {
                          gradeValue = student.finalGrade;
                        } else {
                          gradeValue = 0;
                        }
                        let gradeColor = '';
                        
                        if (gradeValue >= 90) gradeColor = 'text-green-600';
                        else if (gradeValue >= 80) gradeColor = 'text-blue-600';
                        else if (gradeValue >= 70) gradeColor = 'text-yellow-600';
                        else if (gradeValue >= 60) gradeColor = 'text-orange-600';
                        else if (gradeValue > 0) gradeColor = 'text-red-600';
                        else gradeColor = 'text-gray-400';
                        
                        return (
                          <tr key={student.id || index} className="border-b hover:bg-gray-50 sm:table-row flex flex-col">
                            <td className="py-3 sm:py-4 px-3 sm:px-6 flex items-center gap-2">
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                  {student.name.charAt(0)}
                                </div>
                              )}
                              <span>{student.name}</span>
                            </td>
                            <td className="py-2 sm:py-4 px-3 sm:px-6 flex sm:table-cell">
                              <span className="sm:hidden font-medium mr-2">Assignment Avg:</span>
                              <span>{student.assignmentAvg || '0%'}</span>
                            </td>
                            <td className="py-2 sm:py-4 px-3 sm:px-6 flex sm:table-cell">
                              <span className="sm:hidden font-medium mr-2">Participation:</span>
                              <span>{student.participation || '0%'}</span>
                            </td>
                            <td className={`py-2 sm:py-4 px-3 sm:px-6 flex sm:table-cell ${gradeColor} font-medium`}>
                              <span className="sm:hidden font-medium mr-2 text-gray-600">Final Grade:</span>
                              <span>{student.finalGrade || '0%'}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No students found matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Class Metrics and Grade Distribution */}
        <div className="w-full lg:w-[350px] space-y-4 sm:space-y-6 order-1 lg:order-2">
          {/* Class Metrics */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-3 sm:p-4 border-b flex items-center gap-2">
              <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-9"></path>
                <path d="M14 17H5"></path>
                <circle cx="17" cy="17" r="3"></circle>
                <circle cx="7" cy="7" r="3"></circle>
              </svg>
              <h2 className="text-lg sm:text-xl font-bold">Class Metrics</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Class Average:</span>
                <span className="font-medium text-base sm:text-lg bg-blue-50 px-3 py-1 rounded-full">{classMetrics.average}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Highest Grade:</span>
                <span className="font-medium text-base sm:text-lg text-green-600 bg-green-50 px-3 py-1 rounded-full">{classMetrics.highest}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm sm:text-base">Lowest Grade:</span>
                <span className="font-medium text-base sm:text-lg text-red-600 bg-red-50 px-3 py-1 rounded-full">{classMetrics.lowest}</span>
              </div>
              <div className="mt-2 pt-3 sm:pt-4 border-t">
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Total Students: {students.length}</div>
                <div className="text-xs sm:text-sm text-gray-500">Graded: {students.filter(s => s.finalGrade && s.finalGrade !== '0%').length}</div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-3 sm:p-4 border-b flex items-center gap-2">
              <svg className="text-blue-600" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
              <h2 className="text-lg sm:text-xl font-bold">Grade Distribution</h2>
            </div>
            <div className="p-4 sm:p-6">
              {/* Enhanced bar chart with letter grades */}
              <div className="h-36 sm:h-48 flex items-end justify-between gap-1">
                {gradeDistribution.map((grade, index) => (
                  <div key={index} className="flex flex-col items-center w-full">
                    <div className="relative w-full group">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${Math.max(grade.count * 30, grade.count > 0 ? 16 : 4)}px`,
                          backgroundColor: grade.count > 0 ? 
                            index === 0 ? '#34A853' : // A - Green
                            index === 1 ? '#4285F4' : // B - Blue
                            index === 2 ? '#FBBC05' : // C - Yellow
                            index === 3 ? '#FA7B17' : // D - Orange
                            '#EA4335'                 // F - Red
                            : '#E8EAED'
                        }}
                      ></div>
                      {grade.count > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border rounded p-1 text-xs whitespace-nowrap shadow-md z-10">
                          <span className="font-medium">{grade.range}</span>
                          <br />
                          <span>Students: {grade.count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center mt-2">
                      <span className="text-xs font-medium">{grade.label}</span>
                      <span className="text-xs text-gray-500 hidden sm:block">{grade.range}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}