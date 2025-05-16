from rest_framework.permissions import BasePermission
from .models import UserRole

class IsSystemAdmin(BasePermission):
    """
    Allows access only to system administrators.
    """
    def has_permission(self, request, view):
        return bool(request.user and 
                    request.user.is_authenticated and 
                    request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

# You can add other role-based permissions here, e.g.:
# class IsTeacher(BasePermission): ...
# class IsStudent(BasePermission): ...
