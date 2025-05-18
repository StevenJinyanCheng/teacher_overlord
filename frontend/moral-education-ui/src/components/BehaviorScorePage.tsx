import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import {
  getBehaviorScores,
  getBehaviorScoreSummary,
  exportBehaviorScores,
  deleteBehaviorScore,
  User,
  BehaviorScore,
  SchoolClass,
  RuleSubItem,
  ScoreSummary,
  getUsers,
  getSchoolClasses,
  getRuleSubItems
} from '../services/apiService';
import BehaviorScoreForm from './BehaviorScoreForm';

const BehaviorScorePage: React.FC = () => {
  const [scores, setScores] = useState<BehaviorScore[]>([]);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [ruleSubItems, setRuleSubItems] = useState<RuleSubItem[]>([]);
  const [selectedScore, setSelectedScore] = useState<BehaviorScore | null>(null);
  const [filters, setFilters] = useState({
    student: '',
    class: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { isOpen: isFormOpen, onOpen: openForm, onClose: closeForm } = useDisclosure();
  const toast = useToast();

  // Delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState<BehaviorScore | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Fetch scores with optional filters
  const fetchScores = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      
      if (filters.student) {
        params.student = filters.student;
      }
      
      if (filters.class) {
        params.school_class = filters.class;
      }
      
      if (filters.startDate) {
        params.start_date = filters.startDate;
      }
      
      if (filters.endDate) {
        params.end_date = filters.endDate;
      }
      
      const data = await getBehaviorScores(params);
      setScores(data);

      // Also fetch summary statistics with the same filters
      const summaryData = await getBehaviorScoreSummary(params);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch behavior scores',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch users who are students
        const userData = await getUsers({ role: 'student' });
        setStudents(userData);

        // Fetch school classes
        const classData = await getSchoolClasses();
        setSchoolClasses(classData);

        // Fetch rule sub-items
        const ruleData = await getRuleSubItems();
        setRuleSubItems(ruleData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch required data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    fetchScores();
  }, [fetchScores, toast]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchScores();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      student: '',
      class: '',
      startDate: '',
      endDate: '',
    });
    // Fetch scores without filters
    fetchScores();
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params: any = {};
      
      if (filters.student) {
        params.student = filters.student;
      }
      
      if (filters.class) {
        params.school_class = filters.class;
      }
      
      if (filters.startDate) {
        params.start_date = filters.startDate;
      }
      
      if (filters.endDate) {
        params.end_date = filters.endDate;
      }
      
      const blob = await exportBehaviorScores(params);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `behavior_scores_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: 'Behavior scores have been exported',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting scores:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export behavior scores',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle edit
  const handleEdit = (score: BehaviorScore) => {
    setSelectedScore(score);
    openForm();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (score: BehaviorScore) => {
    setScoreToDelete(score);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!scoreToDelete) return;
    
    try {
      await deleteBehaviorScore(scoreToDelete.id);
      
      toast({
        title: 'Behavior score deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh scores
      fetchScores();
    } catch (error) {
      console.error('Error deleting score:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete behavior score',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setScoreToDelete(null);
    }
  };

  // Form success handler
  const handleFormSuccess = () => {
    closeForm();
    fetchScores();
    setSelectedScore(null);
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Student Behavior Scoring</Heading>

      {/* Summary Section */}
      {summary && (
        <Box mb={6} p={4} borderWidth={1} borderRadius="md" bg="blue.50">
          <Heading size="md" mb={3}>Summary Statistics</Heading>
          <Flex flexWrap="wrap" gap={4}>
            <Box p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Positive Points</Text>
              <Text fontSize="xl" fontWeight="bold" color="green.500">
                {summary.total_positive_points}
              </Text>
            </Box>
            <Box p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Negative Points</Text>
              <Text fontSize="xl" fontWeight="bold" color="red.500">
                {summary.total_negative_points}
              </Text>
            </Box>
            <Box p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Net Score</Text>
              <Text fontSize="xl" fontWeight="bold" color={summary.net_score >= 0 ? "blue.500" : "orange.500"}>
                {summary.net_score}
              </Text>
            </Box>
            <Box p={3} bg="white" borderRadius="md" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Total Records</Text>
              <Text fontSize="xl" fontWeight="bold">
                {summary.total_records}
              </Text>
            </Box>
          </Flex>

          {/* Dimension scores */}
          {Object.keys(summary.dimension_scores).length > 0 && (
            <Box mt={4}>
              <Text fontWeight="semibold" mb={2}>Scores by Dimension</Text>
              <Flex flexWrap="wrap" gap={2}>
                {Object.entries(summary.dimension_scores).map(([dimension, score]) => (
                  <Badge 
                    key={dimension} 
                    px={2} 
                    py={1} 
                    borderRadius="full" 
                    colorScheme={score >= 0 ? "green" : "red"}
                  >
                    {dimension}: {score}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {/* Filters */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="md">
        <Heading size="sm" mb={4}>Filters</Heading>
        <Stack spacing={4} direction={["column", "column", "row"]}>
          <FormControl>
            <FormLabel fontSize="sm">Student</FormLabel>
            <Select
              name="student"
              value={filters.student}
              onChange={handleFilterChange}
              placeholder="All students"
              size="sm"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name || student.username}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Class</FormLabel>
            <Select
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
              placeholder="All classes"
              size="sm"
            >
              {schoolClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade_name})
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">Start Date</FormLabel>
            <Input
              name="startDate"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange}
              size="sm"
            />
          </FormControl>
          
          <FormControl>
            <FormLabel fontSize="sm">End Date</FormLabel>
            <Input
              name="endDate"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange}
              size="sm"
            />
          </FormControl>
        </Stack>
        
        <Flex mt={4} gap={2} justify="flex-end">
          <Button size="sm" onClick={resetFilters} variant="outline">
            Reset
          </Button>
          <Button size="sm" colorScheme="blue" onClick={applyFilters}>
            Apply Filters
          </Button>
        </Flex>
      </Box>

      {/* Action Buttons */}      <Flex mb={4} justify="space-between">
        <Button colorScheme="blue" onClick={openForm}>Record New Score</Button>
        <Button 
          onClick={handleExport} 
          colorScheme="teal"
        >
          <FaDownload style={{ marginRight: '0.5rem' }} /> Export to CSV
        </Button>
      </Flex>

      {/* Scores Table */}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Student</Th>
              <Th>Date</Th>
              <Th>Rule</Th>
              <Th>Type</Th>
              <Th>Points</Th>
              <Th>Class</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scores.length > 0 ? (
              scores.map((score) => (
                <Tr key={score.id}>
                  <Td>{score.student_name}</Td>
                  <Td>{new Date(score.date_of_behavior).toLocaleDateString()}</Td>
                  <Td>
                    <Text fontSize="sm">
                      {score.rule_name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {score.dimension_name}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={score.score_type === 'positive' ? 'green' : 'red'}>
                      {score.score_type_display}
                    </Badge>
                  </Td>
                  <Td>{score.points}</Td>
                  <Td>{score.school_class_name}</Td>                  <Td>
                    <IconButton
                      aria-label="Edit score"
                      size="sm"
                      mr={2}
                      onClick={() => handleEdit(score)}
                    >
                      <FaEdit />
                    </IconButton>
                    <IconButton
                      aria-label="Delete score"
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteConfirm(score)}
                    >
                      <FaTrash />
                    </IconButton>
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={4}>
                  {isLoading ? 'Loading scores...' : 'No behavior scores found'}
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>{selectedScore ? 'Edit Behavior Score' : 'Record New Behavior Score'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <BehaviorScoreForm
              initialData={selectedScore || undefined}
              students={students}
              ruleSubItems={ruleSubItems}
              schoolClasses={schoolClasses}
              onSuccess={handleFormSuccess}
              onCancel={closeForm}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Behavior Score
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this behavior score? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default BehaviorScorePage;
