import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}