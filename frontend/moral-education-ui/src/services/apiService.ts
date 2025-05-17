import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Your Django API base URL

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Keep this if you might still use session auth for some things, or remove if exclusively token
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Request interceptor - Token present:', Boolean(token));
    
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      config.headers.Authorization = `Token ${token}`;
      console.log('Setting Authorization header:', `Token ${token.substring(0, 5)}...`);
    } else {
      console.warn('No auth token found in localStorage');
    }
    
    console.log('Request URL:', config.url);
    console.log('Request method:', config.method);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Define the User type based on your Django serializer
export interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: string; // student, parent, teaching_teacher, class_teacher, etc.
  role_display?: string; // Human-readable display of role
  school_class?: number | null; // ID of the home class for students, can be null
  school_class_details?: SchoolClass | null; // Full details of the home class
  teaching_classes?: number[]; // IDs of classes taught by teaching teachers
  teaching_classes_details?: SchoolClass[]; // Details of classes taught by teaching teachers
  children?: Array<{id: number, username: string, full_name: string, school_class?: {id: number, name: string}}>;  // For parents
  parents?: Array<{id: number, username: string, full_name: string}>; // For students
  password?: string; // Only for sending, not for receiving
}

export interface LoginCredentials {
  username?: string; // Made optional to satisfy linter if not immediately used
  password?: string; // Made optional to satisfy linter if not immediately used
}

// Interface for the token response
interface TokenResponse {
  token: string;
}

// Add Grade interface
export interface Grade {
  id: number;
  name: string;
  description?: string;
}

// Interface for the SchoolClass
export interface SchoolClass {
  id: number;
  name: string;
  grade: number; // Grade ID
  grade_name?: string; // Optional: To display grade name directly
  class_type: string; // 'home_class' or 'subject_class'
  class_type_display?: string; // Human-readable display of class type
  class_teachers?: number[]; // IDs of class teachers assigned to this class
  class_teachers_details?: Array<{id: number, username: string, full_name: string}>; // Details of assigned teachers
}

// Interface for student-parent relationships
export interface StudentParentRelationship {
  id: number;
  student: number;
  parent: number;
  student_name?: string;
  student_username?: string;
  parent_name?: string;
  parent_username?: string;
  student_details?: {
    id: number;
    username: string;
    full_name: string;
    school_class?: { id: number; name: string };
  };
  parent_details?: {
    id: number;
    username: string;
    full_name: string;
  };
}

// Service function to get users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get<User[]>('/users/');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Service function to login and get token
export const loginUser = async (credentials: LoginCredentials): Promise<string | null> => {
  try {
    const response = await apiClient.post<TokenResponse>('/api-token-auth/', credentials);
    const token = response.data.token;
    localStorage.setItem('authToken', token);
    return token;
  } catch (error) {
    console.error('Error during login:', error);
    // Remove token if login fails to ensure clean state
    localStorage.removeItem('authToken');
    throw error;
  }
};

// Service function to logout
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  // Optionally, you might want to call a backend endpoint to invalidate the token
  // For DRF's default TokenAuthentication, tokens are typically long-lived and
  // invalidated by deleting them from the database or by the client discarding them.
  console.log('User logged out, token removed.');
};

// Function to get the current token
export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Function to get current user details
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/users/me/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    throw error;
  }
};

