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

from rest_framework.exceptions import ValidationError
from .serializers import AttendanceMarkSerializer
from .models import Session, Lecturer # Assuming Lecturer is needed for Session foreign key
# User model is already imported if get_user_model is used, or via from django.contrib.auth.models import User
# For this example, we'll assume User is available or use get_user_model
from django.contrib.auth import get_user_model

User = get_user_model()

class AttendanceMarkSerializerTests(TestCase):

    def setUp(self):
        # Create a dummy user for lecturer
        self.lecturer_user = User.objects.create_user(username='testlecturer', password='password')
        # Ensure your Lecturer model has a 'user' field and other fields as used.
        # This assumes Lecturer model structure. Adjust if different.
        self.lecturer, _ = Lecturer.objects.get_or_create(
            user=self.lecturer_user,
            defaults={'name': 'Dr. Test', 'email': 'test@example.com', 'department': 'Testing'}
        )

        # Session with complete GPS data
        self.session_valid = Session.objects.create(
            session_id='valid_session_123',
            class_name='Test Course Valid',
            lecturer=self.lecturer,
            gps_latitude=10.000000,
            gps_longitude=20.000000,
            allowed_radius=100  # meters
        )

        # Session with incomplete GPS data (missing radius)
        # This session from the prompt is not directly used in a test named 'data_for_misconfigured_session'
        # but a similar one is created in test_serializer_misconfigured_session_missing_radius
        # self.session_misconfigured = Session.objects.create(
        #     session_id='misconfig_session_456',
        #     class_name='Test Course Misconfigured',
        #     lecturer=self.lecturer,
        #     gps_latitude=10.000000,
        #     gps_longitude=20.000000,
        #     allowed_radius=None # Misconfiguration
        # )

        self.valid_data_within_radius = {
            'session_id': self.session_valid.session_id,
            'latitude': 10.000500,  # Approx 55 meters away based on simple estimation
            'longitude': 20.000500  # Real haversine calculation is needed for accuracy
        }

        self.data_outside_radius = {
            'session_id': self.session_valid.session_id,
            'latitude': 10.010000,  # Approx 1.1 km away
            'longitude': 20.010000
        }

        self.data_invalid_session_id = {
            'session_id': 'non_existent_session_789',
            'latitude': 10.000000,
            'longitude': 20.000000
        }

        # This data variable from prompt is not used directly by a test
        # self.data_for_misconfigured_session = {
        #     'session_id': self.session_misconfigured.session_id, # This session is commented out above
        #     'latitude': 10.000000,
        #     'longitude': 20.000000
        # }

    def test_serializer_valid_data_within_radius(self):
        serializer = AttendanceMarkSerializer(data=self.valid_data_within_radius)
        self.assertTrue(serializer.is_valid(), msg=serializer.errors)

    def test_serializer_invalid_data_outside_radius(self):
        serializer = AttendanceMarkSerializer(data=self.data_outside_radius)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('location', context.exception.detail)
        # Check if the message contains distance information
        self.assertTrue('meters away' in str(context.exception.detail['location'][0]).lower())

    def test_serializer_invalid_session_id(self):
        serializer = AttendanceMarkSerializer(data=self.data_invalid_session_id)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('session_id', context.exception.detail)
        self.assertTrue('not found' in str(context.exception.detail['session_id'][0]).lower())

    def test_serializer_misconfigured_session_missing_radius(self):
        # Test for session missing allowed_radius
        session_no_radius = Session.objects.create(
            session_id='session_no_radius_789',
            class_name='No Radius Course',
            lecturer=self.lecturer,
            gps_latitude=30.0,
            gps_longitude=30.0,
            allowed_radius=None
        )
        data = {
            'session_id': session_no_radius.session_id,
            'latitude': 30.0,
            'longitude': 30.0
        }
        serializer = AttendanceMarkSerializer(data=data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('session_id', context.exception.detail)
        self.assertTrue('location data is not configured' in str(context.exception.detail['session_id'][0]).lower())

    def test_serializer_misconfigured_session_missing_gps_latitude(self):
        # Test for session missing gps_latitude
        session_no_lat = Session.objects.create(
            session_id='session_no_lat_abc',
            class_name='No Lat Course',
            lecturer=self.lecturer,
            gps_latitude=None,
            gps_longitude=40.0,
            allowed_radius=100
        )
        data = {
            'session_id': session_no_lat.session_id,
            'latitude': 40.0001,
            'longitude': 40.0001
        }
        serializer = AttendanceMarkSerializer(data=data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('session_id', context.exception.detail)
        self.assertTrue('location data is not configured' in str(context.exception.detail['session_id'][0]).lower())

    def test_serializer_misconfigured_session_missing_gps_longitude(self):
        # Test for session missing gps_longitude
        session_no_lon = Session.objects.create(
            session_id='session_no_lon_def',
            class_name='No Lon Course',
            lecturer=self.lecturer,
            gps_latitude=50.0,
            gps_longitude=None,
            allowed_radius=100
        )
        data = {
            'session_id': session_no_lon.session_id,
            'latitude': 50.0001,
            'longitude': 50.0001 # Longitude doesn't matter if session longitude is None
        }
        serializer = AttendanceMarkSerializer(data=data)
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
        self.assertIn('session_id', context.exception.detail)
        self.assertTrue('location data is not configured' in str(context.exception.detail['session_id'][0]).lower())
