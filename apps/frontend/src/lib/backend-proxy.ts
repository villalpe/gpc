import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function refreshWithCookie(refreshToken: string) {
  return fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
    cache: "no-store",
  });
}

export async function backendGet(path: string) {
  const c = await cookies();
  const access = c.get("access_token")?.value;
  const refresh = c.get("refresh_token")?.value;
  const companyId = c.get("active_company_id")?.value;

  if (!access || !companyId) {
    return new Response(JSON.stringify({ detail: "Missing auth/company cookie" }), { status: 401 });
  }

  const doFetch = (token: string) =>
    fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Company-Id": companyId,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  const upstream = await doFetch(access);
  if (upstream.status !== 401) return upstream;

  if (!refresh) return upstream;

  const rr = await refreshWithCookie(refresh);
  if (!rr.ok) return upstream;

  const data = await rr.json();
  const newAccess = data.access as string;
  return doFetch(newAccess);
}