import React, { useState, useEffect } from 'react';
import { RuleSubItem, RuleDimension } from '../services/apiService';

interface RuleSubItemFormProps {
  currentSubItem: RuleSubItem | null;
  dimensions: RuleDimension[];
  initialDimensionId?: number;
  onFormSubmit: (subItemData: Partial<RuleSubItem>) => void;
  onCancel: () => void;
}

const RuleSubItemForm: React.FC<RuleSubItemFormProps> = ({ 
  currentSubItem,
  dimensions,
  initialDimensionId,
  onFormSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dimensionId, setDimensionId] = useState<number | undefined>(initialDimensionId);
  const [maxScore, setMaxScore] = useState<number>(10); // Default max score

  useEffect(() => {
    if (currentSubItem) {
      setName(currentSubItem.name);
      setDescription(currentSubItem.description || '');
      setDimensionId(currentSubItem.dimension);
      setMaxScore(currentSubItem.max_score);
    } else {
      setName('');
      setDescription('');
      setDimensionId(initialDimensionId);
      setMaxScore(10); // Default
    }
  }, [currentSubItem, initialDimensionId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dimensionId) {
      alert('Please select a dimension.');
      return;
    }
    
    onFormSubmit({
      name,
      description: description || undefined,
      dimension: dimensionId,
      max_score: maxScore
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">{currentSubItem ? 'Edit Sub-Item' : 'Create New Sub-Item'}</h2>
      
      <div>
        <label htmlFor="dimension" className="block text-sm font-medium text-gray-700">Dimension:</label>
        <select
          id="dimension"
          value={dimensionId || ''}
          onChange={(e) => setDimensionId(e.target.value ? parseInt(e.target.value) : undefined)}
          required
          disabled={initialDimensionId !== undefined} // Disable if initial dimension is specified
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Dimension</option>
          {dimensions.map((dimension) => (
            <option key={dimension.id} value={dimension.id}>
              {dimension.name}
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
      
      <div>
        <label htmlFor="max_score" className="block text-sm font-medium text-gray-700">Maximum Score:</label>
        <input
          type="number"
          id="max_score"
          value={maxScore}
          onChange={(e) => setMaxScore(parseInt(e.target.value) || 0)}
          required
          min="1"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {currentSubItem ? 'Update Sub-Item' : 'Create Sub-Item'}
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

export default RuleSubItemForm;
