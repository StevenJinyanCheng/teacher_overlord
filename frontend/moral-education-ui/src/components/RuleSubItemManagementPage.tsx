import React, { useState, useEffect } from 'react';
import RuleSubItemList from './RuleSubItemList';
import RuleSubItemForm from './RuleSubItemForm';
import {
  getDimensions,
  getDimension,
  getSubItems,
  createSubItem,
  updateSubItem,
  deleteSubItem,
  type RuleSubItem,
  type RuleDimension
} from '../services/apiService';

interface RuleSubItemManagementPageProps {
  dimensionId?: number; // Optional: If provided, only show sub-items for this dimension
  onBack?: () => void; // Optional: Function to navigate back to dimensions
}

const RuleSubItemManagementPage: React.FC<RuleSubItemManagementPageProps> = ({
  dimensionId,
  onBack
}) => {
  const [subItems, setSubItems] = useState<RuleSubItem[]>([]);
  const [dimensions, setDimensions] = useState<RuleDimension[]>([]);
  const [currentDimension, setCurrentDimension] = useState<RuleDimension | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<RuleSubItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDimensions();
    if (dimensionId) {
      fetchSubItemsForDimension(dimensionId);
      fetchDimensionDetails(dimensionId);
    } else {
      fetchAllSubItems();
    }
  }, [dimensionId]);

  const fetchDimensions = async () => {
    try {
      setLoading(true);
      const dimensionsData = await getDimensions();
      setDimensions(dimensionsData);
    } catch (err) {
      setError('Failed to fetch dimensions. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchDimensionDetails = async (id: number) => {
    try {
      setLoading(true);
      const dimensionData = await getDimension(id);
      setCurrentDimension(dimensionData);
    } catch (err) {
      setError('Failed to fetch dimension details. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubItems = async () => {
    try {
      setLoading(true);
      const subItemsData = await getSubItems();
      setSubItems(subItemsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sub-items. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchSubItemsForDimension = async (dimensionId: number) => {
    try {
      setLoading(true);
      const subItemsData = await getSubItems(dimensionId);
      setSubItems(subItemsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sub-items for dimension. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateSubItem = async (subItemData: Partial<RuleSubItem>) => {
    try {
      setLoading(true);
      if (editingSubItem) {
        await updateSubItem(editingSubItem.id, subItemData);
      } else {
        await createSubItem(subItemData as Omit<RuleSubItem, 'id'>);
      }
      
      // Refresh the list based on context
      if (dimensionId) {
        fetchSubItemsForDimension(dimensionId);
      } else {
        fetchAllSubItems();
      }
      
      setShowForm(false);
      setEditingSubItem(null);
      setError(null);
    } catch (err) {
      setError('Failed to save sub-item. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubItem = (subItem: RuleSubItem) => {
    setEditingSubItem(subItem);
    setShowForm(true);
  };

  const handleDeleteSubItem = async (id: number) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this sub-item?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteSubItem(id);
      
      // Refresh the list based on context
      if (dimensionId) {
        fetchSubItemsForDimension(dimensionId);
      } else {
        fetchAllSubItems();
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete sub-item. ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {dimensionId ? `Sub-Items for ${currentDimension?.name || 'Dimension'}` : 'All Sub-Items'}
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            ← Back to Dimensions
          </button>
        )}
      </div>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {loading && <p>Loading...</p>}

      {showForm && (
        <RuleSubItemForm
          currentSubItem={editingSubItem}
          dimensions={dimensions}
          initialDimensionId={dimensionId}
          onFormSubmit={handleCreateOrUpdateSubItem}
          onCancel={() => {
            setShowForm(false);
            setEditingSubItem(null);
            setError(null);
          }}
        />
      )}

      {!showForm && !loading && (
        <button
          onClick={() => { setShowForm(true); setEditingSubItem(null); setError(null); }}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Sub-Item
        </button>
      )}

      {!showForm && !loading && (
        <RuleSubItemList
          subItems={subItems}
          onEditSubItem={handleEditSubItem}
          onDeleteSubItem={handleDeleteSubItem}
          dimensionName={currentDimension?.name}
        />
      )}
    </div>
  );
};

export default RuleSubItemManagementPage;
