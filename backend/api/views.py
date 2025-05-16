from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view, action
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import CustomUser, Grade, UserRole, SchoolClass # Added SchoolClass
from .serializers import UserSerializer, GradeSerializer, SchoolClassSerializer # Added SchoolClassSerializer
from .permissions import IsSystemAdmin # Import the custom permission

# Create your views here.

# @api_view(['GET'])
# def hello_world(request):
#     return JsonResponse({"message": "Hello, world from Django!"})

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated] # Reverted back from AllowAny

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Return the authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

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
