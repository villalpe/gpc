import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  const okCsrf = await verifyCsrf();
  if (!okCsrf) {
    return NextResponse.json({ detail: "CSRF validation failed" }, { status: 403 });
  }

  const { companyId } = await req.json();

  if (!companyId) {
    return NextResponse.json({ detail: "companyId is required" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set("active_company_id", String(companyId), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}