from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Avg
from django.http import JsonResponse
from .models import SiteSettings
from .serializers import SiteSettingsSerializer, SystemStatsSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from attendance.models import Student, Lecturer, Course, Session, Attendance
import json

class SiteSettingsViewSet(viewsets.ModelViewSet):
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get', 'post', 'put', 'patch']
    
    def get_queryset(self):
        # Ensure we always have at least one settings instance
        if not SiteSettings.objects.exists():
            SiteSettings.objects.create()
        return SiteSettings.objects.all()
    
    def list(self, request):
        # Get the first (and only) settings instance
        settings = self.get_queryset().first()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def create(self, request):
        # Override create to handle single instance
        settings = self.get_queryset().first()
        serializer = self.get_serializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get system statistics"""
        try:
            # Calculate attendance rate
            total_attendance = Attendance.objects.count()
            present_count = Attendance.objects.filter(status='Present').count()
            attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0
            
            stats_data = {
                'total_students': Student.objects.count(),
                'total_lecturers': Lecturer.objects.count(),
                'total_courses': Course.objects.count(),
                'total_sessions': Session.objects.count(),
                'total_attendance_records': total_attendance,
                'attendance_rate': round(attendance_rate, 2)
            }
            
            serializer = SystemStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent system activity"""
        try:
            recent_sessions = Session.objects.select_related(
                'lecturer', 'course'
            ).order_by('-timestamp')[:5]
            
            recent_attendance = Attendance.objects.select_related(
                'student', 'session'
            ).order_by('-check_in_time')[:10]
            
            sessions_data = []
            for session in recent_sessions:
                sessions_data.append({
                    'id': session.session_id,
                    'class_name': session.class_name,
                    'course': session.course.code,
                    'lecturer': session.lecturer.name,
                    'timestamp': session.timestamp,
                    'attendance_count': session.attendance_set.count()
                })
            
            attendance_data = []
            for record in recent_attendance:
                attendance_data.append({
                    'student_id': record.student.student_id,
                    'student_name': record.student.name,
                    'session': record.session.class_name,
                    'status': record.status,
                    'check_in_time': record.check_in_time,
                    'course': record.session.course.code
                })
            
            return Response({
                'recent_sessions': sessions_data,
                'recent_attendance': attendance_data
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Utility view for health check and basic info
@method_decorator(csrf_exempt, name='dispatch')
class SystemInfoView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def list(self, request):
        """Get basic system information"""
        try:
            settings = SiteSettings.objects.first()
            if not settings:
                settings = SiteSettings()
                settings.save()
            
            data = {
                'system_name': settings.site_title,
                'academic_year': settings.academic_year,
                'semester': settings.get_semester_display(),
                'version': '1.0.0',
                'status': 'operational'
            }
            
            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': str(e), 'status': 'degraded'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )