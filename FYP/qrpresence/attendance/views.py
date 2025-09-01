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
from django.db.models.functions import TruncDate, ExtractWeek, ExtractYear, ExtractHour, ExtractWeekDay
from rest_framework.response import Response




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
            # FIXED: Changed course.course_code to course.code
            logger.info(f"Session found: {session.session_id} for course: {session.course.code}")
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
            # FIXED: Changed course.course_code to course.code
            logger.warning(f"Student {student.student_id} not enrolled in course {session.course.code}")
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
        # FIXED: Changed session.course.course_code to session.course.code
        return Response({
            'message': 'Attendance marked successfully!',
            'distance_from_class': f'{distance:.2f} meters',
            'session': session.session_id,
            'course': session.course.code,  # FIXED: Changed course.course_code to course.code
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

    today = timezone.now().date()

    # Today's attendance
    today_attendance = Attendance.objects.filter(
        student=student,
        session__timestamp__date=today
    ).select_related('session').first()

    today_status = today_attendance.status if today_attendance else "Absent"

    # Attendance history
    attendance_history = Attendance.objects.filter(student=student)\
        .select_related('session', 'session__course')\
        .order_by('-session__timestamp')[:50]  # Limit to 50 most recent records

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
            'course_code': session.course.code if session and session.course else 'N/A',
        })

    # Calculate statistics
    all_attendance = Attendance.objects.filter(student=student)
    
    # Basic counts
    total_classes = all_attendance.count()
    present_count = all_attendance.filter(status='Present').count()
    absent_count = all_attendance.filter(status='Absent').count()
    
    # Attendance percentage
    attendance_percentage = round((present_count / total_classes * 100), 1) if total_classes > 0 else 0

    # Course breakdown
    by_course = {}
    course_attendance = all_attendance.select_related('session__course')
    
    for record in course_attendance:
        if record.session and record.session.course:
            course_code = record.session.course.code
            course_title = record.session.course.title
            
            if course_code not in by_course:
                by_course[course_code] = {
                    'total': 0,
                    'present': 0,
                    'percentage': 0,
                    'title': course_title
                }
            
            by_course[course_code]['total'] += 1
            if record.status == 'Present':
                by_course[course_code]['present'] += 1
            
            # Update percentage for this course
            if by_course[course_code]['total'] > 0:
                by_course[course_code]['percentage'] = round(
                    (by_course[course_code]['present'] / by_course[course_code]['total'] * 100), 1
                )

    # Recent trends (last 7 and 30 days)
    seven_days_ago = today - timedelta(days=7)
    thirty_days_ago = today - timedelta(days=30)
    
    last_7_days = all_attendance.filter(
        session__timestamp__date__gte=seven_days_ago
    )
    last_30_days = all_attendance.filter(
        session__timestamp__date__gte=thirty_days_ago
    )
    
    recent_7_days_present = last_7_days.filter(status='Present').count()
    recent_30_days_present = last_30_days.filter(status='Present').count()
    
    recent_trend = {
        'last_7_days': round((recent_7_days_present / last_7_days.count() * 100), 1) if last_7_days.count() > 0 else 0,
        'last_30_days': round((recent_30_days_present / last_30_days.count() * 100), 1) if last_30_days.count() > 0 else 0,
    }

    # This week's attendance (Monday to today)
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    this_week_attendance = all_attendance.filter(
        session__timestamp__date__gte=start_of_week
    )
    this_week_present = this_week_attendance.filter(status='Present').count()
    this_week_percentage = round((this_week_present / this_week_attendance.count() * 100), 1) if this_week_attendance.count() > 0 else 0

    return Response({
        'today_status': today_status,
        'attendance_history': history_data,
        'stats': {
            'total_classes': total_classes,
            'present_count': present_count,
            'absent_count': absent_count,
            'attendance_percentage': attendance_percentage,
            'by_course': by_course,
            'recent_trend': recent_trend,
            'this_week_percentage': this_week_percentage,
            'by_time_period': {
                'today': 1 if today_status == 'Present' else 0,  # Today's count
                'this_week': this_week_present,
                'this_month': last_30_days.filter(status='Present').count(),
                'this_year': all_attendance.filter(
                    session__timestamp__year=today.year,
                    status='Present'
                ).count(),
            }
        }
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
            response['Content-Disposition'] = 'attachment; filename="lecturer_attendance_export.csv"'

            writer = csv.writer(response)
            writer.writerow([
                'Student ID', 'Student Name', 'Student Username', 
                'Course Code', 'Course Title', 'Session ID', 'Class Name',
                'Status', 'Check In Time', 'Check Out Time', 
                'Latitude', 'Longitude'
            ])

            # Process records in batches to avoid memory issues
            batch_size = 100
            total_records = queryset.count()
            
            for i in range(0, total_records, batch_size):
                batch = queryset[i:i + batch_size].select_related(
                    'student', 'student__user', 'session', 'session__course'
                )
                
                for record in batch:
                    try:
                        # Student information
                        student_id = getattr(record.student, 'student_id', 'N/A') if record.student else 'N/A'
                        student_name = getattr(record.student, 'name', 'N/A') if record.student else 'N/A'
                        
                        student_username = 'N/A'
                        if record.student and record.student.user:
                            student_username = getattr(record.student.user, 'username', 'N/A')

                        # Course information
                        course_code = 'N/A'
                        course_title = 'N/A'
                        if record.session and record.session.course:
                            course_code = getattr(record.session.course, 'code', 'N/A')
                            course_title = getattr(record.session.course, 'title', 'N/A')

                        # Session information
                        session_id = getattr(record.session, 'session_id', 'N/A') if record.session else 'N/A'
                        class_name = getattr(record.session, 'class_name', 'N/A') if record.session else 'N/A'

                        # Time information
                        check_in_time = record.check_in_time.strftime("%Y-%m-%d %H:%M") if record.check_in_time else 'N/A'
                        check_out_time = record.check_out_time.strftime("%Y-%m-%d %H:%M") if record.check_out_time else 'N/A'

                        writer.writerow([
                            student_id,
                            student_name,
                            student_username,
                            course_code,
                            course_title,
                            session_id,
                            class_name,
                            record.status,
                            check_in_time,
                            check_out_time,
                            record.latitude or '',
                            record.longitude or '',
                        ])
                        
                    except Exception as record_error:
                        # Log individual record errors but continue processing
                        logger.warning(f"Error processing record {record.id}: {record_error}")
                        continue

            return response

        except PermissionDenied as e:
            logger.warning(f"Permission denied for CSV export: {e}")
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.exception(f"Critical error in CSV export: {e}")
            return Response(
                {"detail": f"Failed to export CSV: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='export-debug')
    def export_debug(self, request):
        """Debug endpoint to test field access"""
        try:
            # Get one record to test
            record = self.get_queryset().first()
            
            if not record:
                return Response({"detail": "No records found"}, status=status.HTTP_404_NOT_FOUND)
                
            debug_info = {
                "record_id": record.id,
                "has_student": bool(record.student),
                "has_session": bool(record.session),
                "student_fields": {},
                "session_fields": {},
            }
            
            if record.student:
                debug_info["student_fields"] = {
                    "student_id": getattr(record.student, 'student_id', 'MISSING'),
                    "name": getattr(record.student, 'name', 'MISSING'),
                    "has_user": bool(record.student.user),
                }
                if record.student.user:
                    debug_info["student_fields"]["username"] = getattr(record.student.user, 'username', 'MISSING')
            
            if record.session:
                debug_info["session_fields"] = {
                    "session_id": getattr(record.session, 'session_id', 'MISSING'),
                    "class_name": getattr(record.session, 'class_name', 'MISSING'),
                    "has_course": bool(record.session.course),
                }
                if record.session.course:
                    debug_info["session_fields"].update({
                        "course_code": getattr(record.session.course, 'code', 'MISSING'),
                        "course_title": getattr(record.session.course, 'title', 'MISSING'),
                    })
            
            return Response(debug_info)
            
        except Exception as e:
            logger.exception(f"Error in export debug: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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


import logging
import time
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from django.db.models.functions import TruncDate, ExtractWeek, ExtractYear
from django.core.cache import cache
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

class AttendanceAIChatView(APIView):
    permission_classes = [IsAuthenticated]
    CONTEXT_CACHE_TIMEOUT = 300  # 5 minutes

    def post(self, request):
        start_time = time.time()
        query = request.data.get("query", "").strip()

        if not query:
            return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)

        if len(query) > 1000:
            return Response(
                {"error": "Query too long. Maximum 1000 characters allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = request.user
            cache_key = f"ai_context_{user.id}"

            attendance_context = cache.get(cache_key)
            if not attendance_context:
                attendance_context = self._get_attendance_context(user)
                cache.set(cache_key, attendance_context, self.CONTEXT_CACHE_TIMEOUT)

            answer = self._get_ai_response(query, attendance_context, user)

            self._log_interaction(user, query, answer, time.time() - start_time)

            return Response(
                {
                    "answer": answer,
                    "context_used": {
                        "total_records": attendance_context["summary"]["total_attendance_records"],
                        "time_period": attendance_context["time_period"],
                    },
                }
            )

        except Exception as e:
            logger.error(f"AI chat error for user {request.user.id}: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": "Sorry, I encountered an error while processing your request.",
                    "details": str(e) if settings.DEBUG else "Contact administrator for details",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ===================== DATA CONTEXT =====================

    def _get_attendance_context(self, user):
        from .models import Attendance, Session, Student, Course, Lecturer

        thirty_days_ago = timezone.now() - timedelta(days=30)

        total_attendance = Attendance.objects.count()
        status_counts = Attendance.objects.values("status").annotate(count=Count("status"))
        present_count = next((item["count"] for item in status_counts if item["status"] == "Present"), 0)
        absent_count = next((item["count"] for item in status_counts if item["status"] == "Absent"), 0)

        return {
            "summary": {
                "total_attendance_records": total_attendance,
                "present_count": present_count,
                "absent_count": absent_count,
                "attendance_rate": (present_count / total_attendance * 100) if total_attendance else 0,
                "average_daily_attendance": self._get_average_daily_attendance(),
                "peak_attendance_day": self._get_peak_attendance_day(),
                "most_attended_course": self._get_most_attended_course(),
            },
            "recent_trends": self._get_recent_trends(thirty_days_ago),
            "course_statistics": self._get_course_statistics(),
            "student_statistics": self._get_student_statistics(limit=15),
            "lecturer_data": self._get_lecturer_data(user),
            "time_patterns": self._get_time_patterns(),
            "time_period": {
                "start": thirty_days_ago.isoformat(),
                "end": timezone.now().isoformat(),
                "days": 30,
            },
            "data_freshness": timezone.now().isoformat(),
            "data_points": {
                "total_courses": Course.objects.count(),
                "total_students": Student.objects.count(),
                "total_sessions": Session.objects.count(),
            },
        }

    def _get_recent_trends(self, since_date):
        from .models import Attendance

        daily_trends_raw = (
            Attendance.objects.filter(check_in_time__gte=since_date)
            .annotate(date=TruncDate("check_in_time"))
            .values("date")
            .annotate(
                total=Count("id"),
                present=Count("id", filter=Q(status="Present")),
                absent=Count("id", filter=Q(status="Absent")),
            )
            .order_by("date")
        )

        # 🔹 Convert date objects to ISO strings
        daily_trends = [
            {**row, "date": row["date"].isoformat() if row["date"] else None}
            for row in daily_trends_raw
        ]

        weekly_raw = (
            Attendance.objects.filter(check_in_time__gte=since_date)
            .annotate(week=ExtractWeek("check_in_time"), year=ExtractYear("check_in_time"))
            .values("year", "week")
            .annotate(
                total=Count("id"),
                present=Count("id", filter=Q(status="Present")),
            )
            .order_by("year", "week")
        )

        weekly_trends = []
        for row in weekly_raw:
            total = row["total"] or 0
            present = row["present"] or 0
            rate = (present * 100.0 / total) if total else 0.0
            weekly_trends.append({**row, "rate": round(rate, 2)})

        return {
            "daily": daily_trends,
            "weekly": weekly_trends,
            "comparison": self._get_period_comparison(since_date),
        }

    def _get_course_statistics(self):
        from .models import Course, Session, Attendance

        course_stats = []
        for course in Course.objects.select_related("created_by").prefetch_related("sessions"):
            sessions = Session.objects.filter(course=course)
            course_attendance = Attendance.objects.filter(session__in=sessions)
            total = course_attendance.count()
            present = course_attendance.filter(status="Present").count()
            absent = course_attendance.filter(status="Absent").count()
            attendance_rate = (present / total * 100) if total else 0
            last_session = sessions.order_by("-timestamp").first()

            course_stats.append(
                {
                    "course_id": course.id,
                    "course_code": course.code,
                    "course_title": course.title,
                    "credit_hours": course.credit_hours,
                    "lecturer": getattr(course.created_by, "username", "Unknown"),
                    "total_sessions": sessions.count(),
                    "total_attendance_records": total,
                    "present_count": present,
                    "absent_count": absent,
                    "attendance_rate": round(attendance_rate, 2),
                    "last_session": last_session.timestamp.isoformat() if last_session else None,
                }
            )

        return sorted(course_stats, key=lambda x: x["attendance_rate"], reverse=True)

    def _get_student_statistics(self, limit=15):
        from .models import Student, Attendance

        student_stats = []
        students = Student.objects.select_related("user").prefetch_related("attendance_set")[:limit]

        for student in students:
            attendance_records = Attendance.objects.filter(student=student)
            total = attendance_records.count()
            present = attendance_records.filter(status="Present").count() if total else 0
            rate = (present / total * 100) if total else 0
            recent = attendance_records.order_by("-check_in_time").first()

            student_stats.append(
                {
                    "student_id": student.student_id,
                    "name": student.name,
                    "program": student.program,
                    "attendance_rate": round(rate, 2),
                    "total_classes": total,
                    "present_classes": present,
                    "absent_classes": total - present,
                    "last_attendance": recent.check_in_time.isoformat() if recent else None,
                    "last_status": recent.status if recent else "No records",
                }
            )

        return sorted(student_stats, key=lambda x: x["attendance_rate"])


    def _get_lecturer_data(self, user):
        from .models import Lecturer, Session, Course

        try:
            lecturer = Lecturer.objects.get(user=user)
            sessions = Session.objects.filter(lecturer=lecturer)
            courses = Course.objects.filter(created_by=user)
            return {
                "lecturer_id": lecturer.lecturer_id,
                "name": lecturer.name,
                "department": lecturer.department,
                "total_sessions_conducted": sessions.count(),
                "total_courses_managed": courses.count(),
                "recent_sessions": list(
                    sessions.order_by("-timestamp")[:5].values("session_id", "class_name", "timestamp", "course__code")
                ),
            }
        except Lecturer.DoesNotExist:
            return {"error": "Lecturer profile not found"}

    def _get_time_patterns(self):
        from .models import Attendance

        hourly = (
            Attendance.objects.annotate(hour=ExtractHour("check_in_time"))
            .values("hour")
            .annotate(total=Count("id"), present=Count("id", filter=Q(status="Present")))
            .order_by("hour")
        )
        dow = (
            Attendance.objects.annotate(dow=ExtractWeekDay("check_in_time"))
            .values("dow")
            .annotate(total=Count("id"), present=Count("id", filter=Q(status="Present")))
            .order_by("dow")
        )
        return {"hourly": list(hourly), "day_of_week": list(dow)}

    def _get_average_daily_attendance(self):
        from .models import Attendance

        per_day = (
            Attendance.objects.annotate(date=TruncDate("check_in_time"))
            .values("date")
            .annotate(daily_count=Count("id"))
        )
        counts = [row["daily_count"] for row in per_day]
        return round(sum(counts) / len(counts), 2) if counts else 0.0

    def _get_peak_attendance_day(self):
        from .models import Attendance

        peak = (
            Attendance.objects.annotate(date=TruncDate("check_in_time"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("-count")
            .first()
        )
        return peak or {"date": None, "count": 0}

    def _get_most_attended_course(self):
        from .models import Course

        result = Course.objects.annotate(attendance_count=Count("sessions__attendance")).order_by("-attendance_count").first()
        return {
            "course_code": result.code if result else None,
            "course_title": result.title if result else None,
            "attendance_count": result.attendance_count if result else 0,
        }

    def _get_period_comparison(self, since_date):
        from .models import Attendance

        previous_start = since_date - timedelta(days=30)
        current = Attendance.objects.filter(check_in_time__gte=since_date).aggregate(
            total=Count("id"), present=Count("id", filter=Q(status="Present"))
        )
        prev = Attendance.objects.filter(check_in_time__gte=previous_start, check_in_time__lt=since_date).aggregate(
            total=Count("id"), present=Count("id", filter=Q(status="Present"))
        )
        cur_rate = (current["present"] / current["total"] * 100) if current["total"] else 0
        prev_rate = (prev["present"] / prev["total"] * 100) if prev["total"] else 0
        return {
            "current_period": current,
            "previous_period": prev,
            "current_rate": round(cur_rate, 2),
            "previous_rate": round(prev_rate, 2),
            "trend": "up" if cur_rate > prev_rate else "down" if cur_rate < prev_rate else "stable",
            "change": round(cur_rate - prev_rate, 2),
        }

    # ===================== AI RESPONSE =====================

    def _get_ai_response(self, query, context, user):
        try:
            return self._get_openai_response(query, context, user)
        except Exception as e:
            logger.warning(f"OpenAI failed, fallback: {e}")
            try:
                return self._get_fallback_response(query, context)
            except Exception as fb:
                logger.error(f"All AI methods failed: {fb}")
                return "I apologize, but I'm currently unable to analyze attendance data. Please try again later."

    def _get_openai_response(self, query, context, user):
        from openai import OpenAI

        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY missing")

        client = OpenAI(api_key=api_key)
        model = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

        enhanced_prompt = f"""
ROLE: You are an expert AI assistant for university lecturers analyzing attendance data.

USER CONTEXT:
- User: {user.username}
- Role: Lecturer
- Query: {query}

ATTENDANCE DATA CONTEXT (as of {context['data_freshness']}):
{json.dumps(self._simplify_context(context), indent=2)}

INSTRUCTIONS:
1. Provide data-driven insights with numbers
2. Spot patterns, anomalies, and trends
3. Recommend practical next steps
4. Be concise and structured
5. Use markdown for readability
"""

        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant analyzing attendance data."},
                {"role": "user", "content": enhanced_prompt},
            ],
            max_tokens=1200,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()

    # ===================== FALLBACK RESPONSES =====================

    def _get_fallback_response(self, query, context):
        q = query.lower()
        if any(k in q for k in ["overall", "summary"]):
            return self._generate_summary_response(context)
        if any(k in q for k in ["trend", "pattern", "change"]):
            return self._generate_trend_response(context)
        if "course" in q:
            return self._generate_course_response(context)
        if "student" in q:
            return self._generate_student_response(context)
        return self._generate_general_response(context)

    def _simplify_context(self, context):
        return {
            "summary": context["summary"],
            "top_courses": context["course_statistics"][:5],
            "bottom_students": context["student_statistics"][:5],
            "recent_trends": context["recent_trends"]["comparison"],
            "data_points": context["data_points"],
        }

    def _generate_summary_response(self, context):
        s = context["summary"]
        return f"""**Overall Attendance Summary**
- Total Records: {s['total_attendance_records']}
- Present: {s['present_count']}
- Absent: {s['absent_count']}
- Attendance Rate: {s['attendance_rate']:.1f}%
- Avg Daily: {s['average_daily_attendance']:.1f}
- Peak Day: {s['peak_attendance_day']['count']} students
"""

    def _generate_trend_response(self, context):
        t = context["recent_trends"]["comparison"]
        return f"""**Attendance Trends**
- Current Rate: {t['current_rate']}%
- Previous Rate: {t['previous_rate']}%
- Trend: {t['trend']} ({t['change']}% change)
"""

    def _generate_course_response(self, context):
        c = context["course_statistics"][:3]
        return "**Top Courses by Attendance**\n" + "\n".join(
            f"- {course['course_code']}: {course['attendance_rate']}%" for course in c
        )

    def _generate_student_response(self, context):
        st = context["student_statistics"][:3]
        return "**Students with Low Attendance**\n" + "\n".join(
            f"- {s['name']}: {s['attendance_rate']}%" for s in st
        )

    def _generate_general_response(self, context):
        return "I can analyze overall stats, trends, courses, students, and time-based patterns."

    # ===================== LOGGING =====================

    def _log_interaction(self, user, query, response, response_time):
        log_data = {
            "user_id": user.id,
            "username": user.username,
            "query": query,
            "response_length": len(response),
            "response_time": round(response_time, 2),
            "timestamp": timezone.now().isoformat(),
            "success": True,
        }
        logger.info(f"AI Interaction: {json.dumps(log_data)}")


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
    
