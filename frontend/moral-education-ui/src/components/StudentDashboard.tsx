import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  SimpleGrid,
  Flex,
  Badge,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  getBehaviorScores, 
  getAwards, 
  getBehaviorScoreSummary,
  User,
  BehaviorScore,
  Award,
  ScoreSummary
} from '../services/apiService';

interface StudentDashboardProps {
  currentUser: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser }) => {
  const [scores, setScores] = useState<BehaviorScore[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch the student's behavior scores, awards and summary
        const [scoresData, awardsData, summaryData] = await Promise.all([
          getBehaviorScores(),
          getAwards(),
          getBehaviorScoreSummary()
        ]);
        
        setScores(scoresData);
        setAwards(awardsData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate recent trend (simplified)
  const recentTrend = () => {
    if (scores.length < 2) return 0;
    
    const recentScores = scores.slice(0, Math.min(10, scores.length));
    let positiveCount = 0;
    let negativeCount = 0;
    
    recentScores.forEach(score => {
      if (score.score_type === 'positive') positiveCount += score.points;
      else negativeCount += score.points;
    });
    
    return positiveCount - negativeCount;
  };

  // Get highest level star award
  const getHighestStarRating = () => {
    const starAwards = awards.filter(award => award.award_type === 'star');
    if (starAwards.length === 0) return 0;
    
    return Math.max(...starAwards.map(award => award.level));
  };

  // Recent awards
  const recentAwards = awards.slice(0, 5);

  // Recent records
  const recentScores = scores.slice(0, 5);

  if (isLoading) {
    return (
      <Box p={5}>
        <Text>Loading your progress dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading mb={6}>My Progress Dashboard</Heading>
      
      {/* Top stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
        <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader pb={0}>
            <Stat>
              <StatLabel>Total Score</StatLabel>
              <StatNumber color={summary?.net_score && summary.net_score >= 0 ? "green.500" : "red.500"}>
                {summary?.net_score || 0}
              </StatNumber>
              <StatHelpText>
                {recentTrend() >= 0 ? (
                  <><StatArrow type="increase" />Improving</>
                ) : (
                  <><StatArrow type="decrease" />Declining</>
                )}
              </StatHelpText>
            </Stat>
          </CardHeader>
          <CardBody>
            <Progress 
              value={(summary?.net_score || 0) > 0 ? Math.min(((summary?.net_score || 0) / 100) * 100, 100) : 0} 
              colorScheme="green" 
              size="sm" 
              borderRadius="full"
            />
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader pb={0}>
            <Stat>
              <StatLabel>Star Rating</StatLabel>
              <StatNumber>
                {'★'.repeat(getHighestStarRating()) + '☆'.repeat(5 - getHighestStarRating())}
              </StatNumber>
              <StatHelpText>
                Level {getHighestStarRating()} achieved
              </StatHelpText>
            </Stat>
          </CardHeader>
          <CardBody>
            <Progress 
              value={getHighestStarRating() * 20} 
              colorScheme="yellow" 
              size="sm" 
              borderRadius="full"
            />
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader pb={0}>
            <Stat>
              <StatLabel>Badges Earned</StatLabel>
              <StatNumber>{awards.filter(a => a.award_type === 'badge').length}</StatNumber>
              <StatHelpText>
                Total recognitions: {awards.length}
              </StatHelpText>
            </Stat>
          </CardHeader>
          <CardBody>
            <Progress 
              value={Math.min((awards.length / 10) * 100, 100)} 
              colorScheme="blue" 
              size="sm" 
              borderRadius="full"
            />
          </CardBody>
        </Card>
      </SimpleGrid>
      
      {/* Dimension scores */}
      {summary && Object.keys(summary.dimension_scores).length > 0 && (
        <Card mb={6} bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Performance by Dimension</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={4}>
              {Object.entries(summary.dimension_scores).map(([dimension, score]) => (
                <GridItem key={dimension}>
                  <Text fontWeight="medium">{dimension}</Text>
                  <Flex alignItems="center" mt={1}>
                    <Progress 
                      flex="1"
                      value={score > 0 ? Math.min((score / 20) * 100, 100) : 0} 
                      colorScheme={score >= 0 ? "green" : "red"} 
                      size="sm" 
                      borderRadius="full"
                    />
                    <Text ml={2} fontWeight="bold" color={score >= 0 ? "green.500" : "red.500"}>
                      {score}
                    </Text>
                  </Flex>
                </GridItem>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}
      
      {/* Recent awards and scores in a two-column layout */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Recent Awards */}
        <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Recent Recognition</Heading>
          </CardHeader>
          <CardBody>
            {recentAwards.length > 0 ? (
              recentAwards.map((award) => (
                <Box 
                  key={award.id}
                  p={3} 
                  mb={2}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={cardBorder}
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold">{award.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(award.award_date).toLocaleDateString()}
                      </Text>
                      {award.description && (
                        <Text fontSize="sm" mt={1}>
                          {award.description}
                        </Text>
                      )}
                    </Box>
                    <Badge 
                      colorScheme={
                        award.award_type === 'star' ? 'yellow' : 
                        award.award_type === 'badge' ? 'purple' : 
                        award.award_type === 'certificate' ? 'blue' : 'gray'
                      }
                      p={2}
                    >
                      {award.award_type === 'star' && '★'.repeat(award.level)}
                      {award.award_type !== 'star' && award.award_type_display}
                    </Badge>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text>No awards yet. Keep up the good work!</Text>
            )}
          </CardBody>
        </Card>
        
        {/* Recent Behavior Records */}
        <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Recent Behavior Records</Heading>
          </CardHeader>
          <CardBody>
            {recentScores.length > 0 ? (
              recentScores.map((score) => (
                <Box 
                  key={score.id}
                  p={3} 
                  mb={2}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={cardBorder}
                >
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="medium">{score.rule_name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {score.dimension_name}
                      </Text>
                      <Text fontSize="sm" mt={1}>
                        {new Date(score.date_of_behavior).toLocaleDateString()}
                      </Text>
                      {score.comment && (
                        <Text fontSize="sm" fontStyle="italic" mt={1}>
                          "{score.comment}"
                        </Text>
                      )}
                    </Box>
                    <Badge 
                      colorScheme={score.score_type === 'positive' ? 'green' : 'red'}
                      variant="solid"
                      p={2}
                    >
                      {score.score_type === 'positive' ? '+' : '-'}{score.points}
                    </Badge>
                  </Flex>
                </Box>
              ))
            ) : (
              <Text>No behavior records yet.</Text>
            )}
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

export default StudentDashboard;
