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
  email: string;
  role: string; // Add role if it's part of the User data from /api/users/me/
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
}

// Add SchoolClass interface
export interface SchoolClass {
  id: number;
  name: string;
  grade_id: number; // For creating/updating
  grade_name: string; // For display
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

export const updateSchoolClass = async (classId: number, classData: Partial<Omit<SchoolClass, 'id' | 'grade_name'>>): Promise<SchoolClass> => {
  try {
    const response = await apiClient.put<SchoolClass>(`/schoolclasses/${classId}/`, classData);
    return response.data;
  } catch (error) {
    console.error('Failed to update school class:', error);
    throw error;
  }
};

export const deleteSchoolClass = async (classId: number): Promise<void> => {
  try {
    await apiClient.delete(`/schoolclasses/${classId}/`);
  } catch (error) {
    console.error('Failed to delete school class:', error);
    throw error;
  }
};

export default apiClient;
