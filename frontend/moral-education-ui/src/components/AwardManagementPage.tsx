import React, { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Button,
  VStack,
  Tabs, // Keep Tabs, it's a namespace
  Flex
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import type { Award } from '../services/apiService'; // Added 'type'
import { getAwards } from '../services/apiService';
import AwardForm from './AwardForm';
import AwardList from './AwardList';
import AwardMetricsPanel from './AwardMetricsPanel';
import { toaster } from './ui/toaster'; // Import custom toaster

const AwardManagementPage: React.FC = () => {
  const [awards, setAwards] = useState<Award[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [selectedAward, setSelectedAward] = useState<Award | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  // Removed useToast, using custom toaster

  const loadAwards = async () => {
    setIsLoading(true);
    try {
      const data = await getAwards();
      setAwards(data);
    } catch (error) {
      console.error('Error loading awards:', error);
      toaster.create({ 
        title: 'Error loading awards',
        type: 'error', // Changed status to type
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
    
    toaster.create({ 
      title: 'Success',
      description: selectedAward ? 'Award updated successfully' : 'Award created successfully',
      type: 'success', // Changed status to type
    });
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">Award Management</Heading>
        <Button 
          colorScheme="green"
          onClick={handleCreateClick}
          disabled={isCreating}
        >
          <FaPlus style={{ marginRight: '0.5rem' }} /> New Award
        </Button>
      </Flex>
      
      <Tabs.Root value={activeTab.toString()} onValueChange={(details) => setActiveTab(Number(details.value))}>
        <Tabs.List>
          <Tabs.Trigger value="0">Awards List</Tabs.Trigger>
          {isCreating && (
            <Tabs.Trigger value="1">
              {selectedAward ? 'Edit Award' : 'Create Award'}
            </Tabs.Trigger>
          )}
          <Tabs.Indicator />
        </Tabs.List>
        
        <Tabs.Content value="0" pt={4}> {/* Added pt for padding, TabPanel removed */}
          <VStack gap={8} alignItems="stretch"> {/* Changed spacing to gap, align to alignItems */}
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
        </Tabs.Content>
        
        {isCreating && (
          <Tabs.Content value="1" pt={4}> {/* Added pt for padding, TabPanel removed */}
            <AwardForm 
              initialAward={selectedAward || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Container>
  );
};

export default AwardManagementPage;
