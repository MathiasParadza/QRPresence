from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile
from attendance.models import Student

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def create_student_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'student':
        Student.objects.get_or_create(user=instance)


@receiver(post_save, sender=CustomUser)
def create_lecturer_profile(sender, instance, created, **kwargs):
    from attendance.models import Lecturer  

    if instance.role == 'lecturer':
        if not hasattr(instance, 'lecturer'):
            Lecturer.objects.create(user=instance)
