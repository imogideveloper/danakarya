from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('companies', views.CompanyViewSet)
router.register('employees', views.EmployeeViewSet)

urlpatterns = router.urls + [
    path('settings/', views.SystemSettingsView.as_view(), name='system-settings'),
]
