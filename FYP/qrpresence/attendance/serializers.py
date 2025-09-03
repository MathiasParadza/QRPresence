from rest_framework import serializers
from .models import Session, Student, Lecturer, Attendance # Added Lecturer import
from .utils import haversine # Assuming haversine is in .utils
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer
from .models import Course, StudentCourseEnrollment
from django.core.exceptions import ValidationError
from .models import QRCode



class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            'id',
            'session_id',
            'class_name',
            'gps_latitude',
            'gps_longitude',
            'allowed_radius',
            'course',  # Using the actual field name from model
            'lecturer',
            'timestamp',
            'attendance_window'
        ]
        extra_kwargs = {
            'session_id': {'required': True},
            'class_name': {'required': True},
            'gps_latitude': {'required': True},
            'gps_longitude': {'required': True},
            'course': {'required': True},
            'lecturer': {'read_only': True},  # Will be set in perform_create
            'timestamp': {'read_only': True},
            'attendance_window': {'read_only': True}  # Uses default value
        }

    def validate(self, data):
        """Additional validation for the session"""
        if data.get('gps_latitude') < -90 or data.get('gps_latitude') > 90:
            raise ValidationError("Latitude must be between -90 and 90")
        if data.get('gps_longitude') < -180 or data.get('gps_longitude') > 180:
            raise ValidationError("Longitude must be between -180 and 180")
        if data.get('allowed_radius') < 10 or data.get('allowed_radius') > 1000:
            raise ValidationError("Allowed radius must be between 10 and 1000 meters")
        return data
class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = ['student_id', 'user', 'name', 'email', 'program']

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")

    # Exclude the current instance when checking for duplicates (important for updates)
        student_qs = Student.objects.filter(email=value)
        if self.instance:
            student_qs = student_qs.exclude(pk=self.instance.pk)

        if student_qs.exists():
            raise serializers.ValidationError("A student with this email already exists.")

        return value


class LecturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lecturer
        fields = ['lecturer_id', 'name', 'email', 'department', 'is_admin']  # include is_admin


class AttendanceMarkSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()

    def validate(self, data):
        session_id = data.get('session_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if not session_id:
            raise serializers.ValidationError({"session_id": "Session ID is required."})

        try:
            session = Session.objects.get(session_id=session_id)
        except Session.DoesNotExist:
            raise serializers.ValidationError({"session_id": f"Session with ID '{session_id}' not found."})

        # Geolocation validation
        # Ensure session has GPS data
        if session.gps_latitude is None or session.gps_longitude is None or session.allowed_radius is None:
            raise serializers.ValidationError({"session_id": "Session location data is not configured. Cannot validate attendance."})

        distance = haversine(
            session.gps_latitude, session.gps_longitude,
            latitude, longitude
        )

        if distance > session.allowed_radius:
            raise serializers.ValidationError(
                {"location": f"You are {distance:.2f} meters away. "
                             f"You must be within {session.allowed_radius} meters of the session location to mark attendance."}
            )

        return data
    

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username']
        ref_name = 'SimpleUserSerializer' 

class StudentNestedSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    
    class Meta:
        model = Student
        fields = ['student_id', 'user']

class SessionNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'class_name']  # Added id for filtering

class AttendanceLecturerViewSerializer(serializers.ModelSerializer):
    student = StudentNestedSerializer()
    session = SessionNestedSerializer()
    
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'session', 'status', 'check_in_time', 'check_out_time', 'latitude', 'longitude']


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'title', 'code', 'description', 'credit_hours']
        extra_kwargs = {
            'created_by': {'read_only': True}
        }
class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentCourseEnrollment
        fields = ['id', 'student', 'course', 'enrolled_by', 'enrolled_at']
        read_only_fields = ['enrolled_by', 'enrolled_at']


class QRCodeSerializer(serializers.ModelSerializer):
    session_name = serializers.CharField(source='session.class_name', read_only=True)
    session_id = serializers.CharField(source='session.session_id', read_only=True)
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = QRCode
        fields = [
            'id',
            'qr_image',
            'created_at',
            'expires_at',
            'is_expired',
            'session_name',
            'session_id'
        ]
        read_only_fields = ['created_at']

    def get_is_expired(self, obj):
        return obj.is_expired()
    
class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    session_name = serializers.CharField(source='session.class_name', read_only=True)
    course_code = serializers.CharField(source='session.course.code', read_only=True)
    course_title = serializers.CharField(source='session.course.title', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id',
            'student',
            'student_name',
            'student_id',
            'session',
            'session_name',
            'course_code',
            'course_title',
            'status',
            'check_in_time',
            'check_out_time',
            'latitude',
            'longitude'
        ]
        read_only_fields = ['check_in_time']