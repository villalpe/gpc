from django.urls import path
from .views import QuoteRequestView, QuoteLatestView, QuoteHistoryView, QuoteDetailView, CustomerCreateView, CustomerListView

urlpatterns = [
    path("request/", QuoteRequestView.as_view(), name="quote-request"),
    path("latest/", QuoteLatestView.as_view(), name="quote-latest"),
    path("history/", QuoteHistoryView.as_view(), name="quote-history"),
    path("<int:quote_id>/", QuoteDetailView.as_view(), name="quote-detail"),

    path("customers/", CustomerListView.as_view(), name="customer-list"),
    path("customers/create/", CustomerCreateView.as_view(), name="customer-create"),    
]