// Service function to create a user
export const createUser = async (userData: Omit<User, 'id' | 'role_display' | 'school_class_details'>): Promise<User> => {
  try {
    const response = await apiClient.post<User>('/users/', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Service function to update a user
export const updateUser = async (id: number, userData: Partial<Omit<User, 'id' | 'role_display' | 'school_class_details'>>): Promise<User> => {
  try {
    // Username is typically not updatable or handled differently, so excluding it from Partial update payload
    const response = await apiClient.put<User>(`/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Service function to delete a user
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}/`);
};

export const exportUsers = async (): Promise<Blob> => {
  const response = await apiClient.get('/users/export/', {
    responseType: 'blob',
  });
  return response.data;
};

export interface ImportUsersResponse {
  created: number;
  updated: number;
  errors: string[];
  message?: string; // For cases like empty file
}

// Function to import users from a file
export const importUsers = async (file: File): Promise<ImportUsersResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportUsersResponse>('/users/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error importing users:', error);
    throw error;
  }
};

// Rule Configuration Interfaces
export interface RuleSubItem {
  id: number;
  name: string;
  description?: string;
  dimension: number;
  max_score: number;
}

export interface RuleDimension {
  id: number;
  name: string;
  description?: string;
  chapter: number;
  sub_items?: RuleSubItem[];
}

export interface RuleChapter {
  id: number;
  name: string;
  description?: string;
  dimensions?: RuleDimension[];  // Added if nested=true in API request
}

// Rule Configuration API Functions
export const getChapters = async (): Promise<RuleChapter[]> => {
  const response = await apiClient.get<RuleChapter[]>('/rule-chapters/');
  return response.data;
};

export const getChapter = async (id: number): Promise<RuleChapter> => {
  const response = await apiClient.get<RuleChapter>(`/rule-chapters/${id}/`);
  return response.data;
};

export const createChapter = async (chapterData: Omit<RuleChapter, 'id' | 'dimensions'>): Promise<RuleChapter> => {
  const response = await apiClient.post<RuleChapter>('/rule-chapters/', chapterData);
  return response.data;
};

export const updateChapter = async (id: number, chapterData: Partial<Omit<RuleChapter, 'id' | 'dimensions'>>): Promise<RuleChapter> => {
  const response = await apiClient.patch<RuleChapter>(`/rule-chapters/${id}/`, chapterData);
  return response.data;
};

export const deleteChapter = async (id: number): Promise<void> => {
  await apiClient.delete(`/rule-chapters/${id}/`);
};

export const getDimensions = async (chapterId?: number): Promise<RuleDimension[]> => {
  const url = chapterId ? `/rule-dimensions/?chapter=${chapterId}` : '/rule-dimensions/';
  const response = await apiClient.get<RuleDimension[]>(url);
  return response.data;
};

export const getDimension = async (id: number): Promise<RuleDimension> => {
  const response = await apiClient.get<RuleDimension>(`/rule-dimensions/${id}/`);
  return response.data;
};

export const createDimension = async (dimensionData: Omit<RuleDimension, 'id' | 'sub_items'>): Promise<RuleDimension> => {
  const response = await apiClient.post<RuleDimension>('/rule-dimensions/', dimensionData);
  return response.data;
};

export const updateDimension = async (id: number, dimensionData: Partial<Omit<RuleDimension, 'id' | 'sub_items'>>): Promise<RuleDimension> => {
  const response = await apiClient.patch<RuleDimension>(`/rule-dimensions/${id}/`, dimensionData);
  return response.data;
};

export const deleteDimension = async (id: number): Promise<void> => {
  await apiClient.delete(`/rule-dimensions/${id}/`);
};

export const getSubItems = async (dimensionId?: number): Promise<RuleSubItem[]> => {
  const url = dimensionId ? `/rule-subitems/?dimension=${dimensionId}` : '/rule-subitems/';
  const response = await apiClient.get<RuleSubItem[]>(url);
  return response.data;
};

export const getSubItem = async (id: number): Promise<RuleSubItem> => {
  const response = await apiClient.get<RuleSubItem>(`/rule-subitems/${id}/`);
  return response.data;
};

export const createSubItem = async (subItemData: Omit<RuleSubItem, 'id'>): Promise<RuleSubItem> => {
  const response = await apiClient.post<RuleSubItem>('/rule-subitems/', subItemData);
  return response.data;
};

export const updateSubItem = async (id: number, subItemData: Partial<Omit<RuleSubItem, 'id'>>): Promise<RuleSubItem> => {
  const response = await apiClient.patch<RuleSubItem>(`/rule-subitems/${id}/`, subItemData);
  return response.data;
};

export const deleteSubItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/rule-subitems/${id}/`);
};

// Grade API functions
export const getGrades = async (): Promise<Grade[]> => {
  try {
    const response = await apiClient.get<Grade[]>('/grades/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    throw error;
  }
};

export const createGrade = async (gradeData: Omit<Grade, 'id'>): Promise<Grade> => {
  try {
    console.log('API request to create grade:', gradeData);
    console.log('Auth token present:', Boolean(localStorage.getItem('authToken')));
    const response = await apiClient.post<Grade>('/grades/', gradeData);
    console.log('Grade create response:', response);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create grade:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const updateGrade = async (gradeId: number, gradeData: Partial<Omit<Grade, 'id'>>): Promise<Grade> => {
  try {
    const response = await apiClient.put<Grade>(`/grades/${gradeId}/`, gradeData);
    return response.data;
  } catch (error) {
    console.error('Failed to update grade:', error);
    throw error;
  }
};

export const deleteGrade = async (gradeId: number): Promise<void> => {
  try {
    await apiClient.delete(`/grades/${gradeId}/`);
  } catch (error) {
    console.error('Failed to delete grade:', error);
    throw error;
  }
};

// SchoolClass API functions
export const getSchoolClasses = async (): Promise<SchoolClass[]> => {
  try {
    const response = await apiClient.get<SchoolClass[]>('/schoolclasses/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch school classes:', error);
    throw error;
  }
};

export const createSchoolClass = async (classData: Omit<SchoolClass, 'id' | 'grade_name'>): Promise<SchoolClass> => {
  try {
    const response = await apiClient.post<SchoolClass>('/schoolclasses/', classData);
    return response.data;
  } catch (error) {
    console.error('Failed to create school class:', error);
    throw error;
  }
};

export const updateSchoolClass = async (id: number, classData: Partial<Omit<SchoolClass, 'id' | 'grade_name'>>): Promise<SchoolClass> => {
  try {
    const response = await apiClient.put<SchoolClass>(`/schoolclasses/${id}/`, classData);
    return response.data;
  } catch (error) {
    console.error('Failed to update school class:', error);
    throw error;
  }
};

export const deleteSchoolClass = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/schoolclasses/${id}/`);
  } catch (error) {
    console.error('Failed to delete school class:', error);
    throw error;
  }
};

