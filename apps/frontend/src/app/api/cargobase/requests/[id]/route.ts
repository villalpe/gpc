import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = (process.env.CARGOBASE_BASE_URL ?? "https://sandbox.cargobase.com").replace(
  /\/+$/,
  ""
);
const TOKEN = process.env.CARGOBASE_API_TOKEN;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("access_token")?.value;
  if (!sessionToken) {
    return NextResponse.json({ detail: "No autenticado." }, { status: 401 });
  }

  if (!TOKEN) {
    return NextResponse.json(
      { detail: "CARGOBASE_API_TOKEN no configurado." },
      { status: 500 }
    );
  }

  const { id: rawId } = await params;
  const id = rawId?.trim() ?? "";

  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ detail: "ID de solicitud inválido." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/api/1/requests/${encodeURIComponent(id)}/`, {
      method: "GET",
      headers: {
        Authorization: `Token ${TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Cargobase request error:", res.status);
      return NextResponse.json(
        { detail: data?.detail ?? `Cargobase respondió ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Cargobase proxy fatal error:", error);
    return NextResponse.json({ detail: "Error consultando Cargobase." }, { status: 502 });
  }
}
