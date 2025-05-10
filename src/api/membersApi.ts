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
    
    const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/members/${userId}/remove`, {
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
      // For students, use enrollment
      endpoint = `${API_BASE_URL}/api/courses/enroll`;
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