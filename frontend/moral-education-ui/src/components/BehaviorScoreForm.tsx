import React, { useState } from 'react';
import {
  Box,
  Button,
  Input, // For date input
  Select as ChakraSelect, // Renaming to avoid confusion, using for native selects
  Textarea,
  NumberInput,
  Stack,
  Heading,
  Field,
  createListCollection,
  type ListCollection,
  SelectRoot, // Explicitly import SelectRoot for the composable select
  SelectTrigger,
  SelectValueText,
  SelectPositioner,
  SelectContent,
  SelectItem,
} from '@chakra-ui/react';
import { createBehaviorScore, updateBehaviorScore } from '../services/apiService';
import type { BehaviorScore, RuleSubItem as BaseRuleSubItem, SchoolClass } from '../services/apiService';
import { toaster } from './ui/toaster';

// Extend BaseRuleSubItem to include dimension_name, as it seems to be used in the form logic
interface EnrichedRuleSubItem extends BaseRuleSubItem {
  dimension_name?: string; // This property is used when organizing rules
}

interface StudentForItem {
  id: number;
  username: string;
  full_name: string;
}

interface BehaviorScoreFormProps {
  initialData?: BehaviorScore;
  students: StudentForItem[];
  ruleSubItems: EnrichedRuleSubItem[]; // Use the enriched type here
  schoolClasses: SchoolClass[];
  onSuccess: () => void;
  onCancel: () => void;
}

