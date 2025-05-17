import React, { useState, useEffect } from 'react';
import { type User, type Grade, type SchoolClass } from '../services/apiService'; // Corrected import path

interface UserFormProps {
  currentUser: User | null;
  onFormSubmit: (user: Partial<User>) => void;
  onCancel: () => void;
  grades: Grade[]; // To filter classes by grade
  schoolClasses: SchoolClass[]; // All available school classes
  availableRoles: Array<{ value: string; label: string }>;
}

const UserForm: React.FC<UserFormProps> = ({ currentUser, onFormSubmit, onCancel, grades, schoolClasses, availableRoles }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(''); // To filter classes
  const [schoolClassId, setSchoolClassId] = useState<number | null | undefined>(undefined); // Student's assigned class ID
  const [filteredSchoolClasses, setFilteredSchoolClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setEmail(currentUser.email || '');
      setFirstName(currentUser.first_name || '');
      setLastName(currentUser.last_name || '');
      setRole(currentUser.role);
      setPassword(''); // Clear password on edit

      if (currentUser.role === 'STUDENT' && currentUser.school_class) {
        const studentClass = schoolClasses.find(sc => sc.id === currentUser.school_class);
        if (studentClass) {
          setSelectedGradeFilter(studentClass.grade.toString());
          setFilteredSchoolClasses(schoolClasses.filter(sc => sc.grade === studentClass.grade));
          setSchoolClassId(currentUser.school_class);
        } else { // Student has a class ID but class not found (data inconsistency?)
          setSelectedGradeFilter('');
          setFilteredSchoolClasses(schoolClasses); // Show all classes
          setSchoolClassId(currentUser.school_class); // Still set the ID
        }
      } else {
        setSelectedGradeFilter('');
        setFilteredSchoolClasses(schoolClasses); // Show all classes if not student or no class
        setSchoolClassId(null);
      }
    } else {
      setUsername('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setPassword('');
      setRole(availableRoles.length > 0 ? availableRoles[0].value : ''); // Default to first role or empty
      setSelectedGradeFilter('');
      setFilteredSchoolClasses(schoolClasses);
      setSchoolClassId(null);
    }
  }, [currentUser, grades, schoolClasses, availableRoles]);

  useEffect(() => {
    // Update filtered classes when the grade filter changes or all school classes are loaded
    if (selectedGradeFilter) {
      setFilteredSchoolClasses(schoolClasses.filter(sc => sc.grade === parseInt(selectedGradeFilter, 10)));
    } else {
      setFilteredSchoolClasses(schoolClasses);
    }
    // Reset class selection if the new list doesn't include the currently selected class
    // (unless it's the initial load for an existing student)
    if (currentUser && currentUser.role === 'STUDENT' && currentUser.school_class && schoolClassId === currentUser.school_class) {
        // Do not reset if it's the initial load and the class matches
    } else {
        setSchoolClassId(null); 
    }

  }, [selectedGradeFilter, schoolClasses]); // Removed currentUser dependency here to avoid loop, handle initial in main useEffect


  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole !== 'STUDENT') {
      setSchoolClassId(null); // Clear class if not a student
      setSelectedGradeFilter(''); // Clear grade filter
      setFilteredSchoolClasses(schoolClasses); // Show all classes in background for when role switches back
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userData: Partial<User> = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      school_class: role === 'STUDENT' ? (schoolClassId === undefined ? null : schoolClassId) : null,
    };
    if (password) {
      userData.password = password;
    }
    onFormSubmit(userData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name:</label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password (leave blank if not changing):</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role:</label>
        <select
          id="role"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Role</option>
          {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {role === 'STUDENT' && (
        <>
          <div>
            <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700">Filter Classes by Grade:</label>
            <select 
              id="grade-filter" 
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value);
                // setSchoolClassId(null); // Reset class when grade filter changes - handled by useEffect
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="schoolClass" className="block text-sm font-medium text-gray-700">Class:</label>
            <select 
              id="schoolClass" 
              value={schoolClassId === null || schoolClassId === undefined ? '' : schoolClassId} 
              onChange={(e) => setSchoolClassId(e.target.value ? parseInt(e.target.value, 10) : null)} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select Class (Optional)</option>
              {filteredSchoolClasses.map((sClass) => (
                <option key={sClass.id} value={sClass.id}>
                  {sClass.name} (Grade: {grades.find(g => g.id === sClass.grade)?.name || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-2">
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{currentUser ? 'Update' : 'Create'} User</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
      </div>
    </form>
  );
};

export default UserForm;
