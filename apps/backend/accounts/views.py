from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Membership
from .serializers import MeSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    user = (
        request.user.__class__.objects
        .filter(pk=request.user.pk)
        .prefetch_related("memberships__company")
        .get()
    )
    return Response(MeSerializer(user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_roles(request):
    memberships = (
        Membership.objects
        .filter(user=request.user, is_active=True)
        .values(
            "company_id",
            "company__slug",
            "company__trade_name",
            "company__legal_name",
            "role",
        )
    )

    roles = [
        {
            "company_id": m["company_id"],
            "company_slug": m["company__slug"],
            "company_trade_name": m["company__trade_name"],
            "company_legal_name": m["company__legal_name"],
            "role": m["role"],
        }
        for m in memberships
    ]

    return Response({"roles": roles})