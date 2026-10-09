import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = process.env.DHL_TRACK_BASE_URL ?? "https://api-eu.dhl.com";
const KEY = process.env.DHL_API_KEY;

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.get("access_token")?.value) {
    return NextResponse.json({ detail: "No autenticado." }, { status: 401 });
  }
  if (!KEY) {
    return NextResponse.json({ detail: "DHL_API_KEY no configurado." }, { status: 500 });
  }

  const tn = new URL(req.url).searchParams.get("trackingNumber")?.trim() ?? "";
  if (!/^[A-Za-z0-9]{6,40}$/.test(tn)) {
    return NextResponse.json({ detail: "Número de guía inválido." }, { status: 400 });
  }

  try {
    const r = await fetch(`${BASE}/track/shipments?trackingNumber=${encodeURIComponent(tn)}`, {
      headers: { "DHL-API-Key": KEY, Accept: "application/json" },
      cache: "no-store",
    });
    if (r.status === 404) {
      return NextResponse.json({ detail: "No se encontró la guía." }, { status: 404 });
    }
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("DHL tracking error:", e);
    return NextResponse.json({ detail: "Error consultando DHL." }, { status: 502 });
  }
}