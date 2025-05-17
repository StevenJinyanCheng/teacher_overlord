// Reporting API Interfaces
export interface TimeSeriesPoint {
  date: string;
  count: number;
  points: number;
}

export interface BehaviorTimeSeries {
  positive_series: TimeSeriesPoint[];
  negative_series: TimeSeriesPoint[];
}

export interface AwardTypeDistribution {
  award_type: string;
  count: number;
}

export interface StarRatingDistribution {
  level: number;
  count: number;
}

export interface TopStudent {
  student_id: number;
  student_name: string;
  count: number;
}

export interface AwardOverTime {
  month: string;
  count: number;
}

export interface AwardAnalytics {
  awards_by_type: AwardTypeDistribution[];
  star_distribution: StarRatingDistribution[];
  top_students: TopStudent[];
  awards_over_time: AwardOverTime[];
}

export interface ParentEngagement {
  total_observations: number;
  active_parents: number;
  approval_rate: number;
  top_engaged_parents: {
    parent_id: number;
    observation_count: number;
    approved_count: number;
    rejection_rate: number;
  }[];
}

export interface StudentEngagement {
  total_reports: number;
  active_students: number;
  approval_rate: number;
  top_engaged_students: {
    student_id: number;
    report_count: number;
    approved_count: number;
    rejection_rate: number;
  }[];
}

export interface TeacherEngagement {
  total_scores: number;
  active_teachers: number;
  positive_negative_ratio: number;
  most_active_teachers: {
    recorded_by_id: number;
    score_count: number;
    positive_count: number;
    negative_count: number;
  }[];
}

export interface UserEngagementReport {
  parent_engagement: ParentEngagement;
  student_engagement: StudentEngagement;
  teacher_engagement: TeacherEngagement;
}

export interface DimensionAnalysis {
  dimension_id: number;
  dimension_name: string;
  positive_count: number;
  negative_count: number;
  positive_points: number;
  negative_points: number;
  net_points: number;
  total_records: number;
}

// Reporting API Functions
export const getBehaviorTimeSeries = async (params?: any): Promise<BehaviorTimeSeries> => {
  try {
    const response = await apiClient.get('/reports/behavior-time-series/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching behavior time series:', error);
    throw error;
  }
};

export const getAwardAnalytics = async (params?: any): Promise<AwardAnalytics> => {
  try {
    const response = await apiClient.get('/reports/award-analytics/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching award analytics:', error);
    throw error;
  }
};

export const getUserEngagement = async (params?: any): Promise<UserEngagementReport> => {
  try {
    const response = await apiClient.get('/reports/user-engagement/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching user engagement report:', error);
    throw error;
  }
};

export const getDimensionAnalysis = async (params?: any): Promise<DimensionAnalysis[]> => {
  try {
    const response = await apiClient.get('/reports/dimension-analysis/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dimension analysis:', error);
    throw error;
  }
};
