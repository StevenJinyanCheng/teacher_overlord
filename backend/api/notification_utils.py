from .models import Notification, NotificationType, CustomUser

def send_notification(user, title, message, notification_type=NotificationType.INFO, 
                      related_object_type=None, related_object_id=None):
    """
    Utility function to create a notification for a user
    
    Parameters:
    - user: The CustomUser instance or user_id to send notification to
    - title: Notification title (short)
    - message: Notification message (can be longer)
    - notification_type: One of NotificationType choices
    - related_object_type: Optional string identifying related object type
    - related_object_id: Optional ID of related object
    
    Returns:
    - The created Notification instance
    """
    # If user is an ID, get the user instance
    if isinstance(user, int):
        try:
            user = CustomUser.objects.get(id=user)
        except CustomUser.DoesNotExist:
            return None
    
    # Create notification
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_object_type=related_object_type,
        related_object_id=related_object_id
    )
    
    # In a real app, we might trigger push notifications or websocket events here
    
    return notification

def send_notification_to_role(role, title, message, notification_type=NotificationType.INFO,
                             related_object_type=None, related_object_id=None):
    """
    Send the same notification to all users with a specific role
    
    Parameters:
    - role: UserRole value to target
    - Other parameters same as send_notification
    
    Returns:
    - List of created Notification instances
    """
    users = CustomUser.objects.filter(role=role)
    notifications = []
    
    for user in users:
        notification = send_notification(
            user, title, message, notification_type,
            related_object_type, related_object_id
        )
        if notification:
            notifications.append(notification)
    
    return notifications
