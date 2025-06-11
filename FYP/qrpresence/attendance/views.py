from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsLecturer
from django.utils.timezone import now
from django.core.files.base import ContentFile
import base64
from django.http import JsonResponse
from .models import Session, Attendance, QRCode, Student, Lecturer
from .utils import haversine
from .models import AttendanceRecord 

from django.utils import timezone
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Session, Attendance,Student
from .utils import haversine  # Ensure you have this distance calculation function
from rest_framework import status
import logging
from .serializers import AttendanceMarkSerializer  # Import the serializer

# Configure logger
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    """Mark attendance endpoint"""

    serializer = AttendanceMarkSerializer(data=request.data)
    if not serializer.is_valid():
        print(serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    session_id = serializer.validated_data['session_id']
    latitude = serializer.validated_data['latitude']
    longitude = serializer.validated_data['longitude']

    try:
        # Validate session exists
        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate student exists
        try:
            student = Student.objects.get(user=request.user)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent duplicate attendance
        if Attendance.objects.filter(student=student, session=session).exists():
            return Response(
                {'error': 'Attendance already marked for this session'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create attendance record
        Attendance.objects.create(
            student=student,
            session=session,
            latitude=latitude,
            longitude=longitude
        )

        return Response(
            {'message': 'Attendance marked successfully'},
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        logger.exception("Error marking attendance")
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Correct Django view (Attendance report API)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_record(request):
    if request.user.role != 'lecturer':
        return Response({'error': 'Permission denied'}, status=403)
    
    report = list(AttendanceRecord.objects.values('student_id', 'session_id', 'timestamp', 'status'))
    return Response({'attendance_record': report})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_and_save_qr(request):
    # Check if the user is a lecturer
    if request.user.role != 'lecturer':
        return Response({'error': 'Permission denied. Lecturer access only.'}, status=403)

    # Extract session name and QR image data from request
    session_name = request.data.get('session_name')
    qr_image_data = request.data.get('qr_image')

    # Validate that both fields are provided
    if not session_name or not qr_image_data:
        return Response({'error': 'Missing session_name or qr_image'}, status=400)

    try:
        # Decode the base64 image data
        format, imgstr = qr_image_data.split(';base64,')
        ext = format.split('/')[-1]  # Extract file extension (e.g., png, jpg)
        img_data = ContentFile(base64.b64decode(imgstr), name=f"{session_name}.{ext}")

        # Save QR code image to the database
        qr_code_instance = QRCode(session_name=session_name)
        qr_code_instance.qr_image.save(f"qr_{session_name}.{ext}", img_data, save=True)

        return Response({
            'message': 'QR code generated and saved successfully.',
            'qr_url': qr_code_instance.qr_image.url
        })
    
    except Exception as e:
        return Response({'error': f'Failed to save QR code: {str(e)}'}, status=500)
    
    #sessions
from rest_framework import generics
from .models import Session
from .serializers import SessionSerializer
from rest_framework import serializers

class SessionListCreateView(generics.ListCreateAPIView):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated, IsLecturer]

    def get_queryset(self):
        """
        This ensures lecturers only see their own sessions.
        """
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            return Session.objects.filter(lecturer=lecturer)
        except Lecturer.DoesNotExist:
            return Session.objects.none()  # Return empty queryset if Lecturer is missing

    def perform_create(self, serializer):
        """
        Automatically attach the logged-in lecturer when creating a session.
        """
        try:
            lecturer = Lecturer.objects.get(user=self.request.user)
            serializer.save(lecturer=lecturer)
        except Lecturer.DoesNotExist:
            raise serializers.ValidationError("Lecturer profile not found for the logged-in user.")
        
#admin stats
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """
    Return statistics for the Admin Dashboard
    """
    # Fetch stats
    total_students = Student.objects.count()
    total_lecturers = Lecturer.objects.count()
    total_sessions = Session.objects.count()
    active_sessions = Session.objects.filter(is_active=True).count()
    
    # Calculate attendance rate
    total_attendances = Attendance.objects.count()
    total_possible_attendances = total_sessions * total_students if total_sessions > 0 else 0
    attendance_rate = (total_attendances / total_possible_attendances) * 100 if total_possible_attendances > 0 else 0

    stats = [
        {"label": "Total Students", "value": total_students},
        {"label": "Total Lecturers", "value": total_lecturers},
        {"label": "Total Sessions", "value": total_sessions},
        {"label": "Active Sessions", "value": active_sessions},
        {"label": "Attendance Rate", "value": f"{attendance_rate:.2f}%"},
    ]
    return Response(stats)


#missed sessions data
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def missed_sessions_heatmap(request):
    # 🔥 Dummy data for now
    data = [
        {"session": "Math101", "missed": 20},
        {"session": "History201", "missed": 35},
        {"session": "Physics301", "missed": 10},
        {"session": "Chemistry401", "missed": 50},
        {"session": "Biology501", "missed": 25},
    ]
    return Response(data)

#Validatate student id
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