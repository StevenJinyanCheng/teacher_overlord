import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Select,
  FormErrorMessage,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Grid,
  GridItem,
  HStack
} from '@chakra-ui/react';
import { createStudentSelfReport, getRuleSubItems } from '../services/apiService';

interface StudentSelfReportFormProps {
  studentId: number;
  onSubmitSuccess?: () => void;
}

const StudentSelfReportForm: React.FC<StudentSelfReportFormProps> = ({ 
  studentId,
  onSubmitSuccess
}) => {
  const [description, setDescription] = useState<string>('');
  const [dateOfBehavior, setDateOfBehavior] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [ruleSubItemId, setRuleSubItemId] = useState<string>('');
  const [ruleSubItems, setRuleSubItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const toast = useToast();
  
  // Fetch rule sub items for the form dropdown
  useEffect(() => {
    const fetchRuleSubItems = async () => {
      try {
        const items = await getRuleSubItems();
        setRuleSubItems(items);
      } catch (err) {
        console.error('Error fetching rule sub items:', err);
        setError('Failed to load rule items. Please try again later.');
      }
    };
    
    fetchRuleSubItems();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const reportData = {
        student: studentId,
        rule_sub_item: ruleSubItemId ? parseInt(ruleSubItemId) : null,
        description,
        date_of_behavior: dateOfBehavior,
      };
      
      await createStudentSelfReport(reportData);
      
      // Reset form
      setDescription('');
      setRuleSubItemId('');
      setDateOfBehavior(new Date().toISOString().split('T')[0]);
      
      // Show success message
      setSuccess(true);
      toast({
        title: 'Self-report submitted.',
        description: 'Your self-report has been submitted for review.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Call success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      // Reset success after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting self-report:', err);
      setError(err.message || 'Failed to submit self-report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box p={5} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Submit Self-Report</Heading>
        <Text color="gray.600">
          Use this form to report your own behavior that demonstrates moral character.
          Your teacher will review and validate your report.
        </Text>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <CloseButton 
              position="absolute" 
              right="8px" 
              top="8px" 
              onClick={() => setError(null)}
            />
          </Alert>
        )}
        
        {success && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <AlertTitle mr={2}>Success!</AlertTitle>
            <AlertDescription>
              Your self-report has been submitted and will be reviewed by your teacher.
            </AlertDescription>
            <CloseButton 
              position="absolute" 
              right="8px" 
              top="8px" 
              onClick={() => setSuccess(false)}
            />
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid templateColumns="repeat(12, 1fr)" gap={4}>
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <FormControl isRequired>
                <FormLabel>Date of Behavior</FormLabel>
                <Input
                  type="date"
                  value={dateOfBehavior}
                  onChange={(e) => setDateOfBehavior(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
            </GridItem>
            
            <GridItem colSpan={{ base: 12, md: 6 }}>
              <FormControl>
                <FormLabel>Related Rule (Optional)</FormLabel>
                <Select 
                  placeholder="Select a rule"
                  value={ruleSubItemId}
                  onChange={(e) => setRuleSubItemId(e.target.value)}
                >
                  {ruleSubItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.chapter_name} - {item.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            
            <GridItem colSpan={12}>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel>Description of Behavior</FormLabel>
                <Textarea
                  placeholder="Describe what you did that demonstrates good moral character..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minHeight="150px"
                />
                <FormErrorMessage>{error}</FormErrorMessage>
              </FormControl>
            </GridItem>
            
            <GridItem colSpan={12}>
              <HStack spacing={4} justify="flex-end" mt={4}>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDescription('');
                    setRuleSubItemId('');
                    setDateOfBehavior(new Date().toISOString().split('T')[0]);
                  }}
                >
                  Reset
                </Button>
                <Button 
                  colorScheme="blue" 
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Submitting"
                >
                  Submit Self-Report
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </form>
      </VStack>
    </Box>
  );
};

export default StudentSelfReportForm;
