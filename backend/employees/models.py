from django.db import models
from accounts.models import User


class Company(models.Model):
    ADMIN_FEE_TYPE_CHOICES = [('percentage', 'Persentase'), ('fixed', 'Tetap'), ('tiered', 'Berjenjang')]
    STATUS_CHOICES = [('active', 'Aktif'), ('inactive', 'Tidak Aktif')]

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    contact_person = models.CharField(max_length=150, blank=True)
    mou_number = models.CharField(max_length=50, unique=True)
    mou_date = models.DateField()
    mou_expiry_date = models.DateField()
    max_loan_amount = models.BigIntegerField(default=0)
    max_loan_to_salary_percent = models.DecimalField(max_digits=5, decimal_places=2, default=75)
    admin_fee_type = models.CharField(max_length=20, choices=ADMIN_FEE_TYPE_CHOICES, default='percentage')
    admin_fee = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    max_tenor = models.IntegerField(default=12)
    max_active_loans = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'companies'

    def __str__(self):
        return self.name


class SystemSettings(models.Model):
    ADMIN_FEE_TYPE_CHOICES = [('percentage', 'Persentase'), ('fixed', 'Tetap'), ('tiered', 'Berjenjang')]
    CURRENCY_CHOICES = [('IDR', 'IDR - Rupiah Indonesia'), ('USD', 'USD - US Dollar')]
    DATE_FORMAT_CHOICES = [
        ('dd/MM/yyyy', 'DD/MM/YYYY'), ('MM/dd/yyyy', 'MM/DD/YYYY'), ('yyyy-MM-dd', 'YYYY-MM-DD'),
    ]
    TIMEZONE_CHOICES = [
        ('Asia/Jakarta', 'WIB (UTC+7)'), ('Asia/Makassar', 'WITA (UTC+8)'), ('Asia/Jayapura', 'WIT (UTC+9)'),
    ]

    # Loan settings
    default_admin_fee_type = models.CharField(max_length=20, choices=ADMIN_FEE_TYPE_CHOICES, default='tiered')
    default_admin_fee = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    admin_fee_tier1_max = models.BigIntegerField(default=1000000)
    admin_fee_tier1_amount = models.BigIntegerField(default=50000)
    admin_fee_tier2_amount = models.BigIntegerField(default=100000)
    max_loan_amount = models.BigIntegerField(default=50000000)
    min_loan_amount = models.BigIntegerField(default=1000000)
    max_tenor = models.IntegerField(default=36)
    min_tenor = models.IntegerField(default=3)
    early_settlement_penalty = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    auto_debit_enabled = models.BooleanField(default=True)

    # Notification settings
    email_notification = models.BooleanField(default=True)
    overdue_reminder = models.BooleanField(default=True)
    payment_confirmation = models.BooleanField(default=True)
    loan_approval = models.BooleanField(default=True)
    disbursement_notice = models.BooleanField(default=True)

    # System settings
    company_name = models.CharField(max_length=150, default='DANAKARYA')
    company_tagline = models.CharField(max_length=200, default='Dana & Nabung untuk Karyawan Sejahtera')
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='IDR')
    date_format = models.CharField(max_length=20, choices=DATE_FORMAT_CHOICES, default='dd/MM/yyyy')
    timezone = models.CharField(max_length=50, choices=TIMEZONE_CHOICES, default='Asia/Jakarta')

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_settings'
        verbose_name_plural = 'system settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'System Settings'


class Employee(models.Model):
    EMPLOYMENT_STATUS_CHOICES = [
        ('tetap', 'Tetap'), ('kontrak', 'Kontrak'), ('probasi', 'Probasi'),
    ]
    MARITAL_STATUS_CHOICES = [
        ('belum_menikah', 'Belum Menikah'), ('menikah', 'Menikah'), ('cerai', 'Cerai'),
    ]
    STATUS_CHOICES = [('active', 'Aktif'), ('inactive', 'Tidak Aktif'), ('resigned', 'Resign')]

    employee_id = models.CharField(max_length=20, unique=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employee')
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='employees')
    name = models.CharField(max_length=150)
    birth_place = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    department = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS_CHOICES)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    join_date = models.DateField()
    salary = models.BigIntegerField(default=0)
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    account_name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'employees'

    def __str__(self):
        return f'{self.employee_id} - {self.name}'
