from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import (CustomUser, Grade, SchoolClass, RuleChapter, RuleDimension, RuleSubItem, 
                    StudentParentRelationship, BehaviorScore, ParentObservation, StudentSelfReport, 
                    Award, Notification, NotificationType) # Added Notification models

# Define SchoolClassSerializer before UserSerializer
class SchoolClassSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    class_type_display = serializers.CharField(source='get_class_type_display', read_only=True)
    class_teachers_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'grade', 'grade_name', 'class_type', 'class_type_display', 
                  'class_teachers', 'class_teachers_details']
    
    def get_class_teachers_details(self, obj):
        # Return basic details about assigned class teachers
        return [{'id': teacher.id, 
                'username': teacher.username, 
                'full_name': f"{teacher.first_name} {teacher.last_name}".strip()} 
                for teacher in obj.class_teachers.all()]

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ['id', 'name', 'description']

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    # Use the now defined SchoolClassSerializer
    school_class_details = SchoolClassSerializer(source='school_class', read_only=True)
    school_class = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(),
        allow_null=True,
        required=False,
        # Ensure this field is not written when school_class_details is used for representation
        # but it should be writeable for input
    )
    # Add teaching classes for Teaching Teachers
    teaching_classes_details = SchoolClassSerializer(source='teaching_classes', many=True, read_only=True)
    teaching_classes = serializers.PrimaryKeyRelatedField(
        queryset=SchoolClass.objects.all(),
        many=True,
        required=False
    )
    # Add child relationships for parents
    children = serializers.SerializerMethodField(read_only=True)
    # Add parent relationships for students
    parents = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display',
            'school_class', # ID for writing
            'school_class_details', # Nested object for reading
            'teaching_classes', # IDs for writing
            'teaching_classes_details', # Nested objects for reading
            'children', # For parents
            'parents', # For students
            'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }
    
    def get_children(self, obj):
        # Only return children if user is a parent
        if obj.role != 'parent':
            return []
        
        relationships = obj.student_relationships.all()
        return [
            {
                'id': rel.student.id,
                'username': rel.student.username,
                'full_name': f"{rel.student.first_name} {rel.student.last_name}".strip(),
                'school_class': {
                    'id': rel.student.school_class.id if rel.student.school_class else None,
                    'name': rel.student.school_class.name if rel.student.school_class else None
                } if rel.student.school_class else None
            }
            for rel in relationships
        ]
    
    def get_parents(self, obj):
        # Only return parents if user is a student
        if obj.role != 'student':
            return []
        
        relationships = obj.parent_relationships.all()
        return [
            {
                'id': rel.parent.id,
                'username': rel.parent.username,
                'full_name': f"{rel.parent.first_name} {rel.parent.last_name}".strip()
            }
            for rel in relationships
        ]

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # If 'school_class' is explicitly passed (even as None), update it.
        # If it's not in validated_data, school_class remains unchanged.
        if 'school_class' in validated_data:
            instance.school_class = validated_data.pop('school_class', instance.school_class)
        elif self.partial and 'school_class' not in validated_data:
            # For PATCH requests, if school_class is not provided, do not change it.
            pass # school_class remains instance.school_class
        else:
            # For PUT requests where school_class is not provided, it implies unsetting it (if nullable)
            instance.school_class = None 

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

class RuleSubItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RuleSubItem
        fields = ['id', 'name', 'description', 'dimension', 'max_score']

class RuleDimensionSerializer(serializers.ModelSerializer):
    sub_items = RuleSubItemSerializer(many=True, read_only=True, source='rulesubitem_set') # For nested listing

    class Meta:
        model = RuleDimension
        fields = ['id', 'name', 'description', 'chapter', 'sub_items']

class RuleChapterSerializer(serializers.ModelSerializer):
    dimensions = RuleDimensionSerializer(many=True, read_only=True, source='ruledimension_set') # For nested listing

    class Meta:
        model = RuleChapter
        fields = ['id', 'name', 'description', 'dimensions']

# Add serializer for StudentParentRelationship
class StudentParentRelationshipSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')
    parent_username = serializers.ReadOnlyField(source='parent.username')
    student_name = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentParentRelationship
        fields = ['id', 'student', 'student_username', 'student_name', 
                 'parent', 'parent_username', 'parent_name']
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
    
    def get_parent_name(self, obj):
        return f"{obj.parent.first_name} {obj.parent.last_name}".strip()

# Serializers for behavior tracking and awards
class BehaviorScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    recorder_name = serializers.SerializerMethodField()
    rule_name = serializers.ReadOnlyField(source='rule_sub_item.name')
    dimension_name = serializers.ReadOnlyField(source='rule_sub_item.dimension.name')
    chapter_name = serializers.ReadOnlyField(source='rule_sub_item.dimension.chapter.name')
    score_type_display = serializers.ReadOnlyField(source='get_score_type_display')
    school_class_name = serializers.ReadOnlyField(source='school_class.name')
    
    class Meta:
        model = BehaviorScore
        fields = [
            'id', 'student', 'student_name', 'rule_sub_item', 'rule_name',
            'dimension_name', 'chapter_name', 'recorded_by', 'recorder_name',
            'school_class', 'school_class_name', 'score_type', 'score_type_display',
            'points', 'comment', 'created_at', 'date_of_behavior'
        ]
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
    
    def get_recorder_name(self, obj):
        return f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()

class ParentObservationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    parent_name = serializers.SerializerMethodField()
    rule_name = serializers.ReadOnlyField(source='rule_sub_item.name', default=None)
    reviewer_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = ParentObservation
        fields = [
            'id', 'student', 'student_name', 'parent', 'parent_name',
            'rule_sub_item', 'rule_name', 'description', 'created_at',
            'date_of_behavior', 'status', 'status_display',
            'reviewed_by', 'reviewer_name', 'reviewed_at'
        ]
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
    
    def get_parent_name(self, obj):
        return f"{obj.parent.first_name} {obj.parent.last_name}".strip()
    
    def get_reviewer_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return None
    
    def get_status_display(self, obj):
        status_map = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected'
        }
        return status_map.get(obj.status, obj.status)

class StudentSelfReportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    rule_name = serializers.ReadOnlyField(source='rule_sub_item.name', default=None)
    reviewer_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentSelfReport
        fields = [
            'id', 'student', 'student_name', 'rule_sub_item', 'rule_name',
            'description', 'created_at', 'date_of_behavior', 'status',
            'status_display', 'reviewed_by', 'reviewer_name', 'reviewed_at'
        ]
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
    
    def get_reviewer_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return None
    
    def get_status_display(self, obj):
        status_map = {
            'pending': 'Pending Review',
            'approved': 'Approved',
            'rejected': 'Rejected'
        }
        return status_map.get(obj.status, obj.status)

class AwardSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    awarder_name = serializers.SerializerMethodField()
    award_type_display = serializers.ReadOnlyField(source='get_award_type_display')
    
    class Meta:
        model = Award
        fields = [
            'id', 'student', 'student_name', 'name', 'description',
            'award_type', 'award_type_display', 'level', 'awarded_by',
            'awarder_name', 'created_at', 'award_date'
        ]
    
    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip()
    def get_awarder_name(self, obj):
        if obj.awarded_by:
            return f"{obj.awarded_by.first_name} {obj.awarded_by.last_name}".strip()
        return None

class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.ReadOnlyField(source='get_notification_type_display')
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_name', 'title', 'message', 
            'notification_type', 'notification_type_display', 
            'related_object_type', 'related_object_id',
            'is_read', 'created_at'
        ]
        read_only_fields = ['user', 'user_name']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
