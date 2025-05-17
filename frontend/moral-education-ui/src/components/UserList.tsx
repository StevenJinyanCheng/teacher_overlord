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
              <td className="py-2 px-4 border-b">
                {user.role_display || 
                 (user.role === 'ADMIN' ? 'System Administrator' : 
                  user.role === 'SUPERVISOR' ? 'Moral Education Supervisor' : 
                  user.role === 'TEACHER' ? 'Teaching Teacher' : 
                  user.role === 'CLASS_TEACHER' ? 'Class Teacher' : 
                  user.role === 'STUDENT' ? 'Student' : 
                  user.role === 'PARENT' ? 'Parent' : 
                  user.role === 'PRINCIPAL' ? 'Principal & Director' : 
                  user.role)}
              </td>              <td className="py-2 px-4 border-b">
                {user.role === 'STUDENT' ? (
                  <>
                    {user.school_class_details?.name || (
                      <span className="text-red-500 text-sm font-medium">Not Assigned</span>
                    )}
                    {user.school_class_details?.grade_name && (
                      <div className="text-xs text-gray-600 mt-1">
                        Grade: {user.school_class_details.grade_name}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </td>
              <td className="py-2 px-4 border-b flex space-x-2">
                <button 
                  onClick={() => onEdit(user)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(user.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
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
