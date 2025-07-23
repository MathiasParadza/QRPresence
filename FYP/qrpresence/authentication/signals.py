from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile
from attendance.models import Student, Lecturer

@receiver(post_save, sender=CustomUser)
def handle_user_creation(sender, instance, created, **kwargs):
    if not created:
        return

    # Always create general user profile
    UserProfile.objects.create(user=instance)

    # Create lecturer only (student is created during registration)
    if instance.role == 'lecturer':
        Lecturer.objects.get_or_create(
            user=instance,
            defaults={'name': instance.get_full_name()}
        )
