from django.urls import path, include
from . import views 
from .views import SessionListCreateView, SessionDetailAPIView
from .views import student_overview 
from rest_framework.routers import DefaultRouter
from .views import LecturerAttendanceViewSet
from .views import StudentListCreateAPIView, StudentDetailAPIView
from .views import export_students_csv
from .views import AbsentStudentsView
from .views import AttendanceAIChatView
from .views import LecturerCourseView, LecturerEnrollmentView

# Import the admin views we created
from .views import (
    AdminUserViewSet, AdminStudentViewSet, AdminLecturerViewSet,
    AdminCourseViewSet, AdminSessionViewSet, AdminQRCodeViewSet,
    AdminAttendanceViewSet, AdminEnrollmentViewSet, AdminDashboardViewSet, AdminStatsViewSet
)

# Existing router for lecturer attendance
router = DefaultRouter()
router.register(r'', LecturerAttendanceViewSet, basename='lecturer-attendance')

# New router for admin endpoints
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-user')
admin_router.register(r'students', AdminStudentViewSet, basename='admin-student')
admin_router.register(r'lecturers', AdminLecturerViewSet, basename='admin-lecturer')
admin_router.register(r'courses', AdminCourseViewSet, basename='admin-course')
admin_router.register(r'sessions', AdminSessionViewSet, basename='admin-session')
admin_router.register(r'qrcodes', AdminQRCodeViewSet, basename='admin-qrcode')
admin_router.register(r'attendance', AdminAttendanceViewSet, basename='admin-attendance')
admin_router.register(r'enrollments', AdminEnrollmentViewSet, basename='admin-enrollment')
admin_router.register(r'dashboard', AdminDashboardViewSet, basename='admin-dashboard')
admin_router.register(r'stats', AdminStatsViewSet, basename='admin-stats')

urlpatterns = [
    # Existing endpoints
    path('mark/', views.mark_attendance, name='mark_attendance'),  
    path('sessions/', SessionListCreateView.as_view(), name='create-session'),
    path('generate-and-save-qr/', views.generate_and_save_qr, name='generate_and_save_qr'),
    path('validate-student/<str:student_id>/', views.validate_student, name='validate_student'),
    path('sessions/<int:pk>/', SessionDetailAPIView.as_view(), name='session-detail'),
    path('student/overview/', student_overview, name='student-overview'),
    path('lecturer-attendance/', include(router.urls)),
    path('students/', StudentListCreateAPIView.as_view(), name='student-list'),
    path('students/<int:pk>/', StudentDetailAPIView.as_view(), name='student-detail'),
    path('students/export-csv/', export_students_csv, name='export-students-csv'),
    path('attendance/absent/<str:session_id>/', AbsentStudentsView.as_view(), name='absent-students'),
    path('ai-chat/', AttendanceAIChatView.as_view(), name='attendance-ai-chat'),
    path('qr-codes/', views.get_qr_codes, name="get_qr_codes"),
    path('qr-codes/<int:qr_id>/', views.delete_qr_code, name="delete_qr_code"),
    path('qr-codes/<int:qr_id>/download/', views.download_qr_code, name="download_qr_code"),
    
    # Course management
    path('lecturer/courses/', LecturerCourseView.as_view(), name='lecturer-courses'),
    path('lecturer/courses/create/', LecturerCourseView.as_view(), name='create-course'),
    path('lecturer/courses/<int:pk>/', LecturerCourseView.as_view(), name='course-detail'),
    
    # Enrollment management
    path('lecturer/enrollments/', LecturerEnrollmentView.as_view(), name='lecturer-enrollments'),
    
    # Admin endpoints - added at the end to avoid conflicts
    path('admin/', include(admin_router.urls)),
]