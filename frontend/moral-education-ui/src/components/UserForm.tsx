import React, { useState, useEffect } from 'react';
import type { User } from '../services/apiService';

interface UserFormProps {
  initialUser: User | null;
  onSave: (userData: Omit<User, 'id' | 'role_display' | 'date_joined'> | Partial<Omit<User, 'id' | 'role_display' | 'date_joined' | 'username'>>) => void;
  onCancel: () => void;
}

// Define UserRole enum-like object for the form
const userRoles = {
  SYSTEM_ADMIN: 'System Administrator',
  SCHOOL_ADMIN: 'School Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

const UserForm: React.FC<UserFormProps> = ({ initialUser, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '', // Keep password field for creation/update
    role: 'STUDENT', // Default role
    is_active: true,
  });

  useEffect(() => {
    if (initialUser) {
      // Exclude password from being pre-filled for edits unless it's explicitly handled
      const { password, ...userData } = initialUser;
      setFormData({ ...userData, password: '' }); // Clear password for edit form
    } else {
      // Reset form for new user
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'STUDENT',
        is_active: true,
      });
    }
  }, [initialUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out fields that shouldn't be sent or are empty if not intended (like password for update)
    const dataToSave = { ...formData };
    if (initialUser && !dataToSave.password) {
      delete dataToSave.password; // Don't send empty password on update
    }
    onSave(dataToSave as Omit<User, 'id' | 'role_display' | 'date_joined'>); // Type assertion might need refinement based on exact save logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username || ''}
          onChange={handleChange}
          required
          disabled={!!initialUser} // Username usually not editable
        />
      </div>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="first_name">First Name:</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="last_name">Last Name:</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name || ''}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password || ''}
          onChange={handleChange}
          placeholder={initialUser ? "Leave blank to keep current password" : "Required"}
          required={!initialUser} // Password required for new user
        />
      </div>
      <div>
        <label htmlFor="role">Role:</label>
        <select
          id="role"
          name="role"
          value={formData.role || 'STUDENT'}
          onChange={handleChange}
          required
        >
          {Object.entries(userRoles).map(([key, value]) => (
            <option key={key} value={key}>{value}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="is_active">Active:</label>
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active || false}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Save User</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default UserForm;
