import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import UserList from './UserList';
import UserForm from './UserForm';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  exportUsers, 
  importUsers, 
  getGrades,
  getSchoolClasses
} from '../services/apiService';
import type { User, Grade, SchoolClass, ImportUsersResponse } from '../services/apiService';

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
  const [grades, setGrades] = useState<Grade[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [filterRole, setFilterRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersData, gradesData, classesData] = await Promise.all([
          getUsers(),
          getGrades(),
          getSchoolClasses()
        ]);
        setUsers(usersData);
        setGrades(gradesData);
        setSchoolClasses(classesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const result: ImportUsersResponse = await importUsers(file);
      setImportSuccess(
        `Successfully imported users. Created: ${result.created}, Updated: ${result.updated}`
      );
      // Reload users list after import
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error importing users:', err);
      setImportError(err.response?.data?.message || 'Failed to import users. Please check the file format.');
    } finally {
      setLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file export
  const handleExport = async () => {
    try {
      const blob = await exportUsers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting users:', err);
      setError('Failed to export users. Please try again.');
    }
  };

  // Filter users based on role and search query
  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole ? user.role === filterRole : true;
    
    const matchesSearch = searchQuery.toLowerCase().trim() === '' ? true : (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return matchesRole && matchesSearch;
  });

  // Create a new user
  const handleCreateUser = () => {
    setEditUser(null);
    setShowForm(true);
  };

  // Edit an existing user
  const handleEditUser = (user: User) => {
    setEditUser(user);
    setShowForm(true);
  };

  // Delete a user
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteUser(userId);
      // Update the users list
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission (create/update)
  const handleFormSubmit = async (userData: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      if (editUser) {
        // Update user
        const updatedUser = await updateUser(editUser.id, userData);
        setUsers(prevUsers => 
          prevUsers.map(user => user.id === editUser.id ? updatedUser : user)
        );
      } else {
        // Create user
        const newUser = await createUser(userData as Omit<User, 'id' | 'role_display' | 'school_class_details'>);
        setUsers(prevUsers => [...prevUsers, newUser]);
      }
      
      // Reset form state
      setShowForm(false);
      setEditUser(null);
    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.detail ||
                          'Failed to save user. Please check the form and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="space-x-2">
          <button
            onClick={handleCreateUser}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            Add User
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            Export Users
          </button>
          <label className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
            Import Users
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
              disabled={loading}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
      
      {/* Import success/error messages */}
      {importSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {importSuccess}
        </div>
      )}
      {importError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {importError}
        </div>
      )}
      
      {/* General error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showForm ? (
        <UserForm
          currentUser={editUser}
          onFormSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditUser(null);
            setError(null);
          }}
          grades={grades}
          schoolClasses={schoolClasses}
          availableRoles={USER_ROLES}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-auto flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, username, or email"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-auto md:min-w-[200px]">
                <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  id="role-filter"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  {USER_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Users list */}
          {loading && !users.length ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <UserList
              users={filteredUsers}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No users match your search criteria</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagementPage;
