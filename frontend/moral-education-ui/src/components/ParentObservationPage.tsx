import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select, // Reverted: Keep Select as is, NativeSelect is not needed here as per original file structure and to avoid cascading import errors
  Textarea,
  Stack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  getParentObservations,
  createParentObservation,
  reviewParentObservation,
  getUsers,
  getRuleSubItems,
  ParentObservation,
  User,
  RuleSubItem,
} from '../services/apiService';

interface ParentObservationPageProps {
  currentUser: User;
}

const ParentObservationPage: React.FC<ParentObservationPageProps> = ({ currentUser }) => {
  const [observations, setObservations] = useState<ParentObservation[]>([]);
  const [children, setChildren] = useState<User[]>([]);
  const [ruleSubItems, setRuleSubItems] = useState<RuleSubItem[]>([]);
  const [formData, setFormData] = useState<Partial<ParentObservation>>({
    student: 0,
    rule_sub_item: null,
    description: '',
    date_of_behavior: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch observations and related data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get parent's children from the current user data
        if (currentUser?.children) {
          setChildren(currentUser.children.map(child => ({
            id: child.id,
            username: child.username,
            full_name: child.full_name,
            role: 'student'
          } as User)));
        } else {
          // Fallback to fetching students if needed
          const studentsData = await getUsers({ role: 'student' });
          setChildren(studentsData);
        }

        // Fetch rule sub-items for the dropdown
        const rulesData = await getRuleSubItems();
        setRuleSubItems(rulesData);

        // Fetch parent observations
        const observationsData = await getParentObservations();
        setObservations(observationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser, toast]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value === '' ? null : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.student) {
      setFormError('Please select a student');
      return;
    }

    if (!formData.description) {
      setFormError('Please provide a description of the observation');
      return;
    }

    setIsLoading(true);
    try {
      const newObservation = await createParentObservation({
        ...formData,
        student: Number(formData.student),
        rule_sub_item: formData.rule_sub_item ? Number(formData.rule_sub_item) : null,
      });

      toast({
        title: 'Observation submitted',
        description: 'Your observation has been submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form and update observations list
      setFormData({
        student: 0,
        rule_sub_item: null,
        description: '',
        date_of_behavior: new Date().toISOString().split('T')[0],
      });
      
      setObservations([newObservation, ...observations]);
      onClose();
    } catch (error) {
      console.error('Error submitting observation:', error);
      setFormError('Failed to submit observation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // For teachers/admins to review observations
  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const updatedObservation = await reviewParentObservation(id, status);
      
      // Update the list with the reviewed observation
      setObservations(observations.map(obs => 
        obs.id === id ? updatedObservation : obs
      ));
      
      toast({
        title: `Observation ${status}`,
        status: status === 'approved' ? 'success' : 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error(`Error ${status} observation:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${status} the observation`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Group observations by student for easier viewing
  const groupedObservations: { [studentId: string]: ParentObservation[] } = {};
  observations.forEach(obs => {
    const studentId = String(obs.student);
    if (!groupedObservations[studentId]) {
      groupedObservations[studentId] = [];
    }
    groupedObservations[studentId].push(obs);
  });

  return (
    <Box p={4}>
      <Heading mb={6}>Parent Observations</Heading>

      {/* New observation button */}
      <Button
        colorScheme="blue"
        mb={6}
        onClick={onOpen}
      >
        Submit New Observation
      </Button>

      {/* Observations list */}
      {Object.entries(groupedObservations).length > 0 ? (
        Object.entries(groupedObservations).map(([studentId, studentObservations]) => {
          const studentName = studentObservations[0].student_name || 
            children.find(c => c.id === Number(studentId))?.full_name || 
            `Student ${studentId}`;
          
          return (
            <Card key={studentId} mb={6}>
              <CardHeader bg="blue.50" pb={3}>
                <Heading size="md">{studentName}'s Observations</Heading>
              </CardHeader>
              <CardBody p={0}>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Rule</Th>
                      <Th>Description</Th>
                      <Th>Status</Th>
                      {(currentUser.role === 'class_teacher' ||
                        currentUser.role === 'teaching_teacher' ||
                        currentUser.role === 'moral_education_supervisor' ||
                        currentUser.role === 'principal' ||
                        currentUser.role === 'director' ||
                        currentUser.role === 'system_administrator') && (
                        <Th>Actions</Th>
                      )}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {studentObservations.map((obs) => (
                      <Tr key={obs.id}>
                        <Td>{new Date(obs.date_of_behavior).toLocaleDateString()}</Td>
                        <Td>{obs.rule_name || 'General'}</Td>
                        <Td>{obs.description}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              obs.status === 'approved' ? 'green' :
                              obs.status === 'rejected' ? 'red' : 'yellow'
                            }
                          >
                            {obs.status_display}
                          </Badge>
                        </Td>
                        {(currentUser.role === 'class_teacher' ||
                          currentUser.role === 'teaching_teacher' ||
                          currentUser.role === 'moral_education_supervisor' ||
                          currentUser.role === 'principal' ||
                          currentUser.role === 'director' ||
                          currentUser.role === 'system_administrator') && (
                          <Td>
                            {obs.status === 'pending' && (
                              <Stack direction="row" spacing={2}>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => handleReview(obs.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => handleReview(obs.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            )}
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          );
        })
      ) : (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>No Observations Yet</AlertTitle>
            <AlertDescription>
              You haven't submitted any observations for your children yet.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* New Observation Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit New Observation</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit}>
              {formError && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {formError}
                  <CloseButton
                    position="absolute"
                    right="8px"
                    top="8px"
                    onClick={() => setFormError('')}
                  />
                </Alert>
              )}

              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Student</FormLabel>
                  {/* Reverted: Using original Select component */}
                  <Select
                    name="student"
                    value={formData.student || ''}
                    onChange={handleInputChange}
                    placeholder="Select student"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name || child.username}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Specific Rule (Optional)</FormLabel>
                  {/* Reverted: Using original Select component */}
                  <Select
                    name="rule_sub_item"
                    value={formData.rule_sub_item || ''}
                    onChange={handleInputChange}
                    placeholder="Select a specific rule (optional)"
                  >
                    <option value="">General Observation</option>
                    {ruleSubItems.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date of Behavior</FormLabel>
                  <Input
                    name="date_of_behavior"
                    type="date"
                    value={formData.date_of_behavior || ''}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Describe what you observed..."
                    rows={5}
                  />
                </FormControl>

                <Stack direction="row" spacing={4} justifyContent="flex-end">
                  <Button onClick={onClose}>Cancel</Button>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                  >
                    Submit
                  </Button>
                </Stack>
              </Stack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ParentObservationPage;
