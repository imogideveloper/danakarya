from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import LoanApplication, Loan, LoanInstallment, LoanPayment, LoanSettlement, ActivityLog
from .serializers import (
    LoanApplicationSerializer, LoanSerializer, LoanInstallmentSerializer,
    LoanPaymentSerializer, LoanSettlementSerializer, ActivityLogSerializer,
)


class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.select_related('employee', 'reviewed_by').all()
    serializer_class = LoanApplicationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['application_no', 'employee__name', 'loan_purpose']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        employee = self.request.query_params.get('employee')
        if status_param:
            qs = qs.filter(status=status_param)
        if employee:
            qs = qs.filter(employee_id=employee)
        # Employee hanya lihat milik sendiri
        if self.request.user.role == 'employee':
            qs = qs.filter(employee=self.request.user.employee) if hasattr(self.request.user, 'employee') else qs.none()
        return qs

    def perform_create(self, serializer):
        today = timezone.now().date()
        count = LoanApplication.objects.filter(application_date=today).count() + 1
        app_no = f'APP/{today.strftime("%Y%m%d")}/{count:04d}'
        serializer.save(application_no=app_no, application_date=today)

    @action(detail=True, methods=['post'])
    def start_review(self, request, pk=None):
        app = self.get_object()
        app.status = 'under_review'
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()
        from .serializers import LoanApplicationSerializer
        return Response(LoanApplicationSerializer(app).data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        if request.user.role not in ('admin', 'manager'):
            return Response({'error': 'Hanya admin yang dapat memverifikasi dokumen.'}, status=403)
        app = self.get_object()
        if app.status not in ('submitted', 'under_review'):
            return Response({'error': 'Hanya pengajuan yang diajukan yang dapat diverifikasi.'}, status=400)
        app.status = 'verified'
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.verified_by = request.user
        app.verified_at = timezone.now()
        app.save()
        from .serializers import LoanApplicationSerializer
        return Response(LoanApplicationSerializer(app).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ('finance', 'admin'):
            return Response({'error': 'Hanya finance yang dapat menyetujui pinjaman.'}, status=403)
        app = self.get_object()
        if app.status != 'verified':
            return Response({'error': 'Hanya pengajuan yang terverifikasi yang dapat disetujui.'}, status=400)
        app.status = 'approved'
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.save()
        from .serializers import LoanApplicationSerializer
        return Response(LoanApplicationSerializer(app).data)

    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        from datetime import date
        from dateutil.relativedelta import relativedelta

        if request.user.role != 'finance':
            return Response({'error': 'Hanya finance yang dapat mencairkan pinjaman.'}, status=403)

        app = self.get_object()
        if app.status != 'approved':
            return Response({'error': 'Pengajuan belum disetujui.'}, status=400)
        if hasattr(app, 'loan'):
            return Response({'error': 'Pinjaman sudah pernah dicairkan.'}, status=400)

        disbursement_date_str = request.data.get('disbursement_date')
        try:
            today = date.fromisoformat(disbursement_date_str) if disbursement_date_str else date.today()
        except ValueError:
            today = date.today()

        count = Loan.objects.filter(disbursement_date=today).count() + 1
        loan_no = f'LN/{today.strftime("%Y%m%d")}/{count:04d}'
        monthly_payment = app.loan_amount // app.tenor
        maturity_date = today + relativedelta(months=app.tenor)

        loan = Loan.objects.create(
            loan_no=loan_no,
            application=app,
            employee=app.employee,
            principal_amount=app.loan_amount,
            admin_fee_type=app.admin_fee_type,
            admin_fee=app.admin_fee,
            admin_fee_amount=app.admin_fee_amount,
            disbursed_amount=app.disbursed_amount,
            tenor=app.tenor,
            monthly_payment=monthly_payment,
            total_payment=app.loan_amount,
            outstanding_balance=app.loan_amount,
            status='active',
            disbursement_date=today,
            maturity_date=maturity_date,
        )

        remaining = app.loan_amount
        for i in range(1, app.tenor + 1):
            due = today + relativedelta(months=i)
            is_last = (i == app.tenor)
            amount = remaining if is_last else monthly_payment
            remaining -= amount
            LoanInstallment.objects.create(
                loan=loan,
                installment_no=i,
                due_date=due,
                amount=amount,
                remaining_balance=max(0, remaining),
                status='unpaid',
            )

        app.status = 'disbursed'
        app.save(update_fields=['status'])

        from .serializers import LoanSerializer
        return Response(LoanSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        app = self.get_object()
        app.status = 'rejected'
        app.reviewed_by = request.user
        app.reviewed_at = timezone.now()
        app.notes = request.data.get('notes', app.notes)
        app.save()
        from .serializers import LoanApplicationSerializer
        return Response(LoanApplicationSerializer(app).data)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.select_related('employee', 'application').prefetch_related('installments').all()
    serializer_class = LoanSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['loan_no', 'employee__name']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        employee = self.request.query_params.get('employee')
        if status_param:
            qs = qs.filter(status=status_param)
        if employee:
            qs = qs.filter(employee_id=employee)
        if self.request.user.role == 'employee':
            qs = qs.filter(employee=self.request.user.employee) if hasattr(self.request.user, 'employee') else qs.none()
        return qs


class LoanInstallmentViewSet(viewsets.ModelViewSet):
    queryset = LoanInstallment.objects.select_related('loan').all()
    serializer_class = LoanInstallmentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        loan = self.request.query_params.get('loan')
        status_param = self.request.query_params.get('status')
        if loan:
            qs = qs.filter(loan_id=loan)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class LoanPaymentViewSet(viewsets.ModelViewSet):
    queryset = LoanPayment.objects.select_related('loan').all()
    serializer_class = LoanPaymentSerializer

    def perform_create(self, serializer):
        today = timezone.now().date()
        count = LoanPayment.objects.filter(payment_date=today).count() + 1
        payment_no = f'PAY/{today.strftime("%Y%m%d")}/{count:04d}'
        payment = serializer.save(payment_no=payment_no)
        # Auto-update installment jika payment langsung confirmed
        if payment.status == 'confirmed':
            self._mark_installment_paid(payment)

    def _mark_installment_paid(self, payment):
        installment = payment.loan.installments.filter(
            status__in=['unpaid', 'overdue']
        ).order_by('installment_no').first()
        if installment:
            installment.status = 'paid'
            installment.paid_amount = payment.amount
            installment.paid_date = payment.payment_date
            installment.save()
            # Update outstanding balance
            loan = payment.loan
            loan.outstanding_balance = max(0, loan.outstanding_balance - payment.amount)
            if not loan.installments.filter(status__in=['unpaid', 'overdue']).exists():
                loan.status = 'paid_off'
            loan.save()

    def get_queryset(self):
        qs = super().get_queryset()
        loan = self.request.query_params.get('loan')
        if loan:
            qs = qs.filter(loan_id=loan)
        if self.request.user.role == 'employee':
            qs = qs.filter(loan__employee=self.request.user.employee) if hasattr(self.request.user, 'employee') else qs.none()
        return qs

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'confirmed'
        payment.save()
        self._mark_installment_paid(payment)
        return Response({'status': 'confirmed'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        payment = self.get_object()
        payment.status = 'rejected'
        payment.save()
        return Response({'status': 'rejected'})


class LoanSettlementViewSet(viewsets.ModelViewSet):
    queryset = LoanSettlement.objects.select_related('loan__employee').all()
    serializer_class = LoanSettlementSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        if self.request.user.role == 'employee':
            qs = qs.filter(loan__employee=self.request.user.employee) if hasattr(self.request.user, 'employee') else qs.none()
        return qs

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        settlement = self.get_object()
        settlement.status = 'completed'
        settlement.save()
        # Mark loan as paid_off
        loan = settlement.loan
        loan.status = 'paid_off'
        loan.outstanding_balance = 0
        loan.save()
        # Mark remaining installments as waived
        loan.installments.filter(status='unpaid').update(status='waived')
        return Response(LoanSettlementSerializer(settlement, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        settlement = self.get_object()
        settlement.status = 'rejected'
        settlement.notes = request.data.get('notes', settlement.notes)
        settlement.save()
        return Response(LoanSettlementSerializer(settlement, context={'request': request}).data)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'employee':
            qs = qs.filter(user=self.request.user)
        return qs[:50]
