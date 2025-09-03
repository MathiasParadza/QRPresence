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
    student_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    lecturer_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    department = serializers.CharField(write_only=True, required=False, allow_blank=True)
    admin_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    name = serializers.CharField(write_only=True, required=False)
    program = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'role', 'password',
            'student_id', 'lecturer_id', 'department', 'admin_id',
            'name', 'program'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, data):
        role = data.get('role')
        
        # Validate student-specific fields
        if role == 'student':
            if not data.get('student_id'):
                raise serializers.ValidationError({"student_id": "Student ID is required for students."})
            if not data.get('name'):
                raise serializers.ValidationError({"name": "Name is required for students."})
            if not data.get('program'):
                raise serializers.ValidationError({"program": "Program is required for students."})
        
        # Validate lecturer-specific fields
        elif role == 'lecturer':
            if not data.get('lecturer_id'):
                raise serializers.ValidationError({"lecturer_id": "Lecturer ID is required for lecturers."})
            if not data.get('name'):
                raise serializers.ValidationError({"name": "Name is required for lecturers."})
            if not data.get('department'):
                raise serializers.ValidationError({"department": "Department is required for lecturers."})
        
        # Validate admin-specific fields (if needed)
        elif role == 'admin':
            # Admin might not require additional fields, or you can add validation here
            # For example, if you want to require admin_id:
            # if not data.get('admin_id'):
            #     raise serializers.ValidationError({"admin_id": "Admin ID is required for admins."})
            pass
        
        return data

    def create(self, validated_data):
        # Extract role-specific data
        student_id = validated_data.pop('student_id', None)
        lecturer_id = validated_data.pop('lecturer_id', None)
        department = validated_data.pop('department', None)
        admin_id = validated_data.pop('admin_id', None)
        name = validated_data.pop('name', None)
        program = validated_data.pop('program', None)
        
        role = validated_data.get('role')

        # Create the user
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
        )

        # Create role-specific profile
        if role == 'student':
            Student.objects.create(
                user=user,
                student_id=student_id,
                name=name,
                program=program
            )

        elif role == 'lecturer':
            Lecturer.objects.create(
                user=user,
                lecturer_id=lecturer_id,
                name=name,
                department=department
            )

        elif role == 'admin':
            # Create admin profile if you have an AdminProfile model
            # AdminProfile.objects.create(
            #     user=user,
            #     admin_id=admin_id or f"ADM{user.id:04d}",
            #     name=name
            # )
            # For now, just create the user with admin role
            pass

        return user

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Add role-specific data to the response
        if instance.role == 'student' and hasattr(instance, 'student'):
            representation['student_id'] = instance.student.student_id
            representation['name'] = instance.student.name
            representation['program'] = instance.student.program
            
        elif instance.role == 'lecturer' and hasattr(instance, 'lecturer'):
            representation['lecturer_id'] = instance.lecturer.lecturer_id
            representation['name'] = instance.lecturer.name
            representation['department'] = instance.lecturer.department
            
        elif instance.role == 'admin':
            # Add admin-specific data if you have an AdminProfile model
            # if hasattr(instance, 'admin_profile'):
            #     representation['admin_id'] = instance.admin_profile.admin_id
            pass
            
        return representation 