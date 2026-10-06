from django.urls import path

from .views import FedexTrackView, SkydropxShipmentsView

urlpatterns = [
    path("fedex/track/", FedexTrackView.as_view(), name="fedex-track"),
    path("skydropx/shipments/", SkydropxShipmentsView.as_view(), name="skydropx-shipments"),
]