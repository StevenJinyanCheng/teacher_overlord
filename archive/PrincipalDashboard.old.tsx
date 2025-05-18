import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Text,
  Flex,
  Stat,
  StatLabel,
  Spinner,
  StatNumber,
  StatHelpText,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue,
  Spinner
} from '@chakra-ui/react';
import { 
  getGrades, 
  getSchoolClasses, 
  getAwards, 
  getBehaviorScores, 
  getBehaviorScoreSummary, 
  getParentObservations,
  getStudentSelfReports,
  Grade,
  SchoolClass,
  ScoreSummary,
  getBehaviorTimeSeries,
  getAwardAnalytics,
  getUserEngagement,
  getDimensionAnalysis
} from '../services/apiService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Chart color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Chart components using recharts
const BehaviorTimeSeriesChart: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const positiveData = data?.positive_series || [];
  const negativeData = data?.negative_series || [];

  // Combine data for display
  const combinedData = positiveData.map((item, index) => {
    return {
      date: item.date,
      positive: item.count,
      negative: negativeData[index]?.count || 0,
      positivePoints: item.points,
      negativePoints: negativeData[index]?.points || 0,
    };
  });

  return (
    <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
      <Heading size="sm" mb={4}>{title}</Heading>
      {data ? (
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
      ) : (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
};

const AwardDistributionChart: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const awardsByType = data?.awards_by_type || [];

  return (
    <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
      <Heading size="sm" mb={4}>{title}</Heading>
      {data ? (
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
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {awardsByType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
};

const DimensionAnalysisChart: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  return (
    <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
      <Heading size="sm" mb={4}>{title}</Heading>
      {data ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dimension_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive_count" fill="#82ca9d" name="Positive Records" />
            <Bar dataKey="negative_count" fill="#ff7875" name="Negative Records" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
};

const UserEngagementChart: React.FC<{ data: any; title: string; type: 'parent' | 'student' | 'teacher' }> = ({ data, title, type }) => {
  let chartData = [];

  if (data) {
    if (type === 'parent' && data.parent_engagement) {
      chartData = data.parent_engagement.top_engaged_parents.map((parent) => ({
        name: `Parent ${parent.parent_id}`,
        observations: parent.observation_count,
        approved: parent.approved_count,
      }));
    } else if (type === 'student' && data.student_engagement) {
      chartData = data.student_engagement.top_engaged_students.map((student) => ({
        name: `Student ${student.student_id}`,
        reports: student.report_count,
        approved: student.approved_count,
      }));
    } else if (type === 'teacher' && data.teacher_engagement) {
      chartData = data.teacher_engagement.most_active_teachers.map((teacher) => ({
        name: `Teacher ${teacher.recorded_by_id}`,
        scores: teacher.score_count,
        positive: teacher.positive_count,
        negative: teacher.negative_count,
      }));
    }
  }

  return (
    <Box p={4} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" shadow="sm" minHeight="300px">
      <Heading size="sm" mb={4}>{title}</Heading>
      {data ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {type === 'parent' && (
              <>
                <Bar dataKey="observations" fill="#8884d8" name="Total Observations" />
                <Bar dataKey="approved" fill="#82ca9d" name="Approved Observations" />
              </>
            )}
            {type === 'student' && (
              <>
                <Bar dataKey="reports" fill="#8884d8" name="Total Self-Reports" />
                <Bar dataKey="approved" fill="#82ca9d" name="Approved Reports" />
              </>
            )}
            {type === 'teacher' && (
              <>
                <Bar dataKey="positive" fill="#82ca9d" name="Positive Scores" />
                <Bar dataKey="negative" fill="#ff7875" name="Negative Scores" />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Flex justify="center" align="center" h="250px">
          <Spinner />
        </Flex>
      )}
    </Box>
  );
};

const PrincipalDashboard: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30days');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summaryData, setSummaryData] = useState<any>({
    behaviorScores: {
      total: 0,
      positive: 0,
      negative: 0,
      summary: null as ScoreSummary | null
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
          selfReports
        ] = await Promise.all([
          getBehaviorScores(params),
          getBehaviorScoreSummary(params),
          getAwards(params),
          getParentObservations(params),
          getStudentSelfReports(params)
        ]);
        
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
  
  const averageStarRating = summaryData.awards.byType.star > 0
    ? 'N/A' // This would need calculation from actual award data
    : 'N/A';
  
  const parentObservationApprovalRate = summaryData.parentObservations.total > 0
    ? ((summaryData.parentObservations.approved / summaryData.parentObservations.total) * 100).toFixed(1)
    : 'N/A';
  
  const selfReportApprovalRate = summaryData.studentSelfReports.total > 0
    ? ((summaryData.studentSelfReports.approved / summaryData.studentSelfReports.total) * 100).toFixed(1)
    : 'N/A';
  
  return (
    <Container maxW="container.xl" py={5}>
      <Heading as="h1" size="lg" mb={6}>Principal Analytics Dashboard</Heading>
      
      {/* Filters */}
      <Flex mb={6} gap={4} wrap="wrap">
        <Box>
          <Text fontWeight="bold" mb={1}>Grade</Text>
          <Select 
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            minW="150px"
          >
            <option value="all">All Grades</option>
            {grades.map(grade => (
              <option key={grade.id} value={grade.id.toString()}>
                {grade.name}
              </option>
            ))}
          </Select>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={1}>Class</Text>
          <Select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            minW="150px"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id.toString()}>
                {cls.name}
              </option>
            ))}
          </Select>
        </Box>
        
        <Box>
          <Text fontWeight="bold" mb={1}>Time Range</Text>
          <Select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            minW="150px"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </Select>
        </Box>
      </Flex>
      
      {/* Summary Cards */}
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={8}>
        <GridItem>
          <Card>
            <CardHeader pb={0}>
              <Heading size="md">Behavior Scores</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Total Records</StatLabel>
                <StatNumber>{summaryData.behaviorScores.total}</StatNumber>
                <StatHelpText>
                  Positive: {summaryData.behaviorScores.positive} | 
                  Negative: {summaryData.behaviorScores.negative}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardHeader pb={0}>
              <Heading size="md">Awards</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Total Awards</StatLabel>
                <StatNumber>{summaryData.awards.total}</StatNumber>
                <StatHelpText>
                  Stars: {summaryData.awards.byType.star} | 
                  Badges: {summaryData.awards.byType.badge}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardHeader pb={0}>
              <Heading size="md">Parent Observations</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Total Submissions</StatLabel>
                <StatNumber>{summaryData.parentObservations.total}</StatNumber>
                <StatHelpText>
                  Approval Rate: {parentObservationApprovalRate}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card>
            <CardHeader pb={0}>
              <Heading size="md">Self Reports</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Total Reports</StatLabel>
                <StatNumber>{summaryData.studentSelfReports.total}</StatNumber>
                <StatHelpText>
                  Approval Rate: {selfReportApprovalRate}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      
      {/* Dashboard Tabs with Chart Visualizations */}
      <Tabs variant="enclosed" isFitted>
        <TabList mb="1em">
          <Tab>Behavior Analytics</Tab>
          <Tab>Award Metrics</Tab>
          <Tab>Observation Insights</Tab>
        </TabList>
        
        <TabPanels>
          {/* Behavior Analytics Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(2, 1fr)" }} gap={6}>
              <GridItem>
                <LineChart 
                  data={summaryData.behaviorScores} 
                  title="Behavior Score Trends" 
                />
              </GridItem>
              <GridItem>
                <BarChart 
                  data={summaryData.behaviorScores.summary?.dimension_scores} 
                  title="Scores by Dimension" 
                />
              </GridItem>
              <GridItem colSpan={{ base: 1, lg: 2 }}>
                <LineChart 
                  data={{}} 
                  title="Positive vs Negative Trend" 
                />
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Award Metrics Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(2, 1fr)" }} gap={6}>
              <GridItem>
                <PieChart 
                  data={summaryData.awards.byType} 
                  title="Award Type Distribution" 
                />
              </GridItem>
              <GridItem>
                <LineChart 
                  data={{}} 
                  title="Award Trend Over Time" 
                />
              </GridItem>
              <GridItem>
                <BarChart 
                  data={{}} 
                  title="Awards by Grade" 
                />
              </GridItem>
              <GridItem>
                <BarChart 
                  data={{}} 
                  title="Star Rating Distribution" 
                />
              </GridItem>
            </Grid>
          </TabPanel>
          
          {/* Observation Insights Tab */}
          <TabPanel px={0}>
            <Grid templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(2, 1fr)" }} gap={6}>
              <GridItem>
                <LineChart 
                  data={{}} 
                  title="Parent Observation Trend" 
                />
              </GridItem>
              <GridItem>
                <PieChart 
                  data={{}} 
                  title="Observation Status Breakdown" 
                />
              </GridItem>
              <GridItem>
                <LineChart 
                  data={{}} 
                  title="Self Report Submissions" 
                />
              </GridItem>
              <GridItem>
                <BarChart 
                  data={{}} 
                  title="Top Reporters by Class" 
                />
              </GridItem>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default PrincipalDashboard;
