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
  const [grades, setGrades] = useState<Grade[]>([]); // For the dropdown in ClassForm
  const [classTeachers, setClassTeachers] = useState<User[]>([]); // For assigning teachers to classes
  const [loading, setLoading] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  useEffect(() => {
    fetchPageData();
  }, []);
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const [classesData, gradesData, usersData] = await Promise.all([
        getSchoolClasses(),
        getGrades(),
        getUsers()
      ]);
      setClasses(classesData);
      setGrades(gradesData);
      
      // Filter users to get only class teachers
      const teachers = usersData.filter(user => 
        user.role === 'class_teacher' || user.role === 'teaching_teacher'
      );
      setClassTeachers(teachers);
    } catch (err) {
      setPageError('Failed to fetch page data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchClassesData = async () => {
    try {
      setLoading(true); // Keep page loading indicator for class list refresh
      setPageError(null);
      const data = await getSchoolClasses();
      setClasses(data);
    } catch (err) {
      setPageError('Failed to refresh classes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const handleFormSubmit = async (classData: Omit<SchoolClass, 'id' | 'grade_name'>, id?: number) => {
    try {
      setFormError(null);
      setLoading(true); // Indicate loading during form submission
      if (id) {
        await updateSchoolClass(id, classData);
      } else {
        await createSchoolClass(classData);
      }
      setShowForm(false);
      setEditingClass(null);
      await fetchClassesData(); // Refresh class list
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || (id ? 'update' : 'create');
      setFormError(`Failed to ${id ? 'update' : 'create'} class: ${errorMessage}. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass);
    setShowForm(true);
    setFormError(null); // Clear previous form errors
    setPageError(null);
  };

  const handleDeleteClass = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        setPageError(null);
        setLoading(true);
        await deleteSchoolClass(id);
        await fetchClassesData(); // Refresh class list
      } catch (err) {
        setPageError('Failed to delete class. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddNewClass = () => {
    setEditingClass(null);
    setShowForm(true);
    setFormError(null);
    setPageError(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormError(null);
  };

  if (loading && !showForm) return <p>Loading class data...</p>; // Show loading only if not showing form already

  return (
    <div>
      <h2>Class Management</h2>
      {pageError && <p style={{ color: 'red' }}>{pageError}</p>}
      
      {!showForm && (
        <button onClick={handleAddNewClass} style={{ marginBottom: '1rem' }}>Add New Class</button>
      )}      {showForm && (
        <ClassForm
          onSubmit={handleFormSubmit}
          initialData={editingClass}
          grades={grades}
          classTeachers={classTeachers}
          onCancel={handleCancelForm}
          error={formError}
        />
      )}
      
      {loading && showForm && <p>Submitting form...</p>}


      {!showForm && classes.length > 0 && (
        <ClassList
          classes={classes}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
        />
      )}
      {!showForm && !loading && classes.length === 0 && (
        <p>No classes found. Click "Add New Class" to create one.</p>
      )}
    </div>
  );
};

export default ClassManagementPage;
