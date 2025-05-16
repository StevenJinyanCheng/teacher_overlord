import React from 'react';
import type { SchoolClass } from '../services/apiService'; // Changed to type-only import

interface ClassListProps {
  classes: SchoolClass[];
  onEdit: (schoolClass: SchoolClass) => void;
  onDelete: (id: number) => void;
}

const ClassList: React.FC<ClassListProps> = ({ classes, onEdit, onDelete }) => {
  if (classes.length === 0) {
    return <p>No classes found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Grade</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {classes.map((schoolClass) => (
          <tr key={schoolClass.id}>
            <td>{schoolClass.name}</td>
            <td>{schoolClass.grade_name}</td>
            <td>
              <button onClick={() => onEdit(schoolClass)}>Edit</button>
              <button onClick={() => onDelete(schoolClass.id)} style={{ marginLeft: '5px' }}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClassList;
