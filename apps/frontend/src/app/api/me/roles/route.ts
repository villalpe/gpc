import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backend-proxy";

export async function GET() {
  const upstream = await backendGet("/me/roles/");
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}