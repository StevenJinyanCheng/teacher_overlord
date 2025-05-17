import React from 'react';
import type { User } from '../services/apiService';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="py-2 px-4 border-b">Username</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Full Name</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Class</th> {/* Added Class column */}
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">{user.email || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</td>
              <td className="py-2 px-4 border-b">{user.role_display || user.role}</td>
              <td className="py-2 px-4 border-b">
                {user.role === 'STUDENT' ? (user.school_class_details?.name || 'Not Assigned') : 'N/A'}
                {user.role === 'STUDENT' && user.school_class_details?.grade_name && 
                  <span className="text-xs text-gray-500 ml-1">({user.school_class_details.grade_name})</span>
                }
              </td> {/* Display class name and grade if student */}
              <td className="py-2 px-4 border-b">
                <button onClick={() => onEdit(user)}>Edit</button>
                <button onClick={() => onDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
