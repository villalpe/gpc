import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST() {
  const c = await cookies();
  const refresh = c.get("refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "Missing refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data?.access) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  res.cookies.set("access_token", data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // opcional: maxAge según tu access lifetime
  });

  return res;
}