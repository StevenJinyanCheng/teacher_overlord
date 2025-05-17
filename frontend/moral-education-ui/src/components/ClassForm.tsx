import React, { useState, useEffect } from 'react';
import type { SchoolClass, Grade, User } from '../services/apiService'; // Added User type

interface ClassFormProps {
  onSubmit: (classData: Omit<SchoolClass, 'id' | 'grade_name' | 'class_type_display' | 'class_teachers_details'>, id?: number) => void;
  initialData?: SchoolClass | null;
  grades: Grade[];
  classTeachers?: User[];
  onCancel: () => void;
  error?: string | null;
}

const ClassForm: React.FC<ClassFormProps> = ({ onSubmit, initialData, grades, classTeachers = [], onCancel, error }) => {
  const [name, setName] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState<number | string>('');
  const [classType, setClassType] = useState<string>('home_class'); // Default to home_class
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedGradeId(initialData.grade);
      setClassType(initialData.class_type);
      setSelectedTeacherIds(initialData.class_teachers || []);
    } else {
      // Reset form when creating new class
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setName('');
    setSelectedGradeId('');
    setClassType('home_class');
    setSelectedTeacherIds([]);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    let errors: { [key: string]: string } = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = 'Class name is required';
      isValid = false;
    }

    if (!selectedGradeId) {
      errors.grade = 'Grade is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const classData = {
      name,
      grade: Number(selectedGradeId),
      class_type: classType,
      class_teachers: selectedTeacherIds
    };

    onSubmit(classData, initialData?.id);
  };

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
    setSelectedTeacherIds(selectedOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Class' : 'Add New Class'}
      </h2>
      
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 mb-2">Class Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full p-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded`}
          placeholder="Enter class name"
        />
        {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="grade" className="block text-gray-700 mb-2">Grade</label>
        <select
          id="grade"
          value={selectedGradeId}
          onChange={(e) => setSelectedGradeId(e.target.value)}
          className={`w-full p-2 border ${formErrors.grade ? 'border-red-500' : 'border-gray-300'} rounded`}
        >
          <option value="">Select a Grade</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>{grade.name}</option>
          ))}
        </select>
        {formErrors.grade && <p className="text-red-500 text-sm mt-1">{formErrors.grade}</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="class_type" className="block text-gray-700 mb-2">Class Type</label>
        <select
          id="class_type"
          value={classType}
          onChange={(e) => setClassType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="home_class">Home Class</option>
          <option value="subject_class">Subject Class</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="teachers" className="block text-gray-700 mb-2">Assign Class Teachers</label>
        <select
          id="teachers"
          multiple
          value={selectedTeacherIds.map(String)}
          onChange={handleTeacherChange}
          className="w-full p-2 border border-gray-300 rounded"
          size={Math.min(5, classTeachers.length || 3)}
        >
          {classTeachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.first_name && teacher.last_name 
                ? `${teacher.first_name} ${teacher.last_name}` 
                : teacher.username}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple teachers</p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-black py-2 px-4 rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          {initialData ? 'Update' : 'Create'} Class
        </button>
      </div>
    </form>
  );
};

export default ClassForm;
