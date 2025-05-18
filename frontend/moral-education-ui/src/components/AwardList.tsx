import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Badge,
  IconButton,
  Text,
  HStack,
  Select,
  Input,
  useDisclosure,
  Dialog, // CHANGED to Dialog
  createListCollection,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import type { Award, User } from '../services/apiService';
import { deleteAward, getUsers } from '../services/apiService';
import { toaster } from './ui/toaster';

interface AwardListProps {
  onEdit: (award: Award) => void;
  onRefresh: () => void;
  awards: Award[];
  isLoading: boolean;
}

interface SelectItem { 
  id: string;
  label: string;
}

const AwardList: React.FC<AwardListProps> = ({ onEdit, onRefresh, awards, isLoading }) => {
  const [filters, setFilters] = useState({
    studentId: '',
    awardType: '',
    startDate: '',
    endDate: ''
  });
  const [studentsMap, setStudentsMap] = useState<Record<number, string>>({});
  const [studentItems, setStudentItems] = useState<SelectItem[]>([{ id: '', label: 'All Students' }]);
  const [awardToDelete, setAwardToDelete] = useState<Award | null>(null);
  // useDisclosure returns `open` for Dialog
  const { open: isDeleteDialogOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure(); 
  const cancelRef = useRef<HTMLButtonElement>(null); // Still useful for Dialog.CloseTrigger focus

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const allUsers = await getUsers();
        const studentUsers = allUsers.filter((user: User) => user.role === 'student');
        const map: Record<number, string> = {};
        const itemsForSelect: SelectItem[] = [{ id: '', label: 'All Students' }];
        studentUsers.forEach(user => {
          const userName = `${user.first_name} ${user.last_name}`.trim();
          map[user.id] = userName;
          itemsForSelect.push({ id: user.id.toString(), label: userName });
        });
        setStudentsMap(map);
        setStudentItems(itemsForSelect);
      } catch (error) {
        console.error('Failed to load students:', error);
        toaster.error({ title: 'Error loading students' }); 
      }
    };
    
    loadStudents();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectFilterChange = (name: string, value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };
  
  const awardTypeItems: SelectItem[] = [
    { id: '', label: 'All Types' },
    { id: 'star', label: 'Star Ratings' },
    { id: 'badge', label: 'Badges' },
    { id: 'certificate', label: 'Certificates' },
    { id: 'other', label: 'Other' }
  ];

  const studentCollection = createListCollection({ items: studentItems }); 
  const awardTypeCollection = createListCollection({ items: awardTypeItems });

  const confirmDelete = (award: Award) => {
    setAwardToDelete(award);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!awardToDelete) return;
    
    try {
      await deleteAward(awardToDelete.id);
      toaster.success({ title: 'Award deleted' }); 
      onRefresh();
    } catch (error) {
      console.error('Error deleting award:', error);
      toaster.error({ title: 'Error deleting award' }); 
    } finally {
      onDeleteClose();
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
        <Box maxW={{ base: '100%', md: '200px' }}>
          <Text as="label" fontSize="sm">Student</Text> 
          <Select.Root
            id="studentIdFilter"
            collection={studentCollection}
            value={filters.studentId ? [filters.studentId] : ['']}
            onValueChange={(details) => {
              handleSelectFilterChange('studentId', details.value.length > 0 ? details.value[0] : null);
            }}
          >
            <Select.Trigger>
              <Select.ValueText placeholder="All Students" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                {studentCollection.items.map((item: SelectItem) => (
                  <Select.Item key={item.id} item={item}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>
        
        <Box maxW={{ base: '100%', md: '200px' }}>
          <Text as="label" fontSize="sm">Award Type</Text> 
          <Select.Root
            id="awardTypeFilter"
            collection={awardTypeCollection}
            value={filters.awardType ? [filters.awardType] : ['']}
            onValueChange={(details) => {
              handleSelectFilterChange('awardType', details.value.length > 0 ? details.value[0] : null);
            }}
          >
            <Select.Trigger>
              <Select.ValueText placeholder="All Types" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                {awardTypeCollection.items.map((item: SelectItem) => (
                  <Select.Item key={item.id} item={item}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>
        
        <Box maxW={{ base: '100%', md: '200px' }}>
          <Text as="label" fontSize="sm">From Date</Text> 
          <Input 
            id="startDate"
            name="startDate"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange}
            size="sm"
          />
        </Box>
        
        <Box maxW={{ base: '100%', md: '200px' }}>
          <Text as="label" fontSize="sm">To Date</Text> 
          <Input 
            id="endDate"
            name="endDate"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange}
            size="sm"
          />
        </Box>
      </Flex>
      
      {/* Awards Table */}
      {isLoading ? (
        <Text>Loading awards...</Text>
      ) : filteredAwards.length === 0 ? (
        <Text>No awards found.</Text>
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="line" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Student</Table.ColumnHeader>
                <Table.ColumnHeader>Award</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Level</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Awarder</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredAwards.map(award => (
                <Table.Row key={award.id}>
                  <Table.Cell>{award.student_name || studentsMap[award.student] || "Unknown"}</Table.Cell>
                  <Table.Cell>{award.name}</Table.Cell>
                  <Table.Cell>{getAwardTypeBadge(award.award_type)}</Table.Cell>
                  <Table.Cell>
                    {award.award_type === 'star' ? (
                      <HStack gap={1}>{renderStarRating(award.level)}</HStack>
                    ) : (
                      award.level
                    )}
                  </Table.Cell>
                  <Table.Cell>{new Date(award.award_date).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>{award.awarder_name || "System"}</Table.Cell>
                  <Table.Cell>
                    <HStack>
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
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
      
      {/* Delete Confirmation Dialog - Changed to Dialog */}
      <Dialog.Root 
        open={isDeleteDialogOpen}
        onOpenChange={(details) => { if (!details.open) onDeleteClose(); }} // Correct prop for open state changes
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              Delete Award
            </Dialog.Header>
            <Dialog.Body>
              Are you sure you want to delete this award?
              {awardToDelete && (
                <Text mt={2} fontWeight="bold">
                  {awardToDelete.name} - {studentsMap[awardToDelete.student] || awardToDelete.student_name || 'Unknown Student'}
                </Text>
              )}
              This action cannot be undone.
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button ref={cancelRef} variant="outline">Cancel</Button>
              </Dialog.CloseTrigger>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>Delete</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default AwardList;
