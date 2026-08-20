import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const token = crypto.randomBytes(32).toString("hex");
  const isProd = process.env.NODE_ENV === "production";

  const res = NextResponse.json({ csrfToken: token });

  // Cookie legible por JS para enviarla en header X-CSRF-Token
  res.cookies.set("csrf_token", token, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });

  return res;
}