from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token  # Import the view
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'grades', views.GradeViewSet, basename='grade')  # Added GradeViewSet
router.register(r'schoolclasses', views.SchoolClassViewSet, basename='class')  # Register SchoolClassViewSet
# Register the new Rule Configuration ViewSets
router.register(r'rule-chapters', views.RuleChapterViewSet)
router.register(r'rule-dimensions', views.RuleDimensionViewSet)
router.register(r'rule-subitems', views.RuleSubItemViewSet)
# Register the StudentParentRelationship ViewSet
router.register(r'student-parent-relationships', views.StudentParentRelationshipViewSet, basename='student-parent-relationship')
# Register ViewSets for behavior scoring and awards
router.register(r'behavior-scores', views.BehaviorScoreViewSet, basename='behavior-score')
router.register(r'parent-observations', views.ParentObservationViewSet, basename='parent-observation')
router.register(r'student-self-reports', views.StudentSelfReportViewSet, basename='student-self-report')
router.register(r'awards', views.AwardViewSet, basename='award')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),  # Add this line
]
