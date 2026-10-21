import { NextResponse } from "next/server";
import { backendPost, backendGet } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await backendPost("/quotes/shipments/", body);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/quotes/shipments error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { search } = new URL(req.url);
    const upstream = await backendGet(`/quotes/shipments/${search}`);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("GET /api/quotes/shipments error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}

// Deja tu POST actual tal cual