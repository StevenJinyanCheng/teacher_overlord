import { useState, useEffect } from 'react';
import { getUsers, getToken, logoutUser } from './services/apiService'; // Added getToken, logoutUser
import type { User } from './services/apiService';
import LoginComponent from './components/LoginComponent'; // Import LoginComponent
import './App.css';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Renamed for clarity
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(getToken()); // Initialize token from localStorage

  useEffect(() => {
    const fetchUsersData = async () => {
      if (!authToken) {
        setIsLoading(false); // Not logged in, no need to load users
        setUsers([]); // Clear any existing users
        setError(null); // Clear any existing errors
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err: any) {
        if (err.response && err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
          setAuthToken(null); // Clear token on auth failure
          logoutUser(); // Also clear from localStorage
        } else {
          setError('Failed to fetch users.');
        }
        console.error(err);
        setUsers([]); // Clear users on error
      }
      setIsLoading(false);
    };

    fetchUsersData();
  }, [authToken]); // Re-run effect if authToken changes

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
  };

  const handleLogout = () => {
    logoutUser();
    setAuthToken(null);
    setUsers([]); // Clear users on logout
    setError(null); // Clear any errors on logout
  };

  if (!authToken) {
    return <LoginComponent onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <button onClick={handleLogout} style={{ float: 'right', margin: '10px' }}>Logout</button>
      <h1>Moral Education Platform Users</h1>
      {isLoading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!isLoading && !error && users.length > 0 && (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.username} ({user.first_name} {user.last_name}) - Role: {user.role_display}
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !error && users.length === 0 && (
        <p>No users found or you do not have permission to view them.</p>
      )}
    </>
  );
}

export default App;
