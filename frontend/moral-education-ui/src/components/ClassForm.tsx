import React, { useState, useEffect } from 'react';
import type { SchoolClass, Grade, User } from '../services/apiService'; // Added User type

interface ClassFormProps {
  onSubmit: (classData: Omit<SchoolClass, 'id' | 'grade_name' | 'class_type_display' | 'class_teachers_details'>, id?: number) => void;
  initialData?: SchoolClass | null;
  grades: Grade[]; // To populate the grade selector
  classTeachers?: User[]; // Available class teachers to assign
  onCancel: () => void;
  error?: string | null;
}

const ClassForm: React.FC<ClassFormProps> = ({ onSubmit, initialData, grades, classTeachers = [], onCancel, error }) => {
  const [name, setName] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState<number | string>('');
  const [classType, setClassType] = useState('home_class'); // Default to home class
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedGradeId(initialData.grade);
      setClassType(initialData.class_type || 'home_class');
      setSelectedTeachers(initialData.class_teachers || []);
    } else {
      setName('');
      setSelectedGradeId(''); // Reset for new form
      setClassType('home_class'); // Default for new classes
      setSelectedTeachers([]);
    }
  }, [initialData]);

  const handleTeacherSelection = (teacherId: number) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) // Remove if already selected
        : [...prev, teacherId] // Add if not already selected
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      alert('Class name cannot be empty.');
      return;
    }
    if (!selectedGradeId) {
      alert('Please select a grade.');
      return;
    }
    
    const classDataToSubmit: Omit<SchoolClass, 'id' | 'grade_name' | 'class_type_display' | 'class_teachers_details'> = {
      name: name.trim(),
      grade: Number(selectedGradeId),
      class_type: classType,
      class_teachers: selectedTeachers
    };
    
    if (initialData && initialData.id) {
      onSubmit(classDataToSubmit, initialData.id);
    } else {
      onSubmit(classDataToSubmit);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="mb-4">
        <label htmlFor="className" className="block text-sm font-medium text-gray-700">Class Name:</label>
        <input
          type="text"
          id="className"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="classGrade" className="block text-sm font-medium text-gray-700">Grade:</label>
        <select
          id="classGrade"
          value={selectedGradeId}
          onChange={(e) => setSelectedGradeId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="" disabled>Select a grade</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="classType" className="block text-sm font-medium text-gray-700">Class Type:</label>
        <select
          id="classType"
          value={classType}
          onChange={(e) => setClassType(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        >
          <option value="home_class">Home Class</option>
          <option value="subject_class">Subject Class</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {classType === 'home_class' ? 
            'Home Class: Basic organizational unit. Every student must be assigned to one Home-Class.' : 
            'Subject Class: Specialized instructional groups (e.g., Art, Science, English Reading).'}
        </p>
      </div>
      
      {classTeachers && classTeachers.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Class Teachers:</label>
          <p className="mt-1 text-sm text-gray-500 mb-2">
            {classType === 'home_class' ? 
              'Assign one or more class teachers to this home class.' : 
              'Assign teaching teachers to this subject class.'}
          </p>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
            {classTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id={`teacher-${teacher.id}`}
                  checked={selectedTeachers.includes(teacher.id)}
                  onChange={() => handleTeacherSelection(teacher.id)}
                  className="mr-2"
                />
                <label htmlFor={`teacher-${teacher.id}`}>
                  {teacher.first_name} {teacher.last_name} ({teacher.username}) - {teacher.role_display}
                </label>
              </div>
            ))}
            {classTeachers.length === 0 && (
              <p className="text-sm text-gray-500">No class teachers available.</p>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Create'} Class
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="ml-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
