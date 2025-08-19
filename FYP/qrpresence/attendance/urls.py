from django.urls import path
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

from .views import LecturerCourseView # LecturerEnrollmentView
from .views import LecturerEnrollmentView




router = DefaultRouter()
router.register(r'', LecturerAttendanceViewSet, basename='lecturer-attendance')


urlpatterns = [
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
    path('qr-codes/<int:qr_id>', views.delete_qr_code, name="delete_qr_code"),
    #course management
    path('lecturer/courses/', LecturerCourseView.as_view(), name='lecturer-courses'),
    path('lecturer/courses/create/', LecturerCourseView.as_view(), name='create-course'),
    path('lecturer/courses/<int:pk>/', LecturerCourseView.as_view(), name='course-detail'),
    #enrollment management
    path('lecturer/enrollments/', LecturerEnrollmentView.as_view(), name='lecturer-enrollments')
    # Alternative POST URL with course_id in path (optional)
   # path('lecturer/enrollments/course/<int:course_id>/', 
        # LecturerEnrollmentView.as_view(), 
        # name='lecturer-enrollments-course'),

    
]
