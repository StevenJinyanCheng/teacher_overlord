import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import LoginComponent from './components/LoginComponent';
import GradeManagementPage from './components/GradeManagementPage';
import ClassManagementPage from './components/ClassManagementPage';
import UserManagementPage from './components/UserManagementPage';
import StudentPromotionPage from './components/StudentPromotionPage'; // Import StudentPromotionPage
import RuleConfigurationPage from './components/RuleConfigurationPage'; // Import RuleConfigurationPage
import StudentParentPage from './components/StudentParentPage'; // Import StudentParentPage
import AwardManagementPage from './components/AwardManagementPage'; // Import AwardManagementPage
import PrincipalDashboard from './components/PrincipalDashboard'; // Import PrincipalDashboard
import NotificationCenter from './components/NotificationCenter'; // Import NotificationCenter
import StudentSelfReportPage from './components/StudentSelfReportPage'; // Import StudentSelfReportPage
import { getToken, logoutUser, getCurrentUser } from './services/apiService';
import type { User } from './services/apiService';

// A new component for the main layout after login
const MainLayout: React.FC<{ currentUser: User; onLogout: () => void }> = ({ currentUser, onLogout }) => {
  // currentUser is now guaranteed to be non-null here due to App component logic

  return (
    <div className="App">
      <header className="App-header">
        <h1>Moral Education Platform</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p>
            Welcome, {currentUser.username} ({currentUser.role})
          </p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NotificationCenter />
            <button onClick={onLogout} style={{ marginLeft: '15px' }}>Logout</button>
          </div>
        </div>
        <nav>
          {currentUser.role === 'system_administrator' && (
            <>
              <Link to="/admin/grades" style={{ marginRight: '10px' }}>Grade Management</Link>
              <Link to="/admin/classes" style={{ marginRight: '10px' }}>Class Management</Link>
              <Link to="/admin/users" style={{ marginRight: '10px' }}>User Management</Link>
              <Link to="/admin/student-promotion" style={{ marginRight: '10px' }}>Student Promotion</Link>
              <Link to="/admin/student-parent-relationships" style={{ marginRight: '10px' }}>Student-Parent</Link>
            </>
          )}
          {currentUser.role === 'moral_education_supervisor' && (
            <>
              <Link to="/supervisor/rule-configuration" style={{ marginRight: '10px' }}>Rule Configuration</Link>
              <Link to="/supervisor/awards" style={{ marginRight: '10px' }}>Award Management</Link>
            </>
          )}
          {(currentUser.role === 'principal' || currentUser.role === 'director') && (
            <>
              <Link to="/leadership/dashboard" style={{ marginRight: '10px' }}>Analytics Dashboard</Link>
            </>
          )}
          {currentUser.role === 'student' && (
            <>
              <Link to="/student/self-reports" style={{ marginRight: '10px' }}>Self-Reports</Link>
            </>
          )}
          {/* Add other navigation links here based on role */}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard currentUser={currentUser} />} />
          {currentUser.role === 'system_administrator' && (
            <>
              <Route path="/admin/grades" element={<GradeManagementPage />} />
              <Route path="/admin/classes" element={<ClassManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/student-promotion" element={<StudentPromotionPage />} />
              <Route path="/admin/student-parent-relationships" element={<StudentParentPage />} />
            </>
          )}
          {currentUser.role === 'moral_education_supervisor' && (
            <>
              <Route path="/supervisor/rule-configuration" element={<RuleConfigurationPage />} />
              <Route path="/supervisor/awards" element={<AwardManagementPage />} />
            </>
          )}
          {(currentUser.role === 'principal' || currentUser.role === 'director') && (
            <>
              <Route path="/leadership/dashboard" element={<PrincipalDashboard />} />
            </>
          )}
          {currentUser.role === 'student' && (
            <>
              <Route path="/student/self-reports" element={<StudentSelfReportPage />} />
            </>
          )}
          {/* Add other routes here */}
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect unknown paths to dashboard */}
        </Routes>
      </main>
    </div>
  );
};

// A simple dashboard component
const Dashboard: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  // currentUser is now guaranteed to be non-null here
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard, {currentUser.username}.</p>
      {currentUser.role !== 'system_administrator' && (
        <p>Your role ({currentUser.role}) currently has a general dashboard view.</p>
      )}
      {/* More dashboard content can be added here based on roles */}
    </div>
  );
};

function App() {
  const [token, setToken] = useState<string | null>(getToken());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    const authenticateUser = async () => {
      if (token) {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch (error) {
          console.error('Authentication failed:', error);
          // Clear token and user if fetching user details fails (e.g. invalid token)
          logoutUser(); // This also removes token from localStorage
          setToken(null);
          setCurrentUser(null);
        }
      }
      setLoadingAuth(false);
    };

    if (token) { // Only attempt to authenticate if a token exists
        authenticateUser();
    } else {
        setLoadingAuth(false); // No token, so not loading auth
        setCurrentUser(null); // Ensure user is null if no token
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    // currentUser will be set by the useEffect hook
  };

  const handleLogout = () => {
    logoutUser();
    setToken(null);
    setCurrentUser(null);
    // Navigation to /login will be handled by the Routes logic below
  };

  if (loadingAuth) {
    return <div>Loading authentication details...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!currentUser ? <LoginComponent onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />}
      />
      <Route 
        path="/*" 
        element={currentUser ? <MainLayout currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
