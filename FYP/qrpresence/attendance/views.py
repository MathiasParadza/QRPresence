from datetime import date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsLecturer
from django.utils.timezone import now
from django.core.files.base import ContentFile
import base64
from .models import Session, Attendance, QRCode, Student, Lecturer, AttendanceRecord
from .utils import haversine
from .serializers import StudentSerializer, AttendanceMarkSerializer, SessionSerializer,AttendanceSerializer
from rest_framework import status, generics, serializers
import logging
from django.http import HttpResponse
from rest_framework.views import APIView
import csv
from django.db.models import Q



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
            return Session.objects.filter(lecturer=lecturer)
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
def admin_stats(request):
    total_students = Student.objects.count()
    total_lecturers = Lecturer.objects.count()
    total_sessions = Session.objects.count()
    active_sessions = Session.objects.filter(is_active=True).count()
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def missed_sessions_heatmap(request):
    data = [
        {"session": "Math101", "missed": 20},
        {"session": "History201", "missed": 35},
        {"session": "Physics301", "missed": 10},
        {"session": "Chemistry401", "missed": 50},
        {"session": "Biology501", "missed": 25},
    ]
    return Response(data)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecturer_attendance_records(request):
    # Allow only lecturers
    if getattr(request.user, 'role', None) != 'lecturer':
        return Response({'error': 'Permission denied'}, status=403)

    # Optional filters via query params (e.g. ?search=xyz&status=present)
    search = request.query_params.get('search', None)
    status_filter = request.query_params.get('status', None)

    queryset = Attendance.objects.all()

    if search:
        queryset = queryset.filter(
            Q(student__user__username__icontains=search) |
            Q(session__class_name__icontains=search)
        )
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    # Serialize the queryset
    serializer = AttendanceSerializer(queryset, many=True)

    return Response(serializer.data)

class ExportAttendanceCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Query attendance records, e.g., all or filtered by lecturer
        attendance_qs = Attendance.objects.all()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=attendance_report.csv'

        writer = csv.writer(response)
        writer.writerow(['Student ID', 'Session', 'Status', 'Check-in', 'Check-out'])
        for obj in attendance_qs:
            writer.writerow([
                obj.student.student_id,
                obj.session.class_name,
                obj.status,
                obj.check_in_time,
                obj.check_out_time,
            ])

        return response