import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: Request) {
  try {
    if (!API_URL) {
      return NextResponse.json(
        { detail: "NEXT_PUBLIC_API_URL no está configurada." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email, password, company_id } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email y password son requeridos." },
        { status: 400 }
      );
    }

    // Login real contra Django (SimpleJWT)
    const upstream = await fetch(`${API_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ detail: "Credenciales inválidas" }, { status: 401 });
    }

    const data = await upstream.json(); // { access, refresh }
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

    // Contexto de empresa para X-Company-Id
    if (company_id && typeof company_id === "string") {
      res.cookies.set("company_id", company_id, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ detail: "Error interno." }, { status: 500 });
  }
}