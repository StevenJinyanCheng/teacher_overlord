import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import UserList from './UserList';
import UserForm from './UserForm';
import { 
  getUsers, createUser, updateUser, deleteUser, 
  getGrades, getSchoolClasses, exportUsers, importUsers, // Added importUsers
  type User, type Grade, type SchoolClass, type ImportUsersResponse // Added ImportUsersResponse
} from '../services/apiService'; // Corrected import path and added Grade, SchoolClass, getGrades, getSchoolClasses

const USER_ROLES = [
  { label: 'System Administrator', value: 'system_administrator' },
  { label: 'Moral Education Supervisor', value: 'moral_education_supervisor' },
  { label: 'Teaching Teacher', value: 'teaching_teacher' },
  { label: 'Class Teacher', value: 'class_teacher' },
  { label: 'Student', value: 'student' },
  { label: 'Parent', value: 'parent' },
  { label: 'Principal', value: 'principal' },
  { label: 'Director', value: 'director' },
];

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]); // Added grades state
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]); // Added schoolClasses state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportUsersResponse | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // For triggering file input

  useEffect(() => {
    fetchUsers();
    fetchGrades(); // Fetch grades
    fetchSchoolClasses(); // Fetch school classes
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      // setLoading(true); // Avoid double loading indicator if fetchUsers is also running
      const gradesData = await getGrades();
      setGrades(gradesData);
    } catch (err) {
      setError(prevError => (prevError ? prevError + '\n' : '') + 'Failed to fetch grades. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      // setLoading(false);
    }
  };

  const fetchSchoolClasses = async () => {
    try {
      // setLoading(true);
      const classesData = await getSchoolClasses();
      setSchoolClasses(classesData);
    } catch (err) {
      setError(prevError => (prevError ? prevError + '\n' : '') + 'Failed to fetch school classes. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      // setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);
      const blob = await exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError('Failed to export users. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportUsers(file);
    }
    // Reset file input to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportUsers = async (file: File) => {
    setIsImporting(true);
    setImportResults(null);
    setError(null);
    try {
      const results = await importUsers(file);
      setImportResults(results);
      fetchUsers(); // Refresh user list after import
      if (results.errors && results.errors.length > 0) {
        // setError("Import completed with some errors. See details below."); // Or display errors more prominently
      } else if (results.message) {
        // For messages like "CSV file was empty"
      } else {
        // Potentially a success message, though results speak for themselves
      }
    } catch (err) {
      setError('Failed to import users. ' + (err instanceof Error ? err.message : String(err)));
      setImportResults(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateOrUpdateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      // let updatedUser; // Declared but not used, removed for now, can be re-added if logging/using the direct response
      if (editingUser) {
        /* updatedUser = */ await updateUser(editingUser.id, userData);
      } else {
        const dataToSend = { ...userData, role: userData.role || USER_ROLES[0].value } as Omit<User, 'id' | 'role_display' | 'school_class_details'>;
        /* updatedUser = */ await createUser(dataToSend);
      }
      fetchUsers(); // Refresh the list
      setShowForm(false);
      setEditingUser(null);
      setError(null);
    } catch (err) {
      setError('Failed to save user. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    setError(null);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await deleteUser(userId);
        fetchUsers(); // Refresh the list
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error(err);
      }
    }
  };
  return (
    <div className="container mx-auto p-4">      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <p className="mb-4 text-gray-600">
        Add, modify, or remove user accounts. For students, you can assign them to specific grades and classes.
        Use the bulk operations below to import or export user data.
      </p>
      <div className="mb-4 p-3 border-l-4 border-blue-500 bg-blue-50 text-blue-800">
        <p className="font-medium">Student Assignment:</p>
        <p>When adding a student, you'll be able to select a grade and then assign them to a specific class from that grade.</p>
      </div>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>}
      {/* Combined loading and importing message */}
      {(loading || isImporting) && <p className="text-blue-500 bg-blue-100 p-3 rounded mb-4">Loading...</p>}

      {/* Import Results Display */}
      {importResults && (
        <div className="mb-4 p-3 border rounded bg-gray-50">
          <h3 className="font-semibold text-lg mb-2">Import Results:</h3>
          {importResults.message && <p className="text-blue-600">{importResults.message}</p>}
          {!importResults.message && (
            <>
              <p className="text-green-600">Users Created: {importResults.created}</p>
              <p className="text-blue-600">Users Updated: {importResults.updated}</p>
            </>
          )}
          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-red-600 font-semibold">Errors ({importResults.errors.length}):</p>
              <ul className="list-disc list-inside max-h-40 overflow-y-auto text-sm text-red-500">
                {importResults.errors.map((errMsg, index) => (
                  <li key={index}>{errMsg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <UserForm 
          currentUser={editingUser}
          onFormSubmit={handleCreateOrUpdateUser}
          onCancel={() => {
            setShowForm(false);
            setEditingUser(null);
            setError(null); // Clear error when cancelling form
          }}
          grades={grades} // Pass grades
          schoolClasses={schoolClasses} // Pass schoolClasses
          availableRoles={USER_ROLES}
        />
      )}

      {!showForm && !loading && (
        <button 
          onClick={() => { setShowForm(true); setEditingUser(null); setError(null); }}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
        >
          Add New User
        </button>
      )}
      {!showForm && !loading && (
        <button
          onClick={handleExportUsers}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading} // Disable button while loading
        >
          {loading ? 'Exporting...' : 'Export Users to CSV'}
        </button>
      )}
      {!showForm && !loading && (
        <button
          onClick={() => fileInputRef.current?.click()} // Trigger hidden file input
          className="mb-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mr-2"
          disabled={isImporting} // Disable button while importing
        >
          {isImporting ? 'Importing...' : 'Import Users from CSV'}
        </button>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".csv"
        style={{ display: 'none' }} 
      />

      {!showForm && !loading && users.length > 0 && (
        <UserList
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
