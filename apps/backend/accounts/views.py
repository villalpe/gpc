from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import MeSerializer
from .models import Membership


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(MeSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_roles(request):
    memberships = (
        Membership.objects
        .filter(user=request.user, is_active=True)
        .values("company_id", "role")
    )
    return Response({"roles": list(memberships)})