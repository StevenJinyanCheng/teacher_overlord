import React, { useState, useEffect } from 'react';
import RuleChapterList from './RuleChapterList';
import RuleChapterForm from './RuleChapterForm';
import { 
  getChapters, 
  createChapter, 
  updateChapter, 
  deleteChapter, 
  type RuleChapter 
} from '../services/apiService';

interface RuleChapterManagementPageProps {
  onViewDimensions?: (chapter: RuleChapter) => void;
}

const RuleChapterManagementPage: React.FC<RuleChapterManagementPageProps> = ({ onViewDimensions }) => {
  const [chapters, setChapters] = useState<RuleChapter[]>([]);
  const [editingChapter, setEditingChapter] = useState<RuleChapter | null>(null);  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const chaptersData = await getChapters();
      setChapters(chaptersData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch chapters. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateChapter = async (chapterData: Partial<RuleChapter>) => {
    try {
      setLoading(true);
      if (editingChapter) {
        await updateChapter(editingChapter.id, chapterData);
      } else {
        await createChapter(chapterData as Omit<RuleChapter, 'id' | 'dimensions'>);
      }
      fetchChapters(); // Refresh the list
      setShowForm(false);
      setEditingChapter(null);
      setError(null);
    } catch (err) {
      setError('Failed to save chapter. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };
  const handleEditChapter = (chapter: RuleChapter) => {
    setEditingChapter(chapter);
    setShowForm(true);
  };
  
  const handleViewDimensions = (chapter: RuleChapter) => {
    if (onViewDimensions) {
      onViewDimensions(chapter);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this chapter? This will also delete all dimensions and sub-items in this chapter.')) {
      return;
    }
    
    try {
      setLoading(true);
      await deleteChapter(id);
      fetchChapters(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to delete chapter. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };  const handleViewDimensions = (chapter: RuleChapter) => {
    // Call the parent component handler if provided
    if (onViewDimensions) {
      onViewDimensions(chapter);
    } else {
      // Fallback if no handler provided
      alert(`View dimensions for ${chapter.name} (ID: ${chapter.id}). This will be implemented in the next step.`);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rule Chapter Management</h1>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {loading && <p>Loading...</p>}

      {showForm && (
        <RuleChapterForm 
          currentChapter={editingChapter}
          onFormSubmit={handleCreateOrUpdateChapter}
          onCancel={() => {
            setShowForm(false);
            setEditingChapter(null);
            setError(null);
          }}
        />
      )}

      {!showForm && !loading && (
        <button 
          onClick={() => { setShowForm(true); setEditingChapter(null); setError(null); }}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Chapter
        </button>
      )}

      {!showForm && !loading && (
        <RuleChapterList
          chapters={chapters}
          onEditChapter={handleEditChapter}
          onDeleteChapter={handleDeleteChapter}
          onViewDimensions={handleViewDimensions}
        />
      )}
    </div>
  );
};

export default RuleChapterManagementPage;
