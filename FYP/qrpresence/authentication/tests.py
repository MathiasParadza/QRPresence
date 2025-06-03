from django.test import TestCase

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

class UserModelTests(TestCase):
    def test_create_user(self):
        """Test creating a new user with email and password"""
        username = 'testuser'
        password = 'password123'
        user = get_user_model().objects.create_user(
            username=username,
            password=password
        )

        self.assertEqual(user.username, username)
        self.assertTrue(user.check_password(password))
        self.assertTrue(user.is_active)

    def test_create_superuser(self):
        """Test creating a superuser"""
        username = 'admin'
        password = 'adminpass123'
        user = get_user_model().objects.create_superuser(
            username=username,
            password=password
        )

        self.assertEqual(user.username, username)
        self.assertTrue(user.check_password(password))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

class AuthenticationViewsTests(TestCase):
    def setUp(self):
        """Set up for API tests"""
        self.client = APIClient()

    def test_register_user(self):
        """Test user registration via API"""
        url = reverse('authentication:register')  # Assuming you have a registration URL
        data = {
            'username': 'newuser',
            'password': 'newpassword123',
            'email': 'newuser@example.com',
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')

    def test_login_user(self):
        """Test user login via API"""
        user = get_user_model().objects.create_user(
            username='testlogin',
            password='loginpassword123',
            email='testlogin@example.com'
        )
        url = reverse('authentication:login')  # Assuming you have a login URL
        data = {
            'username': 'testlogin',
            'password': 'loginpassword123',
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)  # Assuming your login response includes a token

    def test_logout_user(self):
        """Test user logout via API"""
        user = get_user_model().objects.create_user(
            username='testlogout',
            password='logoutpassword123',
            email='testlogout@example.com'
        )
        # Login the user
        self.client.login(username='testlogout', password='logoutpassword123')

        url = reverse('authentication:logout')  # Assuming you have a logout URL
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

class UserProfileModelTests(TestCase):
    def test_create_user_profile(self):
        """Test creating a profile for a user"""
        user = get_user_model().objects.create_user(
            username='userprofile',
            password='profilepassword123',
            email='userprofile@example.com'
        )
        user_profile = user.profile  # Access the UserProfile model

        self.assertIsNotNone(user_profile)
        self.assertEqual(user_profile.user, user)
        self.assertEqual(user_profile.bio, '')
        self.assertEqual(user_profile.location, '')
        self.assertIsNone(user_profile.profile_picture)

class UserAuthTokenTests(TestCase):
    def setUp(self):
        """Set up for token tests"""
        self.client = APIClient()

    def test_create_auth_token(self):
        """Test creating an auth token for a user"""
        user = get_user_model().objects.create_user(
            username='userwithtoken',
            password='tokenpassword123',
            email='userwithtoken@example.com'
        )
        url = reverse('authentication:token')  # Assuming you have a token URL
        data = {
            'username': 'userwithtoken',
            'password': 'tokenpassword123',
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)  # Token should be in the response

