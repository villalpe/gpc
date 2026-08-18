from django.urls import path
from .views import me, my_roles
from .views_permissions import my_permissions

urlpatterns = [
    path("me/", me, name="me"),
    path("me/roles/", my_roles, name="my_roles"),
    path("me/permissions/", my_permissions, name="my_permissions"),
]