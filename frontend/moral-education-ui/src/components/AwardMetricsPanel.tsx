import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat, // Keep Stat, it's a namespace
  Heading,
  Flex,
  Badge,
  Text,
  Progress // Keep Progress, it's a namespace
} from '@chakra-ui/react';
import type { Award } from '../services/apiService'; // Added 'type'

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

  // TODO: Adjust cardBg for dark mode theming in Chakra UI v3 (e.g., using semantic tokens or CSS variables)
  const cardBg = 'white'; 

  return (
    <Box mb={8}>
      <Heading size="md" mb={4}>Award Metrics</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}> {/* Changed spacing to gap */}
        {/* Total Awards Stat */}
        <Stat.Root
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <Stat.Label>Total Awards</Stat.Label>
          <Stat.ValueText>{totalAwards}</Stat.ValueText> {/* Changed Stat.Number to Stat.ValueText */}
          <Stat.HelpText>
            <Badge colorScheme="blue" fontSize="sm">All Time</Badge>
          </Stat.HelpText>
        </Stat.Root>
        
        {/* Recent Awards Stat */}
        <Stat.Root
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <Stat.Label>Recent Awards</Stat.Label>
          <Stat.ValueText>{last30DaysCount}</Stat.ValueText> {/* Changed Stat.Number to Stat.ValueText */}
          <Stat.HelpText>
            <Badge colorScheme="green" fontSize="sm">Last 30 Days</Badge>
          </Stat.HelpText>
        </Stat.Root>
        
        {/* Students Recognized */}
        <Stat.Root
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <Stat.Label>Students Recognized</Stat.Label>
          <Stat.ValueText>{totalStudents}</Stat.ValueText> {/* Changed Stat.Number to Stat.ValueText */}
          <Stat.HelpText>
            <Badge colorScheme="purple" fontSize="sm">Unique Students</Badge>
          </Stat.HelpText>
        </Stat.Root>
        
        {/* Average Star Rating */}
        <Stat.Root
          px={4}
          py={3}
          bg={cardBg}
          shadow="base"
          rounded="lg"
        >
          <Stat.Label>Average Star Rating</Stat.Label>
          <Stat.ValueText>{avgStarRating.toFixed(1)}</Stat.ValueText> {/* Changed Stat.Number to Stat.ValueText */}
          <Stat.HelpText>
            <Badge colorScheme="yellow" fontSize="sm">Star Awards Only</Badge>
          </Stat.HelpText>
        </Stat.Root>
      </SimpleGrid>
      
      {/* Award Type Distribution */}
      <Box mt={8} p={4} bg={cardBg} shadow="base" rounded="lg">
        <Heading size="sm" mb={4}>Award Type Distribution</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}> {/* Changed spacing to gap */}
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
                <Progress.Root  /* Changed to Progress.Root */
                  colorScheme={colorMap[type]} 
                  size="sm" 
                  value={percentage} 
                  borderRadius="full"
                  mb={2}
                >
                  {/* In v3, Track and FilledTrack are often implicitly handled or can be added for customization */}
                  {/* <Progress.Track><Progress.FilledTrack /></Progress.Track> */}
                </Progress.Root>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default AwardMetricsPanel;
