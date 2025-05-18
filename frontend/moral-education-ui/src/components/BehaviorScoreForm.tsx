import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Select,
  Textarea,
  NumberInput,
  Stack,
  Heading,
  Field,
  createListCollection,
} from '@chakra-ui/react';
import { createBehaviorScore, updateBehaviorScore } from '../services/apiService';
import type { BehaviorScore, RuleSubItem, SchoolClass } from '../services/apiService';
import { toaster } from './ui/toaster';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleNumberInputChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setFormData({
      ...formData,
      [name]: valueAsNumber,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.student) newErrors.student = 'Student is required';
    if (!formData.rule_sub_item) newErrors.rule_sub_item = 'Rule is required';
    if (!formData.school_class) newErrors.school_class = 'Class is required';
    if (!formData.date_of_behavior) newErrors.date_of_behavior = 'Date is required';
    if (formData.points !== undefined && formData.points <= 0) {
      newErrors.points = 'Points must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (initialData?.id) {
        await updateBehaviorScore(initialData.id, formData as BehaviorScore);
        toaster.create({
          title: 'Behavior score updated',
          type: 'success',
        });
      } else {
        await createBehaviorScore(formData as BehaviorScore);
        toaster.create({
          title: 'Behavior score recorded',
          type: 'success',
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving behavior score:', error);
      toaster.create({
        title: 'Error',
        description: 'Failed to save behavior score',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const organizedRules: { [chapterName: string]: { [dimensionName: string]: RuleSubItem[] } } = {};
  ruleSubItems.forEach((item) => {
    const nameParts = item.dimension_name ? item.dimension_name.split(' - ') : ['Unknown Chapter', 'Unknown Dimension'];
    const chapterName = nameParts[0] || 'Unknown Chapter';
    const dimensionName = nameParts[1] || 'Unknown Dimension';
    
    if (!organizedRules[chapterName]) organizedRules[chapterName] = {};
    if (!organizedRules[chapterName][dimensionName]) organizedRules[chapterName][dimensionName] = [];
    organizedRules[chapterName][dimensionName].push(item);
  });

  const studentItems = students.map(s => ({ id: s.id.toString(), label: s.full_name || s.username }));
  const studentCollection = createListCollection({ items: studentItems });

  const schoolClassItems = schoolClasses.map(sc => ({ id: sc.id.toString(), label: `${sc.name} (${sc.grade_name})` }));
  const schoolClassCollection = createListCollection({ items: schoolClassItems });

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%" maxWidth="800px" mx="auto" p={4}>
      <Heading size="lg" mb={4}>
        {initialData ? 'Edit Behavior Score' : 'Record Behavior Score'}
      </Heading>

      <Stack gap={4}>
        <Field.Root name="student" isRequired isInvalid={!!errors.student}>
          <Field.Label>Student</Field.Label>
          <Select.Root
            id="student"
            value={formData.student ? [formData.student.toString()] : []}
            onValueChange={(details) => handleInputChange({ target: { name: 'student', value: details.value.length > 0 ? details.value[0] : '' } } as any )}
            placeholder="Select student"
            items={studentCollection}
          >
            <Select.Trigger />
            <Select.Positioner>
              <Select.Content>
                {studentCollection.items.map((item: {id: string, label: string}) => (
                  <Select.Item key={item.id} item={item}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <Field.ErrorMessage>{errors.student}</Field.ErrorMessage>
        </Field.Root>

        <Field.Root name="school_class" isRequired isInvalid={!!errors.school_class}>
          <Field.Label>Class</Field.Label>
          <Select.Root
            id="school_class"
            value={formData.school_class ? [formData.school_class.toString()] : []}
            onValueChange={(details) => handleInputChange({ target: { name: 'school_class', value: details.value.length > 0 ? details.value[0] : '' } } as any)}
            placeholder="Select class"
            items={schoolClassCollection}
          >
            <Select.Trigger />
            <Select.Positioner>
              <Select.Content>
                {schoolClassCollection.items.map((item: {id: string, label: string}) => (
                  <Select.Item key={item.id} item={item}>{item.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <Field.ErrorMessage>{errors.school_class}</Field.ErrorMessage>
        </Field.Root>

        <Field.Root name="rule_sub_item" isRequired isInvalid={!!errors.rule_sub_item}>
          <Field.Label>Behavior Rule</Field.Label>
          <Select.RootNative
            id="rule_sub_item_native"
            name="rule_sub_item"
            value={formData.rule_sub_item?.toString() || ''}
            onChange={handleInputChange} 
            placeholder="Select rule"
          >
            {Object.entries(organizedRules).map(([chapterName, dimensions]) => (
              <optgroup key={chapterName} label={`Chapter: ${chapterName}`}>
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
            ))}
          </Select.RootNative>
          <Field.ErrorMessage>{errors.rule_sub_item}</Field.ErrorMessage>
        </Field.Root>

        <Field.Root name="score_type">
          <Field.Label>Score Type</Field.Label>
          <Select.RootNative
            id="score_type_native"
            name="score_type"
            value={formData.score_type || 'positive'}
            onChange={handleInputChange}
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </Select.RootNative>
        </Field.Root>

        <Field.Root name="points" isRequired isInvalid={!!errors.points}>
          <Field.Label>Points</Field.Label>
          <NumberInput.Root
            min={1}
            value={formData.points?.toString() || "1"}
            onValueChange={(details) => handleNumberInputChange('points', details.value, details.valueAsNumber)}
          >
            <NumberInput.Field />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
          <Field.ErrorMessage>{errors.points}</Field.ErrorMessage>
        </Field.Root>

        <Field.Root name="date_of_behavior" isRequired isInvalid={!!errors.date_of_behavior}>
          <Field.Label>Date of Behavior</Field.Label>
          <Input
            name="date_of_behavior"
            type="date"
            value={formData.date_of_behavior || ''}
            onChange={handleInputChange}
          />
          <Field.ErrorMessage>{errors.date_of_behavior}</Field.ErrorMessage>
        </Field.Root>

        <Field.Root name="comment">
          <Field.Label>Comments</Field.Label>
          <Textarea
            name="comment"
            value={formData.comment || ''}
            onChange={handleInputChange}
            placeholder="Add any notes or context about this behavior"
          />
        </Field.Root>

        <Box display="flex" justifyContent="flex-end" gap={4} mt={4}>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" colorScheme="blue" loading={isLoading}>
            {initialData ? 'Update' : 'Save'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default BehaviorScoreForm;
