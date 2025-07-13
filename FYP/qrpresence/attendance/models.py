from django.db import models
from django.utils.timezone import now
from django.conf import settings

class Lecturer(models.Model):
    lecturer_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    is_admin = models.BooleanField(default=False)  # 👈 Add this field

    def __str__(self):
        return self.name

class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    program = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.student_id})"
    

class Session(models.Model):
    session_id = models.CharField(max_length=100, unique=True)  # <-- manually entered ID
    class_name = models.CharField(max_length=255)
    lecturer = models.ForeignKey(Lecturer, to_field='lecturer_id', on_delete=models.CASCADE)
    gps_latitude = models.FloatField()
    gps_longitude = models.FloatField()
    allowed_radius = models.IntegerField(default=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.class_name} ({self.session_id}) - {self.timestamp}"
    
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
