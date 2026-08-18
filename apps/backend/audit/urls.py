from django.urls import path
from .views import audit_events_list

urlpatterns = [
    path("events/", audit_events_list, name="audit_events_list"),
]