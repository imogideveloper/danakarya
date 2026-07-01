from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer  # ← tambah import ini
from .models import User


class UserSerializer(serializers.ModelSerializer):
    employee_id = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()

    def get_employee_id(self, obj):
        return obj.employee.id if hasattr(obj, 'employee') and obj.employee else None

    def get_company_id(self, obj):
        return obj.employee.company_id if hasattr(obj, 'employee') and obj.employee else None

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'is_active', 'employee_id', 'company_id', 'last_login_at', 'created_at']
        read_only_fields = ['id', 'employee_id', 'company_id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'name', 'role', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# ← tambahkan class ini
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'