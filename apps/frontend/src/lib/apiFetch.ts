export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 403) {
    // opcional: emitir evento global / toast / redirect
    throw new Error("FORBIDDEN");
  }

  return res;
}