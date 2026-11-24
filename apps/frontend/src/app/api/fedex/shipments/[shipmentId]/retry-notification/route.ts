import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const { shipmentId } = await params;
  if (!/^\d+$/.test(shipmentId)) {
    return NextResponse.json({ detail: "El envío indicado no es válido." }, { status: 400 });
  }
  try {
    const upstream = await backendPost(`/integrations/fedex/shipments/${shipmentId}/retry-notification/`, {});
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("Error al reintentar el aviso FedEx:", error);
    return NextResponse.json({ detail: "No se pudo confirmar el reintento del aviso." }, { status: 500 });
  }
}
