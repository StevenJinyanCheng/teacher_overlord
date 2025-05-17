import React, { useState, useEffect } from 'react';
import type { Grade } from '../services/apiService'; // Changed to type-only import

interface GradeFormProps {
  onSubmit: (gradeData: Omit<Grade, 'id'> | Partial<Omit<Grade, 'id'>>, id?: number) => void;
  initialData?: Grade | null;
  onCancel: () => void;
}

const GradeForm: React.FC<GradeFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [initialData]);
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      alert('Grade name cannot be empty.');
      return;
    }
    if (initialData && initialData.id) {
      onSubmit({ name, description }, initialData.id);
    } else {
      onSubmit({ name, description });
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="gradeName">Grade Name:</label>
        <input
          type="text"
          id="gradeName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="gradeDescription">Description (Optional):</label>
        <textarea
          id="gradeDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit">{initialData ? 'Update' : 'Create'} Grade</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '10px' }}>Cancel</button>
    </form>
  );
};

export default GradeForm;
