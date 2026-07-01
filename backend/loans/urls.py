from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('applications', views.LoanApplicationViewSet)
router.register('loans', views.LoanViewSet)
router.register('installments', views.LoanInstallmentViewSet)
router.register('payments', views.LoanPaymentViewSet)
router.register('settlements', views.LoanSettlementViewSet)
router.register('activity-logs', views.ActivityLogViewSet)

urlpatterns = router.urls
