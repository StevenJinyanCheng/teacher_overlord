import React, { useState, useEffect } from 'react';
import type { RuleDimension, RuleChapter } from '../services/apiService';

interface RuleDimensionFormProps {
  currentDimension: RuleDimension | null;
  chapters: RuleChapter[];
  initialChapterId?: number;
  onFormSubmit: (dimensionData: Partial<RuleDimension>) => void;
  onCancel: () => void;
}

const RuleDimensionForm: React.FC<RuleDimensionFormProps> = ({ 
  currentDimension, 
  chapters, 
  initialChapterId,
  onFormSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [chapterId, setChapterId] = useState<number | undefined>(initialChapterId);

  useEffect(() => {
    if (currentDimension) {
      setName(currentDimension.name);
      setDescription(currentDimension.description || '');
      setChapterId(currentDimension.chapter);
    } else {
      setName('');
      setDescription('');
      setChapterId(initialChapterId);
    }
  }, [currentDimension, initialChapterId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chapterId) {
      alert('Please select a chapter.');
      return;
    }
    
    onFormSubmit({
      name,
      description: description || undefined,
      chapter: chapterId
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{currentDimension ? 'Edit Dimension' : 'Create New Dimension'}</h2>
      
      <div>
        <label htmlFor="chapter" className="block text-sm font-medium text-gray-700">Chapter:</label>
        <select
          id="chapter"
          value={chapterId || ''}
          onChange={(e) => setChapterId(e.target.value ? parseInt(e.target.value) : undefined)}
          required
          disabled={initialChapterId !== undefined} // Disable if initial chapter is specified
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Chapter</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {currentDimension ? 'Update Dimension' : 'Create Dimension'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RuleDimensionForm;
