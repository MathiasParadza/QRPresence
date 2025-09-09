from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class SiteSettings(models.Model):
    site_title = models.CharField(max_length=200, default='QRPresence')
    site_logo = models.ImageField(upload_to='site_logos/', blank=True, null=True)
    academic_year = models.CharField(max_length=20, default='2023/2024')
    semester = models.CharField(max_length=20, choices=[
        ('1', 'Semester 1'),
        ('2', 'Semester 2'),
        ('3', 'Summer Semester')
    ], default='1')
    attendance_threshold = models.PositiveIntegerField(
        default=75,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Minimum attendance percentage required'
    )
    qr_code_expiry = models.PositiveIntegerField(
        default=15,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text='QR code validity in minutes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'
    
    def __str__(self):
        return f'Site Settings ({self.updated_at})'
    
    def save(self, *args, **kwargs):
        # Ensure only one settings instance exists
        if not self.pk and SiteSettings.objects.exists():
            # Update existing instance instead of creating new one
            existing = SiteSettings.objects.first()
            existing.site_title = self.site_title
            existing.site_logo = self.site_logo
            existing.academic_year = self.academic_year
            existing.semester = self.semester
            existing.attendance_threshold = self.attendance_threshold
            existing.qr_code_expiry = self.qr_code_expiry
            return existing.save(*args, **kwargs)
        return super().save(*args, **kwargs)