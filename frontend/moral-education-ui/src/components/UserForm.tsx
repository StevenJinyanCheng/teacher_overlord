import React, { useState, useEffect } from 'react';
import { type User, type Grade, type SchoolClass } from '../services/apiService'; // Corrected import path

interface UserFormProps {
  currentUser: User | null;
  onFormSubmit: (user: Partial<User>) => void;
  onCancel: () => void;
  grades: Grade[];
  schoolClasses: SchoolClass[];
  availableRoles: Array<{ value: string; label: string }>;
}

const UserForm: React.FC<UserFormProps> = ({ currentUser, onFormSubmit, onCancel, grades, schoolClasses, availableRoles }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [schoolClass, setSchoolClass] = useState<number | ''>('');
  const [teachingClasses, setTeachingClasses] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter classes by grade for better organization
  const [filteredClasses, setFilteredClasses] = useState<SchoolClass[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | ''>('');

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setEmail(currentUser.email || '');
      setFirstName(currentUser.first_name || '');
      setLastName(currentUser.last_name || '');
      setRole(currentUser.role);
      setSchoolClass(currentUser.school_class || '');
      setTeachingClasses(currentUser.teaching_classes || []);
      
      // Don't set password for existing users - it will be an empty field
      setPassword('');
    } else {
      // Reset form for new users
      resetForm();
    }
  }, [currentUser]);

  // Filter classes when grade selection changes
  useEffect(() => {
    if (selectedGrade === '') {
      setFilteredClasses(schoolClasses);
    } else {
      const filtered = schoolClasses.filter(cls => cls.grade === Number(selectedGrade));
      setFilteredClasses(filtered);
    }
  }, [selectedGrade, schoolClasses]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setRole('');
    setSchoolClass('');
    setTeachingClasses([]);
    setSelectedGrade('');
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!currentUser && !password.trim()) {
      errors.password = 'Password is required for new users';
    }
    
    if (!role) {
      errors.role = 'Role is required';
    }
    
    if (role === 'student' && !schoolClass) {
      errors.schoolClass = 'Students must be assigned to a class';
    }
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email address is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const userData: Partial<User> = {
      username,
      email: email || undefined,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      role,
    };
    
    // Only include password if it's provided (for new users or password changes)
    if (password) {
      userData.password = password;
    }
    
    // Include school_class only for students
    if (role === 'student') {
      userData.school_class = schoolClass === '' ? null : Number(schoolClass);
    }
    
    // Include teaching_classes only for teachers
    if (role === 'teaching_teacher' || role === 'class_teacher') {
      userData.teaching_classes = teachingClasses;
    }
    
    // If editing, include the user ID
    if (currentUser) {
      userData.id = currentUser.id;
    }
    
    onFormSubmit(userData);
  };

  const handleTeachingClassesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      option => Number(option.value)
    );
    setTeachingClasses(selectedOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        {currentUser ? 'Edit User' : 'Add New User'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username field */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 mb-1">Username*</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full p-2 border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} rounded`}
            disabled={!!currentUser} // Disable username edit for existing users
          />
          {formErrors.username && <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>}
        </div>
        
        {/* Email field */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full p-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded`}
          />
          {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
        </div>
        
        {/* First Name field */}
        <div className="mb-4">
          <label htmlFor="firstName" className="block text-gray-700 mb-1">First Name</label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {/* Last Name field */}
        <div className="mb-4">
          <label htmlFor="lastName" className="block text-gray-700 mb-1">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {/* Password field */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-1">
            {currentUser ? 'Password (leave blank to keep current)' : 'Password*'}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded`}
          />
          {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
        </div>
        
        {/* Role field */}
        <div className="mb-4">
          <label htmlFor="role" className="block text-gray-700 mb-1">Role*</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`w-full p-2 border ${formErrors.role ? 'border-red-500' : 'border-gray-300'} rounded`}
          >
            <option value="">Select a role</option>
            {availableRoles.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label}
              </option>
            ))}
          </select>
          {formErrors.role && <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>}
        </div>
      </div>
      
      {/* Conditional fields based on role */}
      {role === 'student' && (
        <div className="mb-4">
          <label htmlFor="class-filter" className="block text-gray-700 mb-1">Filter by Grade (optional)</label>          <select
            id="class-filter"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>{grade.name}</option>
            ))}
          </select>
          
          <label htmlFor="schoolClass" className="block text-gray-700 mb-1">Home Class*</label>
          <select
            id="schoolClass"
            value={schoolClass}
            onChange={(e) => setSchoolClass(e.target.value === '' ? '' : Number(e.target.value))}
            className={`w-full p-2 border ${formErrors.schoolClass ? 'border-red-500' : 'border-gray-300'} rounded`}
          >
            <option value="">Select a class</option>
            {filteredClasses
              .filter(cls => cls.class_type === 'home_class')
              .map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade_name || `Grade ${cls.grade}`})
                </option>
              ))}
          </select>
          {formErrors.schoolClass && (
            <p className="text-red-500 text-sm mt-1">{formErrors.schoolClass}</p>
          )}
        </div>
      )}
      
      {(role === 'teaching_teacher' || role === 'class_teacher') && (
        <div className="mb-4">
          <label htmlFor="teachingClasses" className="block text-gray-700 mb-1">Assigned Classes</label>
          <select
            id="teachingClasses"
            multiple
            value={teachingClasses.map(String)}
            onChange={handleTeachingClassesChange}
            className="w-full p-2 border border-gray-300 rounded"
            size={Math.min(5, schoolClasses.length || 3)}
          >
            {schoolClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.grade_name || `Grade ${cls.grade}`}) -
                {cls.class_type_display || (cls.class_type === 'home_class' ? 'Home Class' : 'Subject Class')}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple classes</p>
        </div>
      )}
      
      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          {currentUser ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
