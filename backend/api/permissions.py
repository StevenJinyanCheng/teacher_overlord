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

class IsMoralEducationSupervisor(BasePermission):
    """
    Custom permission to only allow Moral Education Supervisors to access an object.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated and is a Moral Education Supervisor or System Admin (admins can do everything)
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.MORAL_EDUCATION_SUPERVISOR or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

class IsPrincipal(BasePermission):
    """
    Custom permission to only allow Principals to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.PRINCIPAL or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

class IsDirector(BasePermission):
    """
    Custom permission to only allow Directors to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.DIRECTOR or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

class IsTeachingTeacher(BasePermission):
    """
    Custom permission to only allow Teaching Teachers to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.TEACHING_TEACHER or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR or \
                request.user.role == UserRole.PRINCIPAL or \
                request.user.role == UserRole.DIRECTOR)

class IsClassTeacher(BasePermission):
    """
    Custom permission to only allow Class Teachers to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.CLASS_TEACHER or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR or \
                request.user.role == UserRole.PRINCIPAL or \
                request.user.role == UserRole.DIRECTOR)

class IsParent(BasePermission):
    """
    Custom permission to only allow Parents to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.PARENT or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

class IsStudent(BasePermission):
    """
    Custom permission to only allow Students to access an object.
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role == UserRole.STUDENT or \
                request.user.role == UserRole.SYSTEM_ADMINISTRATOR)

class CanManageUsers(BasePermission):
    """
    Permission class for users who can manage user accounts.
    According to the permission table, these are: System Admin, Principal, Director
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role in [UserRole.SYSTEM_ADMINISTRATOR, 
                                      UserRole.PRINCIPAL, 
                                      UserRole.DIRECTOR])

class CanScoreStudents(BasePermission):
    """
    Permission class for users who can score students.
    According to the permission table, these are: System Admin, Principal, Director,
    Moral Education Supervisor, Teaching Teacher, Class Teacher
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role in [UserRole.SYSTEM_ADMINISTRATOR, 
                                      UserRole.PRINCIPAL, 
                                      UserRole.DIRECTOR,
                                      UserRole.MORAL_EDUCATION_SUPERVISOR,
                                      UserRole.TEACHING_TEACHER,
                                      UserRole.CLASS_TEACHER])

class CanConfigureRules(BasePermission):
    """
    Permission class for users who can configure moral education rules.
    According to the permission table, these are: System Admin, Moral Education Supervisor
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role in [UserRole.SYSTEM_ADMINISTRATOR, 
                                      UserRole.MORAL_EDUCATION_SUPERVISOR])

class CanExportReports(BasePermission):
    """
    Permission class for users who can export reports.
    According to the permission table, these are: System Admin, Principal, Director,
    Moral Education Supervisor, Class Teacher
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role in [UserRole.SYSTEM_ADMINISTRATOR, 
                                      UserRole.PRINCIPAL, 
                                      UserRole.DIRECTOR,
                                      UserRole.MORAL_EDUCATION_SUPERVISOR,
                                      UserRole.CLASS_TEACHER])

class CanAdministerClasses(BasePermission):
    """
    Permission class for users who can administer classes.
    According to the permission table, these are: System Admin, Principal, Director,
    Teaching Teacher, Class Teacher
    """
    def has_permission(self, request, view):
        return request.user and \
               request.user.is_authenticated and \
               (request.user.role in [UserRole.SYSTEM_ADMINISTRATOR, 
                                      UserRole.PRINCIPAL, 
                                      UserRole.DIRECTOR,
                                      UserRole.TEACHING_TEACHER,
                                      UserRole.CLASS_TEACHER])
