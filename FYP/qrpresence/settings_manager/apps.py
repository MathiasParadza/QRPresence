from django.apps import AppConfig

class SettingsManagerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'settings_manager'
    verbose_name = 'Settings Manager'
    
    def ready(self):
        """
        Override this method to perform initialization tasks such as
        registering signals or ensuring the default settings instance exists.
        """
        try:
            # Ensure default settings exist when the app is ready
            from .models import SiteSettings
            if not SiteSettings.objects.exists():
                SiteSettings.objects.create()
        except Exception as e:
            # Handle potential database not ready errors during initial setup
            print(f"Error ensuring default settings: {e}")