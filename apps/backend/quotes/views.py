from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import QuoteRequest
from .serializers import (
    QuoteRequestCreateSerializer,
    QuoteRequestListSerializer,
    QuoteRequestDetailSerializer,
)
from .services import build_quote_options

class QuoteRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = QuoteRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = build_quote_options(data)

        quote = QuoteRequest.objects.create(
            full_name=data["full_name"],
            company=data.get("company", ""),
            email=data["email"],
            phone=data["phone"],
            scope=data["scope"],
            service_type=data["service_type"],
            origin_country=data["origin_country"],
            origin_zip=data["origin_zip"],
            dest_country=data["dest_country"],
            dest_zip=data["dest_zip"],
            dest_city=data.get("dest_city", ""),
            weight_kg=data["weight_kg"],
            length_cm=data["length_cm"],
            width_cm=data["width_cm"],
            height_cm=data["height_cm"],
            pieces=data["pieces"],
            declared_value=data.get("declared_value", 0),
            requires_insurance=data.get("requires_insurance", False),
            urgency=data["urgency"],
            frequency=data["frequency"],
            pickup=data.get("pickup", True),
            notes=data.get("notes", ""),
            result_weight=result["weight"],
            result_options=result["options"],
        )

        return Response(
            {
                "message": "Quote request processed successfully.",
                "data": {
                    "id": quote.id,
                    "weight": result["weight"],
                    "options": result["options"],
                    "created_at": quote.created_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class QuoteLatestView(APIView):
    permission_classes = []

    def get(self, request):
        latest = QuoteRequest.objects.order_by("-created_at").first()
        if not latest:
            return Response(
                {"message": "No quotes available yet.", "data": None},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "message": "Latest quote retrieved successfully.",
                "data": QuoteRequestDetailSerializer(latest).data,
            },
            status=status.HTTP_200_OK,
        )


class QuoteHistoryView(APIView):
    permission_classes = []

    def get(self, request):
        qs = QuoteRequest.objects.order_by("-created_at")[:50]
        data = QuoteRequestListSerializer(qs, many=True).data
        return Response(
            {"message": "Quote history retrieved successfully.", "data": data},
            status=status.HTTP_200_OK,
        )


class QuoteDetailView(APIView):
    permission_classes = []

    def get(self, request, quote_id: int):
        quote = get_object_or_404(QuoteRequest, id=quote_id)
        data = QuoteRequestDetailSerializer(quote).data
        return Response(
            {"message": "Quote detail retrieved successfully.", "data": data},
            status=status.HTTP_200_OK,
        )