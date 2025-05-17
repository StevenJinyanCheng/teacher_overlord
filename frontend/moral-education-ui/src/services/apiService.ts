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
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
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
  role: string;
  role_display?: string;
  school_class?: number | null; // ID of the school class, can be null
  school_class_details?: SchoolClass | null; // Full details of the school class
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

// Add SchoolClass interface
export interface SchoolClass {
  id: number;
  name: string;
  grade: number; // Grade ID
  grade_name?: string; // Optional: To display grade name directly
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
  dimensions?: RuleDimension[];
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
    const response = await apiClient.post<Grade>('/grades/', gradeData);
    return response.data;
  } catch (error) {
    console.error('Failed to create grade:', error);
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
  const response = await apiClient.get<SchoolClass[]>('/classes/');
  return response.data;
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

export default apiClient;
