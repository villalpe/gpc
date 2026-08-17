from rest_framework import serializers
from .models import User, Membership


class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ["company_id", "role", "is_active"]


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