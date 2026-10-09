import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.FEDEX_API_URL ?? "https://apis-sandbox.fedex.com";
const KEY = process.env.FEDEX_API_KEY;
const SECRET = process.env.FEDEX_SECRET_KEY;

let cachedToken: { token: string; exp: number } | null = null;

async function getFedexToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.exp) {
    return cachedToken.token;
  }

  if (!KEY || !SECRET) {
    throw new Error("FedEx credentials missing");
  }

  const tokenRes = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: KEY,
      client_secret: SECRET,
    }),
    cache: "no-store",
  });

  const tokenJson = await tokenRes.json().catch(() => ({}));

  if (!tokenRes.ok || !tokenJson?.access_token) {
    console.error("FedEx OAuth error:", tokenRes.status, tokenJson);
    throw new Error(`FedEx OAuth failed (${tokenRes.status})`);
  }

  const ttl = Math.max(60, Number(tokenJson.expires_in ?? 3600));
  cachedToken = {
    token: tokenJson.access_token as string,
    exp: Date.now() + (ttl - 60) * 1000, // margen de 60s
  };

  return cachedToken.token;
}

async function callTrack(trackingNumber: string, token: string) {
  return fetch(`${BASE}/track/v1/trackingnumbers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-locale": "es_MX",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      includeDetailedScans: true,
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber,
          },
        },
      ],
    }),
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("access_token")?.value;
  if (!sessionToken) {
    return NextResponse.json({ detail: "No autenticado." }, { status: 401 });
  }

  if (!KEY || !SECRET) {
    return NextResponse.json(
      { detail: "FEDEX_API_KEY o FEDEX_SECRET_KEY no configurados." },
      { status: 500 }
    );
  }

  const trackingNumber =
    new URL(req.url).searchParams.get("trackingNumber")?.trim() ?? "";

  if (!/^[A-Za-z0-9]{8,40}$/.test(trackingNumber)) {
    return NextResponse.json(
      { detail: "Número de guía inválido." },
      { status: 400 }
    );
  }

  try {
    let token = await getFedexToken(false);
    let fedexRes = await callTrack(trackingNumber, token);

    // Reintento si venció token
    if (fedexRes.status === 401) {
      token = await getFedexToken(true);
      fedexRes = await callTrack(trackingNumber, token);
    }

    const data = await fedexRes.json().catch(() => ({}));

    if (!fedexRes.ok) {
      const message =
        data?.errors?.[0]?.message ??
        data?.errors?.[0]?.code ??
        `FedEx respondió ${fedexRes.status}`;

      console.error(
        "FedEx tracking error:",
        fedexRes.status,
        JSON.stringify(data?.errors ?? data)
      );

      return NextResponse.json({ detail: message }, { status: fedexRes.status });
    }

    const trackResult =
      data?.output?.completeTrackResults?.[0]?.trackResults?.[0];

    if (trackResult?.error) {
      const message =
        trackResult.error?.message ??
        trackResult.error?.code ??
        "No se encontró la guía.";

      console.error(
        "FedEx tracking result error:",
        JSON.stringify(trackResult.error)
      );

      return NextResponse.json({ detail: message }, { status: 404 });
    }

    return NextResponse.json(data, { status: fedexRes.status });
  } catch (error) {
    console.error("FedEx proxy fatal error:", error);
    return NextResponse.json(
      { detail: "Error consultando FedEx." },
      { status: 502 }
    );
  }
}