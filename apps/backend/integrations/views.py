from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import FedexTrackRequestSerializer
from .providers.fedex.client import FedexClient


class FedexTrackView(APIView):
    """
    POST /api/integrations/fedex/track/
    body: { "tracking_number": "449044304137821" }
    """

    def post(self, request):
        serializer = FedexTrackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tracking_number = serializer.validated_data["tracking_number"]

        try:
            client = FedexClient()
            data = client.track(tracking_number)
            return Response(
                {
                    "provider": "fedex",
                    "tracking_number": tracking_number,
                    "raw": data,  # luego lo normalizamos
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "provider": "fedex",
                    "tracking_number": tracking_number,
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )