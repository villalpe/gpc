from django.urls import path

from .views import (
    CustomerCreateView,
    CustomerListView,
    QuoteDetailView,
    QuoteHistoryView,
    QuoteLatestView,
    SkydropxQuoteView,
)

urlpatterns = [
    path("skydropx/", SkydropxQuoteView.as_view(), name="quote-skydropx"),
    path("latest/", QuoteLatestView.as_view(), name="quote-latest"),
    path("history/", QuoteHistoryView.as_view(), name="quote-history"),
    path("customers/", CustomerListView.as_view(), name="customer-list"),
    path("customers/create/", CustomerCreateView.as_view(), name="customer-create"),
    path("<int:quote_id>/", QuoteDetailView.as_view(), name="quote-detail"),
]
