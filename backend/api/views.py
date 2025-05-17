from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view, action
from rest_framework import viewsets, permissions, status, filters # Added filters
from rest_framework.response import Response
from .models import (CustomUser, Grade, SchoolClass, RuleChapter, RuleDimension, 
                    RuleSubItem, StudentParentRelationship, BehaviorScore,
                    ParentObservation, StudentSelfReport, Award, UserRole, ScoreType) # Added new models
from .serializers import (UserSerializer, GradeSerializer, SchoolClassSerializer, 
                         RuleChapterSerializer, RuleDimensionSerializer, RuleSubItemSerializer,
                         StudentParentRelationshipSerializer, BehaviorScoreSerializer,
                         ParentObservationSerializer, StudentSelfReportSerializer,
                         AwardSerializer) # Added new serializers
from .permissions import (IsSystemAdmin, IsMoralEducationSupervisor, IsPrincipal, IsDirector,
                         IsTeachingTeacher, IsClassTeacher, IsParent, IsStudent,
                         CanManageUsers, CanScoreStudents, CanConfigureRules,
                         CanExportReports, CanAdministerClasses) # Added all permission classes
import csv
import io
from rest_framework.parsers import MultiPartParser # Added MultiPartParser
from django.utils import timezone
from datetime import datetime

# Create your views here.

