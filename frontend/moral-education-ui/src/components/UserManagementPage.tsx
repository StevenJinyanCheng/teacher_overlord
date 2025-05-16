import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../services/apiService';
import { getUsers, createUser, updateUser, deleteUser } from '../services/apiService';
import UserList from './UserList';
import UserForm from './UserForm';

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users. Please try again.');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {
    setEditingUser(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (userId: number) => {
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

  const handleSave = async (userData: Omit<User, 'id' | 'role_display' | 'date_joined'> | Partial<Omit<User, 'id' | 'role_display' | 'date_joined' | 'username'>>) => {
    try {
      setError(null);
      if (editingUser && 'id' in editingUser) {
        // Ensure password is not sent if not changed, or handle appropriately
        const updateData = { ...userData };
        if ('password' in updateData && !updateData.password) {
          delete updateData.password;
        }
        await updateUser(editingUser.id, updateData as Partial<Omit<User, 'id' | 'role_display' | 'date_joined' | 'username'>>);
      } else {
        await createUser(userData as Omit<User, 'id' | 'role_display' | 'date_joined'>);
      }
      fetchUsers(); // Refresh the list
      setShowForm(false);
      setEditingUser(null);
    } catch (err: any) {
      if (err.response && err.response.data) {
        // Display backend validation errors
        const errorMessages = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
          .join('; ');
        setError(`Failed to save user: ${errorMessages}`);
      } else {
        setError('Failed to save user. Please check the details and try again.');
      }
      console.error(err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setError(null);
  };

  return (
    <div>
      <h2>User Management</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {showForm ? (
        <UserForm
          initialUser={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <button onClick={handleCreate}>Add New User</button>
          <UserList
            users={users}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
};

export default UserManagementPage;
