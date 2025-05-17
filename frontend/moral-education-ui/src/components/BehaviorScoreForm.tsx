import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
  Heading,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { createBehaviorScore, updateBehaviorScore } from '../services/apiService';
import { BehaviorScore, RuleSubItem, SchoolClass } from '../services/apiService';

interface BehaviorScoreFormProps {
  initialData?: BehaviorScore;
  students: { id: number; username: string; full_name: string }[];
  ruleSubItems: RuleSubItem[];
  schoolClasses: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
}

const BehaviorScoreForm: React.FC<BehaviorScoreFormProps> = ({
  initialData,
  students,
  ruleSubItems,
  schoolClasses,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<BehaviorScore>>({
    student: initialData?.student || 0,
    rule_sub_item: initialData?.rule_sub_item || 0,
    school_class: initialData?.school_class || 0,
    score_type: initialData?.score_type || 'positive',
    points: initialData?.points || 1,
    comment: initialData?.comment || '',
    date_of_behavior: initialData?.date_of_behavior || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleNumberInputChange = (name: string, value: number) => {
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.student) {
      newErrors.student = 'Student is required';
    }
    if (!formData.rule_sub_item) {
      newErrors.rule_sub_item = 'Rule is required';
    }
    if (!formData.school_class) {
      newErrors.school_class = 'Class is required';
    }
    if (!formData.date_of_behavior) {
      newErrors.date_of_behavior = 'Date is required';
    }
    if (formData.points <= 0) {
      newErrors.points = 'Points must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (initialData?.id) {
        await updateBehaviorScore(initialData.id, formData);
        toast({
          title: 'Behavior score updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createBehaviorScore(formData);
        toast({
          title: 'Behavior score recorded',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving behavior score:', error);
      toast({
        title: 'Error',
        description: 'Failed to save behavior score',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group rule subitems by dimensions and chapters for better organization
  const organizedRules: {
    [chapterName: string]: {
      [dimensionName: string]: RuleSubItem[];
    };
  } = {};

  ruleSubItems.forEach((item) => {
    const chapterName = item.dimension_name?.split(' - ')[0] || 'Unknown Chapter';
    const dimensionName = item.dimension_name?.split(' - ')[1] || 'Unknown Dimension';
    
    if (!organizedRules[chapterName]) {
      organizedRules[chapterName] = {};
    }
    
    if (!organizedRules[chapterName][dimensionName]) {
      organizedRules[chapterName][dimensionName] = [];
    }
    
    organizedRules[chapterName][dimensionName].push(item);
  });

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%" maxWidth="800px" mx="auto" p={4}>
      <Heading size="lg" mb={4}>
        {initialData ? 'Edit Behavior Score' : 'Record Behavior Score'}
      </Heading>

      <Stack spacing={4}>
        <FormControl isRequired isInvalid={!!errors.student}>
          <FormLabel>Student</FormLabel>
          <Select
            name="student"
            value={formData.student || ''}
            onChange={handleInputChange}
            placeholder="Select student"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name || student.username}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.student}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.school_class}>
          <FormLabel>Class</FormLabel>
          <Select
            name="school_class"
            value={formData.school_class || ''}
            onChange={handleInputChange}
            placeholder="Select class"
          >
            {schoolClasses.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name} ({schoolClass.grade_name})
              </option>
            ))}
          </Select>
          <FormErrorMessage>{errors.school_class}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.rule_sub_item}>
          <FormLabel>Behavior Rule</FormLabel>
          <Select
            name="rule_sub_item"
            value={formData.rule_sub_item || ''}
            onChange={handleInputChange}
            placeholder="Select rule"
          >
            {Object.entries(organizedRules).map(([chapterName, dimensions]) => (
              <React.Fragment key={chapterName}>
                <optgroup label={`Chapter: ${chapterName}`}>
                  {Object.entries(dimensions).map(([dimensionName, rules]) => (
                    <React.Fragment key={dimensionName}>
                      {rules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                          {dimensionName} - {rule.name}
                        </option>
                      ))}
                    </React.Fragment>
                  ))}
                </optgroup>
              </React.Fragment>
            ))}
          </Select>
          <FormErrorMessage>{errors.rule_sub_item}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>Score Type</FormLabel>
          <Select
            name="score_type"
            value={formData.score_type || 'positive'}
            onChange={handleInputChange}
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </Select>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.points}>
          <FormLabel>Points</FormLabel>
          <NumberInput
            min={1}
            value={formData.points || 1}
            onChange={(_, value) => handleNumberInputChange('points', value)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.points}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.date_of_behavior}>
          <FormLabel>Date of Behavior</FormLabel>
          <Input
            name="date_of_behavior"
            type="date"
            value={formData.date_of_behavior || ''}
            onChange={handleInputChange}
          />
          <FormErrorMessage>{errors.date_of_behavior}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>Comments</FormLabel>
          <Textarea
            name="comment"
            value={formData.comment || ''}
            onChange={handleInputChange}
            placeholder="Add any notes or context about this behavior"
          />
        </FormControl>

        <Box display="flex" justifyContent="flex-end" gap={4} mt={4}>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" colorScheme="blue" isLoading={isLoading}>
            {initialData ? 'Update' : 'Save'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default BehaviorScoreForm;
