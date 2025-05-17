import apiClient from './apiService';

// Notification Interfaces
export interface Notification {
  id: number;
  user: number;
  user_name?: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  notification_type_display?: string;
  related_object_type?: string | null;
  related_object_id?: number | null;
  is_read: boolean;
  created_at: string;
}

// Notification API Functions
export const getNotifications = async (params?: any): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  try {
    const response = await apiClient.get('/notifications/', { 
      params: { is_read: false, limit: 100 } 
    });
    return response.data.length;
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (id: number): Promise<void> => {
  try {
    await apiClient.patch(`/notifications/${id}/mark-read/`, {});
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await apiClient.post('/notifications/mark-all-read/', {});
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
