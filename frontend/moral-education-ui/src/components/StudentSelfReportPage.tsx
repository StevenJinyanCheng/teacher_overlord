import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  VStack,
  HStack,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import { getCurrentUser, getStudentSelfReports } from '../services/apiService';
import StudentSelfReportForm from './StudentSelfReportForm';

interface StudentSelfReport {
  id: number;
  student: number;
  student_name?: string;
  rule_sub_item?: number | null;
  rule_name?: string | null;
  description: string;
  created_at: string;
  date_of_behavior: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display?: string;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
}

const StudentSelfReportPage: React.FC = () => {
  const [selfReports, setSelfReports] = useState<StudentSelfReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<StudentSelfReport | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        if (userData.role === 'student') {
          await fetchSelfReports(userData.id);
        }
      } catch (err) {
        console.error('Error initializing student self-report page:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);
  
  const fetchSelfReports = async (studentId: number) => {
    setIsLoading(true);
    try {
      const reports = await getStudentSelfReports({ student: studentId });
      setSelfReports(reports);
    } catch (err) {
      console.error('Error fetching self reports:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    if (user && user.id) {
      await fetchSelfReports(user.id);
    }
  };
  
  const openReportModal = (report: StudentSelfReport) => {
    setSelectedReport(report);
    onOpen();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge colorScheme="yellow">Pending Review</Badge>;
      case 'approved':
        return <Badge colorScheme="green">Approved</Badge>;
      case 'rejected':
        return <Badge colorScheme="red">Not Approved</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <Container maxW="container.xl" py={5}>
        <VStack spacing={4} align="center" justify="center" minH="500px">
          <Spinner size="xl" />
          <Text>Loading...</Text>
        </VStack>
      </Container>
    );
  }
  
  if (!user || user.role !== 'student') {
    return (
      <Container maxW="container.xl" py={5}>
        <VStack spacing={4} align="center" justify="center" minH="500px">
          <Heading size="md">Access Denied</Heading>
          <Text>This page is only available for student users.</Text>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>Student Self-Reports</Heading>
      
      <Tabs isLazy variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Submit New Report</Tab>
          <Tab>My Reports</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <StudentSelfReportForm studentId={user.id} onSubmitSuccess={handleRefresh} />
          </TabPanel>
          
          <TabPanel>
            <Box overflowX="auto">
              <HStack justify="space-between" mb={4}>
                <Heading size="md">My Submitted Reports</Heading>
                <Button size="sm" onClick={handleRefresh}>
                  Refresh
                </Button>
              </HStack>
              
              {selfReports.length > 0 ? (
                <Table variant="simple" bg={useColorModeValue('white', 'gray.700')} shadow="sm" borderRadius="md">
                  <Thead>
                    <Tr>
                      <Th>Date Submitted</Th>
                      <Th>Date of Behavior</Th>
                      <Th>Rule</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selfReports.map((report) => (
                      <Tr key={report.id}>
                        <Td>{formatDate(report.created_at)}</Td>
                        <Td>{formatDate(report.date_of_behavior)}</Td>
                        <Td>{report.rule_name || 'No rule specified'}</Td>
                        <Td>{getStatusBadge(report.status)}</Td>
                        <Td>
                          <Button size="sm" onClick={() => openReportModal(report)}>
                            View Details
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Box p={5} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" textAlign="center">
                  <Text>You have not submitted any self-reports yet.</Text>
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Report Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Report Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReport && (
              <VStack align="start" spacing={4}>
                <Box w="100%">
                  <Text fontWeight="bold">Date of Behavior:</Text>
                  <Text>{formatDate(selectedReport.date_of_behavior)}</Text>
                </Box>
                
                <Box w="100%">
                  <Text fontWeight="bold">Rule:</Text>
                  <Text>{selectedReport.rule_name || 'No rule specified'}</Text>
                </Box>
                
                <Box w="100%">
                  <Text fontWeight="bold">Description:</Text>
                  <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50" w="100%">
                    <Text whiteSpace="pre-wrap">{selectedReport.description}</Text>
                  </Box>
                </Box>
                
                <Box w="100%">
                  <Text fontWeight="bold">Status:</Text>
                  <HStack>
                    {getStatusBadge(selectedReport.status)}
                    {selectedReport.status !== 'pending' && (
                      <Text fontSize="sm">
                        by {selectedReport.reviewer_name || 'Unknown'} on {selectedReport.reviewed_at ? formatDate(selectedReport.reviewed_at) : 'Unknown date'}
                      </Text>
                    )}
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default StudentSelfReportPage;
