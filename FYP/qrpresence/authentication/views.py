from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UserSerializer
from .models import UserProfile, CustomUser
from django.db import transaction


# JWT login view (extend if needed)
class MyTokenObtainPairView(TokenObtainPairView):
    pass




class LogoutUserView(APIView):
    """
    Handle user logout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # JWT tokens can't be forcibly invalidated on the server without extra setup.
        # You could add token blacklisting here if needed.
        return Response({"message": "Logout handled on frontend by deleting token."}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """
    Retrieve or update user profile information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "bio": profile.bio,
            "location": profile.location,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        profile = request.user.profile
        profile.bio = request.data.get('bio', profile.bio)
        profile.location = request.data.get('location', profile.location)
        profile.profile_picture = request.data.get('profile_picture', profile.profile_picture)
        profile.save()

        return Response({
            "message": "Profile updated successfully.",
            "bio": profile.bio,
            "location": profile.location,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
        }, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    """
    Handle password reset by sending a reset token to the user's email.
    """
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = get_user_model().objects.filter(email=email).first()

        if not user:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)

        token = default_token_generator.make_token(user)

        return Response({
            "message": "Password reset token has been sent.",
            "reset_token": token
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Handle changing of a user's password.
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
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    data = request.data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    student_id = data.get('student_id')

    if CustomUser.objects.filter(username=username).exists():
        return Response({'username': ['A user with that username already exists.']}, status=400)
    if CustomUser.objects.filter(email=email).exists():
        return Response({'email': ['A user with that email already exists.']}, status=400)

    if role == 'student':
        if not student_id:
            return Response({'student_id': ['Student ID is required.']}, status=400)

        if Student.objects.filter(student_id=student_id).exists():
            return Response({'student_id': ['Student ID already exists.']}, status=400)

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='student'
            )
            Student.objects.create(user=user, student_id=student_id, email=email)
        return Response({'message': 'Student registered successfully'}, status=201)

    elif role == 'lecturer':
        with transaction.atomic():
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                role='lecturer'
            )
            Lecturer.objects.create(user=user, email=email)
        return Response({'message': 'Lecturer registered successfully'}, status=201)

    return Response({'error': 'Invalid role'}, status=400)
# Student Profile Update View
    
from attendance.models import Student, Lecturer
from attendance.serializers import StudentSerializer  
from rest_framework.permissions import IsAuthenticated

class StudentProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            student = request.user.student
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found."}, status=404)

        serializer = StudentSerializer(student)
        return Response(serializer.data)

    def put(self, request):
        try:
            student = request.user.student
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found."}, status=404)

        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student profile updated successfully."})
        return Response(serializer.errors, status=400)
