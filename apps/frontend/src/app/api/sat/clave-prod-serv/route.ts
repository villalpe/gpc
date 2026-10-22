import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-proxy";

export async function GET(req: Request) {
  try {
    const { search } = new URL(req.url);
    const upstream = await backendGet(`/quotes/sat/clave-prod-serv/${search}`);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("GET /api/sat/clave-prod-serv error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}