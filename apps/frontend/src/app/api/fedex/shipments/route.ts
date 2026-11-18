import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const upstream = await backendPost("/integrations/fedex/shipments/", body);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/fedex/shipments error:", error);
    return NextResponse.json(
      { detail: "No se pudo procesar la solicitud de envío FedEx." },
      { status: 500 }
    );
  }
}
