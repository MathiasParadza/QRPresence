from django.db import models
from django.utils.timezone import now
from django.conf import settings

class Student(models.Model):
    student_id = models.CharField(max_length=20, primary_key=True)  # Keep manually assigned ID
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    name = models.CharField(max_length=100)
    program = models.CharField(max_length=100)
    courses = models.ManyToManyField('Course', related_name='students')

    @property
    def email(self):
        return self.user.email

    def __str__(self):
        return f"{self.name} ({self.student_id})"


class Lecturer(models.Model):
    lecturer_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lecturer_profile',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100, null=True, blank=True)  
    department = models.CharField(max_length=100, blank=True, null=True)
    is_admin = models.BooleanField(default=False)

    @property
    def email(self):
        return self.user.email if self.user else None

    def __str__(self):
        return self.name or "Unnamed Lecturer"


class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField()
    credit_hours = models.PositiveIntegerField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_courses'
    )
    created_at = models.DateTimeField(auto_now_add=True)

class StudentCourseEnrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        
class Session(models.Model):
    session_id = models.CharField(max_length=100, unique=True)  # <-- manually entered ID
    class_name = models.CharField(max_length=255)
    lecturer = models.ForeignKey('Lecturer', to_field='lecturer_id', on_delete=models.CASCADE)
    gps_latitude = models.FloatField()
    gps_longitude = models.FloatField()
    allowed_radius = models.IntegerField(default=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='sessions')
    

    def __str__(self):
        return f"{self.class_name} ({self.session_id}) - {self.timestamp}"
    class Meta:
        ordering = ['-timestamp']

class AttendanceRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent')], default='Present')  # 🛠 Capital P
class QRCode(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    qr_image = models.ImageField(upload_to="qr_codes/")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"QR for {self.session}"

    def is_expired(self):
        return self.expires_at and now() > self.expires_at

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent')], default='Present')
    check_in_time = models.DateTimeField(default=now)
    check_out_time = models.DateTimeField(blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)   
    longitude = models.FloatField(null=True, blank=True)


    def __str__(self):
        return f"{self.student} - {self.session}"
    class Meta:
        ordering = ['-check_in_time']
