import time

import requests
from django.conf import settings


class SkydropxError(Exception):
    """Base error for Skydropx client failures (never includes tokens/payloads)."""


class SkydropxAPIError(SkydropxError):
    pass


class SkydropxTimeoutError(SkydropxError):
    pass


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

    def _request(self, method: str, path: str, json=None):
        url = f"{self.base_url}{path}"
        for attempt in range(2):
            try:
                resp = requests.request(
                    method, url, json=json, headers=self._headers(), timeout=self.timeout
                )
            except requests.RequestException:
                raise SkydropxAPIError("Skydropx request failed") from None
            except ValueError:
                raise SkydropxAPIError("Skydropx authentication failed") from None

            if resp.status_code == 401 and attempt == 0:
                self._token = None
                continue
            if not resp.ok:
                raise SkydropxAPIError(f"Skydropx responded with HTTP {resp.status_code}")
            try:
                return resp.json()
            except ValueError:
                raise SkydropxAPIError("Skydropx returned an invalid response") from None
        raise SkydropxAPIError("Skydropx responded with HTTP 401")

    def create_quotation(self, payload: dict) -> dict:
        return self._request("POST", "/api/v1/quotations", json=payload)

    def get_quotation(self, quotation_id) -> dict:
        return self._request("GET", f"/api/v1/quotations/{quotation_id}")

    def poll_quotation_until_completed(self, quotation_id, timeout=None, interval=None) -> dict:
        if timeout is None:
            timeout = settings.SKYDROPX_QUOTE_POLL_TIMEOUT_SECONDS
        if interval is None:
            interval = settings.SKYDROPX_QUOTE_POLL_INTERVAL_SECONDS

        deadline = time.monotonic() + timeout
        while True:
            data = self.get_quotation(quotation_id)
            if data.get("is_completed") is True:
                return data
            if time.monotonic() + interval > deadline:
                raise SkydropxTimeoutError("Skydropx quotation did not complete in time")
            time.sleep(interval)
