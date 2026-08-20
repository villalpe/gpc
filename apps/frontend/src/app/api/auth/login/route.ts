import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json({ detail: "Credenciales inválidas" }, { status: 401 });
  }

  const data = await upstream.json(); // access, refresh
  const res = NextResponse.json({ ok: true });

  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set("access_token", data.access, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30, // 30 min
  });

  res.cookies.set("refresh_token", data.refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  return res;
}