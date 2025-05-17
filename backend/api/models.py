from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    STUDENT = 'student', 'Student'
    PARENT = 'parent', 'Parent'
    TEACHING_TEACHER = 'teaching_teacher', 'Teaching Teacher'
    CLASS_TEACHER = 'class_teacher', 'Class Teacher'
    MORAL_EDUCATION_SUPERVISOR = 'moral_education_supervisor', 'Moral Education Supervisor'
    PRINCIPAL = 'principal', 'Principal'
    DIRECTOR = 'director', 'Director'
    SYSTEM_ADMINISTRATOR = 'system_administrator', 'System Administrator'

class ClassType(models.TextChoices):
    HOME_CLASS = 'home_class', 'Home Class'
    SUBJECT_CLASS = 'subject_class', 'Subject Class'

class CustomUser(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.STUDENT, # Or another sensible default
    )
    # For students - their home class assignment
    school_class = models.ForeignKey(
        'SchoolClass',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        help_text="The home class a student belongs to, if applicable."
    )
    # For teaching teachers - classes they teach (Subject-Classes)
    teaching_classes = models.ManyToManyField(
        'SchoolClass',
        related_name='teaching_teachers',
        blank=True,
        help_text="Subject classes taught by this teaching teacher."
    )
    # Add any other fields common to all users, if any
    # e.g., profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

# You might want to create separate models for StudentProfile, TeacherProfile, etc.
# if they have significantly different fields, and link them to CustomUser with a OneToOneField.
# For now, we'll keep it simple with just the role on the CustomUser model.

class Grade(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    # Add other fields if necessary, e.g., level for ordering
    # level = models.IntegerField(unique=True, null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name'] # Or ['level'] if you add a level field

# Model for School Classes
class SchoolClass(models.Model):
    name = models.CharField(max_length=100)
    grade = models.ForeignKey(Grade, related_name='classes', on_delete=models.CASCADE)
    class_type = models.CharField(
        max_length=20,
        choices=ClassType.choices,
        default=ClassType.HOME_CLASS
    )
    # Add relationship for class teachers - m2m since multiple teachers can be assigned to a class
    class_teachers = models.ManyToManyField(
        'CustomUser',
        related_name='led_classes',
        blank=True,
        limit_choices_to={'role': UserRole.CLASS_TEACHER}
    )

    def __str__(self):
        return f"{self.name} ({self.grade.name}) - {self.get_class_type_display()}"

    class Meta:
        unique_together = ('name', 'grade')
        ordering = ['grade__name', 'name']

# Moral Education Rule Configuration Models

# Model to represent the relationship between students and their parents
class StudentParentRelationship(models.Model):
    student = models.ForeignKey(
        CustomUser,
        related_name='parent_relationships',
        on_delete=models.CASCADE,
        limit_choices_to={'role': UserRole.STUDENT}
    )
    parent = models.ForeignKey(
        CustomUser,
        related_name='student_relationships',
        on_delete=models.CASCADE,
        limit_choices_to={'role': UserRole.PARENT}
    )

    class Meta:
        unique_together = ('student', 'parent')
        verbose_name = "Student-Parent Relationship"
        verbose_name_plural = "Student-Parent Relationships"

    def __str__(self):
        return f"{self.student.username} - {self.parent.username}"

class RuleChapter(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Order in which chapters are displayed")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['order', 'name']

class RuleDimension(models.Model):
    chapter = models.ForeignKey(RuleChapter, related_name='dimensions', on_delete=models.CASCADE)
    name = models.CharField(max_length=200, help_text="A core dimension, e.g., 'Respect and Courtesy'")
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Order of dimension within the chapter")

    def __str__(self):
        return f"{self.chapter.name} - {self.name}"

    class Meta:
        unique_together = ('chapter', 'name')
        ordering = ['chapter', 'order', 'name']

class RuleSubItem(models.Model):
    dimension = models.ForeignKey(RuleDimension, related_name='sub_items', on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="Specific rule or behavior, e.g., 'Greets teachers and elders'")
    description = models.TextField(blank=True)
    # points = models.IntegerField(default=0, help_text="Points associated with this rule, if applicable")
    order = models.PositiveIntegerField(default=0, help_text="Order of sub-item within the dimension")

    def __str__(self):
        return f"{self.dimension.name} - {self.name}"

    class Meta:
        unique_together = ('dimension', 'name')
        ordering = ['dimension', 'order', 'name']
