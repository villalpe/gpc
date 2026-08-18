from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from accounts.views_permissions import my_permissions
from django.urls import path, include

from core.views import (
    health_check,
    admin_ping,
    company_scope_ping,
    audit_module_ping,
    inventory_module_ping,
)
from accounts.views import me, my_roles

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/me/", me, name="me"),
    path("api/me/roles/", my_roles, name="my_roles"),
    path("api/me/permissions/", my_permissions, name="my_permissions"),

    path("api/audit/", include("audit.urls")),

    path("api/admin/ping/", admin_ping, name="admin_ping"),
    path("api/company/ping/", company_scope_ping, name="company_scope_ping"),
    path("api/modules/audit/ping/", audit_module_ping, name="audit_module_ping"),
    path("api/modules/inventory/ping/", inventory_module_ping, name="inventory_module_ping"),
]