from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import LogoutUserView, current_user, MyTokenObtainPairView
from .views import register, UserProfileView, PasswordResetView, StudentProfileUpdateView, ChangePasswordView

urlpatterns = [
    path('register/', register, name='register_user'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Custom JWT login view (extendable)
    path("user/", current_user, name="current_user"),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('student-profile/', StudentProfileUpdateView.as_view(), name='student_profile_update'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    path('logout/', LogoutUserView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
