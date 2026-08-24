import { NextResponse } from "next/server";
import { backendPost } from "@/lib/backend-proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const upstream = await backendPost("/modules/inventory/adjust/", body);
  const data = await upstream.json().catch(() => ({}));

  return NextResponse.json(data, { status: upstream.status });
}