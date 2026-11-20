import { NextResponse } from "next/server";
import { backendGet, backendPut } from "@/lib/backend-proxy";

type Context = { params: Promise<{ cbNumber: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { cbNumber } = await params;
  if (!/^S\d{9}$/.test(cbNumber)) {
    return NextResponse.json({ detail: "Número CB inválido." }, { status: 400 });
  }
  try {
    const response = await backendGet(`/integrations/fedex/preferences/${cbNumber}/`);
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("GET FedEx preferences:", error);
    return NextResponse.json({ detail: "No se pudieron cargar las preferencias." }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const { cbNumber } = await params;
  if (!/^S\d{9}$/.test(cbNumber)) {
    return NextResponse.json({ detail: "Número CB inválido." }, { status: 400 });
  }
  try {
    const response = await backendPut(`/integrations/fedex/preferences/${cbNumber}/`, await request.json());
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("PUT FedEx preferences:", error);
    return NextResponse.json({ detail: "No se pudieron guardar las preferencias." }, { status: 502 });
  }
}
