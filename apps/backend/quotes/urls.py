from django.urls import path

from .views import (
    CustomerCreateView,
    CustomerListView,
    QuoteDetailView,
    QuoteHistoryView,
    QuoteLatestView,
    SavedAddressDetailView,
    SavedAddressListCreateView,
    SkydropxQuoteView,
    SavedPackageListCreateView,
    ShipmentCreateView,
    SatClaveProdServSearchView,
)

urlpatterns = [
    path("skydropx/", SkydropxQuoteView.as_view(), name="quote-skydropx"),
    path("latest/", QuoteLatestView.as_view(), name="quote-latest"),
    path("history/", QuoteHistoryView.as_view(), name="quote-history"),
    path("customers/", CustomerListView.as_view(), name="customer-list"),
    path("customers/create/", CustomerCreateView.as_view(), name="customer-create"),

    path("saved-addresses/", SavedAddressListCreateView.as_view(), name="saved-address-list-create"),
    path("saved-addresses/<int:address_id>/", SavedAddressDetailView.as_view(), name="saved-address-detail"),

    path("sat/clave-prod-serv/", SatClaveProdServSearchView.as_view(), name="sat-clave-prod-serv-search"),

    path("saved-packages/", SavedPackageListCreateView.as_view(), name="saved-package-list-create"),
    path("shipments/", ShipmentCreateView.as_view(), name="shipment-create"),
    path("<int:quote_id>/", QuoteDetailView.as_view(), name="quote-detail"),
]
