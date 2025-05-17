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
            <th className="py-2 px-4 border-b">Full Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">School Class</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : <span className="text-gray-400 italic">Not provided</span>}
              </td>
              <td className="py-2 px-4 border-b">
                {user.email || <span className="text-gray-400 italic">Not provided</span>}
              </td>
              <td className="py-2 px-4 border-b">{user.role_display || user.role}</td>
              <td className="py-2 px-4 border-b">
                {user.school_class_details ? user.school_class_details.name : 
                  (user.role === 'student' ? 
                    <span className="text-yellow-600">No class assigned</span> : 
                    <span className="text-gray-400">N/A</span>)}
              </td>
              <td className="py-2 px-4 border-b">
                <button
                  onClick={() => onEdit(user)}
                  className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
