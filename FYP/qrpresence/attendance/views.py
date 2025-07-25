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
from .models import Session, Attendance, QRCode, Student, Lecturer, AttendanceRecord
from .utils import haversine
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

        if Attendance.objects.filter(student=student, session=session).exists():
            return Response({'message': 'Attendance already marked for this session'}, status=status.HTTP_200_OK)

        Attendance.objects.create(
            student=student,
            session=session,
            latitude=latitude,
            longitude=longitude
        )

        return Response({'message': 'Attendance marked successfully'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception("Error marking attendance")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_record(request):
    if getattr(request.user, 'role', None) != 'lecturer':
        return Response({'error': 'Permission denied'}, status=403)

    report = list(AttendanceRecord.objects.values('student_id', 'session_id', 'timestamp', 'status'))
    return Response({'attendance_record': report})

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


class AttendanceRecordFilter(FilterSet):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
    ]

    status = ChoiceFilter(choices=STATUS_CHOICES)

    class Meta:
        model = AttendanceRecord
        fields = ['status', 'session', 'student']


class LecturerAttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceLecturerViewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = AttendanceFilter

    def get_queryset(self):
        # Check if user has lecturer profile
        try:
            lecturer_profile = self.request.user.lecturer
        except AttributeError:
            raise PermissionDenied("User is not associated with a lecturer profile")
            
        return Attendance.objects.filter(
            session__lecturer=lecturer_profile
        ).select_related('student__user', 'session').order_by('-check_in_time')

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            response = super().list(request, *args, **kwargs)

            response.data['counts'] = {
                'all': queryset.count(),
                'present': queryset.filter(status='Present').count(),
                'absent': queryset.filter(status='Absent').count(),
                'by_date': {
                    'today': queryset.filter(check_in_time__date=timezone.now().date()).count(),
                    'week': queryset.filter(check_in_time__date__gte=timezone.now().date() - timedelta(days=7)).count(),
                    'month': queryset.filter(check_in_time__month=timezone.now().month).count(),
                    'year': queryset.filter(check_in_time__year=timezone.now().year).count(),
                }
            }
            return response
            
        except PermissionDenied as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {"detail": "An error occurred while processing your request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            

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




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    # Verify the user is a lecturer
    if not request.user.role == 'lecturer':
        return Response(
            {'error': 'Only lecturers can create courses'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = CourseSerializer(data=request.data)
    if serializer.is_valid():
        # Automatically set the lecturer as the course creator
        course = serializer.save(created_by=request.user)
        return Response(
            {'message': 'Course created successfully', 'course_id': course.id},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_students(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
        
        # Verify the requesting lecturer owns the course
        if course.created_by != request.user:
            return Response(
                {'error': 'You can only enroll students in your own courses'},
                status=status.HTTP_403_FORBIDDEN
            )

        student_ids = request.data.get('student_ids', [])
        
        # Validate student IDs exist
        students = Student.objects.filter(id__in=student_ids)
        if len(students) != len(student_ids):
            return Response(
                {'error': 'One or more student IDs are invalid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create enrollments
        enrollments = []
        for student in students:
            enrollment, created = StudentCourseEnrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={'enrolled_by': request.user}
            )
            if created:
                enrollments.append(enrollment)

        return Response(
            {
                'message': f'Successfully enrolled {len(enrollments)} students',
                'enrolled_count': len(enrollments),
                'duplicates': len(student_ids) - len(enrollments)
            },
            status=status.HTTP_201_CREATED
        )

    except Course.DoesNotExist:
        return Response(
            {'error': 'Course not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
class LecturerCourseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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

    def post(self, request, course_id):
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