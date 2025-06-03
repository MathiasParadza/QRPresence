from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile
from attendance.models import Student
from attendance.models import Lecturer
from .models import CustomUser
User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for handling user profile data.
    """
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'location', 'profile_picture']
        read_only_fields = ['user']
        
    def update(self, instance, validated_data):
        """
        Update user profile information.
        """
        instance.bio = validated_data.get('bio', instance.bio)
        instance.location = validated_data.get('location', instance.location)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)

        instance.save()
        return instance
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating, updating, and returning users.
    Handles both Student and Lecturer profile creation depending on the role.
    """
    # Extra fields for profile creation
    student_id = serializers.CharField(write_only=True, required=False)
    lecturer_id = serializers.CharField(write_only=True, required=False)
    department = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password',
            'student_id', 'lecturer_id', 'department'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        # Extract profile-specific data
        student_id = validated_data.pop('student_id', None)
        lecturer_id = validated_data.pop('lecturer_id', None)
        department = validated_data.pop('department', None)
        role = validated_data.get('role')

        # Create the user
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role
        )

        # Create Student or Lecturer profile based on role
        if role == 'student':
            if not student_id:
                raise serializers.ValidationError({"student_id": "Student ID is required for students."})
            Student.objects.create(user=user, student_id=student_id)

        elif role == 'lecturer':
            Lecturer.objects.create(
                user=user,
                lecturer_id=lecturer_id if lecturer_id else "",
                department=department if department else ""
            )

        return user