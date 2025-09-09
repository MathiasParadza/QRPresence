from django.contrib import admin
from .models import SiteSettings

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['site_title', 'academic_year', 'semester', 'attendance_threshold', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    def has_add_permission(self, request):
        # Allow only one settings instance
        if SiteSettings.objects.count() >= 1:
            return False
        return super().has_add_permission(request)