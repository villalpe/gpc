import { cookies } from "next/headers";
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
    const cookieStore = await cookies();

    const accessToken = cookieStore.get("access_token")?.value;
    const companyId = cookieStore.get("company_id")?.value;

    if (!accessToken) {
      return NextResponse.json({ detail: "No autenticado." }, { status: 401 });
    }

    if (!companyId) {
      return NextResponse.json(
        { detail: "Falta contexto de empresa (company_id)." },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${API_URL}/quotes/skydropx/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Company-Id": companyId,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    console.error("POST /api/quotes/skydropx error:", error);
    return NextResponse.json(
      { detail: "Error interno al procesar cotización." },
      { status: 500 }
    );
  }
}