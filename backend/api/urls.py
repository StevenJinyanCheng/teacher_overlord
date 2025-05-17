from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token  # Import the view
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'grades', views.GradeViewSet, basename='grade')  # Added GradeViewSet
router.register(r'schoolclasses', views.SchoolClassViewSet, basename='class')  # Register SchoolClassViewSet
# Add Rule Management routes
router.register(r'rule-chapters', views.RuleChapterViewSet, basename='rule-chapter')
router.register(r'rule-dimensions', views.RuleDimensionViewSet, basename='rule-dimension')
router.register(r'rule-sub-items', views.RuleSubItemViewSet, basename='rule-sub-item')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),  # Add this line
]
