import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const res = NextResponse.json({ detail: "Refresh inválido" }, { status: 401 });
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
    return res;
  }

  const data = await upstream.json(); // access, refresh? (opcional)
  const res = NextResponse.json({ ok: true });

  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set("access_token", data.access, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  if (data.refresh) {
    res.cookies.set("refresh_token", data.refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}