from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .providers.fedex.client import FedexClient
from .providers.fedex.mappers import map_fedex_tracking
from .providers.skydropx.client import SkydropxClient
from .providers.skydropx.mappers import map_skydropx_shipments_list
from .serializers import FedexTrackRequestSerializer


class FedexTrackView(APIView):
    """
    POST /api/integrations/fedex/track/
    body: { "tracking_number": "449044304137821" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FedexTrackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tracking_number = serializer.validated_data["tracking_number"]

        try:
            client = FedexClient()
            raw = client.track(tracking_number)
            normalized = map_fedex_tracking(raw, tracking_number)

            # Si quieres conservar raw temporalmente para debug:
            # normalized["raw"] = raw

            return Response(normalized, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    "provider": "fedex",
                    "tracking_number": tracking_number,
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

class SkydropxShipmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = request.query_params.get("version", "v1")
        client = SkydropxClient()

        try:
            raw = client.list_shipments_v2() if version == "v2" else client.list_shipments_v1()
            normalized = map_skydropx_shipments_list(raw)
            normalized["version"] = version
            return Response(normalized, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"provider": "skydropx", "error": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )