from django.urls import path
from .views import FedexTrackView

urlpatterns = [
    path("fedex/track/", FedexTrackView.as_view(), name="fedex-track"),
]