import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { useStudentData } from '../contexts/StudentDataContext';
import * as storageApi from '../api/storageApi';
import * as assignmentApi from '../api/assignmentApi';

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  status: 'submitted' | 'late' | 'missing' | 'graded';
  submittedDate?: string;
  grade?: number;
  letterGrade?: string;
  gradePercentage?: number;
  feedback?: string;
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

  // Extract class ID from URL if present or from location state
  const getClassIdFromPath = () => {
    const match = location.pathname.match(/\/class\/([^\/]+)/);
    return match ? match[1] : (location.state?.classId || null);
  };

  const classId = getClassIdFromPath();

  // Initialize with static data instead of empty values that would trigger API calls
  const [assignment, setAssignment] = useState({
    id: assignmentId || '',
    title: 'Loading...',
    courseName: 'Loading...',
    points: '100',
    className: location.state?.className || 'Loading...',
    section: location.state?.section || '',
  });

  // Load assignment data from API
  useEffect(() => {
    const loadAssignmentData = async () => {
      if (!assignmentId) return;
      
      try {
        // Fetch assignment by ID from API
        const assignmentData = await assignmentApi.getAssignment(assignmentId);
        
        // Update state with the fetched data
        setAssignment(prev => ({
          ...prev,
          ...assignmentData,
          // Ensure we have these fields even if API doesn't provide them
          className: assignmentData.className || location.state?.className || prev.className,
          section: assignmentData.section || location.state?.section || prev.section,
        }));
      } catch (error) {
        console.error('Error loading assignment data from API:', error);
      }
    };
    
    loadAssignmentData();
  }, [assignmentId, location.state?.className, location.state?.section]);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { submissions: contextSubmissions } = useStudentData();
  
  // Load submissions from API
  useEffect(() => {
    const loadSubmissions = async () => {
      if (!assignmentId) return;
      
      try {
        // Use existing submissions from context if available
        if (contextSubmissions && contextSubmissions.length > 0) {
          setSubmissions(contextSubmissions as Submission[]);
          return;
        }
        
        // Otherwise fetch from API
        const submissionsData = await assignmentApi.getSubmissions(assignmentId);
        console.log('Raw API submissions data:', submissionsData);
        
        if (submissionsData && submissionsData.length > 0) {
          // Map API response data to match our Submission interface
          const mappedSubmissions = submissionsData.map(submission => {
            // Ensure status is one of the accepted enum values
            let status: 'submitted' | 'late' | 'missing' | 'graded';
            
            if (submission.graded) {
              status = 'graded';
            } else if (submission.submittedAt) {
              // Check if submission is late based on date
              const submittedDate = new Date(submission.submittedAt);
              const now = new Date();
              // If submission date is more than 24 hours ago, consider it late
              // This is just an example logic, adjust as needed
              status = (now.getTime() - submittedDate.getTime() > 24 * 60 * 60 * 1000) ? 'late' : 'submitted';
            } else {
              status = 'missing';
            }
            
            return {
              id: submission.submissionId?.toString() || `submission-${Date.now()}`,
              studentId: submission.userId?.toString() || 'unknown',
              studentName: submission.userName || 'Unknown Student',
              status: status,
              submittedDate: submission.submittedAt,
              grade: submission.grade,
              feedback: submission.feedback
            };
          });
          
          // De-duplicate submissions by student ID
          // If a student has multiple submissions, prioritize graded > submitted > late > missing
          const uniqueSubmissions: { [key: string]: Submission } = {};
          
          // First, group by student ID
          mappedSubmissions.forEach(submission => {
            const existingSubmission = uniqueSubmissions[submission.studentId];
            
            // Priority: graded > submitted > late > missing
            if (!existingSubmission) {
              // No existing submission for this student, add it
              uniqueSubmissions[submission.studentId] = submission;
            } else {
              // Submission already exists, check if this one has higher priority
              const newPriority = submission.status === 'graded' ? 3 : 
                                 submission.status === 'submitted' ? 2 : 
                                 submission.status === 'late' ? 1 : 0;
                                 
              const existingPriority = existingSubmission.status === 'graded' ? 3 : 
                                     existingSubmission.status === 'submitted' ? 2 : 
                                     existingSubmission.status === 'late' ? 1 : 0;
              
              // If new submission has higher priority or same priority but more recent
              if (newPriority > existingPriority || 
                 (newPriority === existingPriority && 
                  submission.submittedDate && existingSubmission.submittedDate && 
                  new Date(submission.submittedDate) > new Date(existingSubmission.submittedDate))) {
                uniqueSubmissions[submission.studentId] = submission;
              }
            }
          });
          
          // Convert back to array
          const deduplicatedSubmissions = Object.values(uniqueSubmissions);
          
          console.log('Mapped submissions:', mappedSubmissions);
          console.log('De-duplicated submissions:', deduplicatedSubmissions);
          setSubmissions(deduplicatedSubmissions);
        } else {
          // Set empty array - no default students
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error loading submissions from API:', error);
      }
    };
    
    loadSubmissions();
  }, [assignmentId, contextSubmissions]);

  // Process submissions data to group by student and remove duplicates
  const processedSubmissions = useMemo(() => {
    if (!submissions || !Array.isArray(submissions)) return [];
    
    // Group submissions by student ID
    const submissionsByStudent: Record<string, any[]> = {};
    
    submissions.forEach(submission => {
      const studentId = submission.studentId;
      if (!studentId) return; // Skip submissions without student ID
      
      if (!submissionsByStudent[studentId]) {
        submissionsByStudent[studentId] = [];
      }
      
      submissionsByStudent[studentId].push(submission);
    });
    
    // For each student, keep only the most recent submission
    const uniqueSubmissions = Object.values(submissionsByStudent).map(studentSubmissions => {
      // Sort by submission date, newest first
      const sorted = studentSubmissions.sort((a, b) => {
        const dateA = new Date(a.submittedDate || 0).getTime();
        const dateB = new Date(b.submittedDate || 0).getTime();
        return dateB - dateA;
      });
      
      // Return only the most recent submission
      return sorted[0];
    });
    
    console.log(`Filtered ${submissions.length} submissions to ${uniqueSubmissions.length} unique student submissions`);
    return uniqueSubmissions;
  }, [submissions]);

  // Store class data for API cache consistency
  useEffect(() => {
    if (classId && assignment) {
      try {
        const classData = {
          name: assignment.className,
          section: assignment.section || '',
          id: classId
        };
        // Save class data to API cache
        storageApi.saveClassData(classId, classData)
          .catch(error => console.error('Error saving class data to API:', error));
      } catch (e) {
        console.error('Error preparing class data for API:', e);
      }
    }
  }, [classId, assignment]);

  // Filtered submissions based on search term
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm) return processedSubmissions;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return processedSubmissions.filter(submission =>
      submission.studentName.toLowerCase().includes(lowerSearchTerm) ||
      submission.studentId.toLowerCase().includes(lowerSearchTerm)
    );
  }, [processedSubmissions, searchTerm]);

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
      navigate('/classwork', {
        state: {
          fromAssignment: assignmentId,
          className: assignment.className,
          section: assignment.section
        }
      });
    }
  }, [navigate, assignmentId, classId, assignment.className, assignment.section]);

  const handleViewSubmission = useCallback((submissionId: string) => {
    console.log(`Viewing submission ${submissionId}`);
    // Find the submission by ID to get the studentId
    const submission = submissions.find(sub => sub.id === submissionId);
    if (submission) {
      // Ensure studentId exists, default to submission id if not available
      const studentId = submission.studentId || submission.id;
      console.log(`Student ID for submission: ${studentId}`);
      
      if (classId) {
        // Navigate to the student submission page using studentId with class context
        navigate(`/class/${classId}/submissions/${assignmentId}/student/${studentId}`, {
          state: {
            classId,
            className: assignment.className,
            section: assignment.section,
            assignmentTitle: assignment.title,
            submissionId: submission.id // Pass the submission ID explicitly
          }
        });
      } else {
        // Navigate to the student submission page using studentId
        navigate(`/submissions/${assignmentId}/student/${studentId}`, {
          state: {
            className: assignment.className,
            section: assignment.section,
            assignmentTitle: assignment.title,
            submissionId: submission.id // Pass the submission ID explicitly
          }
        });
      }
    } else {
      console.error(`Submission with ID ${submissionId} not found`);
    }
  }, [navigate, assignmentId, submissions, classId, assignment.className, assignment.section, assignment.title]);

  const handleGradeAll = useCallback(() => {
    setShowGradeAllModal(true);
  }, []);

  const applyGradeToAll = useCallback(() => {
    // Get assignment points as a number
    const maxPoints = parseInt(assignment.points);

    // Get IDs of students from filtered submissions
    const filteredIds = filteredSubmissions.map(sub => sub.id);

    // Update only filtered submissions, preserve others
    const updatedSubmissions = submissions.map(submission => {
      if (!filteredIds.includes(submission.id)) return submission;
      if (submission.status === 'submitted') {
        return {
          ...submission,
          grade: maxPoints,
          status: 'graded' as const
        };
      } else if (submission.status === 'late') {
        return {
          ...submission,
          grade: Math.round(maxPoints * 0.9),
          status: 'graded' as const
        };
      } else if (submission.status === 'missing') {
        return {
          ...submission,
          grade: 0,
        };
      }
      // Keep graded as is, or optionally regrade
      return submission;
    });

    setSubmissions(updatedSubmissions);
    setShowGradeAllModal(false);
  }, [assignment.points, submissions, filteredSubmissions]);

  // Listen for submission updates
  useEffect(() => {
    const handleSubmissionUpdate = () => {
      // The StudentDataContext will handle the actual data updates
      // This effect is just to trigger UI refreshes when needed
      console.log('Submission data updated');
    };
    
    window.addEventListener('submissionUpdated', handleSubmissionUpdate);
    window.addEventListener('gradesUpdated', handleSubmissionUpdate);
    
    return () => {
      window.removeEventListener('submissionUpdated', handleSubmissionUpdate);
      window.removeEventListener('gradesUpdated', handleSubmissionUpdate);
    };
  }, []);

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

  return (
    <div className="flex flex-col w-full">




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
              {assignment.title}-Submission
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-xl font-semibold">Submissions</h2>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search by student name..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-xs"
                />

                <Button variant="outline" onClick={handleGradeAll} className="w-full sm:w-auto">
                  Grade All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Student</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">Submitted</TableHead>
                    <TableHead className="whitespace-nowrap">Grade</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
                          <div className="text-xs text-gray-500 md:hidden mt-1">
                            {submission.submittedDate || 'Not submitted'}
                          </div>
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
                        <TableCell className="hidden md:table-cell">
                          {submission.submittedDate || 'Not submitted'}
                        </TableCell>
                        <TableCell>
                          {submission.status === 'graded' ? (
                            <span className="font-medium">{submission.grade} / {assignment.points}</span>
                          ) : (
                            <span className="text-gray-500">Not graded</span>
                          )}
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

          {/* Grade statistics section removed */}
        </div>
      </div>

      {/* Grade All Modal */}
      {showGradeAllModal && (
        <Dialog open={showGradeAllModal} onOpenChange={setShowGradeAllModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade All Submissions</DialogTitle>
              <DialogDescription>
                This will apply grades as follows:<br />
                <span className="block mt-2">
                  <b>Submitted:</b> 100%<br />
                  <b>Late:</b> 90% (10% reduction)<br />
                  <b>Missing:</b> 0% (no credit)
                </span>
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