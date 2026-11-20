import { NextResponse } from "next/server";
import { backendGet, backendPost } from "@/lib/backend-proxy";

export async function GET() {
  try {
    const response = await backendGet("/integrations/fedex/addresses/");
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("GET FedEx addresses:", error);
    return NextResponse.json({ detail: "No se pudieron cargar las direcciones." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const response = await backendPost("/integrations/fedex/addresses/", await request.json());
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    console.error("POST FedEx address:", error);
    return NextResponse.json({ detail: "No se pudo guardar la dirección." }, { status: 502 });
  }
}
