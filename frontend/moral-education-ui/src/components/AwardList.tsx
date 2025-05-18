import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Text,
  HStack,
  Select,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import type { Award } from '../services/apiService';
import { deleteAward, getUsers } from '../services/apiService';

interface AwardListProps {
  onEdit: (award: Award) => void;
  onRefresh: () => void;
  awards: Award[];
  isLoading: boolean;
}

const AwardList: React.FC<AwardListProps> = ({ onEdit, onRefresh, awards, isLoading }) => {
  const [filters, setFilters] = useState({
    studentId: '',
    awardType: '',
    startDate: '',
    endDate: ''
  });
  const [studentsMap, setStudentsMap] = useState<Record<number, string>>({});
  const [awardToDelete, setAwardToDelete] = useState<Award | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const users = await getUsers({ role: 'student' });
        const map: Record<number, string> = {};
        users.forEach(user => {
          map[user.id] = `${user.first_name} ${user.last_name}`.trim();
        });
        setStudentsMap(map);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    
    loadStudents();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const confirmDelete = (award: Award) => {
    setAwardToDelete(award);
    onOpen();
  };

  const handleDelete = async () => {
    if (!awardToDelete) return;
    
    try {
      await deleteAward(awardToDelete.id);
      toast({
        title: 'Award deleted',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting award:', error);
      toast({
        title: 'Error deleting award',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      onClose();
      setAwardToDelete(null);
    }
  };
  const renderStarRating = (level: number) => {
    return Array(5)
      .fill('')
      .map((_, i) => (
        <FaStar
          key={i}
          color={i < level ? 'goldenrod' : 'lightgray'}
        />
      ));
  };

  const getAwardTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      'star': 'yellow',
      'badge': 'blue',
      'certificate': 'green',
      'other': 'gray'
    };
    
    return (
      <Badge colorScheme={colorMap[type] || 'gray'} borderRadius="full" px="2">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredAwards = awards.filter(award => {
    let match = true;
    
    if (filters.studentId && award.student.toString() !== filters.studentId) {
      match = false;
    }
    
    if (filters.awardType && award.award_type !== filters.awardType) {
      match = false;
    }
    
    if (filters.startDate && award.award_date < filters.startDate) {
      match = false;
    }
    
    if (filters.endDate && award.award_date > filters.endDate) {
      match = false;
    }
    
    return match;
  });

  return (
    <Box>
      <Heading size="md" mb={4}>Awards</Heading>
      
      {/* Filters */}
      <Flex direction={{ base: 'column', md: 'row' }} mb={6} gap={4} wrap="wrap">
        <FormControl maxW={{ base: '100%', md: '200px' }}>
          <FormLabel fontSize="sm">Student</FormLabel>
          <Select 
            name="studentId"
            value={filters.studentId}
            onChange={handleFilterChange}
            size="sm"
          >
            <option value="">All Students</option>
            {Object.entries(studentsMap).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl maxW={{ base: '100%', md: '200px' }}>
          <FormLabel fontSize="sm">Award Type</FormLabel>
          <Select 
            name="awardType"
            value={filters.awardType}
            onChange={handleFilterChange}
            size="sm"
          >
            <option value="">All Types</option>
            <option value="star">Star Ratings</option>
            <option value="badge">Badges</option>
            <option value="certificate">Certificates</option>
            <option value="other">Other</option>
          </Select>
        </FormControl>
        
        <FormControl maxW={{ base: '100%', md: '200px' }}>
          <FormLabel fontSize="sm">From Date</FormLabel>
          <Input 
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="sm"
          />
        </FormControl>
        
        <FormControl maxW={{ base: '100%', md: '200px' }}>
          <FormLabel fontSize="sm">To Date</FormLabel>
          <Input 
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="sm"
          />
        </FormControl>
      </Flex>
      
      {/* Awards Table */}
      {isLoading ? (
        <Text>Loading awards...</Text>
      ) : filteredAwards.length === 0 ? (
        <Text>No awards found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Student</Th>
                <Th>Award</Th>
                <Th>Type</Th>
                <Th>Level</Th>
                <Th>Date</Th>
                <Th>Awarder</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredAwards.map(award => (
                <Tr key={award.id}>
                  <Td>{award.student_name || studentsMap[award.student] || "Unknown"}</Td>
                  <Td>{award.name}</Td>
                  <Td>{getAwardTypeBadge(award.award_type)}</Td>
                  <Td>
                    {award.award_type === 'star' ? (
                      <HStack gap={1}>{renderStarRating(award.level)}</HStack>
                    ) : (
                      award.level
                    )}
                  </Td>
                  <Td>{new Date(award.award_date).toLocaleDateString()}</Td>
                  <Td>{award.awarder_name || "System"}</Td>
                  <Td>                    <HStack>
                      <IconButton
                        aria-label="Edit award"
                        size="sm"
                        onClick={() => onEdit(award)}
                      >
                        <FaEdit />
                      </IconButton>
                      <IconButton
                        aria-label="Delete award"
                        size="sm"
                        colorScheme="red"
                        onClick={() => confirmDelete(award)}
                      >
                        <FaTrash />
                      </IconButton>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Award
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this award?
              {awardToDelete && (
                <Text mt={2} fontWeight="bold">
                  {awardToDelete.name} - {awardToDelete.student_name}
                </Text>
              )}
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
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

export default AwardList;
