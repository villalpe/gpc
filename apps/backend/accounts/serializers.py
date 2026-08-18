from rest_framework import serializers
from .models import User, Membership


class MembershipSerializer(serializers.ModelSerializer):
    company_id = serializers.UUIDField(source="company.id", read_only=True)
    company_slug = serializers.CharField(source="company.slug", read_only=True)
    company_trade_name = serializers.CharField(source="company.trade_name", read_only=True)
    company_legal_name = serializers.CharField(source="company.legal_name", read_only=True)

    class Meta:
        model = Membership
        fields = [
            "company_id",
            "company_slug",
            "company_trade_name",
            "company_legal_name",
            "role",
            "is_active",
        ]


class MeSerializer(serializers.ModelSerializer):
    memberships = MembershipSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "memberships",
        ]