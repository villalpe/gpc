import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = (process.env.CARGOBASE_BASE_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.CARGOBASE_API_TOKEN; // solo servidor, nunca NEXT_PUBLIC_

type CbQuote = {
  shipment_reference: string;
  quote_reference: string;
  freight_mode: string;
  quote_title: string;
  total_quoted_amount: number;
  total_quoted_currency: string;
  status: string;
};
type CbPage = { count: number; next?: string | null; results: CbQuote[] };

const MAX_PAGES = 10; // tope de seguridad por shipment

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("access_token")?.value) {
    return NextResponse.json({ message: "No autenticado." }, { status: 401 });
  }

  if (!BASE || !TOKEN) {
    return NextResponse.json(
      { message: "CARGOBASE_BASE_URL o CARGOBASE_API_TOKEN no configurados." },
      { status: 500 }
    );
  }

  const shipment = req.nextUrl.searchParams.get("shipment")?.trim().toUpperCase();
  if (!shipment || !/^S\d{9}$/.test(shipment)) {
    return NextResponse.json(
      { message: "shipment inválido (formato S#########)" },
      { status: 400 }
    );
  }

  // TODO: validar que la empresa del usuario tenga acceso a este shipment

  try {
    const rows: CbQuote[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `${BASE}/api/1/quotes/?shipment=${encodeURIComponent(shipment)}&page=${page}`,
        {
          headers: { Authorization: `Token ${TOKEN}`, Accept: "application/json" },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        console.error("Cargobase quotes error:", res.status);
        return NextResponse.json(
          { message: `Cargobase respondió ${res.status}` },
          { status: res.status }
        );
      }

      const data = (await res.json()) as CbPage;
      rows.push(...(data.results ?? []));
      if (!data.next) break;
    }

    // Filtro defensivo por si Cargobase ignora el parámetro shipment
    const quotes = rows
      .filter((q) => q.shipment_reference === shipment)
      .map((q) => ({
        quote_reference: q.quote_reference,
        freight: q.freight_mode,
        quote_title: q.quote_title,
        total: q.total_quoted_amount,
        currency: q.total_quoted_currency,
        status: q.status,
      }));

    return NextResponse.json({ shipment, count: quotes.length, quotes });
  } catch (err) {
    console.error("Cargobase error:", err);
    return NextResponse.json({ message: "No se pudo consultar Cargobase." }, { status: 502 });
  }
}