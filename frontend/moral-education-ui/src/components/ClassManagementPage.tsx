import React, { useState, useEffect } from 'react';
import {
  getSchoolClasses,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
  getGrades, // Need to fetch grades for the form
  getUsers, // Need to fetch teachers for class assignment
} from '../services/apiService';
import type { SchoolClass, Grade, User } from '../services/apiService'; // Changed to type-only imports
import ClassList from './ClassList';
import ClassForm from './ClassForm';

const ClassManagementPage: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classTeachers, setClassTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editClass, setEditClass] = useState<SchoolClass | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // Fetch classes, grades, and teachers on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [classesData, gradesData, usersData] = await Promise.all([
          getSchoolClasses(),
          getGrades(),
          getUsers()
        ]);

        setClasses(classesData);
        setGrades(gradesData);
        // Filter users to only include teachers
        const teachers = usersData.filter(user => 
          user.role === 'teaching_teacher' || user.role === 'class_teacher'
        );
        setClassTeachers(teachers);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateClass = () => {
    setEditClass(null); // Ensure we're not in edit mode
    setShowForm(true);
  };

  const handleEditClass = (classData: SchoolClass) => {
    setEditClass(classData);
    setShowForm(true);
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      await deleteSchoolClass(id);
      // Update classes list after deletion
      setClasses(prevClasses => prevClasses.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete the class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (
    classData: Omit<SchoolClass, 'id' | 'grade_name' | 'class_type_display' | 'class_teachers_details'>,
    id?: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      if (id) {
        // Update existing class
        const updatedClass = await updateSchoolClass(id, classData);
        setClasses(prevClasses => 
          prevClasses.map(c => c.id === id ? updatedClass : c)
        );
      } else {
        // Create new class
        const newClass = await createSchoolClass(classData);
        setClasses(prevClasses => [...prevClasses, newClass]);
      }

      // Reset form state
      setShowForm(false);
      setEditClass(null);
    } catch (err) {
      console.error('Error saving class:', err);
      setError('Failed to save the class. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditClass(null);
    setError(null);
  };

  if (loading && !classes.length) {
    return <div className="flex justify-center items-center h-64"><div className="text-xl">Loading...</div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Class Management</h1>
        <button
          onClick={handleCreateClass}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Class
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {showForm ? (
        <div className="mb-8">
          <ClassForm
            onSubmit={handleFormSubmit}
            initialData={editClass}
            grades={grades}
            classTeachers={classTeachers}
            onCancel={handleCancelForm}
            error={error}
          />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded p-4">
          <ClassList 
            classes={classes}
            onEdit={handleEditClass}
            onDelete={handleDeleteClass}
          />
        </div>
      )}
    </div>
  );
};

export default ClassManagementPage;
