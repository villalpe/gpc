import { NextResponse } from "next/server";
import { backendPatch } from "@/lib/backend-proxy";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ detail: "ID inválido." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const upstream = await backendPatch(`/quotes/saved-addresses/${id}/`, body);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("PATCH /api/quotes/saved-addresses/[id] error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}