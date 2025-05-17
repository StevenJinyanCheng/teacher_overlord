import React from 'react';
import type { RuleChapter } from '../services/apiService';

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
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left border-b">Chapter Name</th>
              <th className="py-2 px-4 text-left border-b">Description</th>
              <th className="py-2 px-4 text-left border-b">Dimensions Count</th>
              <th className="py-2 px-4 text-left border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chapters.map((chapter) => (
              <tr key={chapter.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b font-medium">{chapter.name}</td>
                <td className="py-2 px-4 border-b">
                  {chapter.description ? (
                    <span>{chapter.description}</span>
                  ) : (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  {chapter.dimensions ? chapter.dimensions.length : 0}
                </td>
                <td className="py-2 px-4 border-b space-x-2">
                  <button
                    onClick={() => onViewDimensions(chapter)}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white py-1 px-2 rounded mr-2"
                  >
                    Dimensions
                  </button>
                  <button
                    onClick={() => onEditChapter(chapter)}
                    className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteChapter(chapter.id)}
                    className="bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded"
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
