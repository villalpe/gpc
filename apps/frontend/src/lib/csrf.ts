import { cookies, headers } from "next/headers";

export async function verifyCsrf(): Promise<boolean> {
  const c = await cookies();
  const h = await headers();

  const cookieToken = c.get("csrf_token")?.value;
  const headerToken = h.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}