import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const upstream = await backendPost("/integrations/fedex/rates/", body);
    const data: unknown = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/fedex/rates error:", error);
    return NextResponse.json(
      { detail: "No se pudo consultar las tarifas de FedEx." },
      { status: 502 }
    );
  }
}
