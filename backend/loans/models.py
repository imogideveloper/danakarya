from django.db import models
from accounts.models import User
from employees.models import Employee


class LoanApplication(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'), ('submitted', 'Diajukan'), ('under_review', 'Sedang Direview'),
        ('verified', 'Terverifikasi'), ('approved', 'Disetujui'), ('rejected', 'Ditolak'), ('disbursed', 'Dicairkan'),
    ]
    ADMIN_FEE_TYPE = [('percentage', 'Persentase'), ('fixed', 'Tetap'), ('tiered', 'Berjenjang')]

    application_no = models.CharField(max_length=30, unique=True)
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='applications')
    loan_amount = models.BigIntegerField()
    loan_purpose = models.CharField(max_length=200)
    tenor = models.IntegerField()
    admin_fee_type = models.CharField(max_length=20, choices=ADMIN_FEE_TYPE)
    admin_fee = models.DecimalField(max_digits=10, decimal_places=2)
    admin_fee_amount = models.BigIntegerField(default=0)
    disbursed_amount = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    signature_document = models.FileField(upload_to='applications/documents/', blank=True, null=True)
    selfie_document = models.FileField(upload_to='applications/documents/', blank=True, null=True)
    application_date = models.DateField()
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_applications')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loan_applications'

    def __str__(self):
        return self.application_no


class Loan(models.Model):
    STATUS_CHOICES = [
        ('active', 'Aktif'), ('paid_off', 'Lunas'), ('overdue', 'Terlambat'), ('written_off', 'Hapus Buku'),
    ]
    ADMIN_FEE_TYPE = [('percentage', 'Persentase'), ('fixed', 'Tetap')]

    loan_no = models.CharField(max_length=30, unique=True)
    application = models.OneToOneField(LoanApplication, on_delete=models.PROTECT, related_name='loan')
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='loans')
    principal_amount = models.BigIntegerField()
    admin_fee_type = models.CharField(max_length=20, choices=ADMIN_FEE_TYPE)
    admin_fee = models.DecimalField(max_digits=10, decimal_places=2)
    admin_fee_amount = models.BigIntegerField(default=0)
    disbursed_amount = models.BigIntegerField(default=0)
    tenor = models.IntegerField()
    monthly_payment = models.BigIntegerField()
    total_payment = models.BigIntegerField()
    outstanding_balance = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    disbursement_date = models.DateField()
    maturity_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'loans'

    def __str__(self):
        return self.loan_no


class LoanInstallment(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Belum Bayar'), ('paid', 'Lunas'), ('overdue', 'Terlambat'), ('waived', 'Dibebaskan'),
    ]

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='installments')
    installment_no = models.IntegerField()
    due_date = models.DateField()
    amount = models.BigIntegerField()
    remaining_balance = models.BigIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    paid_amount = models.BigIntegerField(default=0)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'loan_installments'
        unique_together = ['loan', 'installment_no']

    def __str__(self):
        return f'{self.loan.loan_no} - Angsuran {self.installment_no}'


class LoanPayment(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('confirmed', 'Dikonfirmasi'), ('rejected', 'Ditolak')]
    METHOD_CHOICES = [
        ('auto_debit', 'Auto Debit'), ('bank_transfer', 'Transfer Bank'), ('cash', 'Tunai'),
    ]

    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name='payments')
    payment_no = models.CharField(max_length=30, unique=True)
    amount = models.BigIntegerField()
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    reference_no = models.CharField(max_length=50, blank=True)
    proof_image = models.ImageField(upload_to='payments/proofs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loan_payments'
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return self.payment_no


class LoanSettlement(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Selesai')]
    METHOD_CHOICES = [
        ('auto_debit', 'Auto Debit'), ('bank_transfer', 'Transfer Bank'), ('cash', 'Tunai'),
    ]

    loan = models.ForeignKey(Loan, on_delete=models.PROTECT, related_name='settlements')
    settlement_amount = models.BigIntegerField(default=0)
    remaining_principal = models.BigIntegerField(default=0)
    penalty = models.BigIntegerField(default=0)
    settlement_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    reference_no = models.CharField(max_length=50, blank=True)
    proof_image = models.ImageField(upload_to='settlements/proofs/', blank=True, null=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'loan_settlements'

    def __str__(self):
        return f'Settlement {self.loan.loan_no}'


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    action = models.CharField(max_length=50)
    entity = models.CharField(max_length=50)
    entity_id = models.CharField(max_length=50, blank=True)
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} by {self.user}'
