import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;
  if (!/^\d+$/.test(shipmentId)) {
    return NextResponse.json({ detail: "El envío indicado no es válido." }, { status: 400 });
  }

  try {
    const body: unknown = await request.json();
    const upstream = await backendPost(
      `/integrations/fedex/shipments/${shipmentId}/resolve/`,
      body
    );
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/fedex/shipments/[shipmentId]/resolve error:", error);
    return NextResponse.json(
      { detail: "No se pudo resolver el estado del envío FedEx." },
      { status: 500 }
    );
  }
}
