// Define API base URL directly
const API_BASE_URL = 'http://localhost:5203';

// Get authentication token from sessionStorage
const getAuthToken = () => {
  return sessionStorage.getItem('auth_token') || '';
};

// Member types
export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'Teacher' | 'Student';
  avatar?: string;
  finalGrade?: string;
  finalGradeColor?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

// Get all members of a course
export const getCourseMembers = async (courseId: string): Promise<Member[]> => {
  try {
    const token = getAuthToken();
    console.log('Using auth token:', token ? 'Token present' : 'No token');
    
    const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error response body:', await response.text());
      throw new Error(`Failed to fetch course members: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching course members:', error);
    return [];
  }
};

// Remove a member from a course (teacher only)
export const removeMember = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    
    // Process IDs to ensure they're in the correct format
    const numericCourseId = typeof courseId === 'string' && courseId.includes('-') 
      ? courseId.split('-')[1] 
      : courseId;
    
    const numericUserId = typeof userId === 'string' && userId.includes('-') 
      ? userId.split('-')[1] 
      : userId;
    
    console.log(`Processing member removal - Course ID: ${courseId} → ${numericCourseId}, User ID: ${userId} → ${numericUserId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/courses/${numericCourseId}/members/${numericUserId}/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error response body:', await response.text());
      throw new Error(`Failed to remove member: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing member:', error);
    return false;
  }
};

// Add a member to a course (using enrollment code for students)
export const addMember = async (
  enrollmentCode: string, 
  userData: { 
    name: string, 
    email: string, 
    role?: 'Teacher' | 'Student',
    classId?: string
  }
): Promise<boolean> => {
  try {
    console.log('Making API call to add member:', userData);
    const token = getAuthToken();
    
    // Use different endpoints based on role
    let endpoint, requestData;
    
    if (userData.role === 'Teacher') {
      // For teachers, we use the course ID directly
      const courseId = userData.classId || enrollmentCode;
      endpoint = `${API_BASE_URL}/api/courses/${courseId}/members`;
      requestData = {
        userId: userData.email, // Assuming email is used as userId
        name: userData.name,
        email: userData.email,
        role: 'Teacher'
      };
    } else {
      // For students, use the enrollment-by-code endpoint (according to real-world API)
      endpoint = `${API_BASE_URL}/api/courses/enroll-by-code`;
      requestData = {
        enrollmentCode,
        name: userData.name,
        email: userData.email
      };
    }
    
    console.log('Endpoint:', endpoint);
    console.log('Request data:', requestData);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      console.error('API error response:', await response.text());
      throw new Error(`Failed to add member: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log('API response for adding member:', responseText);
    return true;
  } catch (error) {
    console.error('Error adding member:', error);
    return false;
  }
};

// Get pending enrollment requests for a course
export const getPendingEnrollmentRequests = async (courseId: string): Promise<any[]> => {
  try {
    const token = getAuthToken();
    
    // Process ID to ensure it's in the correct format
    const numericCourseId = typeof courseId === 'string' && courseId.includes('-') 
      ? courseId.split('-')[1] 
      : courseId;
    
    console.log(`Fetching pending enrollment requests for course ID: ${courseId} → ${numericCourseId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/enrollment-requests/course/${numericCourseId}/pending`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error response body:', await response.text());
      throw new Error(`Failed to fetch pending enrollment requests: ${response.status}`);
    }
    
    const requests = await response.json();
    console.log('Pending enrollment requests:', requests);
    return requests;
  } catch (error) {
    console.error('Error fetching pending enrollment requests:', error);
    return [];
  }
};

// Get student's own enrollment requests
export const getMyEnrollmentRequests = async (): Promise<any[]> => {
  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/api/enrollment-requests/my-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error response body:', await response.text());
      throw new Error(`Failed to fetch my enrollment requests: ${response.status}`);
    }
    
    const requests = await response.json();
    console.log('My enrollment requests:', requests);
    return requests;
  } catch (error) {
    console.error('Error fetching my enrollment requests:', error);
    return [];
  }
};

// Process (approve or reject) a student's enrollment request
export const processEnrollmentRequest = async (requestId: string, action: 'approve' | 'reject'): Promise<boolean> => {
  try {
    const token = getAuthToken();
    
    // Process ID to ensure it's in the correct format
    const numericRequestId = typeof requestId === 'string' && requestId.includes('-') 
      ? requestId.split('-')[1] 
      : requestId;
    
    console.log(`Processing enrollment request ID: ${requestId} → ${numericRequestId} with action: ${action}`);
    
    const response = await fetch(`${API_BASE_URL}/api/enrollment-requests/${numericRequestId}/process`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });
    
    if (!response.ok) {
      console.error('Error response body:', await response.text());
      throw new Error(`Failed to ${action} enrollment request: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error ${action}ing enrollment request:`, error);
    return false;
  }
};

// Approve a student's enrollment request (keeping for backward compatibility)
export const approveStudentEnrollment = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Fetching pending enrollment requests for course ID: ${courseId} to approve user ID: ${userId}`);
    
    // First, get all pending requests for this course
    const pendingRequests = await getPendingEnrollmentRequests(courseId);
    
    // Find the request for this specific user
    const userRequest = pendingRequests.find(req => 
      req.userId === userId || 
      req.user?.id === userId || 
      req.email === userId
    );
    
    if (!userRequest) {
      console.error(`No pending request found for user ${userId} in course ${courseId}`);
      return false;
    }
    
    // Process the found request
    return await processEnrollmentRequest(userRequest.id, 'approve');
  } catch (error) {
    console.error('Error approving student enrollment:', error);
    return false;
  }
};

// Reject a student's enrollment request (keeping for backward compatibility)
export const rejectStudentEnrollment = async (courseId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Fetching pending enrollment requests for course ID: ${courseId} to reject user ID: ${userId}`);
    
    // First, get all pending requests for this course
    const pendingRequests = await getPendingEnrollmentRequests(courseId);
    
    // Find the request for this specific user
    const userRequest = pendingRequests.find(req => 
      req.userId === userId || 
      req.user?.id === userId || 
      req.email === userId
    );
    
    if (!userRequest) {
      console.error(`No pending request found for user ${userId} in course ${courseId}`);
      return false;
    }
    
    // Process the found request with rejection
    return await processEnrollmentRequest(userRequest.id, 'reject');
  } catch (error) {
    console.error('Error rejecting student enrollment:', error);
    return false;
  }
}; 