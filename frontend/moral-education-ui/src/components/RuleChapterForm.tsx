import React, { useState, useEffect } from 'react';
import type { RuleChapter } from '../services/apiService';

interface RuleChapterFormProps {
  currentChapter: RuleChapter | null;
  onFormSubmit: (chapterData: Partial<RuleChapter>) => void;
  onCancel: () => void;
}

const RuleChapterForm: React.FC<RuleChapterFormProps> = ({ currentChapter, onFormSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (currentChapter) {
      setName(currentChapter.name);
      setDescription(currentChapter.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [currentChapter]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onFormSubmit({
      name,
      description: description || undefined // Don't send empty string
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{currentChapter ? 'Edit Chapter' : 'Create New Chapter'}</h2>
      
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
          {currentChapter ? 'Update Chapter' : 'Create Chapter'}
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

export default RuleChapterForm;
