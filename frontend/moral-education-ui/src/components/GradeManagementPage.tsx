import React, { useState, useEffect } from 'react';
import { getGrades, createGrade, updateGrade, deleteGrade } from '../services/apiService';
import type { Grade } from '../services/apiService'; // Changed to type-only import
import GradeList from './GradeList';
import GradeForm from './GradeForm';

const GradeManagementPage: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  useEffect(() => {
    // Check authentication status and user role first
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('authToken');
      console.log('Auth token present:', Boolean(token));
      
      if (!token) {
        setError('You need to be logged in to access this page.');
        return;
      }
      
      try {
        // Optional: Get current user to verify role
        const apiClient = await import('../services/apiService');
        const currentUser = await apiClient.getCurrentUser();
        console.log('Current user:', currentUser);
        console.log('User role:', currentUser.role);
        
        if (currentUser.role !== 'system_administrator') {
          setError('You need to be a System Administrator to manage grades.');
          return;
        }
        
        fetchGradesData();
      } catch (err) {
        setError('Authentication error. Please log in again.');
        console.error('Authentication check failed:', err);
      }
    };
    
    checkAuthAndFetchData();
  }, []);

  const fetchGradesData = async () => {
    try {
      setLoading(true);
      const data = await getGrades();
      setGrades(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch grades. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleFormSubmit = async (gradeData: Omit<Grade, 'id'> | Partial<Omit<Grade, 'id'>>, id?: number) => {
    try {
      setError(null);
      if (id) {
        await updateGrade(id, gradeData as Partial<Omit<Grade, 'id'>>);
      } else {
        console.log('Creating grade with data:', gradeData);
        await createGrade(gradeData as Omit<Grade, 'id'>);
      }
      setShowForm(false);
      setEditingGrade(null);
      fetchGradesData(); // Refresh list
    } catch (err) {
      const action = id ? 'update' : 'create';
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to ${action} grade. Error: ${errorMessage}`);
      console.error('Grade operation failed:', err);
    }
  };

  const handleEditGrade = (grade: Grade) => {
    setEditingGrade(grade);
    setShowForm(true);
    setError(null);
  };

  const handleDeleteGrade = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        setError(null);
        await deleteGrade(id);
        fetchGradesData(); // Refresh list
      } catch (err) {
        setError('Failed to delete grade. Please try again.');
        console.error(err);
      }
    }
  };

  const handleAddNewGrade = () => {
    setEditingGrade(null);
    setShowForm(true);
    setError(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGrade(null);
    setError(null);
  };

  if (loading) return <p>Loading grades...</p>;

  return (
    <div>
      <h2>Grade Management</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!showForm && (
        <button onClick={handleAddNewGrade} style={{ marginBottom: '1rem' }}>Add New Grade</button>
      )}

      {showForm && (
        <GradeForm
          onSubmit={handleFormSubmit}
          initialData={editingGrade}
          onCancel={handleCancelForm}
        />
      )}

      {!showForm && grades.length > 0 && (
        <GradeList
          grades={grades}
          onEdit={handleEditGrade}
          onDelete={handleDeleteGrade}
        />
      )}
      {!showForm && !loading && grades.length === 0 && (
        <p>No grades found. Click "Add New Grade" to create one.</p>
      )}
    </div>
  );
};

export default GradeManagementPage;
