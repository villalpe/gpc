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

async function authorizedFetch(method: "GET" | "POST", path: string, body?: unknown) {
  const c = await cookies();
  const access = c.get("access_token")?.value;
  const refresh = c.get("refresh_token")?.value;
  const companyId = c.get("active_company_id")?.value;

  if (!access) {
    return new Response(JSON.stringify({ detail: "Missing auth cookie" }), { status: 401 });
  }

  const needsCompany = path.startsWith("/me/permissions") || path.startsWith("/modules/");
  if (needsCompany && !companyId) {
    return new Response(JSON.stringify({ detail: "Missing company cookie" }), { status: 401 });
  }

  const doFetch = (token: string) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(companyId ? { "X-Company-Id": companyId } : {}),
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
    });

  let upstream = await doFetch(access);
  if (upstream.status !== 401) return upstream;

  if (!refresh) return upstream;

  const rr = await refreshWithCookie(refresh);
  if (!rr.ok) return upstream;

  const data = await rr.json().catch(() => ({}));
  const newAccess = data.access as string | undefined;
  if (!newAccess) return upstream;

  upstream = await doFetch(newAccess);
  return upstream;
}

export async function backendGet(path: string) {
  return authorizedFetch("GET", path);
}

export async function backendPost(path: string, body?: unknown) {
  return authorizedFetch("POST", path, body);
}