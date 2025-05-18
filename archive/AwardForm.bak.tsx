"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Input,
  NumberInput,
  Select,
  Stack,
  Textarea
} from '@chakra-ui/react';
import { getUsers, createAward, updateAward } from '../services/apiService';
import type { Award, User } from '../services/apiService';
import { toaster } from './ui/toaster';

interface AwardFormProps {
  initialAward?: Partial<Award>;
  onSave: () => void;
  onCancel: () => void;
}

const AwardForm: React.FC<AwardFormProps> = ({ initialAward, onSave, onCancel }) => {  const [award, setAward] = useState<Partial<Award>>({
    name: '',
    description: '',
    award_type: 'star',
    level: 1,
    student: 0,
    award_date: new Date().toISOString().split('T')[0],
    ...initialAward
  });
  const [students, setStudents] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(initialAward?.id);
  
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const users = await getUsers();
        const studentUsers = users.filter(user => user.role === 'student');
        setStudents(studentUsers);
      } catch (error) {
        console.error('Failed to load students:', error);
        toaster.error({
          title: 'Failed to load students',
          duration: 3000,
        });
      }
    };
    
    loadStudents();  }, []);
  
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
  
  const handleLevelChange = (valueAsNumber: number) => {
    setAward(prev => ({ ...prev, level: valueAsNumber }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toaster.error({
        title: 'Validation error',
        description: 'Please fix the form errors',
        duration: 3000,
      });
      return;
    }
    
    try {
      if (isEditing && initialAward?.id) {
        await updateAward(initialAward.id, award);
        toaster.success({
          title: 'Award updated',
          duration: 3000,
        });
      } else {
        await createAward(award);
        toaster.success({
          title: 'Award created',
          duration: 3000,
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving award:', error);
      toaster.error({
        title: 'Error saving award',
        duration: 3000,
      });
    }  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <Heading size="md" mb={4}>
        {isEditing ? 'Edit Award' : 'Create New Award'}
      </Heading>
      
      <Stack gap={4}>        <FormControl.Root isRequired isInvalid={!!errors.student}>
          <FormControl.Label>Student</FormControl.Label>          <Select.Root
            value={award.student ? [award.student.toString()] : []}
            onValueChange={(details) => {
              const numValue = details.value.length > 0 ? parseInt(details.value[0]) : 0;
              setAward(prev => ({ ...prev, student: numValue }));
            }}
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Select Student" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                <Select.ItemGroup>                  {students.map(student => (
                    <Select.Item key={student.id} item={student.id.toString()}>
                      {student.first_name} {student.last_name}
                    </Select.Item>
                  ))}
                </Select.ItemGroup>
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <FormControl.ErrorMessage>{errors.student}</FormControl.ErrorMessage>
        </FormControl.Root>
          <FormControl.Root isRequired isInvalid={!!errors.award_type}>
          <FormControl.Label>Award Type</FormControl.Label>          <Select.Root
            value={[award.award_type || 'star']}
            onValueChange={(details) => {
              setAward(prev => ({ ...prev, award_type: details.value[0] as "star" | "badge" | "certificate" | "other" }));
            }}
          >
            <Select.Trigger>
              <Select.ValueText />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                <Select.ItemGroup>                  <Select.Item item="star">Star Rating</Select.Item>
                  <Select.Item item="badge">Badge</Select.Item>
                  <Select.Item item="certificate">Certificate</Select.Item>
                  <Select.Item item="other">Other</Select.Item>
                </Select.ItemGroup>
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <FormControl.ErrorMessage>{errors.award_type}</FormControl.ErrorMessage>
        </FormControl.Root>
          <FormControl.Root isRequired isInvalid={!!errors.name}>
          <FormControl.Label>Award Name</FormControl.Label>          <Input 
            name="name"
            value={award.name || ''}
            onChange={handleChange}
          />
          <FormControl.ErrorMessage>{errors.name}</FormControl.ErrorMessage>
        </FormControl.Root>
          <FormControl.Root isInvalid={!!errors.description}>
          <FormControl.Label>Description</FormControl.Label>          <Textarea 
            name="description"
            value={award.description || ''}
            onChange={handleChange}
            placeholder="Brief description of the award"
          />
          <FormControl.ErrorMessage>{errors.description}</FormControl.ErrorMessage>
        </FormControl.Root>
        
        <FormControl.Root isRequired isInvalid={!!errors.level}>
          <FormControl.Label>
            {award.award_type === 'star' ? 'Star Level (1-5)' : 'Achievement Level'}
          </FormControl.Label>          <NumberInput.Root
            value={award.level?.toString() || '1'}
            min={1} 
            max={award.award_type === 'star' ? 5 : undefined}
            onValueChange={({valueAsNumber}) => handleLevelChange(valueAsNumber)}
          >
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          <FormControl.ErrorMessage>{errors.level}</FormControl.ErrorMessage>
        </FormControl.Root>
          <FormControl.Root isRequired isInvalid={!!errors.award_date}>
          <FormControl.Label>Award Date</FormControl.Label>          <Input 
            name="award_date"
            type="date"
            value={award.award_date || ''}
            onChange={handleChange}
          />
          <FormControl.ErrorMessage>{errors.award_date}</FormControl.ErrorMessage>
        </FormControl.Root>
          <Stack direction="row" gap={4} mt={4}>          <Button type="submit" colorScheme="blue">
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
