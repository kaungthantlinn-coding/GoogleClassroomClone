import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import GradeDistributionChart from '../components/GradeDistributionChart';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Checkbox } from '../components/ui/checkbox';
import { Breadcrumb } from '../components/ui/breadcrumb';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  status: 'submitted' | 'late' | 'missing' | 'graded';
  submittedDate: string;
  grade?: number;
}

interface Stats {
  totalStudents: number;
  submitted: number;
  late: number;
  missing: number;
  graded: number;
  submissionRate: number;
}

// Define StatCard component
const StatCard = ({ icon, title, value, description }: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  description: string 
}) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-500">{title}</span>
    </div>
    <div className="text-2xl font-semibold mb-1">{value}</div>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const SubmissionsPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract class ID from URL if present
  const getClassIdFromPath = () => {
    const match = location.pathname.match(/\/class\/([^\/]+)/);
    return match ? match[1] : null;
  };
  
  const classId = getClassIdFromPath();
  
  // Initialize with static data instead of empty values that would trigger API calls
  const [assignment] = useState(() => {
    // Try to get assignment data from localStorage if available
    let assignmentData = {
      id: assignmentId || '',
      title: 'Test - Submissions',
      courseName: 'Full Stack Developer Class',
      points: '100',
      className: 'Cloud',
      section: 'Batch2',
    };
    
    // Check if we have class data in localStorage
    if (classId) {
      try {
        const classDataStr = localStorage.getItem(`classData-${classId}`);
        if (classDataStr) {
          const classData = JSON.parse(classDataStr);
          if (classData) {
            assignmentData.className = classData.name || classData.className || 'Class';
            assignmentData.section = classData.section || '';
          }
        }
      } catch (e) {
        console.error('Error loading class data from localStorage', e);
      }
    }
    
    // Check if we have assignment data in localStorage
    try {
      const assignmentKey = `assignment-${assignmentId}`;
      const storedAssignment = localStorage.getItem(assignmentKey);
      if (storedAssignment) {
        const parsedAssignment = JSON.parse(storedAssignment);
        if (parsedAssignment) {
          assignmentData = {
            ...assignmentData,
            ...parsedAssignment,
          };
        }
      }
    } catch (e) {
      console.error('Error loading assignment data from localStorage', e);
    }
    
    return assignmentData;
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use static sample data instead of API calls for demo purposes
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: '1',
      studentName: 'Alice Smith',
      studentId: '1001',
      status: 'submitted',
      submittedDate: 'June 12th, 2023',
    },
    {
      id: '2',
      studentName: 'Bob Johnson',
      studentId: '1002',
      status: 'late',
      submittedDate: 'June 17th, 2023',
    },
    {
      id: '3',
      studentName: 'Charlie Davis',
      studentId: '1003',
      status: 'graded',
      submittedDate: 'June 10th, 2023',
      grade: 100,
    },
    {
      id: '4',
      studentName: 'Diana Wilson',
      studentId: '1004',
      status: 'missing',
      submittedDate: '',
    },
  ]);
  
  // Filtered submissions based on search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm) return submissions;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return submissions.filter(submission => 
      submission.studentName.toLowerCase().includes(lowerSearchTerm) ||
      submission.studentId.toLowerCase().includes(lowerSearchTerm)
    );
  }, [submissions, searchTerm]);
  
  // Grade All modal state
  const [showGradeAllModal, setShowGradeAllModal] = useState(false);
  const [gradeValue, setGradeValue] = useState("100");
  
  // Calculate stats from filtered submissions data
  const stats = useMemo<Stats>(() => {
    const totalStudents = filteredSubmissions.length;
    const submitted = filteredSubmissions.filter(sub => sub.status === 'submitted').length;
    const late = filteredSubmissions.filter(sub => sub.status === 'late').length;
    const missing = filteredSubmissions.filter(sub => sub.status === 'missing').length;
    const graded = filteredSubmissions.filter(sub => sub.status === 'graded').length;
    
    return {
      totalStudents,
      submitted,
      late,
      missing,
      graded,
      submissionRate: totalStudents > 0 ? Math.round(((submitted + late + graded) / totalStudents) * 100) : 0,
    };
  }, [filteredSubmissions]);
  
  // Calculate average grade from filtered graded submissions
  const getAverageGrade = useCallback(() => {
    const gradedSubmissions = filteredSubmissions.filter(sub => sub.status === 'graded' && sub.grade !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const sum = gradedSubmissions.reduce((total, sub) => total + Number(sub.grade), 0);
    return sum / gradedSubmissions.length;
  }, [filteredSubmissions]);
  
  // Calculate median grade from filtered graded submissions
  const getMedianGrade = useCallback(() => {
    const gradedSubmissions = filteredSubmissions.filter(sub => sub.status === 'graded' && sub.grade !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const grades = gradedSubmissions.map(sub => Number(sub.grade)).sort((a, b) => a - b);
    const mid = Math.floor(grades.length / 2);
    
    return grades.length % 2 === 0
      ? (grades[mid - 1] + grades[mid]) / 2
      : grades[mid];
  }, [filteredSubmissions]);
  
  // Get grade distribution data for the chart from filtered submissions
  const getGradeDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 10 ranges: 0-9, 10-19, ..., 90-100
    const labels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
    
    filteredSubmissions.forEach(submission => {
      if (submission.status === 'graded' && submission.grade !== undefined) {
        const grade = Number(submission.grade);
        const index = Math.min(Math.floor(grade / 10), 9); // Cap at index 9 for grades of 90-100
        distribution[index]++;
      }
    });

    // Create ranges with labels and counts
    const ranges = distribution.map((count, i) => ({
      label: labels[i],
      count,
      min: i * 10,
      max: i === 9 ? 100 : i * 10 + 9
    }));
    
    return ranges;
  }, [filteredSubmissions]);
  
  // Breadcrumb items
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Classroom', href: '/' },
    ];
    
    if (classId) {
      items.push({ label: assignment.className, href: `/class/${classId}` });
      items.push({ label: 'Classwork', href: `/class/${classId}/classwork` });
      items.push({ label: 'Assignment', href: `/class/${classId}/assignment/${assignmentId}` });
      items.push({ label: 'Submissions', href: '' });
    } else {
      items.push({ label: 'Classwork', href: '/classwork' });
      items.push({ label: 'Assignment', href: `/assignment/${assignmentId}` });
      items.push({ label: 'Submissions', href: '' });
    }
    
    return items;
  }, [classId, assignmentId, assignment.className]);
  
  const handleBackToAssignment = useCallback(() => {
    // Check if we're in a class context
    if (classId) {
      // If we're in a class, navigate to the class-specific classwork route
      navigate(`/class/${classId}/classwork`, { 
        state: { 
          fromAssignment: assignmentId,
          className: assignment.className,
          section: assignment.section
        } 
      });
    } else {
      // Otherwise use the generic classwork route
      navigate('/classwork', { state: { fromAssignment: assignmentId } });
    }
  }, [navigate, assignmentId, classId, assignment.className, assignment.section]);
  
  const handleViewSubmission = useCallback((submissionId: string) => {
    console.log(`Viewing submission ${submissionId}`);
    // Find the submission by ID to get the studentId
    const submission = submissions.find(sub => sub.id === submissionId);
    if (submission) {
      // Navigate to the student submission page using studentId instead of submissionId
      navigate(`/submissions/${assignmentId}/student/${submission.studentId}`);
    }
  }, [navigate, assignmentId, submissions]);
  
  const handleGradeAll = useCallback(() => {
    setShowGradeAllModal(true);
  }, []);
  
  const applyGradeToAll = useCallback(() => {
    // Get IDs of students from filtered submissions
    const filteredIds = filteredSubmissions.map(sub => sub.id);
    
    // Update only filtered submissions, preserve others
    const updatedSubmissions = submissions.map(submission => {
      if (filteredIds.includes(submission.id)) {
        return {
          ...submission,
          grade: parseInt(gradeValue),
          status: 'graded' as const
        };
      }
      return submission;
    });
    
    setSubmissions(updatedSubmissions);
    setShowGradeAllModal(false);
  }, [gradeValue, submissions, filteredSubmissions]);
  
  const getStatusIcon = (status: Submission['status']) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'late':
        return <Clock size={18} className="text-amber-500" />;
      case 'missing':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'graded':
        return <Target size={18} className="text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: Submission['status']) => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'late':
        return 'Late';
      case 'missing':
        return 'Missing';
      case 'graded':
        return 'Graded';
      default:
        return '';
    }
  };

  // Handle updating the submission status when returning from grading page
  useEffect(() => {
    const handleStorageChange = () => {
      const gradedSubmissionJson = localStorage.getItem('gradedSubmission');
      if (gradedSubmissionJson) {
        try {
          const gradedSubmission = JSON.parse(gradedSubmissionJson);
          // Update the submissions list with graded submission
          setSubmissions(prevSubmissions => 
            prevSubmissions.map(sub => 
              sub.id === gradedSubmission.id ? 
                { 
                  ...sub, 
                  status: 'graded',
                  grade: gradedSubmission.grade
                } : sub
            )
          );
          // Clear the storage after using it
          localStorage.removeItem('gradedSubmission');
        } catch (e) {
          console.error('Error parsing graded submission', e);
        }
      }
    };

    // Check for graded submissions when component mounts
    handleStorageChange();

    // Listen for storage changes (for cross-tab communication)
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Breadcrumb navigation removed as requested */}
      
      <div className="p-6">
        {/* Back link */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-2 p-0 hover:bg-transparent" 
            onClick={handleBackToAssignment}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to assignment</span>
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Assignment title */}
          <div>
            <h1 className="text-2xl font-medium">
              {assignment.title}
            </h1>
            <div className="text-gray-500 text-sm flex items-center gap-2 mt-1">
              <span>{assignment.className || assignment.courseName}</span>
              {assignment.section && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{assignment.section}</span>
                </>
              )}
              <span className="text-gray-400">•</span>
              <span>{assignment.points} points</span>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} 
              title="Submission Rate" 
              value={`${stats.submissionRate}%`} 
              description={`${stats.submitted + stats.late + stats.graded} of ${stats.totalStudents} students`}
            />
            <StatCard 
              icon={<Clock className="h-5 w-5 text-amber-500" />} 
              title="Late" 
              value={stats.late.toString()} 
              description="submissions"
            />
            <StatCard 
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />} 
              title="Missing" 
              value={stats.missing.toString()} 
              description="submissions"
            />
            <StatCard 
              icon={<Target className="h-5 w-5 text-indigo-500" />} 
              title="Graded" 
              value={stats.graded.toString()} 
              description="submissions"
            />
          </div>

          {/* Submissions table */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Submissions</h2>
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                
                <Button variant="outline" onClick={handleGradeAll}>
                  Grade All
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No submissions match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="font-medium">{submission.studentName}</div>
                          <div className="text-sm text-muted-foreground">ID: {submission.studentId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(submission.status)}
                            <span className={`
                              ${submission.status === 'submitted' ? 'text-green-700' : ''}
                              ${submission.status === 'late' ? 'text-amber-700' : ''}
                              ${submission.status === 'missing' ? 'text-red-700' : ''}
                              ${submission.status === 'graded' ? 'text-blue-700' : ''}
                            `}>
                              {getStatusText(submission.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.submittedDate || 'Not submitted'}
                        </TableCell>
                        <TableCell>
                          {submission.grade !== undefined 
                            ? `${submission.grade} / ${assignment.points}` 
                            : 'Not graded'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewSubmission(submission.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Grade Distribution</h2>
            
            <GradeDistributionChart data={getGradeDistribution} className="h-[200px]" />
            
            
            <div className="mt-6 pt-6 border-t flex gap-8">
              <div>
                <div className="text-sm text-muted-foreground">Average</div>
                <div className="text-2xl font-semibold">
                  {getAverageGrade().toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Median</div>
                <div className="text-2xl font-semibold">
                  {getMedianGrade().toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grade All Modal */}
      {showGradeAllModal && (
        <Dialog open={showGradeAllModal} onOpenChange={setShowGradeAllModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade All Submissions</DialogTitle>
              <DialogDescription>
                This will apply the same grade to all visible submissions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="grade" className="text-right">
                  Grade
                </Label>
                <Input
                  id="grade"
                  type="number"
                  value={gradeValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGradeValue(e.target.value)}
                  className="col-span-3"
                  min="0"
                  max={assignment.points}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Adjust
                </Label>
                <div className="col-span-3">
                  <Slider 
                    value={[parseInt(gradeValue)]} 
                    max={parseInt(assignment.points)}
                    step={1}
                    onValueChange={(value: number[]) => setGradeValue(value[0].toString())}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGradeAllModal(false)}>
                Cancel
              </Button>
              <Button onClick={applyGradeToAll}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SubmissionsPage;