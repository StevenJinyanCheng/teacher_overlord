import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Award, getAwards } from '../services/apiService';
import AwardForm from './AwardForm';
import AwardList from './AwardList';
import AwardMetricsPanel from './AwardMetricsPanel';

const AwardManagementPage: React.FC = () => {
  const [awards, setAwards] = useState<Award[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const toast = useToast();

  const loadAwards = async () => {
    setIsLoading(true);
    try {
      const data = await getAwards();
      setAwards(data);
    } catch (error) {
      console.error('Error loading awards:', error);
      toast({
        title: 'Error loading awards',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAwards();
  }, []);

  const handleCreateClick = () => {
    setSelectedAward(null);
    setIsCreating(true);
    setActiveTab(1); // Switch to form tab
  };

  const handleEditClick = (award: Award) => {
    setSelectedAward(award);
    setIsCreating(true);
    setActiveTab(1); // Switch to form tab
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedAward(null);
    setActiveTab(0); // Switch back to list tab
  };

  const handleSave = () => {
    setIsCreating(false);
    setSelectedAward(null);
    loadAwards(); // Refresh the awards list
    setActiveTab(0); // Switch back to list tab
    
    toast({
      title: 'Success',
      description: selectedAward ? 'Award updated successfully' : 'Award created successfully',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">Award Management</Heading>
        
        <Button 
          leftIcon={<AddIcon />}
          colorScheme="green"
          onClick={handleCreateClick}
          isDisabled={isCreating}
        >
          New Award
        </Button>
      </Flex>
      
      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>Awards List</Tab>
          {isCreating && (
            <Tab>
              {selectedAward ? 'Edit Award' : 'Create Award'}
            </Tab>
          )}
        </TabList>
        
        <TabPanels>
          <TabPanel px={0}>
            <VStack spacing={8} align="stretch">
              {/* Award Metrics */}
              <AwardMetricsPanel awards={awards} />
              
              {/* Award List Table */}
              <AwardList 
                awards={awards}
                isLoading={isLoading}
                onEdit={handleEditClick}
                onRefresh={loadAwards}
              />
            </VStack>
          </TabPanel>
          
          {isCreating && (
            <TabPanel px={0}>
              <AwardForm 
                initialAward={selectedAward || undefined}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default AwardManagementPage;
