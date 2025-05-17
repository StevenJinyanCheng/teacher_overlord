import React from 'react';
import type { RuleDimension } from '../services/apiService';

interface RuleDimensionListProps {
  dimensions: RuleDimension[];
  onEditDimension: (dimension: RuleDimension) => void;
  onDeleteDimension: (id: number) => void;
  onViewSubItems: (dimension: RuleDimension) => void;
  chapterName?: string; // Optional context for the list header
}

const RuleDimensionList: React.FC<RuleDimensionListProps> = ({
  dimensions,
  onEditDimension,
  onDeleteDimension,
  onViewSubItems,
  chapterName
}) => {
  return (
    <div className="overflow-x-auto">
      {chapterName && (
        <h2 className="text-xl font-bold mb-2">Dimensions for Chapter: {chapterName}</h2>
      )}
      
      {dimensions.length === 0 ? (
        <p className="text-center py-4">No dimensions found. Create a new dimension to get started.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Sub-Items</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dimensions.map((dimension) => (
              <tr key={dimension.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{dimension.name}</td>
                <td className="py-2 px-4 border-b">{dimension.description || 'No description'}</td>
                <td className="py-2 px-4 border-b">{dimension.sub_items?.length || 0}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => onViewSubItems(dimension)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    title="View Sub-Items"
                  >
                    View Sub-Items
                  </button>
                  <button
                    onClick={() => onEditDimension(dimension)}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Edit Dimension"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteDimension(dimension.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Dimension"
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

export default RuleDimensionList;
