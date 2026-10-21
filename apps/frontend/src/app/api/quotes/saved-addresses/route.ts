import { NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  try {
    const { search } = new URL(req.url); // ?kind=origin|destination
    const upstream = await backendGet(`/quotes/saved-addresses/${search}`);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("GET /api/quotes/saved-addresses error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const upstream = await backendPost("/quotes/saved-addresses/", body);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/quotes/saved-addresses error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}