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
  const [teachingClassIds, setTeachingClassIds] = useState<number[]>([]); // For Teaching Teachers
  const [subjectClassesFilter, setSubjectClassesFilter] = useState<string>(''); // To filter subject classes
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username);
      setEmail(currentUser.email || '');
      setFirstName(currentUser.first_name || '');
      setLastName(currentUser.last_name || '');
      setRole(currentUser.role);
      setPassword(''); // Clear password on edit

      // Handle student home class assignment
      if (currentUser.role === 'student' && currentUser.school_class) {
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
      
      // Handle teaching teacher class assignments
      if (currentUser.role === 'teaching_teacher' && currentUser.teaching_classes) {
        setTeachingClassIds(currentUser.teaching_classes);
      } else {
        setTeachingClassIds([]);
      }
    } else {
      // For new users
      setUsername('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setPassword('');
      // Set default role - look for student role as default for new user
      const studentRole = availableRoles.find(r => r.value === 'student');
      setRole(studentRole ? studentRole.value : (availableRoles.length > 0 ? availableRoles[0].value : ''));
      
      // Initialize with empty grade/class for new student
      setSelectedGradeFilter('');
      setFilteredSchoolClasses(schoolClasses);
      setSchoolClassId(null);
      setTeachingClassIds([]);
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
    if (newRole !== 'student') {
      setSchoolClassId(null); // Clear class if not a student
      setSelectedGradeFilter(''); // Clear grade filter
      setFilteredSchoolClasses(schoolClasses); // Show all classes in background for when role switches back
    } else {
      // If switching to student role, show all classes initially
      setFilteredSchoolClasses(schoolClasses);
    }
    
    // Clear teaching classes if not a teaching teacher
    if (newRole !== 'teaching_teacher') {
      setTeachingClassIds([]);
    }
  };  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Comprehensive validation for student role
    if (role === 'student') {
      if (!selectedGradeFilter) {
        alert('Please select a grade for the student.');
        return;
      }
      
      if (!schoolClassId) {
        alert('Please select a class for the student.');
        return;
      }
    }
    
    const userData: Partial<User> = {
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      school_class: role === 'student' ? (schoolClassId === undefined ? null : schoolClassId) : null,
    };
    
    // Add teaching classes for teaching teachers
    if (role === 'teaching_teacher' && teachingClassIds.length > 0) {
      userData.teaching_classes = teachingClassIds;
    }
    
    if (password) {
      userData.password = password;
    }
    
    onFormSubmit(userData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
        <div className="space-y-4">
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password {currentUser ? '(leave blank if not changing)' : ''}:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              {...(currentUser ? {} : { required: true })}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
        <div className="space-y-4">
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
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Role Assignment</h3>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">User Role:</label>
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
          <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
            {role === 'STUDENT' ? 'Students need to be assigned to a grade and class below.' : 
             role === 'TEACHER' ? 'Teaching Teacher can evaluate students per lesson.' : 
             role === 'CLASS_TEACHER' ? 'Class Teacher can track student behavior and create reports.' : 
             role === 'SUPERVISOR' ? 'Moral Education Supervisor can define rules and analyze reports.' : 
             role === 'ADMIN' ? 'System Administrator has full access to all system features.' : 
             role === 'PARENT' ? 'Parents can view their child\'s reports and submit observations.' : 
             role === 'PRINCIPAL' ? 'Principal & Director can view all data and generate school-wide reports.' : 
             'Select a role to continue.'}
          </p>
        </div>
      </div>      {role === 'STUDENT' && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Student Grade & Class Assignment</h3>
          <p className="text-sm text-blue-700 mb-3">Students must be assigned to a grade and class to properly appear in teacher views.</p>
          
          <div className="space-y-5">
            <div>
              <label htmlFor="grade-filter" className="block text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> Grade Assignment:
              </label>
              <select 
                id="grade-filter" 
                value={selectedGradeFilter}
                onChange={(e) => {
                  setSelectedGradeFilter(e.target.value);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select Grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name} {grade.description ? `- ${grade.description}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">First select a grade to view available classes</p>
            </div>
            
            <div>
              <label htmlFor="schoolClass" className="block text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> Class Assignment:
              </label>
              <select 
                id="schoolClass" 
                value={schoolClassId === null || schoolClassId === undefined ? '' : schoolClassId} 
                onChange={(e) => setSchoolClassId(e.target.value ? parseInt(e.target.value, 10) : null)} 
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!selectedGradeFilter ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}
                disabled={!selectedGradeFilter}
                required
              >
                <option value="">Select Class{!selectedGradeFilter ? ' (Select Grade First)' : ''}</option>
                {filteredSchoolClasses.length > 0 ? (
                  filteredSchoolClasses.map((sClass) => (
                    <option key={sClass.id} value={sClass.id}>
                      {sClass.name} {grades.find(g => g.id === sClass.grade)?.name && `(Grade: ${grades.find(g => g.id === sClass.grade)?.name})`}
                    </option>
                  ))
                ) : (
                  selectedGradeFilter ? <option value="" disabled>No classes available for this grade</option> : null
                )}
              </select>
              {selectedGradeFilter && filteredSchoolClasses.length === 0 && (
                <p className="mt-1 text-sm text-red-500">No classes found for this grade. Please create classes first.</p>
              )}
              {!selectedGradeFilter && (
                <p className="mt-1 text-sm text-amber-600">You must select a grade before choosing a class</p>
              )}
            </div>
          </div>
        </div>
      )}
      {role === 'TEACHER' && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-300 shadow-sm">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Teaching Class Assignment</h3>
          <p className="text-sm text-green-700 mb-3">Teaching Teachers can be assigned to one or more classes.</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="subject-classes-filter" className="block text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> Subject Class Assignment:
              </label>
              <select 
                id="subject-classes-filter" 
                value={subjectClassesFilter}
                onChange={(e) => setSubjectClassesFilter(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                multiple
                required
              >
                {filteredSchoolClasses.length > 0 ? (
                  filteredSchoolClasses.map((sClass) => (
                    <option key={sClass.id} value={sClass.id}>
                      {sClass.name} {grades.find(g => g.id === sClass.grade)?.name && `(Grade: ${grades.find(g => g.id === sClass.grade)?.name})`}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No classes available for the selected grade</option>
                )}
              </select>
              <p className="mt-1 text-sm text-gray-500">Hold down the Ctrl (Windows) or Command (Mac) button to select multiple classes.</p>
            </div>
          </div>
        </div>
      )}

      {role === 'teaching_teacher' && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-300 shadow-sm">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Teaching Classes Assignment</h3>
          <p className="text-sm text-green-700 mb-3">
            Teaching Teachers can be assigned to multiple subject classes to record scores for students.
          </p>
          
          <div className="mb-4">
            <label htmlFor="subject-class-filter" className="block text-sm font-medium text-gray-700">
              Filter Subject Classes:
            </label>
            <input 
              type="text" 
              id="subject-class-filter" 
              value={subjectClassesFilter}
              onChange={(e) => setSubjectClassesFilter(e.target.value)}
              placeholder="Type to filter classes..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
            {schoolClasses
              .filter(cls => cls.class_type === 'subject_class')
              .filter(cls => {
                if (!subjectClassesFilter) return true;
                return cls.name.toLowerCase().includes(subjectClassesFilter.toLowerCase()) ||
                      (cls.grade_name && cls.grade_name.toLowerCase().includes(subjectClassesFilter.toLowerCase()));
              })
              .map(cls => (
                <div key={cls.id} className="flex items-center mb-2 p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    id={`class-${cls.id}`}
                    checked={teachingClassIds.includes(cls.id)}
                    onChange={() => {
                      setTeachingClassIds(prev => 
                        prev.includes(cls.id) 
                          ? prev.filter(id => id !== cls.id) 
                          : [...prev, cls.id]
                      );
                    }}
                    className="mr-3 h-4 w-4"
                  />
                  <label htmlFor={`class-${cls.id}`} className="flex-grow cursor-pointer">
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-sm text-gray-500">Grade: {cls.grade_name}</div>
                  </label>
                </div>
              ))
            }
            {schoolClasses.filter(cls => cls.class_type === 'subject_class').length === 0 && (
              <p className="text-center py-3 text-gray-500">No subject classes available. Please create subject classes first.</p>
            )}
          </div>
          
          <div className="mt-3 text-sm text-green-600">
            {teachingClassIds.length} subject classes selected
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{currentUser ? 'Update' : 'Create'} User</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
      </div>
    </form>
  );
};

export default UserForm;
