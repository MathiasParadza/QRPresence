from datetime import date
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend # type: ignore
from authentication.permissions import IsLecturer,IsLecturerOrAdmin
from django.utils.timezone import now
from django.core.files.base import ContentFile
import base64
from .models import Session, Attendance, QRCode, Student, Lecturer
from .utils import haversine, is_qr_valid
from .serializers import StudentSerializer, AttendanceMarkSerializer, SessionSerializer,AttendanceLecturerViewSerializer
from rest_framework import status, generics, serializers
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from django.core.exceptions import PermissionDenied
import csv
from django.db.models import Q, Count
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFromToRangeFilter, ChoiceFilter
from .filters import AttendanceFilter
from .utils import get_absent_students
from .utils import AnalyticsAgent
from attendance.ai_chat.llm_agent import answer_natural_language_query
from .models import Course, Student, StudentCourseEnrollment
from .serializers import CourseSerializer, EnrollmentSerializer
from django.utils.timezone import is_aware, make_aware
import openai
from rest_framework.exceptions import ValidationError
from django.db.models import Count, Q, Avg, F, ExpressionWrapper, FloatField
from rest_framework import status
from django.core.cache import cache
from functools import lru_cache
from datetime import timedelta, datetime
import time



# Configure logger
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    try:
        # Log the request for debugging
        logger.info(f"Attendance request from user: {request.user.username}")
        logger.info(f"Request data: {request.data}")
        
        session_id = request.data.get('session_id')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        # Validate required fields
        if not all([session_id, latitude, longitude]):
            logger.warning("Missing required fields in attendance request")
            return Response(
                {'error': 'Missing required fields: session_id, latitude, and longitude are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate session exists
        try:
            session = Session.objects.get(session_id=session_id)
            logger.info(f"Session found: {session.session_id} for course: {session.course.course_code}")
        except Session.DoesNotExist:
            logger.warning(f"Session not found: {session_id}")
            return Response(
                {'error': 'Session not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate student profile exists
        try:
            student = Student.objects.get(user=request.user)
            logger.info(f"Student found: {student.student_id}")
        except Student.DoesNotExist:
            logger.warning(f"Student profile not found for user: {request.user.username}")
            return Response(
                {'error': 'Student profile not found. Please complete your student registration.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if student is enrolled in the course
        enrollment_exists = StudentCourseEnrollment.objects.filter(
            student=student, 
            course=session.course
        ).exists()
        
        if not enrollment_exists:
            logger.warning(f"Student {student.student_id} not enrolled in course {session.course.course_code}")
            return Response(
                {'error': 'You are not enrolled in this course. Please contact your administrator.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        logger.info("Enrollment check passed")

        # QR scan + location + time validity check
        try:
            is_valid, message = is_qr_valid(session, now(), float(latitude), float(longitude))
            if not is_valid:
                logger.warning(f"QR validation failed: {message}")
                return Response(
                    {'error': message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            logger.info("QR validation passed")
        except Exception as e:
            logger.error(f"Error in QR validation: {str(e)}")
            return Response(
                {'error': 'QR validation error'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if attendance already exists
        if Attendance.objects.filter(student=student, session=session).exists():
            logger.info(f"Attendance already marked for student {student.student_id} in session {session.session_id}")
            return Response(
                {'message': 'Attendance already marked for this session'}, 
                status=status.HTTP_200_OK
            )

        # Calculate distance from session location
        try:
            distance = haversine(
                float(latitude),
                float(longitude),
                float(session.gps_latitude),
                float(session.gps_longitude)
            )
            logger.info(f"Distance calculated: {distance:.2f} meters (Allowed: {session.allowed_radius}m)")
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid coordinates: {str(e)}")
            return Response(
                {'error': 'Invalid coordinates provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return Response(
                {'error': 'Error calculating distance'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Check if within allowed radius
        if distance > session.allowed_radius:
            logger.warning(f"Student too far: {distance:.2f}m > allowed {session.allowed_radius}m")
            return Response({
                'error': f'You are too far from the session location ({distance:.2f} meters). Allowed radius: {session.allowed_radius}m. Please move closer to the classroom.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check QR code expiration or attendance window
        try:
            qr_code = QRCode.objects.filter(session=session).first()
            if qr_code and qr_code.expires_at and now() > qr_code.expires_at:
                logger.warning(f"QR code expired at {qr_code.expires_at}")
                return Response(
                    {'error': 'QR code has expired. Attendance window closed.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            elif not qr_code and now() > session.timestamp + timedelta(minutes=15):
                logger.warning(f"Attendance window closed for session {session.session_id}")
                return Response(
                    {'error': 'Attendance window has closed.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            logger.info("Time validation passed")
        except Exception as e:
            logger.error(f"Error checking time validity: {str(e)}")
            return Response(
                {'error': 'Error checking attendance timing'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Create attendance record
        try:
            attendance = Attendance.objects.create(
                student=student,
                session=session,
                latitude=latitude,
                longitude=longitude
            )
            logger.info(f"Attendance created successfully: {attendance.id}")
        except Exception as e:
            logger.error(f"Error creating attendance record: {str(e)}")
            return Response(
                {'error': 'Error saving attendance'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Success response
        return Response({
            'message': 'Attendance marked successfully!',
            'distance_from_class': f'{distance:.2f} meters',
            'session': session.session_id,
            'course': session.course.course_code,
            'timestamp': now().isoformat()
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Unexpected error marking attendance")
        return Response(
            {'error': 'An unexpected error occurred. Please try again.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_and_save_qr(request):
    if getattr(request.user, 'role', None) != 'lecturer':
        return Response({'error': 'Permission denied. Lecturer access only.'}, status=403)

    session_id = request.data.get('session_id')
    qr_image_data = request.data.get('qr_image')

    if not session_id or not qr_image_data:
        return Response({'error': 'Missing session_id or qr_image'}, status=400)

    try:
        session = Session.objects.get(session_id=session_id)

        # Remove potential whitespace
        qr_image_data = qr_image_data.strip()

        # Split base64 string
        if ';base64,' not in qr_image_data:
            return Response({'error': 'Invalid QR image data'}, status=400)

        format, imgstr = qr_image_data.split(';base64,')
        ext = format.split('/')[-1]
        img_data = ContentFile(base64.b64decode(imgstr), name=f"qr_{session_id}.{ext}")

        # Save QRCode instance
        qr_code_instance = QRCode(session=session)
        qr_code_instance.qr_image.save(f"qr_{session_id}.{ext}", img_data)
        qr_code_instance.save()

        return Response({
            'success': True,
            'message': 'QR code generated and saved successfully.',
            'qr_url': qr_code_instance.qr_image.url
        })

    except Session.DoesNotExist:
        return Response({'error': 'Invalid session ID.'}, status=404)
    except Exception as e:
        logger.exception("QR generation failed")
        return Response({'error': f'Failed to save QR code: {str(e)}'}, status=500)

class SessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return sessions for the current lecturer"""
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            return Session.objects.filter(lecturer=lecturer)
        except Lecturer.DoesNotExist:
            raise ValidationError("Lecturer profile not found")

    def perform_create(self, serializer):
        """Automatically set the lecturer from the current user"""
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            serializer.save(lecturer=lecturer)
        except Lecturer.DoesNotExist:
            raise ValidationError({"lecturer": "Lecturer profile not found for this user"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_student(request, student_id):
    try:
        exists = Student.objects.filter(student_id=student_id).exists()
        return Response({'exists': exists})
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class SessionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_overview(request):
    try:
        student = Student.objects.select_related('user').get(user=request.user)
    except Student.DoesNotExist:
        return Response({'error': 'Student profile not found.'}, status=404)

    today = date.today()

    today_attendance = Attendance.objects.filter(
        student=student,
        session__timestamp__date=today
    ).select_related('session').first()

    today_status = today_attendance.status if today_attendance else "Absent"

    attendance_history = Attendance.objects.filter(student=student)\
        .select_related('session')\
        .order_by('-session__timestamp')

    history_data = []
    for a in attendance_history:
        session = a.session
        timestamp = session.timestamp if session else None

        history_data.append({
            'id': a.id,
            'session_date': timestamp.date().isoformat() if timestamp else 'Unknown',
            'session_time': timestamp.strftime("%H:%M") if timestamp else 'Unknown',
            'status': a.status,
            'class_name': session.class_name if session else 'N/A',
        })

    return Response({
        'today_status': today_status,
        'attendance_history': history_data
    })
import csv
import logging
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated

from .models import Attendance
from .serializers import AttendanceLecturerViewSerializer
from authentication.permissions import IsLecturerOrAdmin
from .filters import AttendanceFilter

logger = logging.getLogger(__name__)

class LecturerAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceLecturerViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = AttendanceFilter
    permission_classes = [IsAuthenticated, IsLecturerOrAdmin]

    def get_queryset(self):
        """
        Returns attendance records for the requesting lecturer.
        Admins see all records.
        """
        user = self.request.user

        if user.role == 'admin':
            return Attendance.objects.all().select_related(
                'student__user',
                'session',
                'session__course',
                'session__lecturer'
            ).order_by('-check_in_time')

        try:
            lecturer = user.lecturer_profile
            return Attendance.objects.filter(
                session__lecturer=lecturer
            ).select_related(
                'student__user',
                'session',
                'session__course'
            ).order_by('-check_in_time')
        except AttributeError:
            raise PermissionDenied("User is not associated with a lecturer profile")

    def list(self, request, *args, **kwargs):
        """
        Enhanced list view with pagination, filters, and counts.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())

            # Apply filters
            course_id = request.query_params.get('course_id')
            if course_id:
                queryset = queryset.filter(session__course_id=course_id)

            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            if date_from and date_to:
                queryset = queryset.filter(
                    check_in_time__date__range=[date_from, date_to]
                )

            # Pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'results': serializer.data,
                    'counts': self._get_counts_data(queryset)
                })

            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,
                'counts': self._get_counts_data(queryset)
            })

        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.exception("Error in LecturerAttendanceViewSet list")
            return Response(
                {"detail": "An error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_counts_data(self, queryset):
        """
        Returns summary counts for attendance.
        """
        today = timezone.now().date()
        return {
            'total': queryset.count(),
            'present': queryset.filter(status='Present').count(),
            'absent': queryset.filter(status='Absent').count(),
            'by_time_period': {
                'today': queryset.filter(check_in_time__date=today).count(),
                'this_week': queryset.filter(
                    check_in_time__date__gte=today - timedelta(days=7)
                ).count(),
                'this_month': queryset.filter(
                    check_in_time__month=today.month,
                    check_in_time__year=today.year
                ).count(),
                'this_year': queryset.filter(
                    check_in_time__year=today.year
                ).count(),
            }
        }

    @action(detail=False, methods=['get'], url_path='export-csv')
    def export_csv(self, request):
        """
        Export lecturer attendance to CSV.
        Supports the same filters as list view.
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())

            # Apply filters
            course_id = request.query_params.get('course_id')
            if course_id:
                queryset = queryset.filter(session__course_id=course_id)

            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            if date_from and date_to:
                queryset = queryset.filter(
                    check_in_time__date__range=[date_from, date_to]
                )

            # Prepare CSV response
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="lecturer_attendance.csv"'

            writer = csv.writer(response)
            writer.writerow([
                'Student Name', 'Student Username', 'Session', 'Course',
                'Status', 'Check In Time', 'Check Out Time', 'Latitude', 'Longitude'
            ])

            for record in queryset.select_related('student__user', 'session', 'session__course'):
                writer.writerow([
                    record.student.user.get_full_name() if record.student.user else record.student.name,
                    record.student.user.username if record.student.user else '',
                    record.session.title if record.session else '',
                    record.session.course.title if record.session and record.session.course else '',
                    record.status,
                    record.check_in_time.strftime("%d/%m/%Y %H:%M") if record.check_in_time else '',
                    record.check_out_time.strftime("%d/%m/%Y %H:%M") if record.check_out_time else '',
                    record.latitude or '',
                    record.longitude or '',
                ])

            return response

        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.exception("Error exporting CSV")
            return Response({"detail": "Failed to export CSV"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentListCreateAPIView(generics.ListCreateAPIView):
    queryset = Student.objects.all().order_by('student_id')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsLecturerOrAdmin]

    def perform_create(self, serializer):
        email = serializer.validated_data.get('email')
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})
        if Student.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Student with this email already exists."})
        serializer.save()
        
class StudentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsLecturerOrAdmin]   


def export_students_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="students.csv"'

    writer = csv.writer(response)
    writer.writerow(['Student ID', 'Name', 'Email', 'Program'])

    for student in Student.objects.all():
        writer.writerow([student.student_id, student.name, student.email, student.program])

    return response

class AbsentStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=404)

        absent_students = get_absent_students(session.id)
        serializer = StudentSerializer(absent_students, many=True)
        return Response(serializer.data)
    
class SessionAbsenteesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = Session.objects.get(id=session_id)
            absentees = AnalyticsAgent.get_absent_students(session)
            data = [{'student_id': s.student_id, 'name': s.name} for s in absentees]
            return Response(data)
        except Session.DoesNotExist:
            return Response({"error": "Session not found"}, status=404)


from attendance.ai_chat.llm_agent import answer_natural_language_query



class AttendanceAIChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    # Cache context data for 5 minutes to avoid repeated database queries
    CONTEXT_CACHE_TIMEOUT = 300  # 5 minutes

    def post(self, request):
        start_time = time.time()
        query = request.data.get("query", "").strip()
        
        if not query:
            return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(query) > 1000:
            return Response({"error": "Query too long. Maximum 1000 characters allowed."}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get user-specific context
            user = request.user
            cache_key = f"ai_context_{user.id}"
            
            # Try to get cached context first
            attendance_context = cache.get(cache_key)
            
            if not attendance_context:
                attendance_context = self._get_attendance_context(user)
                # Cache the context for 5 minutes
                cache.set(cache_key, attendance_context, self.CONTEXT_CACHE_TIMEOUT)
            
            # Get AI response
            answer = self._get_ai_response(query, attendance_context, user)
            
            # Log the interaction for analytics
            self._log_interaction(user, query, answer, time.time() - start_time)
            
            return Response({
                "answer": answer,
                "context_used": {
                    "total_records": attendance_context['summary']['total_attendance_records'],
                    "time_period": attendance_context['time_period']
                }
            })
            
        except Exception as e:
            logger.error(f"AI chat error for user {request.user.id}: {str(e)}", exc_info=True)
            return Response({
                "error": "Sorry, I encountered an error while processing your request.",
                "details": str(e) if settings.DEBUG else "Contact administrator for details"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_attendance_context(self, user):
        """Get comprehensive attendance data context"""
        from .models import Attendance, Session, Student, Course, Lecturer
        
        # Get time period for context
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Basic statistics with optimized queries
        total_attendance = Attendance.objects.count()
        status_counts = Attendance.objects.values('status').annotate(count=Count('status'))
        present_count = next((item['count'] for item in status_counts if item['status'] == 'Present'), 0)
        absent_count = next((item['count'] for item in status_counts if item['status'] == 'Absent'), 0)
        
        # Recent trends (last 30 days)
        recent_trends = self._get_recent_trends(thirty_days_ago)
        
        # Course-wise statistics with performance data
        course_stats = self._get_course_statistics()
        
        # Student statistics with attendance rates
        student_stats = self._get_student_statistics(limit=15)
        
        # Lecturer-specific data if available
        lecturer_data = self._get_lecturer_data(user)
        
        # Time-based patterns
        time_patterns = self._get_time_patterns()
        
        # Overall summary with calculated metrics
        overall_summary = {
            'total_attendance_records': total_attendance,
            'present_count': present_count,
            'absent_count': absent_count,
            'attendance_rate': (present_count / total_attendance * 100) if total_attendance > 0 else 0,
            'average_daily_attendance': self._get_average_daily_attendance(),
            'peak_attendance_day': self._get_peak_attendance_day(),
            'most_attended_course': self._get_most_attended_course(),
        }
        
        return {
            'summary': overall_summary,
            'recent_trends': recent_trends,
            'course_statistics': course_stats,
            'student_statistics': student_stats,
            'lecturer_data': lecturer_data,
            'time_patterns': time_patterns,
            'time_period': {
                'start': thirty_days_ago.isoformat(),
                'end': timezone.now().isoformat(),
                'days': 30
            },
            'data_freshness': timezone.now().isoformat(),
            'data_points': {
                'total_courses': Course.objects.count(),
                'total_students': Student.objects.count(),
                'total_sessions': Session.objects.count(),
            }
        }

    def _get_recent_trends(self, since_date):
        """Get recent attendance trends"""
        from .models import Attendance
        
        # Daily trends for last 30 days
        daily_trends = list(Attendance.objects.filter(
            check_in_time__gte=since_date
        ).extra({
            'date': "DATE(check_in_time)"
        }).values('date').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present')),
            absent=Count('id', filter=Q(status='Absent'))
        ).order_by('date'))
        
        # Weekly trends
        weekly_trends = list(Attendance.objects.filter(
            check_in_time__gte=since_date
        ).extra({
            'week': "EXTRACT(WEEK FROM check_in_time)",
            'year': "EXTRACT(YEAR FROM check_in_time)"
        }).values('year', 'week').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present')),
            rate=ExpressionWrapper(
                Count('id', filter=Q(status='Present')) * 100.0 / Count('id'),
                output_field=FloatField()
            )
        ).order_by('year', 'week'))
        
        return {
            'daily': daily_trends,
            'weekly': weekly_trends,
            'comparison': self._get_period_comparison(since_date)
        }

    def _get_course_statistics(self):
        """Get detailed course statistics"""
        from .models import Course, Session, Attendance
        
        course_stats = []
        for course in Course.objects.select_related('created_by').prefetch_related('session_set'):
            sessions = Session.objects.filter(course=course)
            course_attendance = Attendance.objects.filter(session__in=sessions)
            
            if course_attendance.exists():
                attendance_rate = (course_attendance.filter(status='Present').count() / 
                                 course_attendance.count() * 100)
            else:
                attendance_rate = 0
                
            course_stats.append({
                'course_id': course.id,
                'course_code': course.code,
                'course_title': course.title,
                'credit_hours': course.credit_hours,
                'lecturer': getattr(course.created_by, 'username', 'Unknown'),
                'total_sessions': sessions.count(),
                'total_attendance_records': course_attendance.count(),
                'present_count': course_attendance.filter(status='Present').count(),
                'absent_count': course_attendance.filter(status='Absent').count(),
                'attendance_rate': round(attendance_rate, 2),
                'last_session': sessions.order_by('-timestamp').first().timestamp.isoformat() if sessions.exists() else None
            })
        
        return sorted(course_stats, key=lambda x: x['attendance_rate'], reverse=True)

    def _get_student_statistics(self, limit=15):
        """Get student statistics with attendance rates"""
        from .models import Student, Attendance
        
        student_stats = []
        students = Student.objects.select_related('user').prefetch_related('attendance_set')[:limit]
        
        for student in students:
            attendance_records = Attendance.objects.filter(student=student)
            total = attendance_records.count()
            
            if total > 0:
                present = attendance_records.filter(status='Present').count()
                attendance_rate = (present / total * 100)
                recent_attendance = attendance_records.order_by('-check_in_time').first()
            else:
                present = 0
                attendance_rate = 0
                recent_attendance = None
                
            student_stats.append({
                'student_id': student.student_id,
                'name': student.name,
                'program': student.program,
                'attendance_rate': round(attendance_rate, 2),
                'total_classes': total,
                'present_classes': present,
                'absent_classes': total - present,
                'last_attendance': recent_attendance.check_in_time.isoformat() if recent_attendance else None,
                'last_status': recent_attendance.status if recent_attendance else 'No records'
            })
        
        return sorted(student_stats, key=lambda x: x['attendance_rate'])

    def _get_lecturer_data(self, user):
        """Get lecturer-specific data"""
        from .models import Lecturer, Session, Course
        
        try:
            lecturer = Lecturer.objects.get(user=user)
            lecturer_sessions = Session.objects.filter(lecturer=lecturer)
            lecturer_courses = Course.objects.filter(created_by=user)
            
            return {
                'lecturer_id': lecturer.lecturer_id,
                'name': lecturer.name,
                'department': lecturer.department,
                'total_sessions_conducted': lecturer_sessions.count(),
                'total_courses_managed': lecturer_courses.count(),
                'recent_sessions': list(lecturer_sessions.order_by('-timestamp')[:5].values(
                    'session_id', 'class_name', 'timestamp', 'course__code'
                ))
            }
        except Lecturer.DoesNotExist:
            return {'error': 'Lecturer profile not found'}

    def _get_time_patterns(self):
        """Analyze time-based patterns"""
        from .models import Attendance
        
        # Hourly patterns
        hourly_patterns = list(Attendance.objects.extra({
            'hour': "EXTRACT(HOUR FROM check_in_time)"
        }).values('hour').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present'))
        ).order_by('hour'))
        
        # Day of week patterns
        dow_patterns = list(Attendance.objects.extra({
            'dow': "EXTRACT(DOW FROM check_in_time)"
        }).values('dow').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present'))
        ).order_by('dow'))
        
        return {
            'hourly': hourly_patterns,
            'day_of_week': dow_patterns
        }

    def _get_average_daily_attendance(self):
        """Calculate average daily attendance"""
        from .models import Attendance
        
        result = Attendance.objects.extra({
            'date': "DATE(check_in_time)"
        }).values('date').annotate(
            daily_count=Count('id')
        ).aggregate(avg=Avg('daily_count'))
        
        return round(result['avg'] or 0, 2)

    def _get_peak_attendance_day(self):
        """Find the day with highest attendance"""
        from .models import Attendance
        
        peak_day = Attendance.objects.extra({
            'date': "DATE(check_in_time)"
        }).values('date').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        return peak_day or {'date': None, 'count': 0}

    def _get_most_attended_course(self):
        """Find the course with highest attendance"""
        from .models import Course, Attendance, Session
        
        result = Course.objects.annotate(
            attendance_count=Count('sessions__attendance')
        ).order_by('-attendance_count').first()
        
        return {
            'course_code': result.code if result else None,
            'course_title': result.title if result else None,
            'attendance_count': result.attendance_count if result else 0
        }

    def _get_period_comparison(self, since_date):
        """Compare current period with previous period"""
        from .models import Attendance
        
        previous_period_start = since_date - timedelta(days=30)
        
        current_stats = Attendance.objects.filter(
            check_in_time__gte=since_date
        ).aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present'))
        )
        
        previous_stats = Attendance.objects.filter(
            check_in_time__gte=previous_period_start,
            check_in_time__lt=since_date
        ).aggregate(
            total=Count('id'),
            present=Count('id', filter=Q(status='Present'))
        )
        
        current_rate = (current_stats['present'] / current_stats['total'] * 100) if current_stats['total'] > 0 else 0
        previous_rate = (previous_stats['present'] / previous_stats['total'] * 100) if previous_stats['total'] > 0 else 0
        
        return {
            'current_period': current_stats,
            'previous_period': previous_stats,
            'current_rate': round(current_rate, 2),
            'previous_rate': round(previous_rate, 2),
            'trend': 'up' if current_rate > previous_rate else 'down' if current_rate < previous_rate else 'stable',
            'change': round(current_rate - previous_rate, 2)
        }

    def _get_ai_response(self, query, context, user):
        """Get response from AI with enhanced error handling and fallbacks"""
        try:
            # Try OpenAI first
            return self._get_openai_response(query, context, user)
        except Exception as openai_error:
            logger.warning(f"OpenAI failed, trying fallback: {openai_error}")
            
            # Fallback to local analysis
            try:
                return self._get_fallback_response(query, context)
            except Exception as fallback_error:
                logger.error(f"All AI methods failed: {fallback_error}")
                return "I apologize, but I'm currently unable to analyze attendance data. Please try again later or contact support."

    def _get_openai_response(self, query, context, user):
        """Get response from OpenAI with enhanced prompt engineering"""
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Enhanced prompt with user context
            enhanced_prompt = f"""
            ROLE: You are an expert AI assistant for university lecturers analyzing attendance data.
            
            USER CONTEXT:
            - User: {user.username}
            - Role: Lecturer
            - Query: {query}
            
            ATTENDANCE DATA CONTEXT (as of {context['data_freshness']}):
            {json.dumps(self._simplify_context(context), indent=2)}
            
            INSTRUCTIONS:
            1. Provide data-driven, actionable insights
            2. Focus on patterns, trends, and anomalies
            3. Suggest practical recommendations
            4. Be concise but comprehensive
            5. If data is insufficient, suggest what additional data would help
            6. Use markdown formatting for readability
            7. Include specific numbers and percentages
            8. Highlight concerning trends or successes
            
            RESPONSE FORMAT:
            Start with a brief summary, then detailed analysis, then recommendations.
            """
            
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL or "gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful, analytical assistant for university lecturers. Provide insightful, data-driven analysis of attendance patterns. Be professional and actionable."
                    },
                    {
                        "role": "user", 
                        "content": enhanced_prompt
                    }
                ],
                max_tokens=1200,
                temperature=0.3,  # Lower temperature for more factual responses
                top_p=0.9,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            return response.choices[0].message.content.strip()
            
        except ImportError:
            return "OpenAI integration is not configured. Please install the openai package."
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise Exception(f"OpenAI service error: {str(e)}")

    def _get_fallback_response(self, query, context):
        """Fallback response when AI services are unavailable"""
        query_lower = query.lower()
        
        # Pattern matching for common queries
        if any(word in query_lower for word in ['overall', 'statistic', 'summary']):
            return self._generate_summary_response(context)
        elif any(word in query_lower for word in ['trend', 'pattern', 'change']):
            return self._generate_trend_response(context)
        elif any(word in query_lower for word in ['course', 'subject']):
            return self._generate_course_response(context)
        elif any(word in query_lower for word in ['student', 'attendance rate']):
            return self._generate_student_response(context)
        elif any(word in query_lower for word in ['problem', 'issue', 'concern']):
            return self._generate_issues_response(context)
        else:
            return self._generate_general_response(context)

    def _simplify_context(self, context):
        """Simplify context for AI consumption"""
        return {
            'summary': context['summary'],
            'top_courses': context['course_statistics'][:5],
            'bottom_students': context['student_statistics'][:5],
            'recent_trends': context['recent_trends']['comparison'],
            'data_points': context['data_points']
        }

    def _generate_summary_response(self, context):
        """Generate summary response"""
        summary = context['summary']
        return f"""**Overall Attendance Summary**

📊 **Total Records**: {summary['total_attendance_records']:,}
✅ **Present**: {summary['present_count']:,}
❌ **Absent**: {summary['absent_count']:,}
📈 **Attendance Rate**: {summary['attendance_rate']:.1f}%

**Key Insights:**
- Average daily attendance: {summary['average_daily_attendance']:.1f} students
- Peak attendance day: {summary['peak_attendance_day']['count']} students
- Most attended course: {summary['most_attended_course']['course_code'] or 'N/A'}

*Note: For detailed analysis, enable AI integration.*"""

    def _generate_trend_response(self, context):
        """Generate trend response"""
        trends = context['recent_trends']['comparison']
        return f"""**Attendance Trends**

📅 **Current Period Rate**: {trends['current_rate']:.1f}%
📅 **Previous Period Rate**: {trends['previous_rate']:.1f}%
📈 **Trend**: {'Improving' if trends['trend'] == 'up' else 'Declining' if trends['trend'] == 'down' else 'Stable'}

**Change**: {abs(trends['change']):.1f}% {'increase' if trends['change'] > 0 else 'decrease' if trends['change'] < 0 else 'no change'}

*Enable AI integration for detailed trend analysis and recommendations.*"""

    def _generate_course_response(self, context):
        """Generate course-specific response"""
        courses = context['course_statistics'][:3]
        response = "**Top Courses by Attendance**\n\n"
        for course in courses:
            response += f"📚 **{course['course_code']}**: {course['attendance_rate']:.1f}%\n"
        return response + "\n*Full analysis available with AI integration.*"

    def _generate_student_response(self, context):
        """Generate student-specific response"""
        students = context['student_statistics'][:3]
        response = "**Students Needing Attention**\n\n"
        for student in students:
            response += f"🎓 **{student['name']}**: {student['attendance_rate']:.1f}%\n"
        return response + "\n*Contact these students to discuss attendance.*"

    def _generate_issues_response(self, context):
        """Generate issues response"""
        return """**Common Attendance Issues**

Potential issues to investigate:
- Students with consistently low attendance
- Courses with declining attendance rates
- Time slots with poor attendance
- Specific days with high absenteeism

*Enable AI integration for detailed issue analysis and specific recommendations.*"""

    def _generate_general_response(self, context):
        """Generate general response"""
        return """**Attendance Analysis Assistant**

I can help you analyze:
- Overall attendance statistics
- Course-specific patterns
- Student attendance rates
- Time-based trends
- Comparative analysis

*Please enable AI integration for detailed, data-driven insights and recommendations.*"""

    def _log_interaction(self, user, query, response, response_time):
        """Log AI interactions for analytics"""
        log_data = {
            'user_id': user.id,
            'username': user.username,
            'query': query,
            'response_length': len(response),
            'response_time': round(response_time, 2),
            'timestamp': timezone.now().isoformat(),
            'success': True
        }
        
        # Log to database or external service
        logger.info(f"AI Interaction: {json.dumps(log_data)}")
        
        # Optional: Store in database if needed
        # AILog.objects.create(**log_data)
        
from django.conf import settings
from django.http import JsonResponse
import os
import json
from .serializers import QRCodeSerializer


def get_qr_codes(request):
    # 1. Fetch all QR codes from the database (sorted newest first)
    qr_codes = QRCode.objects.select_related("session").order_by("-created_at")
    
    qr_data = []
    for qr in qr_codes:
        # 2. Check if the image exists in the filesystem
        image_path = os.path.join(settings.MEDIA_ROOT, qr.qr_image.name)
        if not os.path.exists(image_path):
            continue  # Skip if file is missing
        
        # 3. Build the response data
        qr_data.append({
            "id": qr.id,
            "url": request.build_absolute_uri(qr.qr_image.url),
            "filename": os.path.basename(qr.qr_image.name),  # e.g., "csc3003.png"
            "name": os.path.splitext(qr.qr_image.name)[0],  # e.g., "csc3003"
            "session": str(qr.session),  # or qr.session.title
            "created_at": qr.created_at.strftime("%Y-%m-%d %H:%M"),
            "expires_at": qr.expires_at.strftime("%Y-%m-%d %H:%M") if qr.expires_at else None,
        })
    
    return JsonResponse({"qr_codes": qr_data})

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
@api_view(['DELETE'])
@permission_classes([IsLecturer])
@require_http_methods(["DELETE"])
def delete_qr_code(request, qr_id):
    qr = get_object_or_404(QRCode, id=qr_id)
    qr.qr_image.delete(save=False)  # remove file from storage
    qr.delete()
    return JsonResponse({"message": "QR code deleted successfully"})

from django.http import FileResponse
def download_qr_code(request, qr_id):
    qr = get_object_or_404(QRCode, id=qr_id)
    file_path = qr.qr_image.path

    try:
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=qr.qr_image.name)
    except FileNotFoundError:
        return JsonResponse({"error": "QR code file not found"}, status=404)
class LecturerEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List enrollments - optionally filtered by course_id"""
        course_id = request.query_params.get('course_id')
        
        if course_id:
            try:
                course = Course.objects.get(id=course_id, created_by=request.user)
                enrollments = StudentCourseEnrollment.objects.filter(course=course)
            except Course.DoesNotExist:
                return Response(
                    {'error': 'Course not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            enrollments = StudentCourseEnrollment.objects.filter(course__created_by=request.user)
        
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Handle student enrollment"""
        course_id = request.query_params.get('course_id') or request.data.get('course_id')
        
        if not course_id:
            return Response(
                {"error": "Course ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            course = Course.objects.get(id=course_id, created_by=request.user)
            student_ids = request.data.get('student_ids', [])
            
            if not student_ids:
                return Response(
                    {"error": "No student IDs provided."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create enrollments
            enrollments = []
            for student_id in student_ids:
                try:
                    student = Student.objects.get(student_id=student_id)
                    enrollment, created = StudentCourseEnrollment.objects.get_or_create(
                        student=student,
                        course=course,
                        defaults={'enrolled_by': request.user}
                    )
                    if created:
                        enrollments.append(enrollment)
                except Student.DoesNotExist:
                    continue

            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response({
                'message': f'Successfully enrolled {len(enrollments)} students',
                'enrollments': serializer.data,
                'duplicates': len(student_ids) - len(enrollments)
            }, status=status.HTTP_201_CREATED)

        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )
        
class LecturerCourseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'lecturer':
            return Response(
                {'error': 'Only lecturers can create courses'},
                status=status.HTTP_403_FORBIDDEN
            )
        courses = Course.objects.filter(created_by=request.user)
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
