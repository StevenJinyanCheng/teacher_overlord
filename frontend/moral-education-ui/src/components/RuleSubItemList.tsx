import React from 'react';
import { RuleSubItem } from '../services/apiService';

interface RuleSubItemListProps {
  subItems: RuleSubItem[];
  onEditSubItem: (subItem: RuleSubItem) => void;
  onDeleteSubItem: (id: number) => void;
  dimensionName?: string; // Optional context for the list header
}

const RuleSubItemList: React.FC<RuleSubItemListProps> = ({
  subItems,
  onEditSubItem,
  onDeleteSubItem,
  dimensionName
}) => {
  return (
    <div className="overflow-x-auto">
      {dimensionName && (
        <h2 className="text-xl font-bold mb-2">Sub-Items for Dimension: {dimensionName}</h2>
      )}
      
      {subItems.length === 0 ? (
        <p className="text-center py-4">No sub-items found. Create a new sub-item to get started.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Max Score</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subItems.map((subItem) => (
              <tr key={subItem.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{subItem.name}</td>
                <td className="py-2 px-4 border-b">{subItem.description || 'No description'}</td>
                <td className="py-2 px-4 border-b">{subItem.max_score}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => onEditSubItem(subItem)}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Edit Sub-Item"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteSubItem(subItem.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Sub-Item"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RuleSubItemList;
