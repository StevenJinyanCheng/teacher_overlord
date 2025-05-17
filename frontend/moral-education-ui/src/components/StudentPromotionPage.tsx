import React, { useState, useEffect } from 'react';
import { 
  getGrades, 
  getSchoolClasses, 
  getUsers, 
  promoteOrDemoteStudents, 
  type Grade, 
  type SchoolClass, 
  type User,
  type PromotionResult 
} from '../services/apiService';

const StudentPromotionPage: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromotionResult | null>(null);
  
  // Selection states
  const [sourceGradeId, setSourceGradeId] = useState<string>('');
  const [sourceClassId, setSourceClassId] = useState<string>('');
  const [targetGradeId, setTargetGradeId] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  
  // Filtered data based on selections
  const [filteredClasses, setFilteredClasses] = useState<SchoolClass[]>([]);
  const [filteredTargetClasses, setFilteredTargetClasses] = useState<SchoolClass[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [gradesData, classesData, studentsData] = await Promise.all([
        getGrades(),
        getSchoolClasses(),
        getUsers()
      ]);
      
      setGrades(gradesData);
      setClasses(classesData);
      // Filter to only include students
      setStudents(studentsData.filter(user => user.role === 'STUDENT'));
      
    } catch (err) {
      setError('Failed to load data: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Update filtered classes when source grade changes
  useEffect(() => {
    if (sourceGradeId) {
      const gradeId = parseInt(sourceGradeId, 10);
      setFilteredClasses(classes.filter(c => c.grade === gradeId));
      setSourceClassId(''); // Reset class selection
    } else {
      setFilteredClasses([]);
      setSourceClassId('');
    }
  }, [sourceGradeId, classes]);

  // Update filtered target classes when target grade changes
  useEffect(() => {
    if (targetGradeId) {
      const gradeId = parseInt(targetGradeId, 10);
      setFilteredTargetClasses(classes.filter(c => c.grade === gradeId));
      setTargetClassId(''); // Reset target class selection
    } else {
      setFilteredTargetClasses([]);
      setTargetClassId('');
    }
  }, [targetGradeId, classes]);
  // Update filtered students based on source grade/class and search term
  useEffect(() => {
    let filtered = [...students];
    
    if (sourceClassId) {
      // Filter by specific class
      const classId = parseInt(sourceClassId, 10);
      filtered = filtered.filter(student => student.school_class === classId);
    } else if (sourceGradeId) {
      // Filter by grade (all classes in the grade)
      const gradeId = parseInt(sourceGradeId, 10);
      const classIdsInGrade = classes
        .filter(c => c.grade === gradeId)
        .map(c => c.id);
      
      filtered = filtered.filter(student => 
        student.school_class && classIdsInGrade.includes(student.school_class)
      );
    }
    
    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        (student.username && student.username.toLowerCase().includes(term)) || 
        (student.first_name && student.first_name.toLowerCase().includes(term)) || 
        (student.last_name && student.last_name.toLowerCase().includes(term))
      );
    }
    
    setFilteredStudents(filtered);
    setSelectedStudentIds([]); // Reset student selection when filters change
    setCurrentPage(1); // Reset to first page on filter change
  }, [sourceGradeId, sourceClassId, students, classes, searchTerm]);

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      // If all are selected, deselect all
      setSelectedStudentIds([]);
    } else {
      // Otherwise select all
      setSelectedStudentIds(filteredStudents.map(student => student.id));
    }
  };

  const handleToggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prevSelected => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter(id => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };
  const handlePromoteOrDemote = async () => {
    if (!targetClassId) {
      setError('Please select a target class');
      return;
    }
    
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student to promote/demote');
      return;
    }

    // Get target class details for the confirmation message
    const targetClass = classes.find(c => c.id === parseInt(targetClassId, 10));
    const targetGrade = grades.find(g => g.id === parseInt(targetGradeId, 10));
    
    // Create confirmation message
    const confirmMessage = `Are you sure you want to move ${selectedStudentIds.length} student(s) to ${targetClass?.name} in grade ${targetGrade?.name}?

This action will:
- Update the students' class assignments
- Take effect immediately
- May affect their access to grade-specific resources

Click "OK" to proceed or "Cancel" to review your selection.`;
    
    // Show confirmation dialog
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const result = await promoteOrDemoteStudents({
        source_grade_id: sourceGradeId ? parseInt(sourceGradeId, 10) : undefined,
        source_class_id: sourceClassId ? parseInt(sourceClassId, 10) : undefined,
        target_grade_id: targetGradeId ? parseInt(targetGradeId, 10) : undefined,
        target_class_id: parseInt(targetClassId, 10),
        student_ids: selectedStudentIds
      });
      
      setResult(result);
      
      // Refresh data after successful promotion/demotion
      fetchInitialData();
    } catch (err) {
      setError('Failed to promote/demote students: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (student: User): string => {
    if (student.first_name || student.last_name) {
      return `${student.first_name || ''} ${student.last_name || ''}`.trim();
    }
    return student.username;
  };

  const getClassDisplay = (classId: number | null | undefined): string => {
    if (!classId) return 'No Class';
    const schoolClass = classes.find(c => c.id === classId);
    return schoolClass ? `${schoolClass.name} (${schoolClass.grade_name})` : `Class ID: ${classId}`;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Grade Promotion/Demotion</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {result && result.success && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          <p>{result.message}</p>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">Errors:</p>
              <ul className="list-disc list-inside">
                {result.errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {loading && <div className="text-gray-500">Loading...</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Source selection */}
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Step 1: Select Source</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Source Grade:</label>
            <select 
              value={sourceGradeId}
              onChange={(e) => setSourceGradeId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- All Grades --</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id.toString()}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Source Class:</label>
            <select 
              value={sourceClassId}
              onChange={(e) => setSourceClassId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!sourceGradeId}
            >
              <option value="">-- All Classes in Grade --</option>
              {filteredClasses.map(schoolClass => (
                <option key={schoolClass.id} value={schoolClass.id.toString()}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Target selection */}
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Step 2: Select Target</h2>
          
          <div className="mb-4">
            <label className="block mb-1">Target Grade:</label>
            <select 
              value={targetGradeId}
              onChange={(e) => setTargetGradeId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Grade --</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id.toString()}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1">Target Class:</label>
            <select 
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!targetGradeId}
            >
              <option value="">-- Select Class --</option>
              {filteredTargetClasses.map(schoolClass => (
                <option key={schoolClass.id} value={schoolClass.id.toString()}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
        {/* Student selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Step 3: Select Students to Move</h2>
        
        {filteredStudents.length === 0 ? (
          <p className="text-gray-500">No students match the selected criteria.</p>
        ) : (
          <>
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="flex items-center">
                <p className="mr-4">Found {filteredStudents.length} students</p>
                <button 
                  className="text-blue-600 hover:text-blue-800"
                  onClick={handleSelectAllStudents}
                >
                  {selectedStudentIds.length === filteredStudents.length 
                    ? 'Unselect All' 
                    : 'Select All'}
                </button>
              </div>
              
              <div className="mt-2 sm:mt-0 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 border rounded w-full sm:w-64"
                />
              </div>
            </div>
            
            <div className="border rounded">
              <table className="min-w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="py-2 px-4 border-b text-left w-12">Select</th>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Username</th>
                    <th className="py-2 px-4 border-b text-left">Current Class</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Display only current page of students */}
                  {filteredStudents
                    .slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage)
                    .map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">
                          <input 
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleStudentSelection(student.id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="py-2 px-4 border-b">{getStudentName(student)}</td>
                        <td className="py-2 px-4 border-b">{student.username}</td>
                        <td className="py-2 px-4 border-b">{getClassDisplay(student.school_class)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              
              {/* Pagination controls */}
              {filteredStudents.length > studentsPerPage && (
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{Math.min(filteredStudents.length, (currentPage - 1) * studentsPerPage + 1)}</span>
                      {" - "}
                      <span className="font-medium">{Math.min(filteredStudents.length, currentPage * studentsPerPage)}</span>
                      {" of "}
                      <span className="font-medium">{filteredStudents.length}</span> students
                    </p>
                  </div>
                  <div>
                    <nav className="flex items-center">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`mr-2 px-3 py-1 rounded ${
                          currentPage === 1 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredStudents.length / studentsPerPage), p + 1))}
                        disabled={currentPage >= Math.ceil(filteredStudents.length / studentsPerPage)}
                        className={`px-3 py-1 rounded ${
                          currentPage >= Math.ceil(filteredStudents.length / studentsPerPage)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
        {/* Selection summary and action button */}
      <div className="border-t pt-4 mt-6">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4">
          <div className="mb-4 md:mb-0">
            {selectedStudentIds.length > 0 && targetClassId ? (
              <div className="bg-blue-50 p-3 rounded">
                <p>
                  <span className="font-semibold">{selectedStudentIds.length}</span> student(s) selected to move to{' '}
                  <span className="font-semibold">
                    {classes.find(c => c.id === parseInt(targetClassId, 10))?.name}{' '}
                    ({grades.find(g => g.id === parseInt(targetGradeId, 10))?.name})
                  </span>
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                {!selectedStudentIds.length ? 'No students selected' : 'Please select a target class'}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={handlePromoteOrDemote}
              disabled={loading || !targetClassId || selectedStudentIds.length === 0}
              className={`px-6 py-2 rounded font-medium ${
                loading || !targetClassId || selectedStudentIds.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Move Selected Students'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPromotionPage;
