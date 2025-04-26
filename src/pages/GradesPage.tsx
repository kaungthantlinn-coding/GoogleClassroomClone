import React, { useEffect, useState } from 'react';
import { Calendar, BellDot, Settings, Download } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useStudentData, Student } from '../contexts/StudentDataContext';

export default function GradesPage() {
  const { classId } = useParams();
  const location = useLocation();

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isStream = currentPath.endsWith('/stream') || currentPath === `/class/${classId}`;
  const isClasswork = currentPath.endsWith('/classwork');
  const isPeople = currentPath.endsWith('/people');
  const isGrades = currentPath.endsWith('/grades');

  // Get student data from context
  const { students, syncGradeData } = useStudentData();
  
  // Add dummy state at the top-level of the component for force re-render
  const [, forceUpdate] = useState(0);

  // Listen for grade updates
  useEffect(() => {
    // Only trigger a lightweight re-render on grade events, never call syncGradeData here!
    const handleGradeUpdate = () => {
      forceUpdate(n => n + 1); // Just re-render, don't sync again!
    };
    window.addEventListener('gradesUpdated', handleGradeUpdate);
    window.addEventListener('submissionUpdated', handleGradeUpdate);
    window.addEventListener('newAssignmentCreated', handleGradeUpdate);
    // Sync grades ONCE when component mounts
    syncGradeData();
    return () => {
      window.removeEventListener('gradesUpdated', handleGradeUpdate);
      window.removeEventListener('submissionUpdated', handleGradeUpdate);
      window.removeEventListener('newAssignmentCreated', handleGradeUpdate);
    };
  }, []); // Only run once on mount

  // Calculate class metrics from student data
  const classMetrics = {
    average: calculateClassAverage(students),
    highest: findHighestGrade(students),
    lowest: findLowestGrade(students)
  };
  
  // Helper function to calculate class average
  function calculateClassAverage(students: Student[]) {
    if (students.length === 0) return '0%';
    
    const validGrades = students
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => parseFloat(student.finalGrade?.replace('%', '') || '0'));
      
    if (validGrades.length === 0) return '0%';
    
    const sum = validGrades.reduce((total: number, grade: number) => total + grade, 0);
    return (sum / validGrades.length).toFixed(1) + '%';
  }
  
  // Helper function to find highest grade
  function findHighestGrade(students: Student[]) {
    if (students.length === 0) return '0%';
    
    const validGrades = students
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => parseFloat(student.finalGrade?.replace('%', '') || '0'));
      
    if (validGrades.length === 0) return '0%';
    
    return Math.max(...validGrades).toFixed(1) + '%';
  }
  
  // Helper function to find lowest grade
  function findLowestGrade(students: Student[]) {
    if (students.length === 0) return '0%';
    
    const validGrades = students
      .filter((student: Student) => student.finalGrade && student.finalGrade !== '0%')
      .map((student: Student) => parseFloat(student.finalGrade?.replace('%', '') || '0'));
      
    if (validGrades.length === 0) return '0%';
    
    return Math.min(...validGrades).toFixed(1) + '%';
  }

  // Calculate grade distribution from student data
  const gradeDistribution = calculateGradeDistribution(students);
  
  // Helper function to calculate grade distribution
  function calculateGradeDistribution(students: Student[]) {
    const distribution = [
      { range: '90-100', count: 0, label: 'A' },
      { range: '80-89', count: 0, label: 'B' },
      { range: '70-79', count: 0, label: 'C' },
      { range: '60-69', count: 0, label: 'D' },
      { range: '0-59', count: 0, label: 'F' }
    ];
    
    students.forEach((student: Student) => {
      if (!student.finalGrade || student.finalGrade === '0%') return;
      
      const grade = parseFloat(student.finalGrade.replace('%', ''));
      
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
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      (student.id && student.id.toLowerCase().includes(search.toLowerCase()))
  );

  // Export grades as CSV
  const handleExportGrades = () => {
    const header = ['Student Name', 'Assignment Avg', 'Participation', 'Final Grade'];
    const rows = students.map(s => [
      s.name,
      s.assignmentAvg,
      s.participation,
      s.finalGrade
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${location.state?.className || 'class'}_grades.csv`;
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
                      const gradeValue = parseFloat(student.finalGrade?.replace('%', '') || '0');
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