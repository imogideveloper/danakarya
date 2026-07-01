from django.core.management.base import BaseCommand
from employees.models import Company


COMPANIES = [
    {
        'code': 'TNU',
        'name': 'PT Teknologi Nusantara',
        'address': 'Jl. Sudirman No. 100, Jakarta Selatan',
        'phone': '021-5551234',
        'email': 'hrd@teknonus.co.id',
        'contact_person': 'Irfan Hakim',
        'mou_number': 'MOU/DK/2026/001',
        'mou_date': '2026-01-15',
        'mou_expiry_date': '2027-01-15',
        'max_loan_amount': 30000000,
        'max_loan_to_salary_percent': 75,
        'admin_fee_type': 'percentage',
        'admin_fee': 1,
        'max_tenor': 24,
        'max_active_loans': 2,
        'status': 'active',
    },
    {
        'code': 'MSJ',
        'name': 'PT Mitra Sejahtera',
        'address': 'Jl. Gatot Subroto No. 55, Jakarta Selatan',
        'phone': '021-5555678',
        'email': 'finance@mitrasej.co.id',
        'contact_person': 'Diana Putri',
        'mou_number': 'MOU/DK/2026/002',
        'mou_date': '2026-03-01',
        'mou_expiry_date': '2027-03-01',
        'max_loan_amount': 20000000,
        'max_loan_to_salary_percent': 75,
        'admin_fee_type': 'percentage',
        'admin_fee': 1.5,
        'max_tenor': 18,
        'max_active_loans': 1,
        'status': 'active',
    },
    {
        'code': 'KMD',
        'name': 'CV Karya Mandiri',
        'address': 'Jl. Pahlawan No. 22, Surabaya',
        'phone': '031-5559012',
        'email': 'admin@karyamandiri.co.id',
        'contact_person': 'Agus Prasetyo',
        'mou_number': 'MOU/DK/2026/003',
        'mou_date': '2026-06-10',
        'mou_expiry_date': '2027-06-10',
        'max_loan_amount': 15000000,
        'max_loan_to_salary_percent': 75,
        'admin_fee_type': 'fixed',
        'admin_fee': 100000,
        'max_tenor': 12,
        'max_active_loans': 1,
        'status': 'active',
    },
]


class Command(BaseCommand):
    help = 'Seed companies data into the database'

    def handle(self, *args, **kwargs):
        created = 0
        skipped = 0
        for data in COMPANIES:
            obj, is_new = Company.objects.get_or_create(code=data['code'], defaults=data)
            if is_new:
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  Created: {obj.name}'))
            else:
                skipped += 1
                self.stdout.write(f'  Skipped (already exists): {obj.name}')
        self.stdout.write(self.style.SUCCESS(f'\nDone. {created} created, {skipped} skipped.'))
