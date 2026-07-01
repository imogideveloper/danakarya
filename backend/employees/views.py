from django.db import transaction
from django.db.models import ProtectedError
from rest_framework import generics, viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from accounts.models import User
from .models import Company, Employee, SystemSettings
from .serializers import CompanySerializer, EmployeeSerializer, SystemSettingsSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('company', 'user').all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'employee_id', 'department', 'position']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        department = self.request.query_params.get('department')
        company = self.request.query_params.get('company')
        if status:
            qs = qs.filter(status=status)
        if department:
            qs = qs.filter(department=department)
        if company:
            qs = qs.filter(company_id=company)
        return qs

    def perform_create(self, serializer):
        password = self.request.data.get('password')
        with transaction.atomic():
            employee = serializer.save()
            if password:
                if not employee.email:
                    raise ValidationError({'email': 'Email wajib diisi untuk membuat akun login.'})
                if User.objects.filter(email__iexact=employee.email).exists():
                    raise ValidationError({'email': 'Email sudah digunakan oleh akun lain.'})
                user = User.objects.create_user(
                    email=employee.email,
                    password=password,
                    name=employee.name,
                    role='employee',
                    is_active=(employee.status == 'active'),
                )
                employee.user = user
                employee.save(update_fields=['user'])

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        has_loans = employee.applications.exists() or hasattr(employee, 'loans') and employee.loans.exists()
        if has_loans:
            return Response(
                {'error': f'Karyawan "{employee.name}" memiliki riwayat pinjaman dan tidak dapat dihapus. Ubah statusnya menjadi Resign jika sudah tidak aktif.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            employee.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'error': f'Karyawan "{employee.name}" tidak dapat dihapus karena terkait data lain di sistem.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        employee = self.get_object()
        password = request.data.get('password', '')
        if len(password) < 6:
            raise ValidationError({'password': 'Password minimal 6 karakter.'})

        user = employee.user
        if not user:
            if not employee.email:
                raise ValidationError({'email': 'Email wajib diisi untuk membuat akun login.'})
            if User.objects.filter(email__iexact=employee.email).exists():
                raise ValidationError({'email': 'Email sudah digunakan oleh akun lain.'})
            user = User.objects.create_user(
                email=employee.email,
                password=password,
                name=employee.name,
                role='employee',
                is_active=(employee.status == 'active'),
            )
            employee.user = user
            employee.save(update_fields=['user'])
        else:
            user.set_password(password)
            user.save(update_fields=['password'])

        return Response({'detail': 'Password berhasil diperbarui.'})


class SystemSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = SystemSettingsSerializer

    def get_object(self):
        return SystemSettings.load()

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            raise PermissionDenied('Hanya admin yang dapat mengubah pengaturan sistem.')
        return super().update(request, *args, **kwargs)
