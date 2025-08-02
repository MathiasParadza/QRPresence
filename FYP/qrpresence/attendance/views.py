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
from django.db.models import Q
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


 




# Configure logger
logger = logging.getLogger(__name__)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    try:
        session_id = request.data.get('session_id')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')

        if not all([session_id, latitude, longitude]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if not StudentCourseEnrollment.objects.filter(student=student, course=session.course).exists():
            return Response({'error': 'You are not enrolled in this course'}, status=status.HTTP_403_FORBIDDEN)

        # ✅ QR scan + location + time validity check
        is_valid, message = is_qr_valid(session, now(), float(latitude), float(longitude))
        if not is_valid:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        if Attendance.objects.filter(student=student, session=session).exists():
            return Response({'message': 'Attendance already marked for this session'}, status=status.HTTP_200_OK)

        # Optional: fallback geolocation check if needed
        try:
            distance = haversine(
                float(latitude),
                float(longitude),
                float(session.gps_latitude),
                float(session.gps_longitude)
            )
        except Exception as e:
            return Response({'error': f'Invalid coordinates: {str(e)}'}, status=400)

        if distance > session.allowed_radius:
            return Response({
                'error': f'You are too far from the session location ({distance:.2f} meters). Allowed radius: {session.allowed_radius}m'
            }, status=403)

        # QR code expiration or fallback timeout
        try:
            qr_code = QRCode.objects.get(session=session)
            if qr_code.expires_at and now() > qr_code.expires_at:
                return Response({'error': 'QR code has expired. Attendance window closed.'}, status=403)
        except QRCode.DoesNotExist:
            if now() > session.timestamp + timedelta(minutes=15):
                return Response({'error': 'Attendance window has closed.'}, status=403)

        # Create attendance
        Attendance.objects.create(
            student=student,
            session=session,
            latitude=latitude,
            longitude=longitude
        )

        return Response({
            'message': 'Attendance marked successfully',
            'distance_from_class': f'{distance:.2f} meters'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error marking attendance")
        return Response({'error': str(e)}, status=500)
    

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
        format, imgstr = qr_image_data.split(';base64,')
        ext = format.split('/')[-1]
        img_data = ContentFile(base64.b64decode(imgstr), name=f"qr_{session_id}.{ext}")

        qr_code_instance = QRCode(session=session)
        qr_code_instance.qr_image.save(f"qr_{session_id}.{ext}", img_data, save=True)

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
    permission_classes = [IsAuthenticated, IsLecturer]

    def get_queryset(self):
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            return Session.objects.filter(lecturer=lecturer).order_by('-timestamp')  # 👈 add ordering
        except Lecturer.DoesNotExist:
            return Session.objects.none()

    def perform_create(self, serializer):
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            serializer.save(lecturer=lecturer)
        except Lecturer.DoesNotExist:
            raise serializers.ValidationError("Lecturer profile not found for the logged-in user.")




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

class LecturerAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceLecturerViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = AttendanceFilter
    permission_classes = [IsAuthenticated, IsLecturerOrAdmin]

    def get_queryset(self):
        """
        Returns attendance records only for sessions belonging to the requesting lecturer.
        Includes optimizations for related data fetching.
        """
        user = self.request.user
        
        # For admin users, return all attendance records
        if user.role == 'admin':
            return Attendance.objects.all().select_related(
                'student__user',
                'session',
                'session__course',
                'session__lecturer'
            ).order_by('-check_in_time')
        
        # For lecturers, return only their own sessions' attendance
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
        Enhanced list view with:
        - Pagination
        - Detailed counts
        - Course filtering
        - Permission checks
        """
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Apply additional filters from query parameters
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
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.exception("Error in LecturerAttendanceViewSet")
            return Response(
                {"detail": "An error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_counts_data(self, queryset):
        """Helper method to generate counts data for the response"""
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

    def post(self, request):
        query = request.data.get("query", "")
        if not query:
            return Response({"error": "Query is required."}, status=400)
        
        try:
            answer = answer_natural_language_query(query)
            return Response({"answer": answer})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
from django.conf import settings
from django.http import JsonResponse
import os
def get_qr_codes(request):
    qr_dir = os.path.join(settings.MEDIA_ROOT, 'qr_codes')
    if not os.path.exists(qr_dir):
        return JsonResponse({"qr_codes": []})

    files = sorted(
        os.listdir(qr_dir),
        key=lambda x: os.path.getmtime(os.path.join(qr_dir, x)),
        reverse=True
    )
    qr_urls = [request.build_absolute_uri(os.path.join(settings.MEDIA_URL, 'qr_codes', f)) for f in files]
    return JsonResponse({"qr_codes": qr_urls})




class LecturerEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all enrollments for courses created by the lecturer"""
        enrollments = StudentCourseEnrollment.objects.filter(course__created_by=request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, course_id):
        """Enroll students to a course the lecturer owns"""
        try:
            course = Course.objects.get(id=course_id)
            if course.created_by != request.user:
                return Response({'error': 'Unauthorized for this course'}, status=status.HTTP_403_FORBIDDEN)

            student_ids = request.data.get('student_ids', [])
            students = Student.objects.filter(id__in=student_ids)

            if len(students) != len(student_ids):
                return Response({'error': 'One or more student IDs are invalid'}, status=status.HTTP_400_BAD_REQUEST)

            enrollments = []
            for student in students:
                enrollment, created = StudentCourseEnrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'enrolled_by': request.user}
                )
                if created:
                    enrollments.append(enrollment)

            return Response({
                'message': f'Successfully enrolled {len(enrollments)} students',
                'enrolled_count': len(enrollments),
                'duplicates': len(student_ids) - len(enrollments)
            }, status=status.HTTP_201_CREATED)

        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        
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
    
    
class LecturerEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # This handles the /lecturer/enrollments/ GET request
        # For example: list all enrollments for courses the lecturer owns
        enrollments = StudentCourseEnrollment.objects.filter(enrolled_by=request.user)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request, course_id=None):
        if course_id is None:
            return Response(
                {"error": "Course ID is required to enroll students."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            course = Course.objects.get(id=course_id, created_by=request.user)
            student_ids = request.data.get('student_ids', [])

            enrollments = []
            for student_id in student_ids:
                enrollment, created = StudentCourseEnrollment.objects.get_or_create(
                    student_id=student_id,
                    course=course,
                    defaults={'enrolled_by': request.user}
                )
                if created:
                    enrollments.append(enrollment)

            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response({
                'message': 'Students enrolled successfully',
                'enrollments': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found or access denied'},
                status=status.HTTP_404_NOT_FOUND
            )