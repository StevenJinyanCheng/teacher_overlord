"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box,
  Button, 
  Heading,
  Stack,
  Input,
  Select,
  Textarea,
  NumberInput,
  Field,
  createListCollection // Added import
} from '@chakra-ui/react';
import { getUsers, createAward, updateAward } from '../services/apiService';
import type { Award, User } from '../services/apiService';
import { toaster } from './ui/toaster'; // Corrected import path

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
    student: 0, // Assuming 0 or undefined means no student selected
    award_date: new Date().toISOString().split('T')[0],
    ...initialAward
  });
  
  const [students, setStudents] = useState<User[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(initialAward?.id);

  // Create collections for Select components
  const studentCollection = createListCollection({
    items: students.map(student => ({
      value: String(student.id),
      label: `${student.first_name} ${student.last_name}`
    }))
  });

  const awardTypeCollection = createListCollection({
    items: [
      { value: "star", label: "Star Rating" },
      { value: "badge", label: "Badge" },
      { value: "certificate", label: "Certificate" },
      { value: "other", label: "Other" },
    ]
  });
  
  useEffect(() => {
    const loadStudents = async () => {
      try {
        // Assuming getUsers now takes no arguments based on TS error
        const users = await getUsers(); 
        setStudents(users);
      } catch (error) {
        console.error('Failed to load students:', error);
        toaster.create({ // Updated toast usage
          title: 'Failed to load students',
          type: 'error',
          duration: 3000,
        });
      }
    };
    
    loadStudents();
  }, []); // Removed toast from dependencies as it's a stable import
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!award.name?.trim()) {
      newErrors.name = 'Award name is required';
    }
    
    if (!award.student || award.student === 0) { // Check for 0 as well
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAward(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldName: keyof Award, details: { value: string[] }) => {
    setAward(prev => ({ ...prev, [fieldName]: details.value[0] || (fieldName === 'student' ? 0 : '') }));
  };
  
  const handleLevelChange = (_valueAsString: string, valueAsNumber: number) => { // valueAsString marked as unused
    setAward(prev => ({ ...prev, level: valueAsNumber }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toaster.create({ // Updated toast usage
        title: 'Validation error',
        description: 'Please fix the form errors',
        type: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      const payload = {
        ...award,
        student: Number(award.student) || undefined, // Ensure student is number or undefined
        level: Number(award.level)
      };

      if (isEditing && initialAward?.id) {
        await updateAward(initialAward.id, payload as Award); // Cast to Award, ensure all fields are present
        toaster.create({ // Updated toast usage
          title: 'Award updated',
          type: 'success',
          duration: 3000,
        });
      } else {
        await createAward(payload as Omit<Award, 'id'>); // Cast, ensure all required fields for creation
        toaster.create({ // Updated toast usage
          title: 'Award created',
          type: 'success',
          duration: 3000,
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving award:', error);
      toaster.create({ // Updated toast usage
        title: 'Error saving award',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} p={4}>
      <Heading size="md" mb={4}>
        {isEditing ? 'Edit Award' : 'Create New Award'}
      </Heading>
      
      <Stack gap={4}> {/* Changed spacing to gap */}
        <Field.Root invalid={!!errors.student} required> {/* Changed isInvalid to invalid, isRequired to required */}
          <Field.Label>Student</Field.Label>
          <Select.Root
            collection={studentCollection} // Use studentCollection
            value={award.student ? [String(award.student)] : []}
            onValueChange={(details) => handleSelectChange('student', details)}
            positioning={{ sameWidth: true }}
          >
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select Student" />
                <Select.Indicator />
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {studentCollection.items.map(item => ( // Iterate over collection items
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <Field.ErrorText>{errors.student}</Field.ErrorText>
        </Field.Root>
        
        <Field.Root invalid={!!errors.award_type} required> {/* Changed isInvalid to invalid, isRequired to required */}
          <Field.Label>Award Type</Field.Label>
          <Select.Root
            collection={awardTypeCollection} // Use awardTypeCollection
            value={award.award_type ? [award.award_type] : []}
            onValueChange={(details) => handleSelectChange('award_type', details)}
            positioning={{ sameWidth: true }}
          >
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select Award Type" />
                <Select.Indicator />
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {awardTypeCollection.items.map(item => ( // Iterate over collection items
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <Field.ErrorText>{errors.award_type}</Field.ErrorText>
        </Field.Root>
        
        <Field.Root invalid={!!errors.name} required> {/* Changed isInvalid to invalid, isRequired to required */}
          <Field.Label>Award Name</Field.Label>
          <Input 
            name="name"
            value={award.name || ''}
            onChange={handleInputChange}
            _invalid={errors.name ? { borderColor: 'red.500' } : {}}
          />
          <Field.ErrorText>{errors.name}</Field.ErrorText>
        </Field.Root>
        
        <Field.Root invalid={!!errors.description}> {/* Changed isInvalid to invalid */}
          <Field.Label>Description</Field.Label>
          <Textarea 
            name="description"
            value={award.description || ''}
            onChange={handleInputChange}
            placeholder="Brief description of the award"
            _invalid={errors.description ? { borderColor: 'red.500' } : {}}
          />
          <Field.ErrorText>{errors.description}</Field.ErrorText>
        </Field.Root>
        
        <Field.Root invalid={!!errors.level} required> {/* Changed isInvalid to invalid, isRequired to required */}
          <Field.Label>
            {award.award_type === 'star' ? 'Star Level (1-5)' : 'Achievement Level'}
          </Field.Label>
          <NumberInput.Root 
            value={String(award.level || 1)} 
            min={1} 
            max={award.award_type === 'star' ? 5 : undefined} // Max can be undefined for non-star
            onValueChange={(details) => handleLevelChange(details.value, details.valueAsNumber)}
            clampValueOnBlur={false} // Allow values outside min/max temporarily, validation handles it
          >
            <NumberInput.Input _invalid={errors.level ? { borderColor: 'red.500' } : {}} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
          <Field.ErrorText>{errors.level}</Field.ErrorText>
        </Field.Root>
        
        <Field.Root invalid={!!errors.award_date} required> {/* Changed isInvalid to invalid, isRequired to required */}
          <Field.Label>Award Date</Field.Label>
          <Input 
            name="award_date"
            type="date"
            value={award.award_date || ''}
            onChange={handleInputChange}
            _invalid={errors.award_date ? { borderColor: 'red.500' } : {}}
          />
          <Field.ErrorText>{errors.award_date}</Field.ErrorText>
        </Field.Root>
        
        <Stack direction="row" gap={4} mt={4}> {/* Changed spacing to gap */}
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
