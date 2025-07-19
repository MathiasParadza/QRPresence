from django.urls import path
from django.urls import path, include
from . import views 
from .views import SessionListCreateView, SessionDetailAPIView
from .views import admin_stats
from .views import missed_sessions_heatmap
from .views import student_overview 
from rest_framework.routers import DefaultRouter
from .views import LecturerAttendanceViewSet
from .views import StudentListCreateAPIView, StudentDetailAPIView
from .views import export_students_csv



router = DefaultRouter()
router.register(r'lecturer-attendance', LecturerAttendanceViewSet, basename='lecturer-attendance')


urlpatterns = [
    path('mark/', views.mark_attendance, name='mark_attendance'),  
    path('report/', views.attendance_record, name='attendance_record'),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('sessions/', SessionListCreateView.as_view(), name='create-session'),
    path('admin/missed-sessions/', missed_sessions_heatmap, name='missed-sessions-heatmap'),
    path('generate-and-save-qr/', views.generate_and_save_qr, name='generate_and_save_qr'),
    path('validate-student/<str:student_id>/', views.validate_student, name='validate_student'),
    path('sessions/<int:pk>/', SessionDetailAPIView.as_view(), name='session-detail'),
    path('student/overview/', student_overview, name='student-overview'),
    path('lecturer/', include(router.urls)),
    path('students/', StudentListCreateAPIView.as_view(), name='student-list'),
    path('students/<int:pk>/', StudentDetailAPIView.as_view(), name='student-detail'),
    path('students/export-csv/', export_students_csv, name='export-students-csv'),
]
