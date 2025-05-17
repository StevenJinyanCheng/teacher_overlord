from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view, action
from rest_framework import viewsets, permissions, status # Add status
from rest_framework.response import Response
from .models import CustomUser, Grade, SchoolClass, RuleChapter, RuleDimension, RuleSubItem  
from .serializers import (
    UserSerializer, GradeSerializer, SchoolClassSerializer,
    RuleChapterSerializer, RuleDimensionSerializer, RuleSubItemSerializer
)
from .permissions import IsSystemAdmin, IsMoralEducationSupervisor  # Added import for new permission
import csv
import io # Added io
from rest_framework.parsers import MultiPartParser # Added MultiPartParser

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
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
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

        if not results['created'] and not results['updated'] and not results['errors'] and row_num == 0 :
             return Response({'message': 'CSV file was empty or contained no data rows.'}, status=status.HTTP_200_OK)
        
        return Response(results, status=status.HTTP_200_OK)

class GradeViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows grades to be viewed or edited.
    Only accessible by System Administrators.
    """
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin] # Updated permissions

# ViewSet for SchoolClass
class SchoolClassViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows school classes to be viewed or edited.
    Only accessible by System Administrators.
    """
    queryset = SchoolClass.objects.all().select_related('grade') # Optimize by selecting related grade
    serializer_class = SchoolClassSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin] # Assuming only Sys Admin manages classes

    # Optional: Add filtering if needed, e.g., filter by grade_id
    # filter_backends = [DjangoFilterBackend]
    # filterset_fields = ['grade']

class RuleChapterViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule chapters to be viewed or edited.
    Only accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleChapter.objects.all().prefetch_related('ruledimension_set')
    serializer_class = RuleChapterSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]

class RuleDimensionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule dimensions to be viewed or edited.
    Only accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleDimension.objects.all().select_related('chapter').prefetch_related('rulesubitem_set')
    serializer_class = RuleDimensionSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]

class RuleSubItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows rule sub-items to be viewed or edited.
    Only accessible by Moral Education Supervisors and System Administrators.
    """
    queryset = RuleSubItem.objects.all().select_related('dimension')
    serializer_class = RuleSubItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsMoralEducationSupervisor]
