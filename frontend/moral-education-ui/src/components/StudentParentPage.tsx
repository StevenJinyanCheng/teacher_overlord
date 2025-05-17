import React, { useState, useEffect } from 'react';
import type { User, StudentParentRelationship, SchoolClass, Grade } from '../services/apiService';
import { 
  getStudentParentRelationships, 
  deleteStudentParentRelationship,
  assignParentToStudent,
  getUsers,
  getSchoolClasses,
  getGrades
} from '../services/apiService';

const StudentParentPage: React.FC = () => {
  const [relationships, setRelationships] = useState<StudentParentRelationship[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [selectedParentId, setSelectedParentId] = useState<number | ''>('');
  const [studentFilter, setStudentFilter] = useState<string>('');
  const [parentFilter, setParentFilter] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  
  // Fetch relationships and users
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [relationshipsData, usersData, classesData, gradesData] = await Promise.all([
          getStudentParentRelationships(),
          getUsers(),
          getSchoolClasses(),
          getGrades()
        ]);
        
        setRelationships(relationshipsData);
        setStudents(usersData.filter(user => user.role === 'student'));
        setParents(usersData.filter(user => user.role === 'parent'));
        setSchoolClasses(classesData);
        setGrades(gradesData);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleCreateRelationship = async () => {
    if (!selectedStudentId || !selectedParentId) {
      setError('Please select both a student and a parent.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Using the custom endpoint for assigning parents
      await assignParentToStudent(Number(selectedStudentId), Number(selectedParentId));
      
      // Refresh the relationships list
      const updatedRelationships = await getStudentParentRelationships();
      setRelationships(updatedRelationships);
      
      // Reset selections
      setSelectedStudentId('');
      setSelectedParentId('');
    } catch (err) {
      setError('Failed to create relationship. Please try again.');
      console.error('Error creating relationship:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteRelationship = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this parent-student relationship?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await deleteStudentParentRelationship(id);
      
      // Update the local state to remove the deleted relationship
      setRelationships(relationships.filter(rel => rel.id !== id));
    } catch (err) {
      setError('Failed to delete relationship. Please try again.');
      console.error('Error deleting relationship:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get student by ID
  const getStudentById = (studentId: number) => {
    return students.find(student => student.id === studentId);
  };

  // Get filtered students based on search, grade, and class filters
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim().toLowerCase();
    const textMatch = 
      student.username.toLowerCase().includes(studentFilter.toLowerCase()) ||
      fullName.includes(studentFilter.toLowerCase());

    // Apply grade filter if selected
    let gradeMatch = true;
    if (selectedGradeFilter) {
      // Check if student's class belongs to the selected grade
      if (student.school_class_details) {
        gradeMatch = student.school_class_details.grade === Number(selectedGradeFilter);
      } else {
        gradeMatch = false; // No class assigned, doesn't match any grade filter
      }
    }

    // Apply class filter if selected
    let classMatch = true;
    if (selectedClassFilter) {
      classMatch = student.school_class === Number(selectedClassFilter);
    }

    return textMatch && gradeMatch && classMatch;
  });
  
  // Filter parents based on search input
  const filteredParents = parents.filter(parent => {
    const fullName = `${parent.first_name || ''} ${parent.last_name || ''}`.trim().toLowerCase();
    return (
      parent.username.toLowerCase().includes(parentFilter.toLowerCase()) ||
      fullName.includes(parentFilter.toLowerCase())
    );
  });

  // Filter classes based on selected grade
  const filteredClasses = schoolClasses.filter(cls => {
    if (!selectedGradeFilter) return true;
    return cls.grade === Number(selectedGradeFilter);
  });
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student-Parent Relationships</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Create new relationship panel */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Assign Parent to Student</h2>
          
          {/* Filters for students */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="student-search">
              Search Student:
            </label>
            <input
              id="student-search"
              type="text"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              placeholder="Type to search students..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            />
          </div>

          {/* Grade filter */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="grade-filter">
              Filter by Grade:
            </label>
            <select
              id="grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value);
                setSelectedClassFilter(''); // Reset class filter when grade changes
              }}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} {grade.description ? `- ${grade.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="class-filter">
              Filter by Class:
            </label>
            <select
              id="class-filter"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            >
              <option value="">All Classes</option>
              {filteredClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.grade_name ? `(${cls.grade_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="student-select">
              Select Student:
            </label>
            <select
              id="student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : '')}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            >
              <option value="">Select a student</option>
              {filteredStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.username})
                  {student.school_class_details ? ` - ${student.school_class_details.name}` : ' - No class assigned'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="parent-search">
              Search Parent:
            </label>
            <input
              id="parent-search"
              type="text"
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              placeholder="Type to search parents..."
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="parent-select">
              Select Parent:
            </label>
            <select
              id="parent-select"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value ? Number(e.target.value) : '')}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            >
              <option value="">Select a parent</option>
              {filteredParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.first_name} {parent.last_name} ({parent.username})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleCreateRelationship}
            disabled={!selectedStudentId || !selectedParentId || loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : 'Assign Parent to Student'}
          </button>
        </div>
        
        {/* Existing relationships panel */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Relationships</h2>
          
          {loading ? (
            <p>Loading relationships...</p>
          ) : relationships.length === 0 ? (
            <p>No student-parent relationships found.</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left">Student</th>
                    <th className="py-2 px-3 text-left">Class</th>
                    <th className="py-2 px-3 text-left">Parent</th>
                    <th className="py-2 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {relationships.map((rel) => {
                    const student = getStudentById(rel.student);
                    const className = student?.school_class_details?.name || 'No class assigned';
                    
                    return (
                      <tr key={rel.id} className="border-t">
                        <td className="py-2 px-3">
                          <div>{rel.student_name}</div>
                          <div className="text-sm text-gray-500">{rel.student_username}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div>{className}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div>{rel.parent_name}</div>
                          <div className="text-sm text-gray-500">{rel.parent_username}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleDeleteRelationship(rel.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentParentPage;
