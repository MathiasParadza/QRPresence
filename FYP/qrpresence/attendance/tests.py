from django.test import TestCase

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from .models import Attendance
from django.contrib.auth.models import User
from datetime import datetime

class AttendanceTests(TestCase):

    def setUp(self):
        """
        Set up initial data for tests.
        """
        # Create a user
        self.user = User.objects.create_user(username='testuser', password='password123')
        
        # Create attendance records
        self.attendance = Attendance.objects.create(
            user=self.user,
            date=datetime.now(),
            status='Present'
        )

    def test_mark_attendance(self):
        """
        Test marking attendance via API
        """
        url = reverse('attendance:mark_attendance')
        data = {
            'user': self.user.id,
            'status': 'Present',
            'date': datetime.now().date().isoformat(),
        }
        
        # Make the POST request
        response = self.client.post(url, data)
        
        # Assert status code and data in response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Attendance.objects.count(), 2)
        self.assertEqual(Attendance.objects.latest('id').status, 'Present')

    def test_attendance_report(self):
        """
        Test the attendance report view
        """
        url = reverse('attendance:attendance_report', kwargs={'user_id': self.user.id})
        response = self.client.get(url)
        
        # Assert status code and data in response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('attendance', response.data)
        self.assertEqual(len(response.data['attendance']), 1)
        self.assertEqual(response.data['attendance'][0]['status'], 'Present')
    
    def test_attendance_creation(self):
        """
        Test that attendance is correctly created in the database
        """
        attendance = Attendance.objects.create(
            user=self.user,
            date=datetime.now(),
            status='Absent'
        )
        
        self.assertEqual(Attendance.objects.count(), 2)
        self.assertEqual(attendance.status, 'Absent')

    def test_invalid_attendance_status(self):
        """
        Test invalid status when marking attendance
        """
        url = reverse('attendance:mark_attendance')
        data = {
            'user': self.user.id,
            'status': 'InvalidStatus',  # Invalid status
            'date': datetime.now().date().isoformat(),
        }
        
        response = self.client.post(url, data)
        
        # Assert error response for invalid status
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('status', response.data)
