from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from rest_framework.decorators import action
from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from .models import (CustomUser, Grade, SchoolClass, BehaviorScore, 
                    ParentObservation, StudentSelfReport, Award, UserRole, ScoreType)
from .permissions import (IsSystemAdmin, IsPrincipal, IsDirector, 
                         CanExportReports)
import json
from datetime import datetime, timedelta

class ReportsViewSet(viewsets.ViewSet):
    """
    API endpoint for advanced analytics and reporting
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Only users with CanExportReports permission can access reports.
        """
        if self.action in ['behavior_time_series', 'award_analytics', 'user_engagement', 'dimension_analysis']:
            self.permission_classes = [permissions.IsAuthenticated, CanExportReports]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'], url_path='behavior-time-series')
    def behavior_time_series(self, request):
        """
        Generate time-series data for behavior scores
        """
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        grade_id = request.query_params.get('grade_id')
        class_id = request.query_params.get('class_id')
        interval = request.query_params.get('interval', 'day')  # day, week, month
        
        # Base queryset
        queryset = BehaviorScore.objects.all()
        
        # Apply filters
        if start_date:
            queryset = queryset.filter(date_of_behavior__gte=start_date)
        else:
            # Default to last 30 days if no start date provided
            default_start = datetime.now() - timedelta(days=30)
            queryset = queryset.filter(date_of_behavior__gte=default_start)
            
        if end_date:
            queryset = queryset.filter(date_of_behavior__lte=end_date)
            
        if grade_id:
            queryset = queryset.filter(student__school_class__grade_id=grade_id)
            
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        
        # Apply time grouping based on interval
        if interval == 'week':
            trunc_function = TruncWeek('date_of_behavior')
        elif interval == 'month':
            trunc_function = TruncMonth('date_of_behavior')
        else:  # Default to day
            trunc_function = TruncDay('date_of_behavior')
        
        # Generate time series data for positive and negative scores
        positive_series = (
            queryset
            .filter(score_type=ScoreType.POSITIVE)
            .annotate(date=trunc_function)
            .values('date')
            .annotate(
                count=Count('id'),
                points=Sum('points')
            )
            .order_by('date')
        )
        
        negative_series = (
            queryset
            .filter(score_type=ScoreType.NEGATIVE)
            .annotate(date=trunc_function)
            .values('date')
            .annotate(
                count=Count('id'),
                points=Sum('points')
            )
            .order_by('date')
        )
        
        # Format response data
        result = {
            'positive_series': [
                {
                    'date': entry['date'].isoformat() if entry['date'] else None,
                    'count': entry['count'],
                    'points': entry['points']
                }
                for entry in positive_series
            ],
            'negative_series': [
                {
                    'date': entry['date'].isoformat() if entry['date'] else None,
                    'count': entry['count'],
                    'points': entry['points']
                }
                for entry in negative_series
            ]
        }
        
        return Response(result)
    
    @action(detail=False, methods=['get'], url_path='award-analytics')
    def award_analytics(self, request):
        """
        Generate analytics for awards and recognitions
        """
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        grade_id = request.query_params.get('grade_id')
        class_id = request.query_params.get('class_id')
        
        # Base queryset
        queryset = Award.objects.all()
        
        # Apply filters
        if start_date:
            queryset = queryset.filter(award_date__gte=start_date)
        else:
            # Default to last 30 days if no start date provided
            default_start = datetime.now() - timedelta(days=30)
            queryset = queryset.filter(award_date__gte=default_start)
            
        if end_date:
            queryset = queryset.filter(award_date__lte=end_date)
            
        if grade_id:
            queryset = queryset.filter(student__school_class__grade_id=grade_id)
            
        if class_id:
            queryset = queryset.filter(student__school_class_id=class_id)
        
        # Award distribution by type
        awards_by_type = (
            queryset
            .values('award_type')
            .annotate(count=Count('id'))
            .order_by('award_type')
        )
        
        # Star rating distribution
        star_distribution = (
            queryset
            .filter(award_type='star')
            .values('level')
            .annotate(count=Count('id'))
            .order_by('level')
        )
        
        # Top awarded students
        top_students = (
            queryset
            .values('student_id')
            .annotate(
                count=Count('id'),
                student_name=F('student__first_name'),
                student_last_name=F('student__last_name')
            )
            .order_by('-count')[:10]
        )
        
        # Awards over time
        awards_over_time = (
            queryset
            .annotate(month=TruncMonth('award_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        
        # Format response data
        result = {
            'awards_by_type': list(awards_by_type),
            'star_distribution': list(star_distribution),
            'top_students': [
                {
                    'student_id': entry['student_id'],
                    'student_name': f"{entry['student_name']} {entry['student_last_name']}".strip(),
                    'count': entry['count']
                }
                for entry in top_students
            ],
            'awards_over_time': [
                {
                    'month': entry['month'].isoformat() if entry['month'] else None,
                    'count': entry['count']
                }
                for entry in awards_over_time
            ]
        }
        
        return Response(result)
    
    @action(detail=False, methods=['get'], url_path='user-engagement')
    def user_engagement(self, request):
        """
        Generate analytics on user engagement (parents, students, teachers)
        """
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Default date range if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).isoformat().split('T')[0]
            
        if not end_date:
            end_date = datetime.now().isoformat().split('T')[0]
            
        # Parent engagement - observations submitted
        parent_observations = (
            ParentObservation.objects
            .filter(created_at__gte=start_date, created_at__lte=end_date)
            .values('parent_id')
            .annotate(
                observation_count=Count('id'),
                approved_count=Count('id', filter=Q(status='approved')),
                rejection_rate=Count('id', filter=Q(status='rejected')) * 1.0 / Count('id')
            )
        )
        
        # Student engagement - self-reports submitted
        student_reports = (
            StudentSelfReport.objects
            .filter(created_at__gte=start_date, created_at__lte=end_date)
            .values('student_id')
            .annotate(
                report_count=Count('id'),
                approved_count=Count('id', filter=Q(status='approved')),
                rejection_rate=Count('id', filter=Q(status='rejected')) * 1.0 / Count('id')
            )
        )
        
        # Teacher engagement - behavior scores recorded
        teacher_scores = (
            BehaviorScore.objects
            .filter(created_at__gte=start_date, created_at__lte=end_date)
            .values('recorded_by_id')
            .annotate(
                score_count=Count('id'),
                positive_count=Count('id', filter=Q(score_type=ScoreType.POSITIVE)),
                negative_count=Count('id', filter=Q(score_type=ScoreType.NEGATIVE))
            )
        )
        
        # Format response data
        result = {
            'parent_engagement': {
                'total_observations': ParentObservation.objects.filter(
                    created_at__gte=start_date, created_at__lte=end_date
                ).count(),
                'active_parents': parent_observations.count(),
                'approval_rate': ParentObservation.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date,
                    status='approved'
                ).count() / max(ParentObservation.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date
                ).count(), 1),
                'top_engaged_parents': list(parent_observations.order_by('-observation_count')[:5])
            },
            'student_engagement': {
                'total_reports': StudentSelfReport.objects.filter(
                    created_at__gte=start_date, created_at__lte=end_date
                ).count(),
                'active_students': student_reports.count(),
                'approval_rate': StudentSelfReport.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date,
                    status='approved'
                ).count() / max(StudentSelfReport.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date
                ).count(), 1),
                'top_engaged_students': list(student_reports.order_by('-report_count')[:5])
            },
            'teacher_engagement': {
                'total_scores': BehaviorScore.objects.filter(
                    created_at__gte=start_date, created_at__lte=end_date
                ).count(),
                'active_teachers': teacher_scores.count(),
                'positive_negative_ratio': BehaviorScore.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date,
                    score_type=ScoreType.POSITIVE
                ).count() / max(BehaviorScore.objects.filter(
                    created_at__gte=start_date, 
                    created_at__lte=end_date,
                    score_type=ScoreType.NEGATIVE
                ).count(), 1),
                'most_active_teachers': list(teacher_scores.order_by('-score_count')[:5])
            }
        }
        
        return Response(result)
    
    @action(detail=False, methods=['get'], url_path='dimension-analysis')
    def dimension_analysis(self, request):
        """
        Analyze scores by moral dimension
        """
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        grade_id = request.query_params.get('grade_id')
        class_id = request.query_params.get('class_id')
        
        # Base queryset
        queryset = BehaviorScore.objects.all()
        
        # Apply filters
        if start_date:
            queryset = queryset.filter(date_of_behavior__gte=start_date)
            
        if end_date:
            queryset = queryset.filter(date_of_behavior__lte=end_date)
            
        if grade_id:
            queryset = queryset.filter(student__school_class__grade_id=grade_id)
            
        if class_id:
            queryset = queryset.filter(school_class_id=class_id)
        
        # Scores by dimension
        dimension_scores = (
            queryset
            .values(
                'rule_sub_item__dimension__name', 
                'rule_sub_item__dimension_id',
                'score_type'
            )
            .annotate(
                count=Count('id'),
                total_points=Sum('points')
            )
        )
        
        # Process data to calculate net scores by dimension
        dimensions_data = {}
        for entry in dimension_scores:
            dimension_name = entry['rule_sub_item__dimension__name']
            if dimension_name not in dimensions_data:
                dimensions_data[dimension_name] = {
                    'positive_count': 0,
                    'negative_count': 0,
                    'positive_points': 0,
                    'negative_points': 0,
                    'name': dimension_name,
                    'dimension_id': entry['rule_sub_item__dimension_id']
                }
                
            if entry['score_type'] == ScoreType.POSITIVE:
                dimensions_data[dimension_name]['positive_count'] = entry['count']
                dimensions_data[dimension_name]['positive_points'] = entry['total_points']
            else:
                dimensions_data[dimension_name]['negative_count'] = entry['count']
                dimensions_data[dimension_name]['negative_points'] = entry['total_points']
        
        # Calculate net scores and format response
        result = []
        for dimension_name, data in dimensions_data.items():
            net_points = data['positive_points'] - data['negative_points']
            total_records = data['positive_count'] + data['negative_count']
            
            result.append({
                'dimension_id': data['dimension_id'],
                'dimension_name': dimension_name,
                'positive_count': data['positive_count'],
                'negative_count': data['negative_count'],
                'positive_points': data['positive_points'],
                'negative_points': data['negative_points'],
                'net_points': net_points,
                'total_records': total_records
            })
        
        # Sort by net points (descending)
        result.sort(key=lambda x: x['net_points'], reverse=True)
        
        return Response(result)
