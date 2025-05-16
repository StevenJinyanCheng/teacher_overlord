from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework import viewsets, permissions
from .models import CustomUser
from .serializers import UserSerializer

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
    permission_classes = [permissions.IsAuthenticated] # Or use IsAdminUser for stricter control
