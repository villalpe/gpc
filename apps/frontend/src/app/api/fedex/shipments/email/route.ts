import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const upstream = await backendPost(
      "/integrations/fedex/shipments/email/",
      body
    );
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/fedex/shipments/email error:", error);
    return NextResponse.json(
      { detail: "No se pudo enviar el correo con la guía FedEx." },
      { status: 500 }
    );
  }
}
