from django.urls import path, re_path

from .views import (
    FedexCreateShipmentView,
    FedexCreationNotificationRetryView,
    FedexEmailShipmentView,
    FedexNotificationPreferencesView,
    FedexRatesView,
    FedexSavedAddressesView,
    FedexShipmentLabelView,
    FedexShipmentResolveView,
    FedexTrackView,
    SkydropxShipmentsView,
)

urlpatterns = [
    path("fedex/track/", FedexTrackView.as_view(), name="fedex-track"),
    path("fedex/rates/", FedexRatesView.as_view(), name="fedex-rates"),
    path("fedex/addresses/", FedexSavedAddressesView.as_view(), name="fedex-addresses"),
    re_path(
        r"^fedex/preferences/(?P<cb_number>S\d{9})/$",
        FedexNotificationPreferencesView.as_view(),
        name="fedex-preferences",
    ),
    path("fedex/shipments/", FedexCreateShipmentView.as_view(), name="fedex-create-shipment"),
    path("fedex/shipments/email/", FedexEmailShipmentView.as_view(), name="fedex-email-shipment"),
    path(
        "fedex/shipments/<int:shipment_id>/retry-notification/",
        FedexCreationNotificationRetryView.as_view(),
        name="fedex-retry-notification",
    ),
    path(
        "fedex/shipments/labels/<int:label_id>/",
        FedexShipmentLabelView.as_view(),
        name="fedex-shipment-label",
    ),
    path(
        "fedex/shipments/<int:shipment_id>/resolve/",
        FedexShipmentResolveView.as_view(),
        name="fedex-shipment-resolve",
    ),
    path("skydropx/shipments/", SkydropxShipmentsView.as_view(), name="skydropx-shipments"),
]