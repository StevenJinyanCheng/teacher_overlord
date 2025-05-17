import React, { useState, useEffect } from 'react';
import RuleDimensionList from './RuleDimensionList';
import RuleDimensionForm from './RuleDimensionForm';
import {
  getChapters,
  getChapter,
  getDimensions,
  createDimension,
  updateDimension,
  deleteDimension,
  type RuleDimension,
  type RuleChapter
} from '../services/apiService';

interface RuleDimensionManagementPageProps {
  chapterId?: number; // Optional: If provided, only show dimensions for this chapter
  onBack?: () => void; // Optional: Function to navigate back to chapters
}

const RuleDimensionManagementPage: React.FC<RuleDimensionManagementPageProps> = ({
  chapterId,
  onBack
}) => {
  const [dimensions, setDimensions] = useState<RuleDimension[]>([]);
  const [chapters, setChapters] = useState<RuleChapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<RuleChapter | null>(null);
  const [editingDimension, setEditingDimension] = useState<RuleDimension | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDimensionId, setSelectedDimensionId] = useState<number | null>(null);

  useEffect(() => {
    fetchChapters();
    if (chapterId) {
      fetchDimensionsForChapter(chapterId);
      fetchChapterDetails(chapterId);
    } else {
      fetchAllDimensions();
    }
  }, [chapterId]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const chaptersData = await getChapters();
      setChapters(chaptersData);
    } catch (err) {
      setError('Failed to fetch chapters. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchChapterDetails = async (id: number) => {
    try {
      setLoading(true);
      const chapterData = await getChapter(id);
      setCurrentChapter(chapterData);
    } catch (err) {
      setError('Failed to fetch chapter details. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDimensions = async () => {
    try {
      setLoading(true);
      const dimensionsData = await getDimensions();
      setDimensions(dimensionsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dimensions. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchDimensionsForChapter = async (chapterId: number) => {
    try {
      setLoading(true);
      const dimensionsData = await getDimensions(chapterId);
      setDimensions(dimensionsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dimensions for chapter. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateDimension = async (dimensionData: Partial<RuleDimension>) => {
    try {
      setLoading(true);
      if (editingDimension) {
        await updateDimension(editingDimension.id, dimensionData);
      } else {
        await createDimension(dimensionData as Omit<RuleDimension, 'id' | 'sub_items'>);
      }
      
      // Refresh the list based on context
      if (chapterId) {
        fetchDimensionsForChapter(chapterId);
      } else {
        fetchAllDimensions();
      }
      
      setShowForm(false);
      setEditingDimension(null);
      setError(null);
    } catch (err) {
      setError('Failed to save dimension. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditDimension = (dimension: RuleDimension) => {
    setEditingDimension(dimension);
    setShowForm(true);
  };

  const handleDeleteDimension = async (id: number) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this dimension? This will also delete all sub-items in this dimension.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDimension(id);
      
      // Refresh the list based on context
      if (chapterId) {
        fetchDimensionsForChapter(chapterId);
      } else {
        fetchAllDimensions();
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete dimension. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubItems = (dimension: RuleDimension) => {
    // For now, just store the selected dimension ID
    // Later, we'll use this to navigate to the sub-items page
    setSelectedDimensionId(dimension.id);
    // In a real app with routing: navigate(`/sub-items/${dimension.id}`)
    alert(`View sub-items for ${dimension.name} (ID: ${dimension.id}). This will be implemented in the next step.`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {chapterId ? `Dimensions for ${currentChapter?.name || 'Chapter'}` : 'All Dimensions'}
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            ← Back to Chapters
          </button>
        )}
      </div>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {loading && <p>Loading...</p>}

      {showForm && (
        <RuleDimensionForm
          currentDimension={editingDimension}
          chapters={chapters}
          initialChapterId={chapterId}
          onFormSubmit={handleCreateOrUpdateDimension}
          onCancel={() => {
            setShowForm(false);
            setEditingDimension(null);
            setError(null);
          }}
        />
      )}

      {!showForm && !loading && (
        <button
          onClick={() => { setShowForm(true); setEditingDimension(null); setError(null); }}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Dimension
        </button>
      )}

      {!showForm && !loading && (
        <RuleDimensionList
          dimensions={dimensions}
          onEditDimension={handleEditDimension}
          onDeleteDimension={handleDeleteDimension}
          onViewSubItems={handleViewSubItems}
          chapterName={currentChapter?.name}
        />
      )}
    </div>
  );
};

export default RuleDimensionManagementPage;
