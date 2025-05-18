import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  getGrades, 
  getSchoolClasses, 
  getAwards, 
  getBehaviorScores, 
  getBehaviorScoreSummary, 
  getParentObservations,
  getStudentSelfReports,
  getBehaviorTimeSeries,
  getAwardAnalytics,
  getUserEngagement,
  getDimensionAnalysis
} from '../services/apiService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PrincipalDashboard: React.FC = () => {
  const [grades, setGrades] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Advanced data state for charts
  const [behaviorTimeSeriesData, setBehaviorTimeSeriesData] = useState<any>(null);
  const [awardAnalyticsData, setAwardAnalyticsData] = useState<any>(null);
  const [userEngagementData, setUserEngagementData] = useState<any>(null);
  const [dimensionAnalysisData, setDimensionAnalysisData] = useState<any[]>([]);
  
  const [summaryData, setSummaryData] = useState<any>({
    behaviorScores: {
      total: 0,
      positive: 0,
      negative: 0,
      summary: null
    },
    awards: {
      total: 0,
      byType: {
        star: 0,
        badge: 0,
        certificate: 0,
        other: 0
      }
    },
    parentObservations: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    },
    studentSelfReports: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0
    }
  });
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [gradesData, classesData] = await Promise.all([
          getGrades(),
          getSchoolClasses()
        ]);
        
        setGrades(gradesData);
        setClasses(classesData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Load dashboard data based on filters
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }
        
        // Prepare filter params
        const params: Record<string, string> = {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        };
        
        if (selectedGrade !== 'all') {
          params.grade_id = selectedGrade;
        }
        
        if (selectedClass !== 'all') {
          params.class_id = selectedClass;
        }
        
        // Fetch all data in parallel
        const [
          behaviorScores,
          scoreSummary,
          awards,
          parentObservations,
          selfReports,
          timeSeries,
          awardAnalytics,
          userEngagement,
          dimensionAnalysis
        ] = await Promise.all([
          getBehaviorScores(params),
          getBehaviorScoreSummary(params),
          getAwards(params),
          getParentObservations(params),
          getStudentSelfReports(params),
          getBehaviorTimeSeries(params),
          getAwardAnalytics(params),
          getUserEngagement(params),
          getDimensionAnalysis(params)
        ]);
        
        // Set chart data
        setBehaviorTimeSeriesData(timeSeries);
        setAwardAnalyticsData(awardAnalytics);
        setUserEngagementData(userEngagement);
        setDimensionAnalysisData(dimensionAnalysis);
        
        // Process behavior scores
        const positiveScores = behaviorScores.filter(score => score.score_type === 'positive');
        const negativeScores = behaviorScores.filter(score => score.score_type === 'negative');
        
        // Process awards
        const awardsByType = {
          star: awards.filter(award => award.award_type === 'star').length,
          badge: awards.filter(award => award.award_type === 'badge').length,
          certificate: awards.filter(award => award.award_type === 'certificate').length,
          other: awards.filter(award => award.award_type === 'other').length
        };
        
        // Process parent observations
        const approvedObservations = parentObservations.filter(obs => obs.status === 'approved');
        const pendingObservations = parentObservations.filter(obs => obs.status === 'pending');
        const rejectedObservations = parentObservations.filter(obs => obs.status === 'rejected');
        
        // Process self reports
        const approvedReports = selfReports.filter(report => report.status === 'approved');
        const pendingReports = selfReports.filter(report => report.status === 'pending');
        const rejectedReports = selfReports.filter(report => report.status === 'rejected');
        
        // Update dashboard data
        setSummaryData({
          behaviorScores: {
            total: behaviorScores.length,
            positive: positiveScores.length,
            negative: negativeScores.length,
            summary: scoreSummary
          },
          awards: {
            total: awards.length,
            byType: awardsByType
          },
          parentObservations: {
            total: parentObservations.length,
            approved: approvedObservations.length,
            pending: pendingObservations.length,
            rejected: rejectedObservations.length
          },
          studentSelfReports: {
            total: selfReports.length,
            approved: approvedReports.length,
            pending: pendingReports.length,
            rejected: rejectedReports.length
          }
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [selectedGrade, selectedClass, timeRange]);
  
  // Prepare stats for summary cards
  const positiveToNegativeRatio = summaryData.behaviorScores.negative > 0
    ? (summaryData.behaviorScores.positive / summaryData.behaviorScores.negative).toFixed(2)
    : 'N/A';
  
  // Render charts
  const renderBehaviorTimeSeriesChart = () => {
    if (!behaviorTimeSeriesData) {
      return (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      );
    }

    const positiveData = behaviorTimeSeriesData.positive_series || [];
    const negativeData = behaviorTimeSeriesData.negative_series || [];

    // Combine data for display
    const combinedData = positiveData.map((item: any, index: number) => {
      return {
        date: item.date,
        positive: item.count,
        negative: negativeData[index]?.count || 0,
      };
    });

    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="positive" stroke="#82ca9d" name="Positive Records" />
          <Line type="monotone" dataKey="negative" stroke="#ff7875" name="Negative Records" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAwardDistributionChart = () => {
    if (!awardAnalyticsData) {
      return (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      );
    }

    const awardsByType = awardAnalyticsData.awards_by_type || [];

    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={awardsByType}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="award_type"
            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {awardsByType.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderDimensionAnalysisChart = () => {
    if (!dimensionAnalysisData || dimensionAnalysisData.length === 0) {
      return (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={dimensionAnalysisData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dimension_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="positive_count" fill="#82ca9d" name="Positive Records" />
          <Bar dataKey="negative_count" fill="#ff7875" name="Negative Records" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderParentEngagementChart = () => {
    if (!userEngagementData || !userEngagementData.parent_engagement) {
      return (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      );
    }

    const chartData = userEngagementData.parent_engagement.top_engaged_parents.map((parent: any) => ({
      name: `Parent ${parent.parent_id}`,
      observations: parent.observation_count,
      approved: parent.approved_count,
    }));

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="observations" fill="#8884d8" name="Total Observations" />
          <Bar dataKey="approved" fill="#82ca9d" name="Approved" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={6}>Principal Analytics Dashboard</Heading>
      
      {/* Filters */}
      <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={6}>
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Text fontWeight="bold" mb={2}>Grade</Text>
          <Select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
          >
            <option value="all">All Grades</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id.toString()}>
                {grade.name}
              </option>
            ))}
          </Select>
        </GridItem>
        
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Text fontWeight="bold" mb={2}>Class</Text>
          <Select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes
              .filter(cls => selectedGrade === 'all' || cls.grade === Number(selectedGrade))
              .map((cls) => (
                <option key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </option>
              ))
            }
          </Select>
        </GridItem>
        
        <GridItem colSpan={{ base: 12, md: 4 }}>
          <Text fontWeight="bold" mb={2}>Time Range</Text>
          <Select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </Select>
        </GridItem>
      </Grid>
      
      {/* Summary Statistics Cards */}
      <Grid templateColumns="repeat(12, 1fr)" gap={6} mb={6}>
        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <Card>
            <CardHeader>
              <Heading size="sm">Behavior Records</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stat>
                <StatNumber>{summaryData.behaviorScores.total}</StatNumber>
                <StatHelpText>
                  {summaryData.behaviorScores.positive} positive, {summaryData.behaviorScores.negative} negative
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <Card>
            <CardHeader>
              <Heading size="sm">Positive/Negative Ratio</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stat>
                <StatNumber>{positiveToNegativeRatio}</StatNumber>
                <StatHelpText>
                  Higher is better
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <Card>
            <CardHeader>
              <Heading size="sm">Awards Issued</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stat>
                <StatNumber>{summaryData.awards.total}</StatNumber>
                <StatHelpText>
                  {summaryData.awards.byType.star} stars, {summaryData.awards.byType.badge} badges
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem colSpan={{ base: 12, md: 6, lg: 3 }}>
          <Card>
            <CardHeader>
              <Heading size="sm">Parent & Student Engagement</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stat>
                <StatNumber>
                  {summaryData.parentObservations.total + summaryData.studentSelfReports.total}
                </StatNumber>
                <StatHelpText>
                  {summaryData.parentObservations.total} parent, {summaryData.studentSelfReports.total} student
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      
      {/* Tabbed Data Views */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList mb="1em">
          <Tab>Behavior Trends</Tab>
          <Tab>Awards</Tab>
          <Tab>User Engagement</Tab>
        </TabList>
        
        <TabPanels>
          {/* Behavior Trends Tab */}
          <TabPanel p={0}>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Behavior Records Over Time</Heading>
                  {renderBehaviorTimeSeriesChart()}
                </Box>
              </GridItem>
              
              <GridItem colSpan={{ base: 12 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Behavior by Moral Dimension</Heading>
                  {renderDimensionAnalysisChart()}
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Awards Tab */}
          <TabPanel p={0}>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Award Distribution by Type</Heading>
                  {renderAwardDistributionChart()}
                </Box>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Awards Over Time</Heading>
                  {!awardAnalyticsData ? (
                    <Flex justify="center" align="center" h="250px">
                      <Spinner />
                    </Flex>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={awardAnalyticsData.awards_over_time || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Awards" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* User Engagement Tab */}
          <TabPanel p={0}>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Parent Engagement</Heading>
                  {renderParentEngagementChart()}
                </Box>
              </GridItem>
              
              <GridItem colSpan={{ base: 12, md: 6 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Student Engagement</Heading>
                  {!userEngagementData || !userEngagementData.student_engagement ? (
                    <Flex justify="center" align="center" h="250px">
                      <Spinner />
                    </Flex>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={userEngagementData.student_engagement.top_engaged_students.map((student: any) => ({
                        name: `Student ${student.student_id}`,
                        reports: student.report_count,
                        approved: student.approved_count,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="reports" fill="#8884d8" name="Total Reports" />
                        <Bar dataKey="approved" fill="#82ca9d" name="Approved" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </GridItem>
              
              <GridItem colSpan={{ base: 12 }}>
                <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
                  <Heading size="sm" mb={4}>Teacher Activity</Heading>
                  {!userEngagementData || !userEngagementData.teacher_engagement ? (
                    <Flex justify="center" align="center" h="250px">
                      <Spinner />
                    </Flex>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={userEngagementData.teacher_engagement.most_active_teachers.map((teacher: any) => ({
                        name: `Teacher ${teacher.recorded_by_id}`,
                        positive: teacher.positive_count,
                        negative: teacher.negative_count,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="positive" fill="#82ca9d" name="Positive Scores" />
                        <Bar dataKey="negative" fill="#ff7875" name="Negative Scores" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default PrincipalDashboard;
