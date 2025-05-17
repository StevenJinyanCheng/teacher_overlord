import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Flex,
  Badge,
  Text,
  Progress,
  useColorModeValue
} from '@chakra-ui/react';
import { Award } from '../services/apiService';

interface AwardMetricsPanelProps {
  awards: Award[];
}

const AwardMetricsPanel: React.FC<AwardMetricsPanelProps> = ({ awards }) => {
  // Calculate metrics
  const totalAwards = awards.length;
  
  const awardsByType: Record<string, number> = {
    star: 0,
    badge: 0,
    certificate: 0,
    other: 0
  };
  
  awards.forEach(award => {
    if (award.award_type in awardsByType) {
      awardsByType[award.award_type]++;
    } else {
      awardsByType['other']++;
    }
  });
  
  const totalStudents = new Set(awards.map(award => award.student)).size;
  
  // Get last 30 days award count
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const last30DaysCount = awards.filter(
    award => new Date(award.award_date) >= last30Days
  ).length;
  
  // Calculate average star rating
  const starAwards = awards.filter(award => award.award_type === 'star');
  const avgStarRating = starAwards.length > 0
    ? starAwards.reduce((sum, award) => sum + award.level, 0) / starAwards.length
    : 0;
  
  // Get color for card backgrounds
  const cardBg = useColorModeValue('white', 'gray.700');
  
  return (
    <Box mb={8}>
      <Heading size="md" mb={4}>Award Metrics</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {/* Total Awards Stat */}
        <Stat
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Total Awards</StatLabel>
          <StatNumber>{totalAwards}</StatNumber>
          <StatHelpText>
            <Badge colorScheme="blue" fontSize="sm">All Time</Badge>
          </StatHelpText>
        </Stat>
        
        {/* Recent Awards Stat */}
        <Stat
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Recent Awards</StatLabel>
          <StatNumber>{last30DaysCount}</StatNumber>
          <StatHelpText>
            <Badge colorScheme="green" fontSize="sm">Last 30 Days</Badge>
          </StatHelpText>
        </Stat>
        
        {/* Students Recognized */}
        <Stat
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Students Recognized</StatLabel>
          <StatNumber>{totalStudents}</StatNumber>
          <StatHelpText>
            <Badge colorScheme="purple" fontSize="sm">Unique Students</Badge>
          </StatHelpText>
        </Stat>
        
        {/* Average Star Rating */}
        <Stat
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Average Star Rating</StatLabel>
          <StatNumber>{avgStarRating.toFixed(1)}</StatNumber>
          <StatHelpText>
            <Badge colorScheme="yellow" fontSize="sm">Star Awards Only</Badge>
          </StatHelpText>
        </Stat>
      </SimpleGrid>
      
      {/* Award Type Distribution */}
      <Box mt={8} p={4} bg={cardBg} shadow="base" rounded="lg">
        <Heading size="sm" mb={4}>Award Type Distribution</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {Object.entries(awardsByType).map(([type, count]) => {
            const percentage = totalAwards > 0 ? (count / totalAwards) * 100 : 0;
            const colorMap: Record<string, string> = {
              'star': 'yellow',
              'badge': 'blue',
              'certificate': 'green',
              'other': 'gray'
            };
            
            return (
              <Box key={type}>
                <Flex justify="space-between" mb={2}>
                  <Text>
                    <Badge colorScheme={colorMap[type]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  </Text>
                  <Text fontWeight="bold">
                    {count} ({percentage.toFixed(1)}%)
                  </Text>
                </Flex>
                <Progress 
                  colorScheme={colorMap[type]} 
                  size="sm" 
                  value={percentage} 
                  borderRadius="full"
                  mb={2}
                />
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default AwardMetricsPanel;
