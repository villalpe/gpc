import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.CARGOBASE_BASE_URL ?? "https://sandbox.cargobase.com";
const TOKEN = process.env.CARGOBASE_API_TOKEN!; // solo servidor, nunca NEXT_PUBLIC_
const PAGE_SIZE = 10; // ajustar si Cargobase permite page_size
const CACHE_MS = 60_000;

type CbQuote = {
  shipment_reference: string;
  quote_reference: string;
  freight_mode: string;
  quote_title: string;
  total_quoted_amount: number;
  total_quoted_currency: string;
  status: string;
};
type CbPage = { count: number; results: CbQuote[] };

let cache: { at: number; rows: CbQuote[] } | null = null;

async function fetchPage(page: number): Promise<CbPage> {
  // Armamos la URL nosotros: el campo "next" de Cargobase viene con http://
  const res = await fetch(`${BASE}/api/1/quotes/?page=${page}`, {
    headers: { Authorization: `Token ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cargobase ${res.status}`);
  return res.json();
}

async function loadAllQuotes(): Promise<CbQuote[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;

  const first = await fetchPage(1);
  const totalPages = Math.max(1, Math.ceil(first.count / PAGE_SIZE));
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2)),
  );
  const rows = [first, ...rest].flatMap((p) => p.results);

  cache = { at: Date.now(), rows };
  return rows;
}

export async function GET(req: NextRequest) {
  const shipment = req.nextUrl.searchParams.get("shipment")?.trim().toUpperCase();
  if (!shipment || !/^S\d{9}$/.test(shipment)) {
    return NextResponse.json({ message: "shipment inválido (formato S#########)" }, { status: 400 });
  }

  // TODO: validar sesión y que la empresa del usuario tenga acceso a este shipment

  try {
    const rows = await loadAllQuotes();
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