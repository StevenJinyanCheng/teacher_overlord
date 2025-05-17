import React from 'react';
import { RuleChapter } from '../services/apiService';

interface RuleChapterListProps {
  chapters: RuleChapter[];
  onEditChapter: (chapter: RuleChapter) => void;
  onDeleteChapter: (id: number) => void;
  onViewDimensions: (chapter: RuleChapter) => void;
}

const RuleChapterList: React.FC<RuleChapterListProps> = ({ 
  chapters, 
  onEditChapter, 
  onDeleteChapter,
  onViewDimensions 
}) => {
  return (
    <div className="overflow-x-auto">
      {chapters.length === 0 ? (
        <p className="text-center py-4">No chapters found. Create a new chapter to get started.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b">Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Dimensions</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((chapter) => (
              <tr key={chapter.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{chapter.name}</td>
                <td className="py-2 px-4 border-b">{chapter.description || 'No description'}</td>
                <td className="py-2 px-4 border-b">{chapter.dimensions?.length || 0}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => onViewDimensions(chapter)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    title="View Dimensions"
                  >
                    View Dimensions
                  </button>
                  <button
                    onClick={() => onEditChapter(chapter)}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Edit Chapter"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteChapter(chapter.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Chapter"
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

export default RuleChapterList;
