import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Icon,
  Badge,
  VStack,
  Text,
  Divider,
  HStack,
  IconButton,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FaBell, FaCheck } from 'react-icons/fa';
import type { Notification } from '../services/apiService';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadNotificationsCount
} from '../services/apiService';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Colors for notification types
  const colorMap = {
    info: 'blue',
    success: 'green',
    warning: 'orange',
    error: 'red'
  };
  
  // Background colors for notification items
  const unreadBgColor = useColorModeValue('gray.50', 'gray.700');
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (60 * 1000));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / (24 * 60));
      if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      } else {
        // For older notifications, show the actual date
        return date.toLocaleDateString();
      }
    }
  };
  
  return (
    <Popover placement="bottom-end" closeOnBlur={true}>
      {({ isOpen, onClose }) => (
        <>
          <PopoverTrigger>
            <Box position="relative" display="inline-block">              <IconButton
                aria-label="Notifications"
                variant="ghost"
                fontSize="20px"
                onClick={() => {
                  if (!isOpen) {
                    fetchNotifications(); // Refresh notifications when opening
                  }
                }}
              >
                <FaBell />
              </IconButton>
              {unreadCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-5px"
                  right="-5px"
                  fontSize="xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Box>
          </PopoverTrigger>
          <PopoverContent width={{ base: '300px', md: '380px' }}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader fontWeight="bold" p={4}>
              Notifications
            </PopoverHeader>
            <PopoverBody p={0} maxHeight="400px" overflowY="auto">
              {isLoading ? (
                <Box p={4} textAlign="center">
                  <Text>Loading notifications...</Text>
                </Box>
              ) : notifications.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Text color="gray.500">No notifications</Text>
                </Box>
              ) : (                <VStack gap={0} alignItems="stretch">
                  {notifications.map((notification) => (
                    <Box 
                      key={notification.id}
                      p={4}
                      borderBottomWidth="1px"
                      bg={notification.is_read ? 'transparent' : unreadBgColor}
                      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
                    >
                      <HStack justify="space-between" mb={1}>
                        <HStack>
                          <Badge colorScheme={colorMap[notification.notification_type]}>
                            {notification.notification_type_display || notification.notification_type}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(notification.created_at)}
                          </Text>
                        </HStack>
                        {!notification.is_read && (
                          // Tooltip replaced with title attribute
                          <IconButton
                          aria-label="Mark as read"
                          size="xs"
                          variant="ghost"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          icon={<FaCheck />}
                          title="Mark as read"
                          />
                        )}
                      </HStack>
                      <Text fontWeight="bold" fontSize="sm">
                        {notification.title}
                      </Text>
                      <Text fontSize="sm" noOfLines={2}>
                        {notification.message}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </PopoverBody>
            <PopoverFooter p={2}>
              <Button
                size="sm"
                variant="ghost"
                width="100%"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default NotificationCenter;
