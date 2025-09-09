from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone



# Custom User model
class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=[('student', 'Student'), ('lecturer', 'Lecturer'),('admin', 'Admin')])

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['id']  # or ['username', 'date_joined', etc.]

    # Avoid reverse accessor clashes with related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_groups',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_permissions',
        blank=True
    )
# User Profile model
class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Profile of {self.user.username}"



