import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Textarea,
  Stack,
  Heading,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { Award, getUsers, createAward, updateAward, CustomUser } from '../services/apiService';

interface AwardFormProps {
  initialAward?: Partial<Award>;
  onSave: () => void;
  onCancel: () => void;
}

const AwardForm: React.FC<AwardFormProps> = ({ initialAward, onSave, onCancel }) => {
  const [award, setAward] = useState<Partial<Award>>({
    name: '',
    description: '',
    award_type: 'star',
    level: 1,
    student: 0,
    award_date: new Date().toISOString().split('T')[0],
    ...initialAward
  });
  
  const [students, setStudents] = useState<CustomUser[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const isEditing = Boolean(initialAward?.id);
  
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const users = await getUsers({ role: 'student' });
        setStudents(users);
      } catch (error) {
        console.error('Failed to load students:', error);
        toast({
          title: 'Failed to load students',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };
    
    loadStudents();
  }, [toast]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!award.name?.trim()) {
      newErrors.name = 'Award name is required';
    }
    
    if (!award.student) {
      newErrors.student = 'Student must be selected';
    }
    
    if (!award.award_date) {
      newErrors.award_date = 'Award date is required';
    }
    
    if (award.level === undefined || award.level < 1 || (award.award_type === 'star' && award.level > 5)) {
      newErrors.level = award.award_type === 'star'
        ? 'Star awards must be level 1-5'
        : 'Level must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAward(prev => ({ ...prev, [name]: value }));
  };
  
  const handleLevelChange = (valueAsString: string, valueAsNumber: number) => {
    setAward(prev => ({ ...prev, level: valueAsNumber }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation error',
        description: 'Please fix the form errors',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    try {
      if (isEditing && initialAward?.id) {
        await updateAward(initialAward.id, award);
        toast({
          title: 'Award updated',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        await createAward(award);
        toast({
          title: 'Award created',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving award:', error);
      toast({
        title: 'Error saving award',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <Heading size="md" mb={4}>
        {isEditing ? 'Edit Award' : 'Create New Award'}
      </Heading>
      
      <Stack spacing={4}>
        <FormControl isRequired isInvalid={!!errors.student}>
          <FormLabel>Student</FormLabel>
          <Select 
            name="student"
            value={award.student || ''}
            onChange={handleChange}
          >
            <option value="">Select Student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.student}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.award_type}>
          <FormLabel>Award Type</FormLabel>
          <Select 
            name="award_type"
            value={award.award_type || 'star'}
            onChange={handleChange}
          >
            <option value="star">Star Rating</option>
            <option value="badge">Badge</option>
            <option value="certificate">Certificate</option>
            <option value="other">Other</option>
          </Select>
          <FormErrorMessage>{errors.award_type}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.name}>
          <FormLabel>Award Name</FormLabel>
          <Input 
            name="name"
            value={award.name || ''}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
        
        <FormControl isInvalid={!!errors.description}>
          <FormLabel>Description</FormLabel>
          <Textarea 
            name="description"
            value={award.description || ''}
            onChange={handleChange}
            placeholder="Brief description of the award"
          />
          <FormErrorMessage>{errors.description}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.level}>
          <FormLabel>
            {award.award_type === 'star' ? 'Star Level (1-5)' : 'Achievement Level'}
          </FormLabel>
          <NumberInput 
            value={award.level || 1} 
            min={1} 
            max={award.award_type === 'star' ? 5 : undefined}
            onChange={handleLevelChange}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.level}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.award_date}>
          <FormLabel>Award Date</FormLabel>
          <Input 
            name="award_date"
            type="date"
            value={award.award_date || ''}
            onChange={handleChange}
          />
          <FormErrorMessage>{errors.award_date}</FormErrorMessage>
        </FormControl>
        
        <Stack direction="row" spacing={4} mt={4}>
          <Button type="submit" colorScheme="blue">
            {isEditing ? 'Update Award' : 'Create Award'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AwardForm;
