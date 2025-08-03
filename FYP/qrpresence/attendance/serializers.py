from rest_framework import serializers
from .models import Session, Student, Lecturer, Attendance # Added Lecturer import
from .utils import haversine # Assuming haversine is in .utils
from django.contrib.auth import get_user_model
from authentication.serializers import UserSerializer
from .models import Course, StudentCourseEnrollment




class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            'id',
            'session_id',
            'class_name',
            'lecturer',  # <-- Added (required, since it's a ForeignKey)
            'course',    # <-- Added (required, since it's a ForeignKey)
            'gps_latitude',
            'gps_longitude',
            'allowed_radius',
            'timestamp',
            'attendance_window',  # <-- Added (optional, but part of the model)
        ]
        read_only_fields = ['id', 'timestamp']
        extra_kwargs = {
            'lecturer': {'required': True},  # Enforce lecturer is provided
            'course': {'required': True},     # Enforce course is provided
        }

    def validate_session_id(self, value):
        if self.instance is None and Session.objects.filter(session_id=value).exists():
            raise serializers.ValidationError("Session ID must be unique.")
        if self.instance and self.instance.session_id != value and Session.objects.filter(session_id=value).exists():
            raise serializers.ValidationError("Session ID must be unique.")
        return value

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
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['username']
        ref_name = 'LocalUserSerializer'  

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


class BulkEnrollmentSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    student_ids = serializers.ListField(
        child=serializers.IntegerField()
    )