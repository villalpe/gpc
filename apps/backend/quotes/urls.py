from django.urls import path

from .views import (
    CustomerCreateView,
    CustomerListView,
    QuoteDetailView,
    QuoteHistoryView,
    QuoteLatestView,
    QuoteRequestView,
)

urlpatterns = [
    path("request/", QuoteRequestView.as_view(), name="quote-request"),
    path("latest/", QuoteLatestView.as_view(), name="quote-latest"),
    path("history/", QuoteHistoryView.as_view(), name="quote-history"),
    path("<int:pk>/", QuoteDetailView.as_view(), name="quote-detail"),
    path("customers/", CustomerListView.as_view(), name="customer-list"),
    path("customers/create/", CustomerCreateView.as_view(), name="customer-create"),
]