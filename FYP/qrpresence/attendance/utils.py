import qrcode
from io import BytesIO
from django.core.files import File
from django.conf import settings
from PIL import Image
import math


def generate_qr_code(data):
    """
    Generates a QR code image for the given data and returns it as a File object.
    """
    # Create the QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create an image from the QR code
    img = qr.make_image(fill='black', back_color='white')

    # Save image to a BytesIO object (so it can be saved in the database)
    img_io = BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)

    # Convert the image into a Django File object
    qr_code_file = File(img_io, name=f"{data}.png")
    
    return qr_code_file



#haversine function to calculate distance between two GPS coordinates
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c




def is_qr_valid(session, scan_time, latitude, longitude, max_distance=0.1):
    if session.attendance_window and scan_time > session.timestamp + session.attendance_window:
        return False, "QR code has expired."
    if session.gps_latitude is not None and session.gps_longitude is not None:
        distance = haversine(latitude, longitude, session.gps_latitude, session.gps_longitude)
        if distance > max_distance:
            return False, "You are too far from the class location."
    return True, "QR code is valid."


# controlling attendance if only using campus wifi
def is_on_campus(request):
    ip = request.META.get('REMOTE_ADDR')
    allowed_ips = ['192.168.', '10.0.', '123.45.67.89']  # add your internal/public ranges
    return any(ip.startswith(prefix) for prefix in allowed_ips)
#needs to be included in mark attendance logic
   # def post(self, request):
    #    if not is_on_campus(request):
     #       return Response({"detail": "You must be on campus Wi-Fi to mark attendance."},
      #                      status=status.HTTP_403_FORBIDDEN

from functools import wraps
from django.http import JsonResponse

def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        if user.role != 'admin':
            return JsonResponse({'error': 'Admin access only'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view


from attendance.models import Session,Attendance, Student

def get_absent_students(session_id):
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return None  # or raise an exception if you want

    enrolled_students = session.course.students.all()
    present_students = Student.objects.filter(attendance__session=session)
    absent_students = enrolled_students.exclude(id__in=present_students.values_list('id', flat=True))
    return absent_students


from attendance.models import Session, Attendance, Student

def get_absent_students(session_id):
    """
    Returns a queryset of students who are enrolled but absent for the given session.
    Assumes you add a way to link students to courses/sessions (or all students are enrolled).
    """
    try:
        session = Session.objects.get(session_id=session_id)
    except Session.DoesNotExist:
        return None  # or raise an exception if preferred

    # TODO: Replace this with your actual logic to get enrolled students for session/course
    enrolled_students = Student.objects.all()  # placeholder for enrolled students for the session

    # Students who have attendance marked as present in this session
    present_student_ids = Attendance.objects.filter(session=session, status='Present').values_list('student__student_id', flat=True)

    # Absent students = enrolled - present
    absent_students = enrolled_students.exclude(student_id__in=present_student_ids)

    return absent_students




from attendance.models import Attendance, Student, Session, Course
from datetime import timedelta
from django.utils import timezone

class AnalyticsAgent:
    @staticmethod
    def get_absent_students(session):
        enrolled = session.course.students.all()
        present = Student.objects.filter(attendance__session=session)
        return enrolled.exclude(id__in=present.values_list('id', flat=True))

    @staticmethod
    def get_student_attendance_summary(student):
        total_sessions = Session.objects.filter(course__in=student.courses.all()).count()
        attended = Attendance.objects.filter(student=student).count()
        percentage = (attended / total_sessions * 100) if total_sessions else 0
        return {
            'student_id': student.student_id,
            'attended': attended,
            'total_sessions': total_sessions,
            'attendance_percentage': round(percentage, 2)
        }

    @staticmethod
    def get_course_attendance_rate(course):
        sessions = course.session_set.all()
        students = course.students.count()
        total_possible = sessions.count() * students
        attended_total = Attendance.objects.filter(session__in=sessions).count()
        rate = (attended_total / total_possible * 100) if total_possible else 0
        return round(rate, 2)

    @staticmethod
    def get_low_attendance_students(course, threshold=75):
        students = course.students.all()
        flagged = []
        for student in students:
            total = course.session_set.count()
            attended = Attendance.objects.filter(student=student, session__course=course).count()
            percentage = (attended / total * 100) if total else 0
            if percentage < threshold:
                flagged.append({
                    'student_id': student.student_id,
                    'percentage': round(percentage, 2)
                })
        return flagged
