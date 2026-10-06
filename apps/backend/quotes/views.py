import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permission_service import can_view_price
from accounts.permissions import CanAccessQuotes
from core.company_context import get_active_company_id
from integrations.providers.skydropx.client import (
    SkydropxClient,
    SkydropxError,
    SkydropxTimeoutError,
)
from integrations.providers.skydropx.mappers import map_quotation_rates

from .models import Customer, QuoteParcel, QuoteRequest
from .serializers import (
    CustomerCreateSerializer,
    CustomerListSerializer,
    QuoteOutputSerializer,
    SkydropxQuoteInputSerializer,
)
from .services import parcels_weight_summary


class QuotesBaseView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def _company_id(self, request):
        return get_active_company_id(request)

    def _serialize(self, request, company_id, obj, many=False):
        return QuoteOutputSerializer(
            obj,
            many=many,
            context={"show_price": can_view_price(request.user, company_id)},
        ).data


class CustomerCreateView(QuotesBaseView):
    def post(self, request):
        company_id = self._company_id(request)
        serializer = CustomerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            customer = serializer.save(company_id=company_id)
        except IntegrityError:
            return Response(
                {"message": "Ya existe un cliente con ese email.", "data": None},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "message": "Customer created successfully.",
                "data": CustomerListSerializer(customer).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerListView(QuotesBaseView):
    def get(self, request):
        company_id = self._company_id(request)
        email = request.query_params.get("email")
        qs = Customer.objects.filter(company_id=company_id)
        if email:
            qs = qs.filter(email__iexact=email.strip())
        data = CustomerListSerializer(qs[:20], many=True).data
        return Response({"message": "Customers retrieved successfully.", "data": data}, status=200)


class SkydropxQuoteView(QuotesBaseView):
    def post(self, request):
        company_id = self._company_id(request)
        serializer = SkydropxQuoteInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payload = serializer.to_skydropx_payload()

        try:
            client = SkydropxClient()
            created = client.create_quotation(payload)
            quotation_id = created.get("id")
            if not quotation_id:
                raise SkydropxError("missing quotation id")
            raw = client.poll_quotation_until_completed(quotation_id)
        except SkydropxTimeoutError:
            return Response(
                {"message": "La cotización tardó demasiado. Intenta de nuevo.", "data": None},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except SkydropxError:
            return Response(
                {"message": "Error al cotizar con el proveedor.", "data": None},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        options = map_quotation_rates(raw)
        snapshot = json.loads(json.dumps(options, cls=DjangoJSONEncoder))
        origin, dest = data["origin"], data["destination"]

        with transaction.atomic():
            quote = QuoteRequest.objects.create(
                company_id=company_id,
                created_by=request.user,
                provider="skydropx",
                provider_quotation_id=str(quotation_id),
                scope="nacional",
                origin_country=origin["country_code"],
                origin_zip=origin["postal_code"],
                origin_state=origin["state"],
                origin_city=origin["city"],
                origin_area=origin["area"],
                dest_country=dest["country_code"],
                dest_zip=dest["postal_code"],
                dest_state=dest["state"],
                dest_city=dest["city"],
                dest_area=dest["area"],
                result_weight=parcels_weight_summary(data["parcels"]),
                result_options=snapshot,
            )
            QuoteParcel.objects.bulk_create(
                QuoteParcel(
                    quote=quote,
                    length_cm=p["length"],
                    width_cm=p["width"],
                    height_cm=p["height"],
                    weight_kg=p["weight"],
                )
                for p in data["parcels"]
            )

        return Response(
            {
                "message": "Quote processed successfully.",
                "data": self._serialize(request, company_id, quote),
            },
            status=status.HTTP_201_CREATED,
        )


class QuoteLatestView(QuotesBaseView):
    def get(self, request):
        company_id = self._company_id(request)
        latest = QuoteRequest.objects.filter(company_id=company_id).order_by("-created_at").first()
        if not latest:
            return Response(
                {"message": "No quotes available yet.", "data": None},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "message": "Latest quote retrieved successfully.",
                "data": self._serialize(request, company_id, latest),
            },
            status=status.HTTP_200_OK,
        )


class QuoteHistoryView(QuotesBaseView):
    def get(self, request):
        company_id = self._company_id(request)
        qs = QuoteRequest.objects.filter(company_id=company_id).order_by("-created_at")[:50]
        return Response(
            {
                "message": "Quote history retrieved successfully.",
                "data": self._serialize(request, company_id, qs, many=True),
            },
            status=status.HTTP_200_OK,
        )


class QuoteDetailView(QuotesBaseView):
    def get(self, request, quote_id: int):
        company_id = self._company_id(request)
        quote = get_object_or_404(QuoteRequest, id=quote_id, company_id=company_id)
        return Response(
            {
                "message": "Quote detail retrieved successfully.",
                "data": self._serialize(request, company_id, quote),
            },
            status=status.HTTP_200_OK,
        )
