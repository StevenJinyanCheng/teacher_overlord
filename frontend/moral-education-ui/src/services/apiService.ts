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
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
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

// Interface for login credentials
export interface LoginCredentials {
  username?: string; // Made optional to satisfy linter if not immediately used
  password?: string; // Made optional to satisfy linter if not immediately used
}

// Interface for the token response
interface TokenResponse {
  token: string;
}

// Service function to login and get token
export const loginUser = async (credentials: LoginCredentials): Promise<string> => {
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
