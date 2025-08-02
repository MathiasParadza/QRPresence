from django.contrib import admin
from .models import (
    Attendance,
    QRCode,
    Session,
    Lecturer,
    Student,
    Course,
    StudentCourseEnrollment,
)

# QRCode Admin
@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('session', 'created_at', 'expires_at', 'qr_image')
    list_filter = ('session', 'expires_at')
    search_fields = ('session__class_name',)
    fields = ('session', 'qr_image', 'expires_at')


# Lecturer Admin
@admin.register(Lecturer)
class LecturerAdmin(admin.ModelAdmin):
    list_display = ('lecturer_id', 'name', 'email', 'department')
    search_fields = ('name', 'user__username', 'user__email')
    list_filter = ('department',)


# Student Admin
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'email', 'program')
    search_fields = ('student_id', 'name', 'user__username', 'user__email')
    list_filter = ('program',)


# Attendance Admin
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'session', 'status', 'check_in_time', 'check_out_time')
    ordering = ('-check_in_time',)
    list_filter = ('status', 'check_in_time', 'session')
    search_fields = ('student__user__username', 'session__class_name')
    date_hierarchy = 'check_in_time'
    actions = ['export_as_csv']

    def export_as_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=attendance_report.csv'
        writer = csv.writer(response)
        writer.writerow(['Student ID', 'Session', 'Status', 'Check-in', 'Check-out'])
        for obj in queryset:
            writer.writerow([
                obj.student.student_id, obj.session.class_name,
                obj.status, obj.check_in_time, obj.check_out_time
            ])
        return response

    export_as_csv.short_description = "Export Selected as CSV"


# Session Admin
@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'class_name', 'course', 'lecturer', 'timestamp')
    search_fields = ('class_name', 'session_id', 'course__title')
    list_filter = ('course', 'lecturer', 'timestamp')
    ordering = ('-timestamp',)


# Course Admin
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'credit_hours', 'created_by', 'created_at')
    search_fields = ('code', 'title', 'description')
    list_filter = ('credit_hours',)
    ordering = ('-created_at',)


# Student-Course Enrollment Admin
@admin.register(StudentCourseEnrollment)
class StudentCourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrolled_by', 'enrolled_at')
    search_fields = ('student__student_id', 'course__code', 'student__name')
    list_filter = ('course', 'enrolled_by')
    ordering = ('-enrolled_at',)