// Interface for student promotion/demotion API request
export interface PromotionRequest {
  source_grade_id?: number; // Optional filter
  source_class_id?: number; // Optional filter
  target_grade_id?: number; // Used for cross-grade promotions
  target_class_id: number; // Required: the class to move students to
  student_ids: number[]; // Required: students to move
}

// Interface for student promotion/demotion API response
export interface PromotionResult {
  success: boolean;
  updated_count: number;
  errors: string[];
  message: string;
}

// Function to promote or demote students
export const promoteOrDemoteStudents = async (promotionData: PromotionRequest): Promise<PromotionResult> => {
  try {
    const response = await apiClient.post<PromotionResult>('/users/promote-demote/', promotionData);
    return response.data;
  } catch (error) {
    console.error('Failed to promote/demote students:', error);
    throw error;
  }
};

// Function to get student-parent relationships
export const getStudentParentRelationships = async (): Promise<StudentParentRelationship[]> => {
  try {
    const response = await apiClient.get<StudentParentRelationship[]>('/student-parent-relationships/');
    return response.data;
  } catch (error) {
    console.error('Error fetching student-parent relationships:', error);
    throw error;
  }
};

// Function to create a student-parent relationship
export const createStudentParentRelationship = async (studentId: number, parentId: number): Promise<StudentParentRelationship> => {
  try {
    const response = await apiClient.post<StudentParentRelationship>('/student-parent-relationships/', {
      student: studentId,
      parent: parentId
    });
    return response.data;
  } catch (error) {
    console.error('Error creating student-parent relationship:', error);
    throw error;
  }
};

// Function to delete a student-parent relationship
export const deleteStudentParentRelationship = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/student-parent-relationships/${id}/`);
  } catch (error) {
    console.error('Error deleting student-parent relationship:', error);
    throw error;
  }
};

// Function to assign a parent to a student using the custom endpoint
export const assignParentToStudent = async (studentId: number, parentId: number): Promise<any> => {
  try {
    const response = await apiClient.post('/student-parent-relationships/assign_parent/', {
      student_id: studentId,
      parent_id: parentId
    });
    return response.data;
  } catch (error) {
    console.error('Error assigning parent to student:', error);
    throw error;
  }
};

export default apiClient;
