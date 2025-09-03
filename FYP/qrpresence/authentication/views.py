from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UserSerializer
from .models import CustomUser
from attendance.models import Student, Lecturer
from attendance.serializers import StudentSerializer


# Custom JWT Login View
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Extends default JWT login view if needed in the future.
    """
    pass


class LogoutUserView(APIView):
    """
    Handles user logout. JWT token deletion is handled client-side.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"message": "Logout handled on frontend by deleting token."}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    Retrieve or update a user's profile depending on their role.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if hasattr(user, 'student_profile'):
            student = user.student_profile
            return Response({
                "role": "student",
                "username": user.username,
                "email": student.email,
                "name": student.name,
                "program": student.program,
                "student_id": student.student_id,
            })

        elif hasattr(user, 'lecturer_profile'):
            lecturer = user.lecturer_profile
            return Response({
                "role": "lecturer",
                "username": user.username,
                "email": lecturer.email,
                "name": lecturer.name,
                "department": lecturer.department,
                "is_admin": lecturer.is_admin,
            })

        return Response({"detail": "No associated profile found."}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        user = request.user
        data = request.data

        if hasattr(user, 'student_profile'):
            student = user.student_profile
            student.name = data.get('name', student.name)
            student.program = data.get('program', student.program)
            student.save()
            return Response({"message": "Student profile updated successfully."})

        elif hasattr(user, 'lecturer_profile'):
            lecturer = user.lecturer_profile
            lecturer.name = data.get('name', lecturer.name)
            lecturer.department = data.get('department', lecturer.department)
            lecturer.save()
            return Response({"message": "Lecturer profile updated successfully."})

        return Response({"detail": "No profile found to update."}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetView(APIView):
    """
    Sends a password reset token to the user's email.
    (Email sending needs to be implemented separately.)
    """
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_user_model().objects.filter(email=email).first()
        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        token = default_token_generator.make_token(user)
        # Here you'd normally send the token via email.
        return Response({
            "message": "Password reset token has been generated.",
            "reset_token": token
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Allow authenticated users to change their password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"error": "Old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.check_password(old_password):
            return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Return serialized user info (for frontend auth check).
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Handle user registration (student, lecturer, or admin).
    """
    data = request.data
    required_fields = ['username', 'email', 'password', 'role', 'name']
    missing = [field for field in required_fields if field not in data]

    if missing:
        return Response({'error': f"Missing required fields: {', '.join(missing)}"}, status=400)

    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']
    role = data['role'].lower()
    name = data['name'].strip()

    # Email format validation
    try:
        validate_email(email)
    except ValidationError:
        return Response({'email': ['Enter a valid email address.']}, status=400)

    # Username & email uniqueness
    if CustomUser.objects.filter(username=username).exists():
        return Response({'username': ['This username is already taken.']}, status=400)
    if CustomUser.objects.filter(email=email).exists():
        return Response({'email': ['This email is already registered.']}, status=400)

    if role not in ['student', 'lecturer', 'admin']:
        return Response({'error': 'Invalid role. Must be either "student", "lecturer", or "admin".'}, status=400)

    try:
        with transaction.atomic():
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                first_name=name.split()[0],
                last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
            )

            if role == 'student':
                student_id = data.get('student_id', '').strip()
                program = data.get('program', '').strip()

                if not student_id:
                    return Response({'student_id': ['Student ID is required.']}, status=400)
                if Student.objects.filter(student_id=student_id).exists():
                    return Response({'student_id': ['This Student ID already exists.']}, status=400)

                Student.objects.create(
                    user=user,
                    student_id=student_id,
                    name=name,
                    program=program
                )

                return Response({
                    'message': 'Student registered successfully',
                    'user_id': user.id,
                    'student_id': student_id
                }, status=201)

            elif role == 'lecturer':
                lecturer_id = data.get('lecturer_id', '').strip()
                department = data.get('department', '').strip()

                if not lecturer_id:
                    return Response({'lecturer_id': ['Lecturer ID is required.']}, status=400)
                if Lecturer.objects.filter(lecturer_id=lecturer_id).exists():
                    return Response({'lecturer_id': ['This Lecturer ID already exists.']}, status=400)

                if not department:
                    return Response({'department': ['Department is required.']}, status=400)

                Lecturer.objects.create(
                    user=user,
                    lecturer_id=lecturer_id,
                    name=name,
                    department=department
                )

                return Response({
                    'message': 'Lecturer registered successfully',
                    'user_id': user.id,
                    'lecturer_id': lecturer_id
                }, status=201)

            elif role == 'admin':
                # For admin role, we just create the user with admin role
                # No additional profile creation needed unless you have an AdminProfile model
                return Response({
                    'message': 'Admin registered successfully',
                    'user_id': user.id
                }, status=201)

    except Exception as e:
        return Response({'error': f"Registration failed: {str(e)}"}, status=400)

class StudentProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = getattr(request.user, 'student_profile', None)
        if not student:
            return Response({"error": "Student profile not found."}, status=404)

        serializer = StudentSerializer(student)
        return Response(serializer.data)

    def put(self, request):
        student = getattr(request.user, 'student_profile', None)
        if not student:
            return Response({"error": "Student profile not found."}, status=404)

        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student profile updated successfully."})
        return Response(serializer.errors, status=400)
