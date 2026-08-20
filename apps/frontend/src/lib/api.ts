const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function healthCheck() {
  const res = await fetch(`${API_URL}/health/`, { cache: "no-store" });
  if (!res.ok) throw new Error("Backend no disponible");
  return res.json();
}