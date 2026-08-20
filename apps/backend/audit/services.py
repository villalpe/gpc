from typing import Optional

from .models import AuditEvent


def get_client_ip(request) -> Optional[str]:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_event(
    *,
    request,
    action: str,
    status: str,
    message: str = "",
    company_id=None,
    metadata: dict | None = None,
):
    user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
    request_id = getattr(request, "request_id", "") or request.headers.get("X-Request-Id", "")

    AuditEvent.objects.create(
        request_id=request_id,
        company_id=company_id,
        user=user,
        action=action,
        status=status,
        message=message,
        ip=get_client_ip(request),
        method=request.method if hasattr(request, "method") else "",
        path=request.path if hasattr(request, "path") else "",
        metadata=metadata or {},
    )