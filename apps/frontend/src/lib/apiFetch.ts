export class ApiError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message ?? `HTTP_${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: "include",
      cache: "no-store",
    });

  let res = await doFetch();

  // Si expiró access token, intenta refresh y reintenta 1 vez
  if (res.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (res.status === 403) {
    throw new ApiError(403, "No autorizado");
  }

  if (!res.ok) {
    throw new ApiError(res.status, `HTTP_${res.status}`);
  }

  return res;
}