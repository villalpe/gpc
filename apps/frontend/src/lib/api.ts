import { apiFetch } from "@/lib/apiFetch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function healthCheck() {
  const res = await apiFetch(`${API_URL}/health/`, { cache: "no-store" });
  return res.json();
}