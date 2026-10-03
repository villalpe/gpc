import requests
from django.conf import settings


class SkydropxClient:
    def __init__(self):
        self.base_url = settings.SKYDROPX_BASE_URL.rstrip("/")
        self.api_key = settings.SKYDROPX_API_KEY
        self.secret_key = settings.SKYDROPX_SECRET_KEY
        self.timeout = settings.SKYDROPX_TIMEOUT_SECONDS
        self._token = None

    def _authenticate(self) -> str:
        if self._token:
            return self._token

        url = f"{self.base_url}/api/v1/oauth/token"
        payload = {
            "client_id": self.api_key,
            "client_secret": self.secret_key,
            "grant_type": "client_credentials",
        }
        headers = {"Content-Type": "application/json"}

        resp = requests.post(url, json=payload, headers=headers, timeout=self.timeout)
        if not resp.ok:
            raise ValueError(f"Skydropx auth {resp.status_code}: {resp.text[:300]}")
        data = resp.json()

        self._token = data.get("access_token")
        if not self._token:
            raise ValueError("Skydropx auth response sin access_token")
        return self._token

    def _headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._authenticate()}",
        }

    def list_shipments_v1(self):
        url = f"{self.base_url}/api/v1/shipments"
        resp = requests.get(url, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()

    def list_shipments_v2(self):
        url = f"{self.base_url}/api/v2/shipments"
        resp = requests.get(url, headers=self._headers(), timeout=self.timeout)
        resp.raise_for_status()
        return resp.json()