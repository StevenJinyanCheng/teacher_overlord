import React from 'react';
import type { Grade } from '../services/apiService'; // Changed to type-only import

interface GradeListProps {
  grades: Grade[];
  onEdit: (grade: Grade) => void;
  onDelete: (id: number) => void;
}

const GradeList: React.FC<GradeListProps> = ({ grades, onEdit, onDelete }) => {
  if (grades.length === 0) {
    return <p>No grades found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {grades.map((grade) => (
          <tr key={grade.id}>
            <td>{grade.name}</td>
            <td>
              <button onClick={() => onEdit(grade)}>Edit</button>
              <button onClick={() => onDelete(grade.id)} style={{ marginLeft: '5px' }}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GradeList;
