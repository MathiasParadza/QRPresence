from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'settings', views.SiteSettingsViewSet, basename='sitesettings')
router.register(r'system-info', views.SystemInfoView, basename='systeminfo')

urlpatterns = [
    path('api/admin/', include(router.urls)),
    path('api/admin/settings/stats/', views.SiteSettingsViewSet.as_view({'get': 'stats'}), name='settings-stats'),
    path('api/admin/settings/recent-activity/', views.SiteSettingsViewSet.as_view({'get': 'recent_activity'}), name='settings-recent-activity'),
]