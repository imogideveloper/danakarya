from rest_framework import serializers
from django.utils import timezone
from .models import LoanApplication, Loan, LoanInstallment, LoanPayment, LoanSettlement, ActivityLog


class LoanApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True)
    application_no = serializers.CharField(required=False, allow_blank=True)
    application_date = serializers.DateField(required=False)
    signature_document_url = serializers.SerializerMethodField()
    selfie_document_url = serializers.SerializerMethodField()

    def get_signature_document_url(self, obj):
        if obj.signature_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.signature_document.url)
            return obj.signature_document.url
        return None

    def get_selfie_document_url(self, obj):
        if obj.selfie_document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.selfie_document.url)
            return obj.selfie_document.url
        return None

    class Meta:
        model = LoanApplication
        fields = '__all__'


class LoanInstallmentSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    def get_status(self, obj):
        if obj.status == 'unpaid' and obj.due_date < timezone.localdate():
            return 'overdue'
        return obj.status

    class Meta:
        model = LoanInstallment
        fields = '__all__'


class LoanSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    installments = LoanInstallmentSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = '__all__'


class LoanPaymentSerializer(serializers.ModelSerializer):
    loan_no = serializers.CharField(source='loan.loan_no', read_only=True)
    employee_name = serializers.CharField(source='loan.employee.name', read_only=True)
    payment_no = serializers.CharField(required=False, allow_blank=True)
    proof_image_url = serializers.SerializerMethodField()

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
            return obj.proof_image.url
        return None

    class Meta:
        model = LoanPayment
        fields = '__all__'


class LoanSettlementSerializer(serializers.ModelSerializer):
    loan_no = serializers.CharField(source='loan.loan_no', read_only=True)
    employee_name = serializers.CharField(source='loan.employee.name', read_only=True)
    proof_image_url = serializers.SerializerMethodField()

    def get_proof_image_url(self, obj):
        if obj.proof_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.proof_image.url)
            return obj.proof_image.url
        return None

    class Meta:
        model = LoanSettlement
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'
