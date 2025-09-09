from rest_framework import serializers
from .models import SiteSettings
from django.core.files.base import ContentFile
import base64
import uuid

class SiteSettingsSerializer(serializers.ModelSerializer):
    site_logo_data = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = SiteSettings
        fields = [
            'site_title',
            'site_logo',
            'site_logo_data',
            'academic_year',
            'semester',
            'attendance_threshold',
            'qr_code_expiry',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.site_logo:
            representation['site_logo'] = instance.site_logo.url
        else:
            representation['site_logo'] = None
        return representation
    
    def create(self, validated_data):
        site_logo_data = validated_data.pop('site_logo_data', None)
        
        if site_logo_data:
            # Handle base64 image data
            format, imgstr = site_logo_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"site_logo_{uuid.uuid4()}.{ext}"
            data = ContentFile(base64.b64decode(imgstr), name=file_name)
            validated_data['site_logo'] = data
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        site_logo_data = validated_data.pop('site_logo_data', None)
        
        if site_logo_data:
            # Handle base64 image data
            format, imgstr = site_logo_data.split(';base64,')
            ext = format.split('/')[-1]
            file_name = f"site_logo_{uuid.uuid4()}.{ext}"
            data = ContentFile(base64.b64decode(imgstr), name=file_name)
            validated_data['site_logo'] = data
        
        return super().update(instance, validated_data)

class SystemStatsSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    total_lecturers = serializers.IntegerField()
    total_courses = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    total_attendance_records = serializers.IntegerField()
    attendance_rate = serializers.FloatField()