# @api_view(['GET'])
# def hello_world(request):
#     return JsonResponse({"message": "Hello, world from Django!"})

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = CustomUser.objects.all().order_by('id')
    serializer_class = UserSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'promote_demote_students']:
            self.permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]
        elif self.action in ['list', 'retrieve', 'export_users', 'import_users']:
            # Allow any authenticated user to list/retrieve, or restrict to IsSystemAdmin if needed
            self.permission_classes = [permissions.IsAuthenticated] 
        # The 'me' action has its permissions set by its decorator.
        # For any other custom actions, they should define their own permissions or fall back to a default.
        return super().get_permissions()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Return the authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='export')
    def export_users(self, request):
        response = HttpResponse(
            content_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename="users.csv"'},
        )
        users = self.get_queryset() # Use the viewset's queryset
        serializer = self.get_serializer(users, many=True) # Use the viewset's serializer
        user_data = serializer.data

        writer = csv.writer(response)
        # Write header row - use serializer fields, but exclude sensitive/complex ones for CSV
        # Or define specific fields for export
        header_fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'role_display', 
            'school_class', # This is the ID
            'school_class_name', 'school_class_grade_name',
            'password' # Added password to header for template, though it won't be exported
        ]
        writer.writerow(header_fields)

        for user_item in user_data: # Renamed user to user_item to avoid conflict
            school_class_details = user_item.get('school_class_details')
            writer.writerow([
                user_item.get('id'),
                user_item.get('username'),
                user_item.get('email'),
                user_item.get('first_name'),
                user_item.get('last_name'),
                user_item.get('role'),
                user_item.get('role_display'),
                user_item.get('school_class'), 
                school_class_details.get('name') if school_class_details else None,
                school_class_details.get('grade_name') if school_class_details else None,
                '' # Placeholder for password column in exported CSV
            ])
        return response

    @action(detail=False, methods=['post'], url_path='import', parser_classes=[MultiPartParser])
    def import_users(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file_obj.read().decode('utf-8-sig') # Use utf-8-sig to handle potential BOM
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            if not reader.fieldnames:
                 return Response({'error': 'CSV file is empty or headers are missing.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        results = {'created': 0, 'updated': 0, 'errors': []}
        valid_roles = dict(CustomUser.ROLE_CHOICES).keys()

        for row_num, row in enumerate(reader, 1):
            username = row.get('username')
            if not username:
                results['errors'].append(f"Row {row_num}: Missing username.")
                continue

            role_str = row.get('role')
            if not role_str or role_str not in valid_roles:
                results['errors'].append(f"Row {row_num} (User: {username}): Invalid or missing role '{role_str}'. Must be one of {list(valid_roles)}.")
                continue
            
            user_data = {
                'username': username,
                'email': row.get('email', ''),
                'first_name': row.get('first_name', ''),
                'last_name': row.get('last_name', ''),
                'role': role_str,
            }

            password = row.get('password')
            if password and password.strip(): # Only include password if provided and not just whitespace
                user_data['password'] = password
            
            if role_str == CustomUser.UserRole.STUDENT:
                school_class_id_str = row.get('school_class') # Matches the export field name for class ID
                if school_class_id_str and school_class_id_str.strip():
                    try:
                        class_id = int(school_class_id_str)
                        if SchoolClass.objects.filter(id=class_id).exists():
                            user_data['school_class'] = class_id
                        else:
                            results['errors'].append(f"Row {row_num} (User: {username}): SchoolClass with ID {school_class_id_str} not found.")
                            continue
                    except ValueError:
                        results['errors'].append(f"Row {row_num} (User: {username}): Invalid school_class ID '{school_class_id_str}'.")
                        continue
                else: # school_class_id_str is empty or None for a student
                    user_data['school_class'] = None 
            
            try:
                user_instance = CustomUser.objects.filter(username=username).first()
                
                if user_instance: # Existing user
                    serializer = UserSerializer(user_instance, data=user_data, partial=True)
                    if serializer.is_valid():
                        serializer.save()
                        results['updated'] += 1
                    else:
                        error_detail = "; ".join([f"{k}: {str(v[0])}" for k, v in serializer.errors.items()])
                        results['errors'].append(f"Row {row_num} (User: {username}): Update failed. {error_detail}")
                else: # New user
                    if 'password' not in user_data or not user_data['password']:
                        results['errors'].append(f"Row {row_num} (User: {username}): Password is required for new user and was not provided or was empty.")
                        continue
                    
                    serializer = UserSerializer(data=user_data)
                    if serializer.is_valid():
                        serializer.save()
                        results['created'] += 1
                    else:
                        error_detail = "; ".join([f"{k}: {str(v[0])}" for k, v in serializer.errors.items()])
                        results['errors'].append(f"Row {row_num} (User: {username}): Create failed. {error_detail}")
            except Exception as e:
                results['errors'].append(f"Row {row_num} (User: {username}): Unexpected error. {str(e)}")

        if not results['created'] and not results['updated'] and not results['errors']:
            return Response({'message': 'CSV file was empty or contained no data rows.'}, status=status.HTTP_200_OK)
        
        return Response(results, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=['post'], url_path='promote-demote')
    def promote_demote_students(self, request):
        """
        Promote or demote students between grades by updating their school_class.
        
        Expected format:
        {
            "source_grade_id": 1,  # Optional: Filter students by source grade
            "source_class_id": 2,  # Optional: Filter students by source class
            "target_grade_id": 3,  # Required for promotions/demotions across grades
            "target_class_id": 4,  # Required: The new class to assign students to
            "student_ids": [1, 2, 3]  # Required: List of student IDs to update
        }
        """
        source_grade_id = request.data.get('source_grade_id')
        source_class_id = request.data.get('source_class_id')
        target_grade_id = request.data.get('target_grade_id')
        target_class_id = request.data.get('target_class_id')
        student_ids = request.data.get('student_ids', [])
        
        if not student_ids:
            return Response({'error': 'No students specified for promotion/demotion.'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        if not target_class_id:
            return Response({'error': 'Target class ID is required.'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_class = SchoolClass.objects.get(id=target_class_id)
        except SchoolClass.DoesNotExist:
            return Response({'error': f'Target class with ID {target_class_id} does not exist.'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Query for students, filtered by role and optionally by source grade/class
        students_query = CustomUser.objects.filter(
            id__in=student_ids, 
            role=CustomUser.UserRole.STUDENT
        )
        
        if source_class_id:
            students_query = students_query.filter(school_class_id=source_class_id)
        elif source_grade_id:
            # If source_grade_id is provided but not source_class_id,
            # filter students by classes that belong to the source grade
            class_ids = SchoolClass.objects.filter(grade_id=source_grade_id).values_list('id', flat=True)
            students_query = students_query.filter(school_class_id__in=class_ids)
        
        # Get the actual students
        students = list(students_query)
        
        if not students:
            return Response({'error': 'No matching students found with the provided criteria.'},
                           status=status.HTTP_404_NOT_FOUND)
        
        # Update the students' class assignment
        updated_count = 0
        errors = []
        
        for student in students:
            student.school_class = target_class
            try:
                student.save()
                updated_count += 1
            except Exception as e:
                errors.append(f"Failed to update student {student.username}: {str(e)}")
        
        results = {
            'success': True,
            'updated_count': updated_count,
            'errors': errors,
            'message': f'{updated_count} students successfully moved to class {target_class.name} in grade {target_class.grade.name}'
        }
        
        return Response(results, status=status.HTTP_200_OK)

class GradeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows grades to be viewed or edited.
    Only accessible by System Administrators.
    """
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin] # Updated permissions
    
    def create(self, request, *args, **kwargs):
        """
        Override create method to add more detailed error handling
        """
        print(f"Creating grade with data: {request.data}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User role: {request.user.role}")
        print(f"Is system admin: {request.user.role == 'system_administrator'}")
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Grade creation error: {str(e)}")
            return Response(
                {"detail": f"Grade creation failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

# ViewSet for SchoolClass
class SchoolClassViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows school classes to be viewed or edited.
    Create/Edit/Delete accessible by System Administrators,
    List/Retrieve accessible by various roles based on permissions.
    """
    queryset = SchoolClass.objects.all().select_related('grade') # Optimize by selecting related grade
    serializer_class = SchoolClassSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'grade__name']
    ordering_fields = ['name', 'grade__name']

    def get_permissions(self):
        """
        Customize permissions based on action:
        - Create/Update/Delete: System Admins only
        - List/Retrieve: Any authenticated user who can administer classes
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]
        else:  # 'list', 'retrieve'
            permission_classes = [permissions.IsAuthenticated, CanAdministerClasses]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Customize queryset based on user role:
        - System admins, principals, directors see all classes
        - Teaching teachers see their assigned teaching classes
        - Class teachers see their assigned home classes
        - Students see their own class and classes they're enrolled in
        """
        from .models import UserRole  # Import UserRole here
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by class_type if specified in query params
        class_type = self.request.query_params.get('class_type', None)
        if class_type:
            queryset = queryset.filter(class_type=class_type)
        
        # Apply user-specific filtering
        if user.role in [UserRole.SYSTEM_ADMINISTRATOR, UserRole.PRINCIPAL, UserRole.DIRECTOR]:
            return queryset
        elif user.role == UserRole.TEACHING_TEACHER:
            return user.teaching_classes.all()
        elif user.role == UserRole.CLASS_TEACHER:
            return user.led_classes.all()
        elif user.role == UserRole.STUDENT:
            # Get student's home class and all subject classes they're enrolled in
            # This will need to be expanded when implementing subject class enrollment
            if user.school_class:
                return queryset.filter(id=user.school_class.id)
            return SchoolClass.objects.none()
        else:
            return SchoolClass.objects.none()

# ViewSet for RuleChapter
class RuleChapterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule chapters to be viewed or edited.
    Accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleChapter.objects.all().prefetch_related('ruledimension_set__rulesubitem_set')
    serializer_class = RuleChapterSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['id', 'name']
    ordering = ['id']  # Default ordering

# ViewSet for RuleDimension
class RuleDimensionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule dimensions to be viewed or edited.
    Accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleDimension.objects.all().prefetch_related('rulesubitem_set')
    serializer_class = RuleDimensionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['id', 'name', 'chapter__name']
    ordering = ['chapter__id', 'id']  # Default ordering
    filterset_fields = ['chapter']  # Allow filtering by chapter

    def get_queryset(self):
        """
        Optionally restricts the returned dimensions to a given chapter,
        by filtering against a chapter query parameter in the URL.
        """
        queryset = super().get_queryset()
        chapter_id = self.request.query_params.get('chapter', None)
        if chapter_id is not None:
            queryset = queryset.filter(chapter_id=chapter_id)
        return queryset

# ViewSet for RuleSubItem
class RuleSubItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule sub-items to be viewed or edited.
    Accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleSubItem.objects.all().select_related('dimension', 'dimension__chapter') # Added select_related
    serializer_class = RuleSubItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'dimension__name']
    ordering_fields = ['name', 'order', 'dimension__name']

# ViewSet for StudentParentRelationship
class StudentParentRelationshipViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows student-parent relationships to be viewed or edited.
    Accessible by System Administrators.
    """
    queryset = StudentParentRelationship.objects.all().select_related('student', 'parent')
    serializer_class = StudentParentRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUsers]
    
    def get_queryset(self):
        """
        Customize queryset based on user role:
        - System admins, principals, directors see all relationships
        - Parents see relationships for their own children
        - Students see their own parent relationships
        """
        from .models import UserRole  # Import UserRole here
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role in [UserRole.SYSTEM_ADMINISTRATOR, UserRole.PRINCIPAL, UserRole.DIRECTOR]:
            return queryset
        elif user.role == UserRole.PARENT:
            return queryset.filter(parent=user)
        elif user.role == UserRole.STUDENT:
            return queryset.filter(student=user)
        else:
            return StudentParentRelationship.objects.none()
    
    @action(detail=False, methods=['post'])
    def assign_parent(self, request):
        """
        Custom action to link a parent to a student
        """
        from .models import UserRole  # Import UserRole here
        student_id = request.data.get('student_id')
        parent_id = request.data.get('parent_id')
        
        if not student_id or not parent_id:
            return Response({'error': 'Both student_id and parent_id are required'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the student exists and has the correct role
        try:
            student = CustomUser.objects.get(id=student_id, role=UserRole.STUDENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Student not found or not a student role'}, 
                            status=status.HTTP_404_NOT_FOUND)
        
        # Verify the parent exists and has the correct role
        try:
            parent = CustomUser.objects.get(id=parent_id, role=UserRole.PARENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Parent not found or not a parent role'}, 
                            status=status.HTTP_404_NOT_FOUND)
        
        # Create the relationship if it doesn't exist
        relationship, created = StudentParentRelationship.objects.get_or_create(
            student=student,
            parent=parent
        )
        
        if created:
            return Response({'success': f'Parent {parent.username} linked to student {student.username}'}, 
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'message': f'Relationship between parent {parent.username} and student {student.username} already exists'}, 
                            status=status.HTTP_200_OK)

# ViewSet for BehaviorScore
class BehaviorScoreViewSet(viewsets.ModelViewSet):
    """
    API endpoint for behavior scores - allows teachers and administrators to record and retrieve behavior scores
    """
    queryset = BehaviorScore.objects.all().order_by('-created_at')
    serializer_class = BehaviorScoreSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__username', 'student__first_name', 'student__last_name', 'comment']
    ordering_fields = ['created_at', 'date_of_behavior', 'points']

    def get_permissions(self):
        """
        Only users with CanScoreStudents permission can access behavior scores.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, CanScoreStudents]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filter queryset based on user role:
        - System admins, principals, directors can see all scores
        - Teaching teachers and class teachers can see scores for their students
        - Students can see their own scores
        - Parents can see scores for their children
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == UserRole.STUDENT:
            # Students can only see their own scores
            return queryset.filter(student=user)
        
        elif user.role == UserRole.PARENT:
            # Parents can only see scores for their children
            children_ids = user.student_relationships.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=children_ids)
        
        elif user.role in [UserRole.TEACHING_TEACHER, UserRole.CLASS_TEACHER]:
            # Teachers can see scores for students in their classes
            if user.role == UserRole.CLASS_TEACHER:
                # Class teachers can see scores for students in their home class
                class_ids = user.led_classes.values_list('id', flat=True)
                return queryset.filter(student__school_class_id__in=class_ids)
            else:
                # Teaching teachers can see scores for students in their teaching classes
                class_ids = user.teaching_classes.values_list('id', flat=True)
                return queryset.filter(school_class_id__in=class_ids)
        
        # System admins, principals, directors, moral education supervisors can see all scores
        return queryset
    
    def perform_create(self, serializer):
        # Set the recorded_by field to the current user
        serializer.save(recorded_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='export')
    def export_scores(self, request):
        """Export behavior scores to CSV"""
        if not CanExportReports().has_permission(request, self):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            
        response = HttpResponse(
            content_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename="behavior_scores.csv"'},
        )
        
        # Get filtered queryset
        scores = self.get_queryset()
        writer = csv.writer(response)
        
        # Write header
        header_fields = [
            'Student ID', 'Student Name', 'Date of Behavior', 'Chapter', 
            'Dimension', 'Rule', 'Score Type', 'Points', 'Comment',
            'Recorded By', 'Class'
        ]
        writer.writerow(header_fields)
        
        # Write data rows
        for score in scores:
            writer.writerow([
                score.student.id,
                f"{score.student.first_name} {score.student.last_name}".strip(),
                score.date_of_behavior,
                score.rule_sub_item.dimension.chapter.name,
                score.rule_sub_item.dimension.name,
                score.rule_sub_item.name,
                score.get_score_type_display(),
                score.points,
                score.comment,
                f"{score.recorded_by.first_name} {score.recorded_by.last_name}".strip(),
                score.school_class.name
            ])
            
        return response
    
    @action(detail=False, methods=['get'], url_path='summary')
    def score_summary(self, request):
        """
        Generate summary statistics of behavior scores
        """
        queryset = self.get_queryset()
        
        # Get query parameters for filtering
        student_id = request.query_params.get('student_id')
        class_id = request.query_params.get('class_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        if start_date:
            queryset = queryset.filter(date_of_behavior__gte=start_date)
        if end_date:
            queryset = queryset.filter(date_of_behavior__lte=end_date)
        
        # Calculate summary statistics
        positive_scores = queryset.filter(score_type=ScoreType.POSITIVE)
        negative_scores = queryset.filter(score_type=ScoreType.NEGATIVE)
        
        total_positive_points = sum(score.points for score in positive_scores)
        total_negative_points = sum(score.points for score in negative_scores)
        net_score = total_positive_points - total_negative_points
        
        # Group scores by dimension
        dimension_scores = {}
        for score in queryset:
            dimension = score.rule_sub_item.dimension.name
            if dimension not in dimension_scores:
                dimension_scores[dimension] = 0
            
            if score.score_type == ScoreType.POSITIVE:
                dimension_scores[dimension] += score.points
            else:
                dimension_scores[dimension] -= score.points
        
        return Response({
            'total_positive_points': total_positive_points,
            'total_negative_points': total_negative_points,
            'net_score': net_score,
            'total_records': queryset.count(),
            'dimension_scores': dimension_scores
        })

class ParentObservationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for parent observations
    """
    queryset = ParentObservation.objects.all().order_by('-created_at')
    serializer_class = ParentObservationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'student__username', 'student__first_name', 'student__last_name']
    ordering_fields = ['created_at', 'date_of_behavior', 'status']

    def get_permissions(self):
        """
        Parents can create observations.
        Teachers, and administrators can review observations.
        """
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated, IsParent]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, CanScoreStudents]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filter queryset based on user role:
        - Parents see only their own submissions
        - Teachers see submissions for their students
        - Admins see all submissions
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == UserRole.PARENT:
            # Parents can only see their own observations
            return queryset.filter(parent=user)
        
        elif user.role == UserRole.STUDENT:
            # Students can see observations submitted about them
            return queryset.filter(student=user)
        
        elif user.role in [UserRole.TEACHING_TEACHER, UserRole.CLASS_TEACHER]:
            # Teachers can see observations for their students
            if user.role == UserRole.CLASS_TEACHER:
                class_ids = user.led_classes.values_list('id', flat=True)
                return queryset.filter(student__school_class_id__in=class_ids)
            else:
                class_ids = user.teaching_classes.values_list('id', flat=True)
                student_ids = CustomUser.objects.filter(school_class_id__in=class_ids).values_list('id', flat=True)
                return queryset.filter(student_id__in=student_ids)
        
        # Admins see all observations
        return queryset
    
    def perform_create(self, serializer):
        # Set the parent field to the current user
        serializer.save(parent=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='review')
    def review_observation(self, request, pk=None):
        """
        Review a parent observation and update its status
        """
        observation = self.get_object()
        status = request.data.get('status')
        
        if status not in ['approved', 'rejected']:
            return Response({'detail': 'Status must be either "approved" or "rejected"'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        observation.status = status
        observation.reviewed_by = request.user
        observation.reviewed_at = timezone.now()
        observation.save()
        
        serializer = self.get_serializer(observation)
        return Response(serializer.data)

class StudentSelfReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint for student self-reports
    """
    queryset = StudentSelfReport.objects.all().order_by('-created_at')
    serializer_class = StudentSelfReportSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'student__username', 'student__first_name', 'student__last_name']
    ordering_fields = ['created_at', 'date_of_behavior', 'status']

    def get_permissions(self):
        """
        Students can create self-reports.
        Teachers and administrators can review them.
        """
        if self.action == 'create':
            self.permission_classes = [permissions.IsAuthenticated, IsStudent]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, CanScoreStudents]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filter queryset based on user role:
        - Students see only their own reports
        - Teachers see reports for their students
        - Admins see all reports
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == UserRole.STUDENT:
            # Students can only see their own self-reports
            return queryset.filter(student=user)
        
        elif user.role == UserRole.PARENT:
            # Parents can see self-reports for their children
            children_ids = user.student_relationships.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=children_ids)
        
        elif user.role in [UserRole.TEACHING_TEACHER, UserRole.CLASS_TEACHER]:
            # Teachers can see self-reports for their students
            if user.role == UserRole.CLASS_TEACHER:
                class_ids = user.led_classes.values_list('id', flat=True)
                return queryset.filter(student__school_class_id__in=class_ids)
            else:
                class_ids = user.teaching_classes.values_list('id', flat=True)
                student_ids = CustomUser.objects.filter(school_class_id__in=class_ids).values_list('id', flat=True)
                return queryset.filter(student_id__in=student_ids)
        
        # Admins see all self-reports
        return queryset
    
    def perform_create(self, serializer):
        # Set the student field to the current user
        serializer.save(student=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='review')
    def review_self_report(self, request, pk=None):
        """
        Review a student self-report and update its status
        """
        self_report = self.get_object()
        status_value = request.data.get('status')
        
        if status_value not in ['approved', 'rejected']:
            return Response({'detail': 'Status must be either "approved" or "rejected"'},
                          status=status.HTTP_400_BAD_REQUEST)
        
        self_report.status = status_value
        self_report.reviewed_by = request.user
        self_report.reviewed_at = timezone.now()
        self_report.save()
        
        serializer = self.get_serializer(self_report)
        return Response(serializer.data)

class AwardViewSet(viewsets.ModelViewSet):
    """
    API endpoint for student awards and recognitions
    """
    queryset = Award.objects.all().order_by('-award_date', '-level')
    serializer_class = AwardSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'student__username', 'student__first_name', 'student__last_name']
    ordering_fields = ['award_date', 'level', 'award_type']

    def get_permissions(self):
        """
        Only teachers and administrators can create, update or delete awards.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, CanScoreStudents]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()
    
    def get_queryset(self):
        """
        Filter queryset based on user role:
        - Students see only their own awards
        - Parents see awards for their children
        - Teachers see awards for their students
        - Admins see all awards
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if user.role == UserRole.STUDENT:
            # Students can only see their own awards
            return queryset.filter(student=user)
        
        elif user.role == UserRole.PARENT:
            # Parents can see awards for their children
            children_ids = user.student_relationships.values_list('student_id', flat=True)
            return queryset.filter(student_id__in=children_ids)
        
        elif user.role in [UserRole.TEACHING_TEACHER, UserRole.CLASS_TEACHER]:
            # Teachers can see awards for their students
            if user.role == UserRole.CLASS_TEACHER:
                class_ids = user.led_classes.values_list('id', flat=True)
                return queryset.filter(student__school_class_id__in=class_ids)
            else:
                class_ids = user.teaching_classes.values_list('id', flat=True)
                student_ids = CustomUser.objects.filter(school_class_id__in=class_ids).values_list('id', flat=True)
                return queryset.filter(student_id__in=student_ids)
        
        # Admins see all awards
        return queryset
    
    def perform_create(self, serializer):
        # Set the awarded_by field to the current user
        serializer.save(awarded_by=self.request.user)
