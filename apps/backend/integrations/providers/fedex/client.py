import requests
from django.conf import settings


class FedexClient:
    def __init__(self):
        self.base_url = settings.FEDEX_BASE_URL.rstrip("/")
        self.api_key = settings.FEDEX_API_KEY
        self.secret_key = settings.FEDEX_SECRET_KEY
        self.timeout = getattr(settings, "FEDEX_TIMEOUT_SECONDS", 20)
        self._token = None

    def _get_token(self) -> str:
        if self._token:
            return self._token

        url = f"{self.base_url}/oauth/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.secret_key,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        resp = requests.post(url, data=payload, headers=headers, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        self._token = data["access_token"]
        return self._token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json",
        }

    def track(self, tracking_number: str) -> dict:
        url = f"{self.base_url}/track/v1/trackingnumbers"
        payload = {
            "includeDetailedScans": True,
            "trackingInfo": [{"trackingNumberInfo": {"trackingNumber": tracking_number}}],
        }
        resp = requests.post(url, json=payload, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()