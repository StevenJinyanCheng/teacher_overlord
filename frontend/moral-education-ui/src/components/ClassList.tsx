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

  return (    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-100">
          <th className="py-2 px-4 text-left">Name</th>
          <th className="py-2 px-4 text-left">Grade</th>
          <th className="py-2 px-4 text-left">Type</th>
          <th className="py-2 px-4 text-left">Teachers</th>
          <th className="py-2 px-4 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {classes.map((schoolClass) => (
          <tr key={schoolClass.id} className="border-t hover:bg-gray-50">
            <td className="py-2 px-4">{schoolClass.name}</td>
            <td className="py-2 px-4">{schoolClass.grade_name}</td>
            <td className="py-2 px-4">
              {schoolClass.class_type_display || 
               (schoolClass.class_type === 'home_class' ? 'Home Class' : 
               schoolClass.class_type === 'subject_class' ? 'Subject Class' : 
               schoolClass.class_type)}
            </td>
            <td className="py-2 px-4">
              {schoolClass.class_teachers_details && schoolClass.class_teachers_details.length > 0 ? (
                <ul className="list-disc pl-5">
                  {schoolClass.class_teachers_details.map(teacher => (
                    <li key={teacher.id}>{teacher.full_name || teacher.username}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500 italic">No teachers assigned</span>
              )}
            </td>
            <td className="py-2 px-4">
              <button 
                onClick={() => onEdit(schoolClass)} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(schoolClass.id)} 
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClassList;