const BehaviorScoreForm: React.FC<BehaviorScoreFormProps> = ({
  initialData,
  students,
  ruleSubItems, // Now typed as EnrichedRuleSubItem[]
  schoolClasses,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<BehaviorScore>>({
    student: initialData?.student, 
    rule_sub_item: initialData?.rule_sub_item,
    school_class: initialData?.school_class,
    score_type: initialData?.score_type || 'positive',
    points: initialData?.points === undefined || initialData.points === null ? 1 : initialData.points,
    comment: initialData?.comment || '',
    date_of_behavior: initialData?.date_of_behavior || new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | undefined = value;

    if ((name === 'student' || name === 'school_class') && value !== '') {
      processedValue = parseInt(value, 10);
    } else if (name === 'rule_sub_item') {
      processedValue = value === '' ? undefined : parseInt(value, 10); 
    }
    
    setFormData({
      ...formData,
      [name]: processedValue,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleStudentChange = (details: { value: string[] }) => {
    const studentIdString = details.value.length > 0 ? details.value[0] : undefined;
    const studentId = studentIdString ? parseInt(studentIdString, 10) : undefined;
    setFormData(prev => ({ ...prev, student: studentId }));
    if (errors.student && studentId !== undefined) {
      setErrors(prev => ({ ...prev, student: '' }));
    }
  };

  const handleSchoolClassChange = (details: { value: string[] }) => {
    const classIdString = details.value.length > 0 ? details.value[0] : undefined;
    const classId = classIdString ? parseInt(classIdString, 10) : undefined;
    setFormData(prev => ({ ...prev, school_class: classId }));
    if (errors.school_class && classId !== undefined) {
      setErrors(prev => ({ ...prev, school_class: '' }));
    }
  };

  const handleNumberInputChange = (name: string, valueAsNumber: number) => {
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
    if (formData.student === undefined) newErrors.student = 'Student is required';
    if (formData.rule_sub_item === undefined || formData.rule_sub_item === null || Number.isNaN(formData.rule_sub_item)) newErrors.rule_sub_item = 'Rule is required';
    if (formData.school_class === undefined) newErrors.school_class = 'Class is required';
    if (!formData.date_of_behavior) newErrors.date_of_behavior = 'Date is required';
    const pointsValue = formData.points === undefined ? 1 : formData.points;
    if (pointsValue <= 0) {
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
      const payload: Partial<BehaviorScore> = { ...formData };
      // Ensure rule_sub_item is a number if it was set via native select
      if (typeof payload.rule_sub_item === 'string') {
        payload.rule_sub_item = parseInt(payload.rule_sub_item, 10);
        if (Number.isNaN(payload.rule_sub_item)) payload.rule_sub_item = undefined;
      }

      if (initialData?.id) {
        await updateBehaviorScore(initialData.id, payload as BehaviorScore);
        toaster.create({
          title: 'Behavior score updated',
          type: 'success',
        });
      } else {
        await createBehaviorScore(payload as BehaviorScore);
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

  const organizedRules: { [chapterName: string]: { [dimensionName: string]: EnrichedRuleSubItem[] } } = {};
  ruleSubItems.forEach((item: EnrichedRuleSubItem) => {
    const nameParts = item.dimension_name ? item.dimension_name.split(' - ') : ['Unknown Chapter', 'Unknown Dimension'];
    const chapterName = nameParts[0] || 'Unknown Chapter';
    const dimensionName = nameParts[1] || 'Unknown Dimension';
    
    if (!organizedRules[chapterName]) organizedRules[chapterName] = {};
    if (!organizedRules[chapterName][dimensionName]) organizedRules[chapterName][dimensionName] = [];
    organizedRules[chapterName][dimensionName].push(item);
  });

  const studentItems = students.map((s: StudentForItem) => ({ id: s.id.toString(), label: s.full_name || s.username }));
  const studentCollection: ListCollection<{ id: string; label: string; }> = createListCollection({items: studentItems});

  const schoolClassItems = schoolClasses.map((sc: SchoolClass) => ({ id: sc.id.toString(), label: `${sc.name} (${sc.grade_name})` }));
  const schoolClassCollection: ListCollection<{ id: string; label: string; }> = createListCollection({items: schoolClassItems});

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%" maxWidth="800px" mx="auto" p={4}>
      <Heading size="lg" mb={4}>
        {initialData ? 'Edit Behavior Score' : 'Record Behavior Score'}
      </Heading>

      <Stack gap={4}>
        <Field.Root required invalid={!!errors.student}>
          <Field.Label>Student</Field.Label>
          <SelectRoot
            id="student"
            value={formData.student !== undefined ? [String(formData.student)] : []}
            onValueChange={handleStudentChange}
            collection={studentCollection}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select student" />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {studentCollection.items.map((item: {id: string, label: string}) => (
                  <SelectItem key={item.id} item={item}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </SelectRoot>
          {errors.student && <Field.HelperText color="red.500">{errors.student}</Field.HelperText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.school_class}>
          <Field.Label>Class</Field.Label>
          <SelectRoot
            id="school_class"
            value={formData.school_class !== undefined ? [String(formData.school_class)] : []}
            onValueChange={handleSchoolClassChange}
            collection={schoolClassCollection}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select class" />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {schoolClassCollection.items.map((item: {id: string, label: string}) => (
                  <SelectItem key={item.id} item={item}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </SelectRoot>
          {errors.school_class && <Field.HelperText color="red.500">{errors.school_class}</Field.HelperText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.rule_sub_item}>
          <Field.Label>Behavior Rule</Field.Label>
          <ChakraSelect
            id="rule_sub_item_native"
            name="rule_sub_item"
            value={formData.rule_sub_item?.toString() || ''} // Ensure value is string for native select
            onChange={handleInputChange}
            placeholder="Select rule"
          >
            {Object.entries(organizedRules).map(([chapterName, dimensions]) => (
              <optgroup key={chapterName} label={`Chapter: ${chapterName}`}>
                {Object.entries(dimensions).map(([dimensionName, rules]) =>
                  rules.map((rule: EnrichedRuleSubItem) => (
                      <option key={rule.id} value={rule.id}>
                        {dimensionName} - {rule.name}
                      </option>
                  ))
                )}
              </optgroup>
            ))}
          </ChakraSelect>
          {errors.rule_sub_item && <Field.HelperText color="red.500">{errors.rule_sub_item}</Field.HelperText>}
        </Field.Root>

        <Field.Root>
          <Field.Label>Score Type</Field.Label>
          <ChakraSelect
            id="score_type_native"
            name="score_type"
            value={formData.score_type || 'positive'}
            onChange={handleInputChange}
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </ChakraSelect>
        </Field.Root>

        <Field.Root required invalid={!!errors.points}>
          <Field.Label>Points</Field.Label>
          <NumberInput.Root
            min={1}
            value={(formData.points ?? 1).toString()} 
            onValueChange={(details) => handleNumberInputChange('points', details.valueAsNumber)}
          >
            <NumberInput.Input />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
          {errors.points && <Field.HelperText color="red.500">{errors.points}</Field.HelperText>}
        </Field.Root>

        <Field.Root required invalid={!!errors.date_of_behavior}>
          <Field.Label>Date of Behavior</Field.Label>
          <Input
            name="date_of_behavior"
            type="date"
            value={formData.date_of_behavior || ''}
            onChange={handleInputChange}
          />
          {errors.date_of_behavior && <Field.HelperText color="red.500">{errors.date_of_behavior}</Field.HelperText>}
        </Field.Root>

        <Field.Root>
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
