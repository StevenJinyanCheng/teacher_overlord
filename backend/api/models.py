from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    STUDENT = 'student', 'Student'
    PARENT = 'parent', 'Parent'
    TEACHING_TEACHER = 'teaching_teacher', 'Teaching Teacher'
    CLASS_TEACHER = 'class_teacher', 'Class Teacher'
    MORAL_EDUCATION_SUPERVISOR = 'moral_education_supervisor', 'Moral Education Supervisor'
    PRINCIPAL_DIRECTOR = 'principal_director', 'Principal & Director'
    SYSTEM_ADMINISTRATOR = 'system_administrator', 'System Administrator'

class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.STUDENT, # Or another sensible default
    )
    # Add any other fields common to all users, if any
    # e.g., profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

# You might want to create separate models for StudentProfile, TeacherProfile, etc.
# if they have significantly different fields, and link them to CustomUser with a OneToOneField.
# For now, we'll keep it simple with just the role on the CustomUser model.
