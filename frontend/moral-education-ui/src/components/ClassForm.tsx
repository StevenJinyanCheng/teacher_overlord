import React, { useState, useEffect } from 'react';
import type { SchoolClass, Grade } from '../services/apiService'; // Changed to type-only imports

interface ClassFormProps {
  onSubmit: (classData: Omit<SchoolClass, 'id' | 'grade_name'>, id?: number) => void;
  initialData?: SchoolClass | null;
  grades: Grade[]; // To populate the grade selector
  onCancel: () => void;
  error?: string | null;
}

const ClassForm: React.FC<ClassFormProps> = ({ onSubmit, initialData, grades, onCancel, error }) => {
  const [name, setName] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState<number | string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedGradeId(initialData.grade_id);
    } else {
      setName('');
      setSelectedGradeId(''); // Reset for new form
    }
  }, [initialData]);

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
    const classDataToSubmit: Omit<SchoolClass, 'id' | 'grade_name'> = {
      name: name.trim(),
      grade_id: Number(selectedGradeId),
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
      <div>
        <label htmlFor="className">Class Name:</label>
        <input
          type="text"
          id="className"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="classGrade">Grade:</label>
        <select
          id="classGrade"
          value={selectedGradeId}
          onChange={(e) => setSelectedGradeId(e.target.value)}
          required
        >
          <option value="" disabled>Select a grade</option>
          {grades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit">{initialData ? 'Update' : 'Create'} Class</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>Cancel</button>
    </form>
  );
};

export default ClassForm;
