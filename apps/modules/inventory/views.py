from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.drf_feature_permissions import CanInventoryRead
from audit.services import log_event


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanInventoryRead])
def inventory_ping(request):
    company_id = request.headers.get("X-Company-Id")

    log_event(
        request=request,
        action="inventory.ping",
        status="success",
        company_id=company_id,
        metadata={"module": "inventory"},
    )

    return Response({"ok": True, "module": "inventory"})