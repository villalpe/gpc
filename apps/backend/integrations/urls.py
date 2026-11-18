from django.urls import path

from .views import (
    FedexCreateShipmentView,
    FedexEmailShipmentView,
    FedexTrackView,
    SkydropxShipmentsView,
)

urlpatterns = [
    path("fedex/track/", FedexTrackView.as_view(), name="fedex-track"),
    path("fedex/shipments/", FedexCreateShipmentView.as_view(), name="fedex-create-shipment"),
    path("fedex/shipments/email/", FedexEmailShipmentView.as_view(), name="fedex-email-shipment"),
    path("skydropx/shipments/", SkydropxShipmentsView.as_view(), name="skydropx-shipments"),
]