from rest_framework import serializers
from .models import Session
from .utils import generate_qr_code


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
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']

    def validate_session_id(self, value):
        if Session.objects.filter(session_id=value).exists():
            raise serializers.ValidationError("Session ID must be unique.")
        return value

#student serializer
from .models import Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'student_id', 'course', 'year']  # Add fields as needed
        read_only_fields = ['id', 'user']